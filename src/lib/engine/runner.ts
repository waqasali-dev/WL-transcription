import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { appSettings, chunks, events, jobs } from "@/db/schema";
import {
  adaptiveNoiseDb,
  computeEnergyBins,
  decodePcm16,
  detectOnsetsFromSamples,
  detectSilences,
  ensureBrowserPlayable,
  pcmToNormalizedFloat32,
  probeDuration,
  round3,
  sliceToMp3,
  speechIntervals,
} from "@/lib/engine/audio";
import { acousticCoverage, alignClip, computeEmissions, forcedAlign, type Emissions } from "@/lib/engine/forced";
import { analyzeVideo, probeVideoMeta, refreshVideoSpeech } from "@/lib/engine/video";
import { keyManager } from "@/lib/engine/keys";
import { sendModelRequest } from "@/lib/engine/gemini";
import {
  assembleSentences,
  coreFilter,
  correctWordTimestamps,
  measureCoverage,
  normalizeClipWords,
  snapWordsToSpeech,
  stampPauses,
} from "@/lib/engine/align";
import type {
  AlignmentStats,
  ChunkMeta,
  EventLevel,
  EventRow,
  JobSettings,
  Silence,
  StageKey,
  TranscriptDoc,
  VideoMeta,
  VideoTranscript,
  Word,
} from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), ".data");
export const OUT_DIR = (id: string) => path.join(DATA_DIR, "output", id);
const TMP_DIR = (id: string) => path.join(DATA_DIR, "tmp", id);

// ── Atomic JSON persistence ─────────────────────────────────────────────────
export function writeJsonAtomic(filePath: string, data: unknown) {
  fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
  const json = JSON.stringify(data, null, 2);
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(tmp, json, "utf-8");
    try {
      fs.renameSync(tmp, filePath);
    } catch (err: any) {
      if (err.code === "EPERM" || err.code === "EBUSY") {
        fs.writeFileSync(filePath, json, "utf-8");
        try {
          fs.unlinkSync(tmp);
        } catch {
          /* ignore */
        }
      } else throw err;
    }
  } catch {
    fs.writeFileSync(filePath, json, "utf-8");
  }
}

// ── Real-time PubSub bus for <15ms Server-Sent Events push ──────────────────
export type StreamPacket =
  | { type: "event"; event: EventRow }
  | { type: "state"; status?: string; stage?: string; progress?: number; rev: number };

type Listener = (pkt: StreamPacket) => void;

interface EngineBus {
  listeners: Map<string, Set<Listener>>;
  revisions: Map<string, number>;
}
const gBus = globalThis as typeof globalThis & { __splicerBus?: EngineBus };
const bus: EngineBus = gBus.__splicerBus ?? (gBus.__splicerBus = { listeners: new Map(), revisions: new Map() });

function bumpRev(jobId: string): number {
  const next = (bus.revisions.get(jobId) ?? 0) + 1;
  bus.revisions.set(jobId, next);
  return next;
}

export function jobRevision(jobId: string): number {
  return bus.revisions.get(jobId) ?? 0;
}

function broadcast(jobId: string, pkt: StreamPacket) {
  const subs = bus.listeners.get(jobId);
  if (!subs) return;
  for (const fn of subs) {
    try {
      fn(pkt);
    } catch {
      /* ignore subscriber errors */
    }
  }
}

export function subscribeJob(jobId: string, fn: Listener): () => void {
  let set = bus.listeners.get(jobId);
  if (!set) {
    set = new Set();
    bus.listeners.set(jobId, set);
  }
  set.add(fn);
  return () => {
    set?.delete(fn);
    if (set && set.size === 0) bus.listeners.delete(jobId);
  };
}

// ── Step 3: Silence-snapped chunk planning ──────────────────────────────────
export function planChunkBoundaries(
  durationSec: number,
  silences: Silence[],
  chunkSec = 30,
  searchSec = 3
): number[] {
  const boundaries = [0];
  for (let target = chunkSec; target < durationSec - chunkSec * 0.25; target += chunkSec) {
    let best = target;
    let bestDist = Infinity;
    for (const s of silences) {
      const mid = (s.start + s.end) / 2;
      const dist = Math.abs(mid - target);
      if (dist <= searchSec && dist < bestDist && mid > boundaries[boundaries.length - 1] + chunkSec * 0.5) {
        best = mid;
        bestDist = dist;
      }
    }
    boundaries.push(round3(best));
  }
  boundaries.push(durationSec);
  return boundaries;
}

interface PlanChunk {
  idx: number;
  coreStart: number;
  coreEnd: number;
  clipStart: number;
  clipEnd: number;
}

function buildPlan(durationSec: number, silences: Silence[], chunkSec: number, overlapSec: number): PlanChunk[] {
  const b = planChunkBoundaries(durationSec, silences, chunkSec, 3);
  const out: PlanChunk[] = [];
  for (let i = 0; i < b.length - 1; i++) {
    const coreStart = b[i];
    const coreEnd = b[i + 1];
    if (coreEnd - coreStart < 0.5) continue;
    out.push({
      idx: i,
      coreStart: round3(coreStart),
      coreEnd: round3(coreEnd),
      clipStart: round3(Math.max(0, coreStart - overlapSec)),
      clipEnd: round3(Math.min(durationSec, coreEnd + overlapSec)),
    });
  }
  return out;
}

// ── Event / job-state helpers ───────────────────────────────────────────────
const emitChains = new Map<string, Promise<void>>();

export async function emit(
  jobId: string,
  stage: StageKey | "info",
  level: EventLevel,
  title: string,
  message: string,
  data?: Record<string, unknown>
) {
  const prev = emitChains.get(jobId) ?? Promise.resolve();
  const next = prev.then(async () => {
    try {
      const inserted = await db
        .insert(events)
        .values({ jobId, stage, level, title, message, data: data ?? null })
        .returning();
      const row = inserted[0];
      if (row) {
        broadcast(jobId, {
          type: "event",
          event: {
            id: row.id,
            ts: row.ts.toISOString(),
            stage: row.stage,
            level: row.level as EventLevel,
            title: row.title,
            message: row.message,
            data: (row.data as Record<string, unknown> | null) ?? null,
          },
        });
      }
    } catch {
      /* never let logging kill the pipeline */
    }
  });
  emitChains.set(jobId, next);
  return next;
}

export async function patchJob(jobId: string, patch: Record<string, unknown>) {
  await db.update(jobs).set(patch as any).where(eq(jobs.id, jobId));
  const rev = bumpRev(jobId);
  broadcast(jobId, {
    type: "state",
    status: patch.status as string | undefined,
    stage: patch.stage as string | undefined,
    progress: patch.progress as number | undefined,
    rev,
  });
}

