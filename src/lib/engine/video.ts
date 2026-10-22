import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { FFMPEG, FFPROBE, round3 } from "@/lib/engine/audio";
import { sendVideoAnalysisRequest } from "@/lib/engine/gemini";
import { keyManager } from "@/lib/engine/keys";
import type {
  EventLevel,
  VideoEventMarker,
  VideoMeta,
  VideoObservation,
  VideoSection,
  VideoTranscript,
  Word,
} from "@/lib/types";

function execBuffer(
  cmd: string,
  args: string[],
  timeout = 300_000,
  signal?: AbortSignal
): Promise<{ stdout: Buffer; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(
      cmd,
      args,
      { encoding: "buffer", maxBuffer: 256 * 1024 * 1024, timeout, signal } as any,
      (err, stdout, stderr) => {
        if (signal?.aborted) {
          reject(new Error("cancelled"));
          return;
        }
        if (err) {
          const detail = Buffer.isBuffer(stderr) ? stderr.toString().trim() : String(stderr || "");
          reject(new Error(`${err.message}${detail ? ` — ${detail.slice(-500)}` : ""}`));
        } else {
          resolve({ stdout: stdout as Buffer, stderr: Buffer.isBuffer(stderr) ? stderr.toString() : String(stderr) });
        }
      }
    );
  });
}

function parseRate(rate: string | undefined): number {
  if (!rate) return 0;
  const [a, b] = rate.split("/").map(Number);
  return Number.isFinite(a) && Number.isFinite(b) && b ? a / b : Number(rate) || 0;
}

/** Returns null for audio-only media (ignores embedded cover art / 1-frame attached pictures). */
export async function probeVideoMeta(filePath: string, signal?: AbortSignal): Promise<VideoMeta | null> {
  try {
    const { stdout } = await execBuffer(
      FFPROBE,
      [
        "-v",
        "error",
        "-show_entries",
        "stream=index,codec_type,codec_name,width,height,avg_frame_rate,r_frame_rate,disposition",
        "-of",
        "json",
        filePath,
      ],
      60_000,
      signal
    );
    const parsed = JSON.parse(stdout.toString());
    const streams: any[] = Array.isArray(parsed?.streams) ? parsed.streams : [];
    const video = streams.find(
      (s) =>
        s.codec_type === "video" &&
        Number(s.width) > 0 &&
        Number(s.height) > 0 &&
        s.disposition?.attached_pic !== 1 &&
        !/^(mjpeg|png|webp|bmp|gif)$/i.test(String(s.codec_name || ""))
    );
    if (!video) return null;
    return {
      width: Number(video.width) || 0,
      height: Number(video.height) || 0,
      fps: round3(parseRate(video.avg_frame_rate || video.r_frame_rate)),
      codec: String(video.codec_name || "unknown"),
      hasAudio: streams.some((s) => s.codec_type === "audio"),
    };
  } catch (e: any) {
    if (signal?.aborted) throw new Error("cancelled");
    return null;
  }
}

/**
 * Physical pixel-level scene-cut detection via FFmpeg (`select='gt(scene,0.25)',showinfo`).
 */
export async function detectSceneCuts(
  filePath: string,
  { threshold = 0.25, minSpacingSec = 0.25, signal }: { threshold?: number; minSpacingSec?: number; signal?: AbortSignal } = {}
): Promise<number[]> {
  try {
    const { stderr } = await execBuffer(
      FFMPEG,
      [
        "-hide_banner",
        "-nostats",
        "-i",
        filePath,
        "-vf",
        `scale=min(480\\,iw):-2,select='gt(scene\\,${threshold})',showinfo`,
        "-an",
        "-f",
        "null",
        "-",
      ],
      240_000,
      signal
    );
    const cuts: number[] = [];
    for (const line of stderr.split(/\r?\n/)) {
      const m = line.match(/pts_time:\s*([\d.]+)/);
      if (!m) continue;
      const t = parseFloat(m[1]);
      if (!Number.isFinite(t) || t < 0.05) continue;
      if (cuts.length === 0 || t - cuts[cuts.length - 1] >= minSpacingSec) {
        cuts.push(round3(t));
      }
    }
    return cuts;
  } catch (e: any) {
    if (signal?.aborted) throw new Error("cancelled");
    return [];
  }
}