type StageLog = { stage: StageKey; startedAt: string; doneAt: string | null }[];

async function setStage(jobId: string, stageKey: StageKey, log: StageLog, progress: number): Promise<StageLog> {
  const started = { stage: stageKey, startedAt: new Date().toISOString(), doneAt: null };
  const filtered = log.filter((s) => s.stage !== stageKey);
  const next = [...filtered, started];
  await patchJob(jobId, { stage: stageKey, stageLog: next, progress });
  return next;
}

async function endStage(jobId: string, stageKey: StageKey, log: StageLog, progress: number): Promise<StageLog> {
  const next = log.map((s) => (s.stage === stageKey && !s.doneAt ? { ...s, doneAt: new Date().toISOString() } : s));
  await patchJob(jobId, { stageLog: next, progress });
  return next;
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("cancelled"));
      return;
    }
    const t = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new Error("cancelled"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });

// ── Simulation fallback ─────────────────────────────────────────────────────
const SIM_CORPUS = [
  "So the first thing we do is probe the file, and we get the exact duration down to the millisecond.",
  "From there we run silence detection with an adaptive noise floor, so music beds never hide pauses.",
  "The onset detector measures physical consonant attacks directly from the waveform energy envelope.",
  "Audio slices snap cleanly to silence midpoints with two second overlaps so no syllable is ever cut in half.",
  "Each clip dispatches through a least recently used multi key rotator across all configured Gemini keys.",
  "An acoustic coverage gate compares heard character posteriors against transcribed spans and repairs any gap.",
  "Character level Viterbi alignment anchors every word to 20 millisecond acoustic frames and refines vocal attacks.",
  "For video streams, FFmpeg extracts pixel accurate scene cuts and locks every five second visual window to speech.",
];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function synthesizeWords(chunk: PlanChunk, speech: Silence[], onsets: number[], seed: number): Word[] {
  const rnd = mulberry32(seed * 7919 + chunk.idx * 104729 + 17);
  const words: Word[] = [];
  let si = Math.floor(rnd() * SIM_CORPUS.length);
  let wi = 0;
  for (const iv of speech) {
    const a = Math.max(iv.start, chunk.coreStart);
    const b = Math.min(iv.end, chunk.coreEnd);
    if (b - a < 0.15) continue;
    let t = a;
    while (t < b - 0.05) {
      const sentence = SIM_CORPUS[si];
      const toks = sentence.split(" ");
      if (wi >= toks.length) {
        si = (si + 1) % SIM_CORPUS.length;
        wi = 0;
        continue;
      }
      let tok = toks[wi];
      const isSentenceStart = wi === 0;
      const lastTok = wi === toks.length - 1;
      if (isSentenceStart) tok = tok.charAt(0).toUpperCase() + tok.slice(1);
      if (lastTok) tok = tok.replace(/[.,]$/, "") + ".";
      const baseDur = 0.14 + rnd() * 0.2 + tok.length * 0.013;
      const jitter = (rnd() - 0.5) * 0.24;
      const start = t + jitter;
      const nextT = t + baseDur + 0.06 + rnd() * 0.14;
      if (lastTok) {
        si = (si + 1) % SIM_CORPUS.length;
        wi = 0;
      } else {
        wi += 1;
      }
      words.push({
        word: tok,
        start: round3(Math.max(chunk.coreStart, start)),
        end: round3(Math.max(start + 0.08, nextT)),
        pauseAfterMs: 0,
      });
      t = nextT;
    }
  }
  words.sort((x, y) => x.start - y.start);
  for (const w of words) {
    if (rnd() < 0.45 && onsets.length) {
      const near = onsets.find((o) => Math.abs(o - w.start) < 0.3);
      if (near !== undefined && rnd() < 0.6) w.start = round3(near + (rnd() - 0.5) * 0.12);
    }
  }
  return words;
}