export interface VideoSectionPlan {
  index: number;
  start: number;
  end: number;
  clipStart: number;
  clipEnd: number;
  slots: { slot: number; start: number; end: number; contextStart: number; contextEnd: number }[];
}

export function planVideoSections(durationSec: number, overlapSec = 1): VideoSectionPlan[] {
  const sections: VideoSectionPlan[] = [];
  for (let start = 0, index = 0; start < durationSec - 0.001; start += 30, index++) {
    const end = Math.min(durationSec, start + 30);
    const slots: VideoSectionPlan["slots"] = [];
    for (let s = start, slot = 0; s < end - 0.001; s += 5, slot++) {
      const e = Math.min(end, s + 5);
      slots.push({
        slot,
        start: round3(s),
        end: round3(e),
        contextStart: round3(Math.max(0, s - overlapSec)),
        contextEnd: round3(Math.min(durationSec, e + overlapSec)),
      });
    }
    sections.push({
      index,
      start: round3(start),
      end: round3(end),
      clipStart: round3(Math.max(0, start - overlapSec)),
      clipEnd: round3(Math.min(durationSec, end + overlapSec)),
      slots,
    });
  }
  return sections;
}

/**
 * Re-encodes a compact H.264/AAC analysis clip with strict VBV bitrate cap
 * (`-maxrate 2200k -bufsize 4400k`) so 32-second clips never exceed ~9 MB,
 * guaranteeing compliance with Gemini's 20 MB inline payload limit.
 */
export async function sliceVideoSection(
  src: string,
  plan: VideoSectionPlan,
  outPath: string,
  signal?: AbortSignal
): Promise<void> {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const duration = Math.max(0.1, plan.clipEnd - plan.clipStart);
  await execBuffer(
    FFMPEG,
    [
      "-y",
      "-v",
      "error",
      "-ss",
      String(plan.clipStart),
      "-i",
      src,
      "-t",
      String(duration),
      "-map",
      "0:v:0",
      "-map",
      "0:a?",
      "-vf",
      "scale=min(960\\,iw):-2,fps=10",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "27",
      "-maxrate",
      "2200k",
      "-bufsize",
      "4400k",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "96k",
      "-movflags",
      "+faststart",
      outPath,
    ],
    300_000,
    signal
  );
}

function speechFor(words: Word[], start: number, end: number): string {
  return words
    .filter((w) => w.start < end && (w.spokenEnd ?? w.end) > start)
    .map((w) => w.word)
    .join(" ")
    .trim();
}

function wordAt(words: Word[], time: number): string | undefined {
  const exact = words.find((w) => time >= w.start - 0.08 && time <= (w.spokenEnd ?? w.end) + 0.12);
  return exact?.word;
}

function cleanList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((x) => String(x).trim()).filter(Boolean))].slice(0, 12);
}

function promptFor(
  plan: VideoSectionPlan,
  words: Word[],
  sceneCuts: number[],
  prevSummary: string,
  hasAudio: boolean
): string {
  const coreOffset = plan.start - plan.clipStart;
  const rows = plan.slots
    .map((s) => {
      const rs = s.start - plan.clipStart;
      const re = s.end - plan.clipStart;
      const rcs = s.contextStart - plan.clipStart;
      const rce = s.contextEnd - plan.clipStart;
      const slotWords = words.filter((w) => w.start < s.end && (w.spokenEnd ?? w.end) > s.start);
      const speechHint = slotWords.length
        ? slotWords.map((w) => `${w.word}@${Math.max(0, w.start - plan.clipStart).toFixed(2)}s`).join(" ")
        : hasAudio
          ? "(no spoken words)"
          : "(silent video stream — no audio track)";
      const slotCuts = sceneCuts
        .filter((c) => c >= s.start && c < s.end)
        .map((c) => `${Math.max(0, c - plan.clipStart).toFixed(2)}s (global ${c.toFixed(2)}s)`);
      const cutHint = slotCuts.length ? ` | FFmpeg frame cuts: ${slotCuts.join(", ")}` : "";
      return `slot ${s.slot}: CORE ${rs.toFixed(1)}–${re.toFixed(1)}s in this clip (1s overlap window ${rcs.toFixed(1)}–${rce.toFixed(1)}s; global ${s.start.toFixed(1)}–${s.end.toFixed(1)}s)${cutHint}\n  aligned speech: ${speechHint}`;
    })
    .join("\n");

  return (
    `Analyze this video${hasAudio ? "+audio" : " (silent stream)"} clip for 30-second section #${plan.index + 1} (global ${plan.start.toFixed(1)}–${plan.end.toFixed(1)}s; core starts ${coreOffset.toFixed(1)}s into this clip).\n` +
    (prevSummary ? `Previous 30s section summary for continuity: "${prevSummary}"\n\n` : "") +
    `Return sectionSummary plus ${plan.slots.length} observations, one for each 5-second slot below:\n${rows}\n\n` +
    `For every slot:\n` +
    `- Describe every visible action, subject, UI/screen change, graphic, camera movement, cut, and readable text across the full 5-second CORE (use the 1-second overlap window only for boundary continuity).\n` +
    `- Pin specific visual moments (cuts, graphic reveals, gestures, transitions) in events[] with their exact clipSec in THIS clip.\n` +
    `- In audioRelation, explain how what happens on screen syncs with the aligned words/audio at that exact moment (or note visual pacing if silent).`
  );
}

function alignVisualEvents(
  rawEvents: { clipSec: number; what: string }[] | undefined,
  clipStart: number,
  slotStart: number,
  slotEnd: number,
  slotCuts: number[],
  words: Word[]
): VideoEventMarker[] {
  const claimedCuts = new Set<number>();
  const out: VideoEventMarker[] = [];

  for (const ev of rawEvents || []) {
    let globalT = round3(clipStart + ev.clipSec);
    if (globalT < slotStart - 0.15 || globalT >= slotEnd - 0.02) continue;
    globalT = Math.max(slotStart, Math.min(slotEnd - 0.001, globalT));

    let bestCut: number | null = null;
    let bestDist = Infinity;
    for (const c of slotCuts) {
      if (claimedCuts.has(c)) continue;
      const d = Math.abs(c - globalT);
      if (d <= 0.35 && d < bestDist) {
        bestDist = d;
        bestCut = c;
      }
    }
    if (bestCut !== null) {
      globalT = bestCut;
      claimedCuts.add(bestCut);
    }
    out.push({
      time: round3(globalT),
      what: ev.what,
      syncedWord: wordAt(words, globalT),
    });
  }

  for (const c of slotCuts) {
    if (!claimedCuts.has(c)) {
      out.push({
        time: c,
        what: "Frame-accurate scene cut",
        syncedWord: wordAt(words, c),
      });
    }
  }

  out.sort((a, b) => a.time - b.time);
  return out.slice(0, 6);
}

export function refreshVideoSpeech(video: VideoTranscript, words: Word[]): VideoTranscript {
  const sections = video.sections.map((section) => ({
    ...section,
    observations: section.observations.map((o) => {
      const speech = speechFor(words, o.start, o.end);
      const events = (o.events || []).map((ev) => ({
        ...ev,
        syncedWord: wordAt(words, ev.time),
      }));
      return {
        ...o,
        speech,
        events,
        combinedText: speech ? `${o.description} Spoken: “${speech}”` : o.description,
      };
    }),
  }));
  // Re-index observations deterministically in section order
  let idx = 0;
  for (const sec of sections) {
    for (const o of sec.observations) {
      o.index = idx++;
    }
  }
  return { ...video, sections, observations: sections.flatMap((s) => s.observations) };
}