// ── Main job pipeline ───────────────────────────────────────────────────────
export async function runJob(jobId: string, settings: JobSettings, allowSimulate: boolean, signal: AbortSignal) {
  let logRef: StageLog = [];
  const checkCancel = () => {
    if (signal.aborted || cancelFlags.has(jobId)) throw new Error("cancelled");
  };

  try {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!job) throw new Error("Job not found");
    if (!job.mediaPath || !fs.existsSync(/*turbopackIgnore: true*/ job.mediaPath)) throw new Error("Media file missing on disk");
    logRef = job.stageLog ?? [];

    const videoMeta = await probeVideoMeta(job.mediaPath, signal);
    const mediaKind: "audio" | "video" = videoMeta ? "video" : "audio";
    const hasAudioTrack = !videoMeta || videoMeta.hasAudio;

    await patchJob(jobId, {
      status: "working",
      startedAt: job.startedAt ?? new Date(),
      error: null,
      progress: Math.max(job.progress || 0, 0.01),
      mediaKind,
      videoMeta,
    });

    await emit(
      jobId,
      "info",
      "stage",
      "Pipeline started",
      `Target: ${job.filename} · ${
        mediaKind === "video"
          ? `${videoMeta!.width}×${videoMeta!.height} @ ${videoMeta!.fps}fps (${videoMeta!.codec})${hasAudioTrack ? " · synced audio+video" : " · silent video stream"}`
          : "precision audio pipeline"
      }`
    );

    // Prepare web-compatible playback proxy in background if container/codec isn't native in all browsers
    void ensureBrowserPlayable(job.mediaPath, mediaKind, videoMeta?.codec, signal).catch(() => {});

    // ── STAGE 0: Key Discovery & Quota ──────────────────────────────────────
    logRef = await setStage(jobId, "discovery", logRef, 0.03);
    await emit(jobId, "discovery", "stage", "Multi-key pool discovery", "Inspecting .env keys and PostgreSQL rotation pool");
    await keyManager.load();
    const keyCount = keyManager.count();
    const healthyKeys = keyManager.healthyCount();
    if (healthyKeys > 0) {
      const info = await keyManager.describe();
      for (const k of info.keys) {
        await emit(
          jobId,
          "discovery",
          "info",
          `Key #${k.idx} · ${k.source}`,
          `${k.masked} (${k.from} · ${k.project})${k.disabledReason ? ` — DISABLED: ${k.disabledReason}` : ""}`
        );
      }
      await emit(
        jobId,
        "discovery",
        "success",
        `${healthyKeys}/${keyCount} active key${healthyKeys === 1 ? "" : "s"} armed`,
        `LRU round-robin load balancer active across ${healthyKeys} key${healthyKeys === 1 ? "" : "s"} · rolling 60s RPM + 1:00 PM daily RPD`
      );
    } else {
      if (!allowSimulate) {
        throw new Error(
          keyCount > 0
            ? "All configured Gemini API keys are disabled. Reset quotas or add a valid key in the API Keys drawer."
            : "No Gemini API keys configured. Add at least one key in the API Keys drawer (or enable simulation fallback)."
        );
      }
      await emit(
        jobId,
        "discovery",
        "warn",
        "Running in simulation fallback mode",
        "No active Gemini keys available — real FFmpeg waveforms, scene cuts, and forced alignment will run with synthetic text."
      );
    }
    logRef = await endStage(jobId, "discovery", logRef, 0.05);
    checkCancel();

    // ── Silent Video Fast-Path (when video file has no audio track at all) ──
    const outJsonPath = path.join(OUT_DIR(jobId), "transcript_data.json");
    if (!hasAudioTrack) {
      logRef = await setStage(jobId, "analysis", logRef, 0.1);
      const durationSec = await probeDuration(job.mediaPath, signal);
      const emptyEnergy = { bins: new Array(240).fill(0), peak: 0 };
      await patchJob(jobId, { durationSec, silences: [], onsets: [], energy: emptyEnergy });
      await emit(
        jobId,
        "analysis",
        "info",
        `Silent video stream (${durationSec.toFixed(3)} s)`,
        "No audio track present — skipping speech extraction and advancing directly to FFmpeg scene cuts & 30s/5s visual analysis"
      );
      logRef = await endStage(jobId, "analysis", logRef, 0.2);
      for (const skippedStage of ["onsets", "chunking", "transcription", "alignment"] as StageKey[]) {
        logRef = await setStage(jobId, skippedStage, logRef, 0.78);
        logRef = await endStage(jobId, skippedStage, logRef, 0.82);
      }
      await alignAssemblePersist({
        jobId,
        filename: job.filename,
        fingerprint: job.fingerprint,
        mediaPath: job.mediaPath,
        words: [],
        pcmSamples: null,
        durationSec,
        silences: [],
        onsets: [],
        speech: [],
        chunkMetas: [],
        settings,
        simulated: healthyKeys === 0,
        logRef,
        outJsonPath,
        emissions: null,
        videoMeta,
        existingVideo: job.transcript?.video,
        allowSimulate,
        signal,
      });
      return;
    }

    // ── STAGE 1 & 2: Single-Pass Audio Decode + Silences + Onsets ───────────
    logRef = await setStage(jobId, "analysis", logRef, 0.07);
    await emit(jobId, "analysis", "stage", "Acoustic signal & pause analysis", "Probing duration, decoding 16 kHz mono PCM once, and mapping adaptive silence boundaries");

    const tDecode = Date.now();
    const durationSec = job.durationSec && Number.isFinite(job.durationSec) ? job.durationSec : await probeDuration(job.mediaPath, signal);
    // Decode 16 kHz PCM ONCE and reuse buffer across energy, noise floor, onsets, CTC emissions, and waveform refinement!
    const pcm = await decodePcm16(job.mediaPath, 16000, signal);
    const { samples: normSamples, gainDb } = pcmToNormalizedFloat32(pcm);
    const energy = job.energy ?? computeEnergyBins(pcm, 16000, 600);
    await patchJob(jobId, { durationSec, energy });
    await emit(
      jobId,
      "analysis",
      "success",
      `Decoded ${durationSec.toFixed(3)} s @ 16 kHz (${Date.now() - tDecode} ms)`,
      `${(pcm.length / 1000).toFixed(0)}k samples${gainDb > 0.5 ? ` · quiet recording boosted +${gainDb.toFixed(1)} dB for clean recognition` : " · healthy vocal gain"}`
    );

    let silences = job.silences ?? [];
    if (!job.silences) {
      const sT0 = Date.now();
      const noiseDb = adaptiveNoiseDb(pcm);
      silences = await detectSilences(job.mediaPath, { noiseDb, signal });
      await patchJob(jobId, { silences });
      const speechTmp = speechIntervals(silences, durationSec);
      const speechPct = durationSec > 0 ? (speechTmp.reduce((a, s) => a + (s.end - s.start), 0) / durationSec) * 100 : 0;
      await emit(
        jobId,
        "analysis",
        "success",
        `${silences.length} natural pause${silences.length === 1 ? "" : "s"} mapped (${Date.now() - sT0} ms)`,
        `Adaptive floor ${noiseDb.toFixed(1)} dB · ${speechPct.toFixed(1)}% active audio`
      );
    }
    const speech = speechIntervals(silences, durationSec);
    logRef = await endStage(jobId, "analysis", logRef, 0.13);
    checkCancel();

    logRef = await setStage(jobId, "onsets", logRef, 0.14);
    let onsets = job.onsets ?? [];
    if (!onsets.length) {
      const oT0 = Date.now();
      onsets = detectOnsetsFromSamples(pcm, 16000);
      await patchJob(jobId, { onsets });
      await emit(
        jobId,
        "onsets",
        "success",
        `${onsets.length.toLocaleString()} acoustic onsets measured (${Date.now() - oT0} ms)`,
        "10 ms RMS windows · 5 ms hop · half-wave ODF peak picking · 80 ms spacing"
      );
    } else {
      await emit(jobId, "onsets", "info", "Reusing cached onset map", `${onsets.length.toLocaleString()} physical attacks ready`);
    }
    logRef = await endStage(jobId, "onsets", logRef, 0.18);
    checkCancel();

    // ── STAGE 3: Upfront Silence-Snapped Chunk Planning ─────────────────────
    logRef = await setStage(jobId, "chunking", logRef, 0.2);
    const plan = buildPlan(durationSec, silences, settings.chunkSec, settings.overlapSec);
    const existingRows = await db.select().from(chunks).where(eq(chunks.jobId, jobId)).orderBy(asc(chunks.idx));
    const existingByIdx = new Map(existingRows.map((r) => [r.idx, r]));

    // Insert all planned chunks immediately as "pending" so UI `done/total` and retry logic are 100% exact
    for (const p of plan) {
      if (!existingByIdx.has(p.idx)) {
        const ins = await db
          .insert(chunks)
          .values({
            jobId,
            idx: p.idx,
            coreStart: p.coreStart,
            coreEnd: p.coreEnd,
            clipStart: p.clipStart,
            clipEnd: p.clipEnd,
            status: "pending",
            wordCount: 0,
            attempts: 0,
          })
          .returning();
        existingByIdx.set(p.idx, ins[0]);
      }
    }
    await patchJob(jobId, { progress: 0.24 });
    await emit(
      jobId,
      "chunking",
      "success",
      `${plan.length} silence-snapped chunk${plan.length === 1 ? "" : "s"} planned`,
      plan.map((c) => `#${c.idx + 1} [${c.coreStart.toFixed(1)}→${c.coreEnd.toFixed(1)}s]`).join("  ")
    );
    logRef = await endStage(jobId, "chunking", logRef, 0.25);
    checkCancel();

    // ── STAGE 4–6: Gemini Multimodal Speech Transcription + Acoustic Gate ───
    logRef = await setStage(jobId, "transcription", logRef, 0.26);
    const seed = parseInt(crypto.createHash("md5").update(jobId).digest("hex").slice(0, 8), 16);
    const useSim = healthyKeys === 0;
    let simulated = useSim;
    let failures = 0;

    // Seed per-chunk word map deterministically from cached transcript so out-of-order retries NEVER scramble word order
    const wordsByChunk = new Map<number, Word[]>();
    const metaByChunk = new Map<number, ChunkMeta>();
    if (job.transcript?.words?.length && existingRows.some((r) => r.status === "done")) {
      for (const m of job.transcript.chunks ?? []) {
        const row = existingByIdx.get(m.index);
        if (row?.status === "done") {
          metaByChunk.set(m.index, m);
          const cw = job.transcript.words.filter((w) => {
            const mid = (w.start + (w.spokenEnd ?? w.end)) / 2;
            return mid >= m.coreStart - 0.05 && mid <= m.coreEnd + 0.05;
          });
          wordsByChunk.set(m.index, cw);
        }
      }
      if (wordsByChunk.size > 0) {
        await emit(
          jobId,
          "transcription",
          "info",
          `Resumed ${wordsByChunk.size}/${plan.length} completed chunk${wordsByChunk.size === 1 ? "" : "s"} from cache`,
          "Only pending or failed chunks will be dispatched"
        );
      }
    }

    const stitchOrderedWords = (): Word[] => {
      const out: Word[] = [];
      for (const p of plan) {
        const w = wordsByChunk.get(p.idx);
        if (w?.length) out.push(...w);
      }
      return out;
    };

    let emissions: Emissions | null = null;
    if (!useSim) {
      try {
        await emit(
          jobId,
          "transcription",
          "info",
          "Scoring 20 ms acoustic character posteriors",
          "Running wav2vec2 ONNX engine across audio frames for exact overlap splicing & missing-speech repair"
        );
        emissions = await computeEmissions(normSamples, (title, message, level) =>
          void emit(jobId, "transcription", level || "info", title, message)
        );
      } catch (e: any) {
        await emit(
          jobId,
          "transcription",
          "warn",
          "wav2vec2 acoustic model unavailable",
          `${String(e?.message || e).slice(0, 150)} — falling back to silence-based coverage gate`
        );
      }
    }

    for (let ci = 0; ci < plan.length; ci++) {
      checkCancel();
      const chunk = plan[ci];
      const row = existingByIdx.get(chunk.idx);

      if (row?.status === "done" && metaByChunk.has(chunk.idx)) {
        await patchJob(jobId, { progress: 0.26 + ((ci + 1) / plan.length) * 0.5 });
        continue;
      }

      if (row) {
        await db.update(chunks).set({ status: "transcribing", error: null }).where(eq(chunks.id, row.id));
      }
      await patchJob(jobId, { progress: 0.26 + ((ci + 0.35) / plan.length) * 0.5 });

      await emit(
        jobId,
        "transcription",
        "stage",
        `Chunk ${chunk.idx + 1}/${plan.length} · [${chunk.coreStart.toFixed(2)}s → ${chunk.coreEnd.toFixed(2)}s]`,
        `Slicing mono 16 kHz clip [${chunk.clipStart.toFixed(2)} → ${chunk.clipEnd.toFixed(2)}s]`
      );

      const clipPath = path.join(TMP_DIR(jobId), `chunk-${chunk.idx}.mp3`);
      await sliceToMp3(job.mediaPath, chunk.clipStart, chunk.clipEnd, clipPath, signal);
      const b64 = fs.readFileSync(clipPath).toString("base64");

      let attempt = 0;
      let feedback = "";
      let finalWords: Word[] = [];
      let modelUsed = "";
      let keyIdx: number | null = null;
      let report = { coverage: 1, longestMissSec: 0 };
      let bestScore = -Infinity;
      const maxAttempts = 3;

      let bestAll: Word[] | null = null;
      let lastGate: { coverage: number; longestMissSec: number; missAt?: number } | null = null;
      const priorWords = stitchOrderedWords();
      const lastPrev = priorWords.length ? priorWords[priorWords.length - 1] : null;
      const lastPrevEnd = lastPrev ? (lastPrev.spokenEnd ?? lastPrev.end) : -Infinity;
      const isLast = ci === plan.length - 1;
      const gateStart = ci > 0 ? Math.max(chunk.clipStart, Math.min(chunk.coreStart, lastPrevEnd)) : chunk.coreStart;
      const gateEnd = Math.max(gateStart + 1, isLast ? chunk.coreEnd : chunk.coreEnd - settings.overlapSec * 0.75);

      const spliceFilter = (all: Word[]) =>
        all.filter((w) => {
          const mid = (w.start + (w.spokenEnd ?? w.end)) / 2;
          if (mid > chunk.coreEnd + 0.05) return false;
          if (mid >= chunk.coreStart - 0.05) return !lastPrev || w.start >= lastPrevEnd - 0.03;
          return ci > 0 && w.start >= lastPrevEnd - 0.03;
        });

      try {
        while (attempt < maxAttempts) {
          checkCancel();
          attempt += 1;
          let chunkWords: Word[] | null = null;
          let preAligned: Word[] | null = null;
          let thisModel = "";
          let thisKey: number | null = null;
          const canRepair = !!(emissions && bestAll && lastGate?.missAt != null && !useSim && !simulated);

          if (useSim || simulated) {
            await emit(jobId, "transcription", "model", `Simulating speech pass ${attempt}`, "Generating synthetic words with timing jitter");
            await sleep(500 + Math.random() * 400, signal);
            const raw = synthesizeWords(chunk, speech, onsets, seed);
            chunkWords = normalizeClipWords(
              raw.map((w) => ({ word: w.word, start: w.start - chunk.clipStart, end: w.end - chunk.clipStart })),
              chunk.clipStart
            );
            thisModel = "simulation";
          } else if (canRepair) {
            const missAt: number = lastGate?.missAt ?? 0;
            const missEnd: number = missAt + (lastGate?.longestMissSec ?? 0);
            const rs = Math.max(chunk.clipStart, missAt - 1);
            const re = Math.min(chunk.clipEnd, Math.max(missEnd + 1, rs + 2));
            const all: Word[] = bestAll ?? [];
            const beforeIdx = all.filter((w) => (w.spokenEnd ?? w.end) <= missAt + 0.1).length;
            let afterIdx = all.findIndex((w, i) => i >= beforeIdx && w.start >= missEnd - 0.1);
            if (afterIdx < 0) afterIdx = all.length;
            const gStart = beforeIdx > 0 ? (all[beforeIdx - 1].spokenEnd ?? all[beforeIdx - 1].end) : rs;
            const gEnd = afterIdx < all.length ? all[afterIdx].start : re;

            await emit(
              jobId,
              "transcription",
              "stage",
              `Targeted gap repair · ${missAt.toFixed(1)}–${missEnd.toFixed(1)} s`,
              `Re-transcribing only the ${(re - rs).toFixed(1)} s skipped window [${rs.toFixed(1)} → ${re.toFixed(1)}s]`
            );
            const repairPath = path.join(TMP_DIR(jobId), `chunk-${chunk.idx}-repair-${attempt}.mp3`);
            await sliceToMp3(job.mediaPath, rs, re, repairPath, signal);
            const before = [...priorWords, ...all.slice(0, beforeIdx)].slice(-20).map((w) => w.word).join(" ");
            const after = all.slice(afterIdx, afterIdx + 10).map((w) => w.word).join(" ");
            const prompt =
              `Transcribe this short ${(re - rs).toFixed(1)} second audio clip verbatim, every word in spoken order. ` +
              (before ? `It comes right after: "${before}". ` : "") +
              (after ? `It is followed by: "${after}". ` : "") +
              "Return the full JSON object with each word and its start (s) and end (e) in seconds from the start of THIS clip.";
            try {
              const res = await sendModelRequest({
                prompt,
                audioBase64: fs.readFileSync(repairPath).toString("base64"),
                mimeType: "audio/mpeg",
                preferredModel: settings.model,
                signal,
                onLog: (msg, level) => void emit(jobId, "transcription", (level as EventLevel) || "info", "Rotator", msg),
              });
              const rAl = alignClip(emissions!, normalizeClipWords(res.words, rs), rs, re);
              const fill = rAl.words.filter((w) => {
                const mid = (w.start + (w.spokenEnd ?? w.end)) / 2;
                return mid > gStart - 0.02 && mid < gEnd + 0.02 && w.start >= gStart - 0.03;
              });
              preAligned = [...all.slice(0, beforeIdx), ...fill, ...all.slice(afterIdx)];
              thisModel = res.model;
              thisKey = res.keyIndex;
              await emit(
                jobId,
                "transcription",
                "success",
                `Gap repaired · +${fill.length} words`,
                `Spliced cleanly: "${fill.map((w) => w.word).join(" ").slice(0, 120)}"`
              );
            } catch (e: any) {
              if (/cancelled/i.test(String(e?.message || e)) || signal.aborted) throw new Error("cancelled");
              await emit(jobId, "transcription", "warn", "Gap repair attempt skipped", String(e?.message || e).slice(0, 150));
              continue;
            } finally {
              try {
                fs.unlinkSync(repairPath);
              } catch {
                /* ignore */
              }
            }
          } else {
            const context = priorWords.slice(-25).map((w) => w.word).join(" ");
            const prompt =
              `Transcribe this ${Math.max(0.1, chunk.clipEnd - chunk.clipStart).toFixed(1)} second audio clip. ` +
              (context ? `The speaker was saying just before this clip: "${context}" — continue verbatim from where they left off. ` : "") +
              (feedback ? `\n${feedback}\n` : "") +
              `Return the full JSON object with every word IN SPOKEN ORDER, its start (s) and end (e) in seconds from the start of THIS clip.`;
            try {
              const res = await sendModelRequest({
                prompt,
                audioBase64: b64,
                mimeType: "audio/mpeg",
                preferredModel: settings.model,
                signal,
                onLog: (msg, level) => void emit(jobId, "transcription", (level as EventLevel) || "info", "Rotator", msg),
              });
              chunkWords = normalizeClipWords(res.words, chunk.clipStart);
              thisModel = res.model;
              thisKey = res.keyIndex;
            } catch (e: any) {
              if (/cancelled/i.test(String(e?.message || e)) || signal.aborted) throw new Error("cancelled");
              failures += 1;
              if (allowSimulate && failures >= Math.min(3, Math.max(1, healthyKeys))) {
                simulated = true;
                await emit(jobId, "transcription", "warn", "Keys exhausted — switching to simulation", "Completing remaining chunks in simulation mode");
                attempt -= 1;
                continue;
              }
              throw e;
            }
          }

          let cleaned: Word[];
          let allAligned: Word[] | null = null;
          let gate: { coverage: number; longestMissSec: number; missAt?: number };
          let acoustic = false;
          if (preAligned) {
            allAligned = preAligned;
            cleaned = spliceFilter(preAligned);
            gate = acousticCoverage(emissions!, cleaned, gateStart, gateEnd);
            acoustic = true;
          } else if (emissions && thisModel !== "simulation" && chunkWords) {
            const al = alignClip(emissions, chunkWords, chunk.clipStart, chunk.clipEnd);
            allAligned = al.words;
            cleaned = spliceFilter(al.words);
            gate = acousticCoverage(emissions, cleaned, gateStart, gateEnd);
            acoustic = al.ok;
            await emit(
              jobId,
              "transcription",
              "info",
              al.ok ? `Clip aligned · ${cleaned.length} core words` : "Fallback to clip timestamps",
              al.ok ? `Acoustic confidence ${Math.round(al.avgConf * 100)}%` : "Dense window"
            );
          } else {
            cleaned = coreFilter(snapWordsToSpeech(chunkWords ?? [], silences), chunk.coreStart, chunk.coreEnd);
            gate = measureCoverage(cleaned, speech, chunk.coreStart, chunk.coreEnd);
          }

          const minCov = acoustic ? 0.9 : 0.85;
          const maxMiss = acoustic ? 1.5 : 3;
          const passed = thisModel === "simulation" || (gate.coverage >= minCov && gate.longestMissSec < maxMiss);
          await emit(
            jobId,
            "transcription",
            passed ? "success" : "warn",
            `Coverage gate · ${(gate.coverage * 100).toFixed(0)}%`,
            `Longest miss ${gate.longestMissSec.toFixed(2)}s`
          );

          const score = gate.coverage - gate.longestMissSec * 0.05;
          if (score > bestScore) {
            bestScore = score;
            finalWords = cleaned;
            bestAll = allAligned;
            lastGate = gate;
            report = {
              coverage: thisModel === "simulation" ? 1 : gate.coverage,
              longestMissSec: thisModel === "simulation" ? 0 : gate.longestMissSec,
            };
            modelUsed = thisModel;
            keyIdx = thisKey;
          }
          if (passed) break;
          if (attempt < maxAttempts) {
            const g = lastGate ?? gate;
            const where =
              g.missAt != null
                ? ` Speech around ${(g.missAt - chunk.clipStart).toFixed(1)}s–${(g.missAt - chunk.clipStart + g.longestMissSec).toFixed(1)}s was skipped.`
                : "";
            feedback = `IMPORTANT: previous attempt missed speech (${(g.coverage * 100).toFixed(0)}% covered, ${g.longestMissSec}s missed).${where} Transcribe EVERY spoken word in order.`;
          }
        }
      } catch (chunkErr: any) {
        if (row && !/cancelled/i.test(String(chunkErr?.message || chunkErr))) {
          await db
            .update(chunks)
            .set({ status: "failed", attempts: attempt, error: String(chunkErr?.message || chunkErr).slice(0, 200) })
            .where(eq(chunks.id, row.id));
        }
        try {
          fs.unlinkSync(clipPath);
        } catch {
          /* ignore */
        }
        throw chunkErr;
      }

      wordsByChunk.set(chunk.idx, finalWords);
      const meta: ChunkMeta = {
        index: chunk.idx,
        coreStart: chunk.coreStart,
        coreEnd: chunk.coreEnd,
        wordCount: finalWords.length,
        coverage: Math.round(report.coverage * 100) / 100,
        longestMissSec: report.longestMissSec,
        model: modelUsed,
      };
      metaByChunk.set(chunk.idx, meta);

      if (row) {
        await db
          .update(chunks)
          .set({
            status: "done",
            wordCount: finalWords.length,
            coverage: meta.coverage,
            longestMissSec: meta.longestMissSec,
            attempts: attempt,
            model: modelUsed,
            keyIndex: keyIdx,
            error: null,
          })
          .where(eq(chunks.id, row.id));
      }

      const orderedWords = stitchOrderedWords();
      const orderedMetas = [...metaByChunk.values()].sort((a, b) => a.index - b.index);
      const partial: TranscriptDoc = {
        version: 5,
        generatedAt: new Date().toISOString(),
        audio: { filename: job.filename, fingerprint: job.fingerprint, durationSec },
        settings: {
          chunkDurationSeconds: settings.chunkSec,
          overlapSeconds: settings.overlapSec,
          model: settings.model,
          toleranceMs: settings.toleranceMs,
        },
        complete: false,
        simulated,
        chunks: orderedMetas,
        silences,
        onsets,
        words: stampPauses(orderedWords),
        sentences: assembleSentences(orderedWords),
        alignment: null,
        video: job.transcript?.video,
      };
      writeJsonAtomic(outJsonPath, partial);
      await patchJob(jobId, {
        transcript: partial,
        wordCount: orderedWords.length,
        sentenceCount: partial.sentences.length,
        simulated,
        progress: 0.26 + ((ci + 1) / plan.length) * 0.5,
      });
      await emit(
        jobId,
        "transcription",
        "success",
        `Chunk ${chunk.idx + 1}/${plan.length} complete`,
        `${finalWords.length} words (${orderedWords.length} total) · ${modelUsed}${keyIdx !== null ? ` · Key #${keyIdx}` : ""}`
      );

      try {
        fs.unlinkSync(clipPath);
      } catch {
        /* ignore */
      }
    }

    logRef = await endStage(jobId, "transcription", logRef, 0.78);
    checkCancel();

    await alignAssemblePersist({
      jobId,
      filename: job.filename,
      fingerprint: job.fingerprint,
      mediaPath: job.mediaPath,
      words: stitchOrderedWords(),
      pcmSamples: normSamples,
      durationSec,
      silences,
      onsets,
      speech,
      chunkMetas: [...metaByChunk.values()].sort((a, b) => a.index - b.index),
      settings,
      simulated,
      logRef,
      outJsonPath,
      emissions,
      videoMeta,
      existingVideo: job.transcript?.video,
      allowSimulate,
      signal,
    });
  } catch (err: any) {
    await failJob(jobId, err);
  }
}

async function failJob(jobId: string, err: any) {
  const msg = String(err?.message || err);
  const cancelled = /cancelled|aborted/i.test(msg);
  await patchJob(jobId, {
    status: cancelled ? "canceled" : "failed",
    error: cancelled ? null : msg,
    completedAt: cancelled ? undefined : new Date(),
  }).catch(() => {});
  await emit(
    jobId,
    "info",
    cancelled ? "warn" : "error",
    cancelled ? "Job stopped" : "Pipeline halted",
    cancelled ? "Execution aborted cleanly. Completed chunks & visual sections remain cached for instant resume." : msg
  );
}

// ── Shared: forced alignment → video analysis → sentence assembly → persist ─
async function alignAssemblePersist(p: {
  jobId: string;
  filename: string;
  fingerprint: string | null;
  mediaPath: string;
  words: Word[];
  pcmSamples: Float32Array | null;
  durationSec: number;
  silences: Silence[];
  onsets: number[];
  speech: Silence[];
  chunkMetas: ChunkMeta[];
  settings: JobSettings;
  simulated: boolean;
  logRef: StageLog;
  outJsonPath: string;
  emissions?: Emissions | null;
  videoMeta?: VideoMeta | null;
  existingVideo?: VideoTranscript;
  allowSimulate?: boolean;
  signal: AbortSignal;
}) {
  const { jobId, words, durationSec, onsets, speech, settings, signal } = p;
  let logRef = p.logRef;

  // ── STAGE 7: Acoustic Forced Alignment ──────────────────────────────────
  logRef = await setStage(jobId, "alignment", logRef, 0.8);
  let alignedWords: Word[] = [];
  let stats: AlignmentStats = {
    anchored: 0,
    interpolated: 0,
    total: 0,
    collisionsFixed: 0,
    method: "ctc-forced",
    avgConfidence: 1,
    lowConfidence: 0,
    refined: 0,
  };

  if (words.length > 0 && p.pcmSamples) {
    await emit(
      jobId,
      "alignment",
      "stage",
      "20 ms CTC forced alignment",
      `Aligning ${words.length} words character-by-character against wav2vec2 acoustic frames and refining attacks on the waveform`
    );
    try {
      const t0 = Date.now();
      const segments = [...p.chunkMetas]
        .sort((a, b) => a.coreStart - b.coreStart)
        .map((c) => ({ start: c.coreStart, end: c.coreEnd }));
      const res = await forcedAlign({
        words,
        samples: p.pcmSamples,
        segments,
        onsets,
        durationSec,
        emissions: p.emissions,
        onLog: (title, message, level) => void emit(jobId, "alignment", level || "info", title, message),
      });
      alignedWords = res.words;
      stats = {
        anchored: res.aligned,
        interpolated: res.interpolated,
        total: words.length,
        collisionsFixed: res.collisionsFixed,
        method: "ctc-forced",
        avgConfidence: Math.round(res.avgConfidence * 100) / 100,
        lowConfidence: res.lowConfidence,
        refined: res.refined,
      };
      await emit(
        jobId,
        "alignment",
        "success",
        `Force-aligned ${res.aligned}/${words.length} words (${((Date.now() - t0) / 1000).toFixed(1)} s)`,
        `Mean acoustic confidence ${Math.round(res.avgConfidence * 100)}% · ${res.refined} physical vocal attacks refined`
      );
    } catch (err: any) {
      if (signal.aborted) throw new Error("cancelled");
      await emit(jobId, "alignment", "warn", "Fallback drift-curve alignment", String(err?.message || err).slice(0, 160));
      const res = correctWordTimestamps(words, onsets, { toleranceSec: settings.toleranceMs / 1000 });
      alignedWords = stampPauses(res.words);
      stats = res.stats;
    }
  } else {
    await emit(jobId, "alignment", "info", "No spoken words to align", "Proceeding with 0 spoken words");
  }
  logRef = await endStage(jobId, "alignment", logRef, 0.84);
  if (signal.aborted) throw new Error("cancelled");

  // ── STAGE 8: Synchronized Video Analysis ────────────────────────────────
  logRef = await setStage(jobId, "video", logRef, 0.85);
  let videoTranscript: VideoTranscript | undefined;
  if (p.videoMeta) {
    if (p.existingVideo?.complete) {
      videoTranscript = refreshVideoSpeech(p.existingVideo, alignedWords);
      await emit(
        jobId,
        "video",
        "success",
        "Visual analysis re-bound",
        `${videoTranscript.observations.length} × 5s observations re-linked to newly aligned words (0 Gemini calls spent)`
      );
    } else {
      await emit(
        jobId,
        "video",
        "stage",
        "Synchronized 30s / 5s video understanding",
        "Extracting physical FFmpeg scene cuts and analyzing every 5-second slot with 1-second overlap"
      );
      videoTranscript = await analyzeVideo({
        mediaFile: p.mediaPath,
        jobId,
        durationSec,
        meta: p.videoMeta,
        words: alignedWords,
        preferredModel: settings.model,
        tmpDir: TMP_DIR(jobId),
        useSim: p.simulated,
        allowSimulate: p.allowSimulate ?? true,
        cachedSections: p.existingVideo?.sections,
        signal,
        onLog: (level, title, message) => emit(jobId, "video", level, title, message),
        onSection: async (video) => {
          const draftSentences = assembleSentences(alignedWords);
          const draft: TranscriptDoc = {
            version: 5,
            generatedAt: new Date().toISOString(),
            audio: { filename: p.filename, fingerprint: p.fingerprint, durationSec },
            settings: {
              chunkDurationSeconds: settings.chunkSec,
              overlapSeconds: settings.overlapSec,
              model: settings.model,
              toleranceMs: settings.toleranceMs,
            },
            complete: false,
            simulated: Boolean(p.simulated || video.simulated),
            chunks: p.chunkMetas,
            silences: p.silences,
            onsets,
            words: alignedWords,
            sentences: draftSentences,
            alignment: stats,
            video,
          };
          writeJsonAtomic(p.outJsonPath, draft);
          const totalSections = Math.max(1, Math.ceil(durationSec / 30));
          await patchJob(jobId, {
            transcript: draft,
            simulated: Boolean(p.simulated || video.simulated),
            progress: 0.85 + (video.sections.length / totalSections) * 0.08,
          });
        },
      });
      await emit(
        jobId,
        "video",
        "success",
        "Audio + video timeline locked",
        `${videoTranscript.observations.length} × 5s observations across ${videoTranscript.sections.length} sections synchronized to ${alignedWords.length} words & ${videoTranscript.sceneCuts?.length ?? 0} cuts`
      );
    }
  } else {
    await emit(jobId, "video", "info", "Audio-only media", "Visual stage skipped");
  }
  logRef = await endStage(jobId, "video", logRef, 0.94);

  // ── STAGE 9: Sentence Assembly & Atomic Persistence ─────────────────────
  logRef = await setStage(jobId, "assembly", logRef, 0.95);
  const sentences = assembleSentences(alignedWords);
  const pauses = alignedWords.filter((w) => w.pauseAfterMs >= 250).length;
  await emit(
    jobId,
    "assembly",
    "success",
    `${sentences.length} sentences assembled`,
    `${pauses} natural pauses ≥ 250 ms stamped`
  );
  logRef = await endStage(jobId, "assembly", logRef, 0.97);

  logRef = await setStage(jobId, "persist", logRef, 0.98);
  const finalSimulated = Boolean(p.simulated || videoTranscript?.simulated);
  const globalReport = speech.length ? measureCoverage(alignedWords, speech, 0, durationSec) : { coverage: 1, longestMissSec: 0 };
  const doc: TranscriptDoc = {
    version: 5,
    generatedAt: new Date().toISOString(),
    audio: { filename: p.filename, fingerprint: p.fingerprint, durationSec },
    settings: {
      chunkDurationSeconds: settings.chunkSec,
      overlapSeconds: settings.overlapSec,
      model: settings.model,
      toleranceMs: settings.toleranceMs,
    },
    complete: true,
    simulated: finalSimulated,
    chunks: p.chunkMetas,
    silences: p.silences,
    onsets,
    words: alignedWords,
    sentences,
    alignment: stats,
    video: videoTranscript,
  };
  writeJsonAtomic(p.outJsonPath, doc);
  await patchJob(jobId, {
    transcript: doc,
    wordCount: alignedWords.length,
    sentenceCount: sentences.length,
    coverage: Math.round(globalReport.coverage * 100) / 100,
    longestMissSec: globalReport.longestMissSec,
    anchoredCount: stats.anchored,
    alignedTotal: stats.total,
    status: "completed",
    progress: 1,
    completedAt: new Date(),
    error: null,
    simulated: finalSimulated,
  });
  await emit(jobId, "persist", "success", "Atomic persistence complete", `transcript_data.json saved (${alignedWords.length} words, ${sentences.length} sentences)`);
  await endStage(jobId, "persist", logRef, 1);
  await emit(jobId, "info", "success", "Pipeline complete", `Coverage ${(globalReport.coverage * 100).toFixed(1)}% · ready for studio review & export`);
}