function buildSimulatedSection(
  plan: VideoSectionPlan,
  meta: VideoMeta,
  words: Word[],
  sceneCuts: number[],
  offsetIndex: number
): VideoSection {
  const observations: VideoObservation[] = plan.slots.map((slot) => {
    const speech = speechFor(words, slot.start, slot.end);
    const slotCuts = sceneCuts.filter((c) => c >= slot.start && c < slot.end);
    const cutText = slotCuts.length
      ? `${slotCuts.length} physical scene cut${slotCuts.length > 1 ? "s" : ""} at ${slotCuts.map((c) => `${c.toFixed(2)}s`).join(", ")}`
      : "continuous shot with no hard scene cut";
    const description = `[Simulated visual pass] ${meta.width}×${meta.height} frame sequence across ${slot.start.toFixed(1)}–${slot.end.toFixed(1)}s (${cutText}).`;
    const events: VideoEventMarker[] = slotCuts.map((c) => ({
      time: c,
      what: "Frame-accurate scene cut (FFmpeg)",
      syncedWord: wordAt(words, c),
    }));
    return {
      index: offsetIndex + slot.slot,
      sectionIndex: plan.index,
      start: slot.start,
      end: slot.end,
      contextStart: slot.contextStart,
      contextEnd: slot.contextEnd,
      description,
      actions: slotCuts.length ? ["scene transition"] : ["continuous framing"],
      subjects: ["video frame"],
      visibleText: [],
      shot: slotCuts.length ? `Cut transition (${slotCuts.length})` : "Continuous shot",
      audioRelation: speech
        ? `Synchronized to aligned speech over ${slot.start.toFixed(1)}–${slot.end.toFixed(1)}s.`
        : "No aligned speech during this 5-second window.",
      speech,
      combinedText: speech ? `${description} Spoken: “${speech}”` : description,
      confidence: 0.5,
      sceneCuts: slotCuts,
      events,
    };
  });
  return {
    index: plan.index,
    start: plan.start,
    end: plan.end,
    clipStart: plan.clipStart,
    clipEnd: plan.clipEnd,
    model: "simulation",
    keyIndex: null,
    summary: `Simulated 30-second visual section (${plan.start.toFixed(0)}–${plan.end.toFixed(0)}s) synced to physical FFmpeg scene cuts and acoustic speech timestamps.`,
    observations,
  };
}