// ── Re-align existing job without spending Gemini API calls ─────────────────
export async function realignJob(jobId: string, signal: AbortSignal) {
  try {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!job) throw new Error("Job not found");
    if (!job.transcript?.words?.length) throw new Error("This job has no words to re-align");
    if (!job.mediaPath || !fs.existsSync(/*turbopackIgnore: true*/ job.mediaPath)) throw new Error("Media file missing on disk");
    const settings: JobSettings = job.settings ?? { chunkSec: 30, overlapSec: 2, model: "auto", toleranceMs: 350 };

    const keep = (job.stageLog ?? []).filter((s) => !["alignment", "video", "assembly", "persist"].includes(s.stage));
    await patchJob(jobId, { status: "working", stage: "alignment", progress: 0.78, error: null, stageLog: keep });
    await emit(jobId, "info", "stage", "Re-alignment started", `Re-timing ${job.transcript.words.length} words acoustically — 0 API quota used`);

    const durationSec = job.durationSec ?? (await probeDuration(job.mediaPath, signal));
    const pcm = await decodePcm16(job.mediaPath, 16000, signal);
    const { samples: normSamples } = pcmToNormalizedFloat32(pcm);
    const noiseDb = adaptiveNoiseDb(pcm);
    const silences = await detectSilences(job.mediaPath, { noiseDb, signal });
    const speech = speechIntervals(silences, durationSec);
    const onsets = job.onsets?.length ? job.onsets : detectOnsetsFromSamples(pcm, 16000);
    await patchJob(jobId, { silences });

    await alignAssemblePersist({
      jobId,
      filename: job.filename,
      fingerprint: job.fingerprint,
      mediaPath: job.mediaPath,
      words: job.transcript.words.map((w) => ({ word: w.word, start: w.start, end: w.spokenEnd ?? w.end, pauseAfterMs: 0 })),
      pcmSamples: normSamples,
      durationSec,
      silences,
      onsets,
      speech,
      chunkMetas: job.transcript.chunks ?? [],
      settings,
      simulated: job.simulated,
      logRef: keep,
      outJsonPath: path.join(OUT_DIR(jobId), "transcript_data.json"),
      videoMeta: job.videoMeta,
      existingVideo: job.transcript.video,
      signal,
    });
  } catch (err: any) {
    await failJob(jobId, err);
  }
}

// ── Queue + Instant AbortController + Orphan Recovery ───────────────────────
interface QueueItem {
  id: string;
  kind: "full" | "realign";
  settings?: JobSettings;
  allowSimulate?: boolean;
}
interface EngineQueue {
  queue: QueueItem[];
  running: boolean;
  activeId: string | null;
  activeController: AbortController | null;
  cancel: Map<string, boolean>;
  bootRecovered: boolean;
}
const g = globalThis as typeof globalThis & { __engineQueue3?: EngineQueue };
const q: EngineQueue =
  g.__engineQueue3 ??
  (g.__engineQueue3 = {
    queue: [],
    running: false,
    activeId: null,
    activeController: null,
    cancel: new Map(),
    bootRecovered: false,
  });
export const cancelFlags = q.cancel;

export function queueJob(jobId: string, settings: JobSettings, allowSimulate: boolean) {
  cancelFlags.delete(jobId);
  if (!q.queue.some((x) => x.id === jobId) && q.activeId !== jobId) {
    q.queue.push({ id: jobId, kind: "full", settings, allowSimulate });
  }
  void pump();
}

export function queueRetryFailed(jobId: string) {
  cancelFlags.delete(jobId);
  if (!q.queue.some((x) => x.id === jobId) && q.activeId !== jobId) {
    q.queue.push({ id: jobId, kind: "full", settings: undefined, allowSimulate: undefined });
  }
  void pump();
}