export async function analyzeVideo(opts: {
  mediaFile: string;
  jobId: string;
  durationSec: number;
  meta: VideoMeta;
  words: Word[];
  preferredModel?: string;
  tmpDir: string;
  useSim?: boolean;
  allowSimulate?: boolean;
  cachedSections?: VideoSection[];
  signal?: AbortSignal;
  onLog?: (level: EventLevel, title: string, message: string) => Promise<void> | void;
  onSection?: (video: VideoTranscript) => Promise<void> | void;
}): Promise<VideoTranscript> {
  const tCuts = Date.now();
  await opts.onLog?.(
    "info",
    "Measuring physical scene cuts",
    "Scanning video frames with FFmpeg pixel-difference detector (select='gt(scene,0.25)',showinfo)"
  );
  const sceneCuts = await detectSceneCuts(opts.mediaFile, { signal: opts.signal });
  await opts.onLog?.(
    "success",
    `${sceneCuts.length} frame-accurate scene cut${sceneCuts.length === 1 ? "" : "s"} measured`,
    `${sceneCuts.length ? `Cuts at ${sceneCuts.slice(0, 10).map((c) => `${c.toFixed(3)}s`).join(", ")}${sceneCuts.length > 10 ? "…" : ""}` : "Continuous single-take stream"} (${Date.now() - tCuts} ms)`
  );

  const plans = planVideoSections(opts.durationSec, 1);
  const cachedByIdx = new Map((opts.cachedSections || []).map((s) => [s.index, s]));
  const completedMap = new Map<number, VideoSection>();
  let simulated = Boolean(opts.useSim);

  const emitProgressSnapshot = async () => {
    const ordered = [...completedMap.values()].sort((a, b) => a.index - b.index);
    let idx = 0;
    for (const sec of ordered) {
      for (const o of sec.observations) o.index = idx++;
    }
    await opts.onSection?.({
      complete: false,
      simulated,
      sectionDurationSeconds: 30,
      observationDurationSeconds: 5,
      overlapSeconds: 1,
      meta: opts.meta,
      sceneCuts,
      sections: ordered,
      observations: ordered.flatMap((s) => s.observations),
    });
  };

  await emitProgressSnapshot();

  const concurrency = simulated ? 1 : Math.min(plans.length, keyManager.concurrencyHint(3));
  if (concurrency > 1 && plans.length > 1) {
    await opts.onLog?.(
      "info",
      `Parallel multi-key video workers (${concurrency}×)`,
      `Distributing ${plans.length} × 30s sections across ${keyManager.healthyCount()} healthy keys with LRU round-robin load balancing`
    );
  }

  let nextIdx = 0;
  const processOne = async (plan: VideoSectionPlan) => {
    if (opts.signal?.aborted) throw new Error("cancelled");

    const cached = cachedByIdx.get(plan.index);
    if (cached && cached.observations.length === plan.slots.length) {
      const refreshed = refreshVideoSpeech(
        {
          complete: false,
          simulated,
          sectionDurationSeconds: 30,
          observationDurationSeconds: 5,
          overlapSeconds: 1,
          meta: opts.meta,
          sceneCuts,
          sections: [cached],
          observations: cached.observations,
        },
        opts.words
      ).sections[0];
      completedMap.set(plan.index, refreshed);
      await emitProgressSnapshot();
      await opts.onLog?.("info", `Visual section ${plan.index + 1}/${plans.length} cached`, "Reused completed 30s section and re-bound aligned words");
      return;
    }

    if (simulated) {
      const simSec = buildSimulatedSection(plan, opts.meta, opts.words, sceneCuts, 0);
      completedMap.set(plan.index, simSec);
      await emitProgressSnapshot();
      await opts.onLog?.(
        "warn",
        `Visual section ${plan.index + 1}/${plans.length} simulated`,
        `${simSec.observations.length} × 5s slots synced to FFmpeg cuts & aligned words`
      );
      return;
    }

    const clipPath = path.join(opts.tmpDir, `visual-${plan.index}.mp4`);
    await opts.onLog?.(
      "stage",
      `Visual section ${plan.index + 1}/${plans.length} · [${plan.start.toFixed(1)}s → ${plan.end.toFixed(1)}s]`,
      `Encoding [${plan.clipStart.toFixed(1)} → ${plan.clipEnd.toFixed(1)}s] with 1.0s overlap · ${plan.slots.length} × 5s windows`
    );
    await sliceVideoSection(opts.mediaFile, plan, clipPath, opts.signal);
    const mb = fs.statSync(clipPath).size / 1024 / 1024;
    await opts.onLog?.("info", `Section ${plan.index + 1} clip ready`, `${mb.toFixed(2)} MB H.264/AAC`);

    const prevSummary = completedMap.get(plan.index - 1)?.summary || "";
    let best: Awaited<ReturnType<typeof sendVideoAnalysisRequest>> | null = null;
    try {
      for (let attempt = 1; attempt <= 2; attempt++) {
        if (opts.signal?.aborted) throw new Error("cancelled");
        const result = await sendVideoAnalysisRequest({
          prompt: promptFor(plan, opts.words, sceneCuts, prevSummary, opts.meta.hasAudio),
          videoBase64: fs.readFileSync(clipPath).toString("base64"),
          preferredModel: opts.preferredModel,
          signal: opts.signal,
          onLog: (msg, level) => void opts.onLog?.((level as EventLevel) || "info", "Video rotator", msg),
        });
        if (!best || result.observations.length > best.observations.length) best = result;
        const unique = new Set(result.observations.map((o) => o.slot).filter((s) => s >= 0 && s < plan.slots.length));
        if (unique.size === plan.slots.length) break;
        await opts.onLog?.("warn", `Section ${plan.index + 1} incomplete — retrying`, `Model returned ${unique.size}/${plan.slots.length} slots`);
      }
    } catch (err: any) {
      try {
        fs.unlinkSync(clipPath);
      } catch {
        /* ignore */
      }
      if (/cancelled/i.test(String(err?.message || err)) || opts.signal?.aborted) throw new Error("cancelled");
      if (opts.allowSimulate) {
        simulated = true;
        await opts.onLog?.(
          "warn",
          "Gemini video keys exhausted — falling back to simulation",
          `${String(err?.message || err).slice(0, 150)}`
        );
        const simSec = buildSimulatedSection(plan, opts.meta, opts.words, sceneCuts, 0);
        completedMap.set(plan.index, simSec);
        await emitProgressSnapshot();
        return;
      }
      throw err;
    }

    const bySlot = new Map((best?.observations || []).map((o) => [o.slot, o]));
    const observations: VideoObservation[] = plan.slots.map((slot) => {
      const raw = bySlot.get(slot.slot);
      const speech = speechFor(opts.words, slot.start, slot.end);
      const slotCuts = sceneCuts.filter((c) => c >= slot.start && c < slot.end);
      const events = alignVisualEvents(raw?.events, plan.clipStart, slot.start, slot.end, slotCuts, opts.words);
      const description = raw?.description || "No reliable visual description was returned for this 5-second interval.";
      const audioRelation =
        raw?.audioRelation ||
        (speech ? "Visual sequence plays alongside the spoken narration." : "No aligned speech in this interval.");
      return {
        index: slot.slot,
        sectionIndex: plan.index,
        start: slot.start,
        end: slot.end,
        contextStart: slot.contextStart,
        contextEnd: slot.contextEnd,
        description,
        actions: cleanList(raw?.actions),
        subjects: cleanList(raw?.subjects),
        visibleText: cleanList(raw?.visibleText),
        shot: raw?.shot || "",
        audioRelation,
        speech,
        combinedText: speech ? `${description} Spoken: “${speech}”` : description,
        confidence: raw ? Math.round(raw.confidence * 100) / 100 : 0,
        sceneCuts: slotCuts,
        events,
      };
    });

    const sectionSummary =
      best?.sectionSummary ||
      observations
        .map((o) => o.description)
        .slice(0, 2)
        .join(" ");

    completedMap.set(plan.index, {
      index: plan.index,
      start: plan.start,
      end: plan.end,
      clipStart: plan.clipStart,
      clipEnd: plan.clipEnd,
      model: best?.model || "unavailable",
      keyIndex: best?.keyIndex ?? null,
      summary: sectionSummary,
      observations,
    });

    await emitProgressSnapshot();
    const eventTotal = observations.reduce((acc, o) => acc + (o.events?.length || 0), 0);
    await opts.onLog?.(
      "success",
      `Visual section ${plan.index + 1}/${plans.length} complete`,
      `${observations.length} × 5s windows + ${eventTotal} synced markers · ${best?.model || "unavailable"}${best ? ` · Key #${best.keyIndex}` : ""} — "${sectionSummary.slice(0, 105)}${sectionSummary.length > 105 ? "…" : ""}"`
    );
    try {
      fs.unlinkSync(clipPath);
    } catch {
      /* non-fatal */
    }
  };

  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (nextIdx < plans.length) {
        if (opts.signal?.aborted) throw new Error("cancelled");
        const plan = plans[nextIdx++];
        await processOne(plan);
      }
    })
  );

  const ordered = [...completedMap.values()].sort((a, b) => a.index - b.index);
  let idx = 0;
  for (const sec of ordered) {
    for (const o of sec.observations) o.index = idx++;
  }

  return {
    complete: true,
    simulated,
    sectionDurationSeconds: 30,
    observationDurationSeconds: 5,
    overlapSeconds: 1,
    meta: opts.meta,
    sceneCuts,
    sections: ordered,
    observations: ordered.flatMap((s) => s.observations),
  };
}