export function queueRealign(jobId: string) {
  cancelFlags.delete(jobId);
  if (!q.queue.some((x) => x.id === jobId) && q.activeId !== jobId) {
    q.queue.push({ id: jobId, kind: "realign" });
  }
  void pump();
}

export async function cancelJob(jobId: string) {
  cancelFlags.set(jobId, true);
  // Remove if still waiting in queue
  const before = q.queue.length;
  q.queue = q.queue.filter((x) => x.id !== jobId);
  if (q.activeId === jobId && q.activeController) {
    q.activeController.abort();
  } else if (before !== q.queue.length) {
    await patchJob(jobId, { status: "canceled", error: null });
    await emit(jobId, "info", "warn", "Job canceled", "Removed from queue before execution started.");
  }
}

/** Auto-recovers jobs stranded in 'working'/'queued' if the server restarted mid-job. */
export async function ensureOrphansRecovered() {
  if (q.bootRecovered) return;
  q.bootRecovered = true;
  try {
    const stranded = await db
      .select({ id: jobs.id, settings: jobs.settings })
      .from(jobs)
      .where(inArray(jobs.status, ["working", "queued"]));
    if (!stranded.length) return;
    const [appCfg] = await db.select().from(appSettings).where(eq(appSettings.id, 1)).limit(1);
    for (const s of stranded) {
      if (q.activeId === s.id || q.queue.some((x) => x.id === s.id)) continue;
      await emit(s.id, "info", "info", "Auto-resumed after server restart", "Continuing seamlessly from atomic cache");
      q.queue.push({
        id: s.id,
        kind: "full",
        settings: s.settings ?? undefined,
        allowSimulate: appCfg?.allowSimulate ?? true,
      });
    }
    if (q.queue.length) void pump();
  } catch {
    /* non-fatal during schema bootstrap */
  }
}

async function pump() {
  if (q.running) return;
  q.running = true;
  try {
    while (q.queue.length > 0) {
      const next = q.queue.shift()!;
      if (cancelFlags.get(next.id)) {
        cancelFlags.delete(next.id);
        continue;
      }
      const controller = new AbortController();
      q.activeId = next.id;
      q.activeController = controller;
      try {
        if (next.kind === "realign") {
          await realignJob(next.id, controller.signal);
        } else {
          const [appCfg] = await db.select().from(appSettings).where(eq(appSettings.id, 1)).limit(1);
          const [jobCfg] = await db
            .select({ settings: jobs.settings })
            .from(jobs)
            .where(eq(jobs.id, next.id))
            .limit(1);
          const settings =
            next.settings ??
            jobCfg?.settings ?? {
              chunkSec: appCfg?.chunkSec ?? 30,
              overlapSec: appCfg?.overlapSec ?? 2,
              model: appCfg?.model ?? "auto",
              toleranceMs: appCfg?.toleranceMs ?? 350,
            };
          await runJob(next.id, settings, next.allowSimulate ?? appCfg?.allowSimulate ?? true, controller.signal);
        }
      } finally {
        q.activeId = null;
        q.activeController = null;
        cancelFlags.delete(next.id);
      }
    }
  } finally {
    q.running = false;
  }
}

export function queueSnapshot() {
  return { queued: q.queue.length, running: q.running, activeId: q.activeId };
}
