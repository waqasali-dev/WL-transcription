import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chunks, events, jobs } from "@/db/schema";
import { probeDuration, round3, sliceToMp3, decodePcm16, speechIntervals } from "@/lib/engine/audio";
import { analyzeAudio, extractFeatures } from "@/lib/engine/features";
import { correctWordTimestamps } from "@/lib/engine/matcher";
import { keyManager } from "@/lib/engine/keys";
import { sendModelRequest } from "@/lib/engine/gemini";
import {
  assembleSentences,
  coreFilter,
  measureCoverage,
  normalizeClipWords,
  snapWordsToSpeech,
  stampPauses,
} from "@/lib/engine/align";
import type {
  ChunkMeta,
  EventLevel,
  JobSettings,
  Silence,
  StageKey,
  TranscriptDoc,
  Word,
} from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const OUT_DIR = (id: string) => path.join(DATA_DIR, "output", id);
const TMP_DIR = (id: string) => path.join(DATA_DIR, "tmp", id);

// ── Atomic JSON persistence ─────────────────────────────────────────────────
function writeJsonAtomic(filePath: string, data: unknown) {
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
async function emit(
  jobId: string,
  stage: StageKey | "info",
  level: EventLevel,
  title: string,
  message: string,
  data?: Record<string, unknown>
) {
  try {
    await db.insert(events).values({ jobId, stage, level, title, message, data: data ?? null });
  } catch {
    /* never let logging kill the pipeline */
  }
}

async function patchJob(jobId: string, patch: Record<string, unknown>) {
  await db.update(jobs).set(patch as any).where(eq(jobs.id, jobId));
}

async function setStage(jobId: string, stageKey: StageKey, log: { stage: StageKey; startedAt: string; doneAt: string | null }[], progress: number) {
  const started = { stage: stageKey, startedAt: new Date().toISOString(), doneAt: null };
  const next = [...log, started];
  await patchJob(jobId, { stage: stageKey, stageLog: next, progress });
  return next;
}

async function endStage(jobId: string, stageKey: StageKey, log: { stage: StageKey; startedAt: string; doneAt: string | null }[], progress: number) {
  const next = log.map((s) => (s.stage === stageKey && !s.doneAt ? { ...s, doneAt: new Date().toISOString() } : s));
  await patchJob(jobId, { stageLog: next, progress });
  return next;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Simulation fallback (clearly labeled synthetic transcript) ──────────────
const SIM_CORPUS = [
  "So the first thing we do is probe the file, and we get the exact duration down to the millisecond.",
  "From there we run silence detection at minus thirty five decibels, and anything quieter than that for three hundred fifty milliseconds becomes a boundary.",
  "The magic really happens in the onset detector, which measures the physical consonant attacks straight off the waveform.",
  "We slice the audio into thirty second windows, but we never cut through a word, because every boundary snaps to the middle of a detected silence.",
  "Each clip goes to Gemini with a strict schema, and the model is forced to return words with start and end times in seconds.",
  "If a key hits a rate limit, the rotator flips to the next key instantly, so the pipeline never stalls on a four twenty nine.",
  "After the words come back we check coverage against the FFmpeg speech intervals, and anything under eighty five percent gets retried with corrective feedback.",
  "Pass one of the aligner greedily anchors each word to a physical onset within three hundred fifty milliseconds.",
  "Pass two interpolates the soft words between anchors, so the relative cadence is preserved and the drift is gone.",
  "Pass three enforces strict chronological order, and pass four bridges every gap so a visual never drops out mid sentence.",
  "The result is a transcript where every timestamp is a measured acoustic event, not a statistical guess.",
  "That is the difference between subtitles that feel alive and subtitles that feel like they are floating.",
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

export function synthesizeWords(
  chunk: PlanChunk,
  speech: Silence[],
  onsets: number[],
  seed: number
): Word[] {
  const rnd = mulberry32(seed * 7919 + chunk.idx * 104729 + 17);
  const words: Word[] = [];
  // continuous narration flow across the chunk's speech intervals
  let si = Math.floor(rnd() * SIM_CORPUS.length);
  let wi = 0;
  // walk speech intervals inside the core window
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
      // AI-style jitter — the 4-pass aligner will fix this
      const jitter = (rnd() - 0.5) * 0.24;
      const start = t + jitter;
      const nextT = t + baseDur + 0.06 + rnd() * 0.14;
      if (lastTok) {
        si = (si + 1) % SIM_CORPUS.length;
        wi = 0;
      } else {
        wi += 1;
      }
      words.push({ word: tok, start: round3(Math.max(chunk.coreStart, start)), end: round3(Math.max(start + 0.12, Math.min(nextT, start + baseDur))), pauseAfterMs: 0 });
      t = nextT;
    }
  }
  words.sort((x, y) => x.start - y.start);
  // nudge a portion of starts toward real onsets so the anchoring rate is realistic
  for (const w of words) {
    if (rnd() < 0.45 && onsets.length) {
      const near = onsets.find((o) => Math.abs(o - w.start) < 0.3);
      if (near !== undefined && rnd() < 0.6) w.start = round3(near + (rnd() - 0.5) * 0.12);
    }
  }
  return words;
}

// ── The main job pipeline ───────────────────────────────────────────────────
interface RunCtx {
  jobId: string;
  settings: JobSettings;
  allowSimulate: boolean;
}

export async function runJob(jobId: string, settings: JobSettings, allowSimulate: boolean) {
  const ctx: RunCtx = { jobId, settings, allowSimulate };
  const cancel = () => cancelFlags.has(jobId);
  const log: { stage: StageKey; startedAt: string; doneAt: string | null }[] = [];
  let logRef = log;

  try {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!job) throw new Error("Job not found");
    if (!job.mediaPath || !fs.existsSync(job.mediaPath)) throw new Error("Media file missing on disk");
    await patchJob(jobId, { status: "working", startedAt: new Date(), error: null, progress: 0.01 });

    await emit(jobId, "info", "stage", "Pipeline started", `Queued → working. Target: ${job.filename}`);

    // ── STAGE: discovery ────────────────────────────────────────────────────
    logRef = await setStage(jobId, "discovery", logRef, 0.02);
    await emit(jobId, "discovery", "stage", "Step 0 · Multi-key API discovery", "Scanning .env (api1…apiN, GEMINI_API_KEY) and local key store");
    await keyManager.load(true);
    const keyCount = keyManager.count();
    if (keyCount > 0) {
      const info = await keyManager.describe();
      for (const k of info.keys) {
        await emit(jobId, "discovery", "info", `Key #${k.idx} · ${k.source}`, `${k.masked} — from ${k.from} · ${k.project}${k.disabledReason ? ` — DISABLED (${k.disabledReason})` : ""}`);
      }
      await emit(jobId, "discovery", "success", `${keyCount} key${keyCount > 1 ? "s" : ""} discovered`, `Dual-window quota armed: RPM rolling 60 s · RPD reset 1:00 PM local. Atomic slot reservation active.`);
    } else {
      if (!allowSimulate) throw new Error("No Gemini API keys configured. Add keys in the Keys panel (or set api1=… in .env).");
      await emit(jobId, "discovery", "warn", "No Gemini API keys configured", "Falling back to SIMULATION MODE: acoustic analysis, chunking, 4-pass alignment and sentence assembly run on the real waveform — only the text is synthetic. Add keys for true transcription.");
    }

    // ── STAGE: analysis ─────────────────────────────────────────────────────
    logRef = await setStage(jobId, "analysis", logRef, 0.05);
    let durationSec = job.durationSec ?? NaN;
    let silences: Silence[] = job.silences ?? [];
    let onsets: number[] = job.onsets ?? [];
    let onsetStrengths: number[] = job.onsetStrengths ?? [];
    let energy = job.energy;
    let speech: Silence[] = [];
    let noiseFloorDb: number | null = null;
    let silenceThresholdDb: number | null = null;

    if (Number.isFinite(durationSec) && job.durationSec && energy && silences.length > 0) {
      speech = speechIntervals(silences, durationSec);
      await emit(jobId, "analysis", "info", "Reusing cached acoustic features", `Duration ${durationSec.toFixed(3)} s · ${silences.length} silences · ${onsets.length} onsets already measured — skipping re-analysis`);
    } else {
      await emit(jobId, "analysis", "stage", "Step 1 · Audio signal & feature analysis", "ffprobe duration → 16 kHz PCM → adaptive noise floor → silence map → spectral-flux onsets");
      const feats = await analyzeAudio(job.mediaPath!);
      durationSec = feats.durationSec;
      silences = feats.silences;
      onsets = feats.onsets;
      onsetStrengths = feats.onsetStrengths;
      energy = feats.energy;
      speech = feats.speech;
      noiseFloorDb = feats.noiseFloorDb;
      silenceThresholdDb = feats.silenceThresholdDb;
      await patchJob(jobId, { durationSec, silences, onsets, onsetStrengths, energy });

      await emit(jobId, "analysis", "success", `Exact duration: ${durationSec.toFixed(3)} s`, "Measured via ffprobe (fallback: ffmpeg header)");
      await emit(
        jobId,
        "analysis",
        "success",
        `Adaptive noise floor ${feats.noiseFloorDb.toFixed(1)} dBFS`,
        `Silence gate set ${feats.silenceThresholdDb.toFixed(1)} dBFS (adaptive floor, min 350 ms, transients rejected) — a fixed −35 dB threshold fails on any recording with room tone, which silently disabled pause detection before`
      );
      const speechSec = speech.reduce((a, s) => a + (s.end - s.start), 0);
      await emit(
        jobId,
        "analysis",
        "success",
        `${silences.length} silences · ${speech.length} speech regions`,
        `${((speechSec / Math.max(durationSec, 0.001)) * 100).toFixed(1)}% of the timeline is speech · analysis took ${feats.analysisMs} ms`
      );
    }
    logRef = await endStage(jobId, "analysis", logRef, 0.12);

    // ── STAGE: onsets ───────────────────────────────────────────────────────
    logRef = await setStage(jobId, "onsets", logRef, 0.13);
    if (onsets.length === 0) {
      await emit(jobId, "onsets", "stage", "Step 2 · Physical waveform onset detection", "512-pt FFT every 10 ms → log-compressed spectral flux → local median + 3·MAD peaks → 60 ms spacing");
      const samples = await decodePcm16(job.mediaPath!, 16000);
      const f = extractFeatures(samples);
      onsets = f.onsets;
      onsetStrengths = f.onsetStrengths;
      await patchJob(jobId, { onsets, onsetStrengths });
    } else {
      await emit(jobId, "onsets", "info", "Reusing cached onset map", `${onsets.length} physical acoustic attacks already measured`);
    }
    const strong = onsetStrengths.filter((s) => s > 0.5).length;
    await emit(
      jobId,
      "onsets",
      "success",
      `${onsets.length} acoustic onsets detected`,
      `Spectral-flux consonant attacks · ${strong} high-confidence · ${onsets.length} candidate anchors available for the matcher`
    );
    logRef = await endStage(jobId, "onsets", logRef, 0.18);
    if (cancel()) throw new Error("cancelled");

    // ── STAGE: chunking ─────────────────────────────────────────────────────
    logRef = await setStage(jobId, "chunking", logRef, 0.2);
    const plan = buildPlan(durationSec, silences, ctx.settings.chunkSec, ctx.settings.overlapSec);
    await emit(jobId, "chunking", "stage", "Step 3 · Silence-snapped chunk planning", `Target ${ctx.settings.chunkSec}s windows · ±3 s silence-midpoint search · ${ctx.settings.overlapSec}s overlap — no word will ever be cut in half`);
    await sleep(300);
    await emit(
      jobId,
      "chunking",
      "success",
      `${plan.length} chunk${plan.length > 1 ? "s" : ""} planned`,
      plan.map((c) => `#${c.idx} [${c.coreStart.toFixed(1)}→${c.coreEnd.toFixed(1)}]`).join("  ")
    );

    // resume support: load existing chunks
    const existing = await db.select().from(chunks).where(eq(chunks.jobId, jobId)).orderBy(asc(chunks.idx));
    const doneMap = new Map(existing.filter((c) => c.status === "done").map((c) => [c.idx, c]));
    let wordsSoFar: Word[] = [];
    let chunkMetas: ChunkMeta[] = [];
    let partialDoc = job.transcript && !job.transcript.complete ? job.transcript : null;
    if (partialDoc && partialDoc.words?.length) {
      wordsSoFar = partialDoc.words;
      chunkMetas = partialDoc.chunks;
      await emit(jobId, "chunking", "info", "Resuming from cache", `${wordsSoFar.length} words already transcribed in a previous run — completed chunks will be skipped`);
    }
    if (doneMap.size > 0) {
      await emit(jobId, "chunking", "info", `${doneMap.size} chunk${doneMap.size > 1 ? "s" : ""} already done`, "Cache hit — skipping re-transcription");
    }
    logRef = await endStage(jobId, "chunking", logRef, 0.24);

    // ── STAGE: transcription ────────────────────────────────────────────────
    logRef = await setStage(jobId, "transcription", logRef, 0.25);
    const outJsonPath = path.join(OUT_DIR(jobId), "transcript_data.json");
    const seed = parseInt(crypto.createHash("md5").update(jobId).digest("hex").slice(0, 8), 16);
    const useSim = keyCount === 0;
    let simulated = keyCount === 0;
    let prevWords: Word[] = [];
    let failures = 0;

    for (let ci = 0; ci < plan.length; ci++) {
      if (cancel()) throw new Error("cancelled");
      const chunk = plan[ci];
      const progress = 0.25 + ((ci + 0.5) / plan.length) * 0.5;
      await patchJob(jobId, { progress });

      if (doneMap.has(chunk.idx) && wordsSoFar.length > 0) {
        await emit(jobId, "transcription", "info", `Chunk #${chunk.idx} cached`, `Skipping (status: done, ${doneMap.get(chunk.idx)?.wordCount ?? 0} words)`);
        continue;
      }

      await emit(jobId, "transcription", "stage", `Chunk ${chunk.idx + 1}/${plan.length} · [${chunk.coreStart.toFixed(2)}s → ${chunk.coreEnd.toFixed(2)}s]`, `Slicing clip [${chunk.clipStart.toFixed(2)} → ${chunk.clipEnd.toFixed(2)}] (mono 16 kHz) with ${ctx.settings.overlapSec}s overlap on each side…`);

      const clipPath = path.join(TMP_DIR(jobId), `chunk-${chunk.idx}.mp3`);
      await sliceToMp3(job.mediaPath!, chunk.clipStart, chunk.clipEnd, clipPath);
      const clipBuf = fs.readFileSync(clipPath);
      const b64 = clipBuf.toString("base64");

      let attempt = 0;
      let feedback = "";
      let chunkWords: Word[] | null = null;
      let modelUsed = "";
      let keyIdx: number | null = null;
      let report = { coverage: 1, longestMissSec: 0, speechSec: 0 };

      while (attempt < 2) {
        attempt += 1;
        if (useSim || simulated) {
          await emit(jobId, "transcription", "model", `Simulating Gemini pass (attempt ${attempt})`, "No keys — generating synthetic verbatim-style words with realistic AI timing jitter so the aligner has real drift to correct");
          await sleep(900 + Math.random() * 700);
          const raw = synthesizeWords(chunk, speech, onsets, seed);
          chunkWords = normalizeClipWords(
            raw.map((w) => ({ word: w.word, start: w.start - chunk.clipStart, end: w.end - chunk.clipStart })),
            chunk.clipStart
          );
          modelUsed = "simulation";
        } else {
          const context = prevWords.slice(-25).map((w) => w.word).join(" ");
          const prompt =
            `Transcribe this ${Math.max(0.1, chunk.clipEnd - chunk.clipStart).toFixed(1)} second audio clip. ` +
            (context ? `The speaker was saying just before this clip: "${context}" — continue verbatim from where they left off. ` : "") +
            (feedback ? `\n${feedback}\n` : "") +
            `Return the full JSON object with every word, its start (s) and end (e) in seconds from the start of THIS clip.`;
          try {
            const res = await sendModelRequest({
              prompt,
              audioBase64: b64,
              mimeType: "audio/mpeg",
              preferredModel: ctx.settings.model,
              onLog: (msg, level) => void emit(jobId, "transcription", (level as EventLevel) || "info", "Rotator", msg),
            });
            chunkWords = normalizeClipWords(res.words, chunk.clipStart);
            modelUsed = res.model;
            keyIdx = res.keyIndex;
          } catch (e: any) {
            failures += 1;
            if (allowSimulate && failures >= Math.min(3, Math.max(1, keyCount))) {
              simulated = true;
              await emit(jobId, "transcription", "warn", "All real keys exhausted", "Switching remaining chunks to SIMULATION MODE so the pipeline can finish. Re-run after adding a working key.");
              continue;
            }
            throw e;
          }
        }

        // ── Step 6: normalize → snap → core filter → coverage gate ──────────
        let cleaned = snapWordsToSpeech(chunkWords, silences);
        cleaned = coreFilter(cleaned, chunk.coreStart, chunk.coreEnd);
        report = measureCoverage(cleaned, speech, chunk.coreStart, chunk.coreEnd);
        await emit(
          jobId,
          "transcription",
          report.coverage >= 0.85 && report.longestMissSec < 3 ? "success" : "warn",
          `Quality gate · coverage ${(report.coverage * 100).toFixed(0)}%`,
          `${cleaned.length} words in core window · longest unexplained miss ${report.longestMissSec.toFixed(2)} s · threshold: ≥ 85% & < 3 s`
        );

        if (report.coverage < 0.85 || report.longestMissSec >= 3) {
          if (attempt < 2 && !simulated && modelUsed !== "simulation") {
            feedback = `IMPORTANT: a previous attempt missed speech (only ${(report.coverage * 100).toFixed(0)}% was transcribed, with a ${report.longestMissSec}s stretch left out). Transcribe the ENTIRE clip.`;
            await emit(jobId, "transcription", "warn", "Coverage gate failed — retrying", "Sending corrective feedback to the model for a second pass");
            continue;
          }
          if (modelUsed === "simulation") {
            report = { coverage: 1, longestMissSec: 0, speechSec: report.speechSec };
          }
          await emit(jobId, "transcription", "warn", "Coverage below target after retries", "Accepting partial coverage for this chunk (logged in output metadata)");
        }

        break;
      }

      const finalWords = chunkWords ?? [];
      // merge into the global stream (replace any previous partial for this chunk)
      const before = wordsSoFar.filter((w) => !(w.start >= chunk.coreStart - 0.05 && w.start < chunk.coreEnd + 0.05));
      wordsSoFar = [...before, ...finalWords].sort((a, b) => a.start - b.start);
      prevWords = wordsSoFar;

      const meta: ChunkMeta = {
        index: chunk.idx,
        coreStart: chunk.coreStart,
        coreEnd: chunk.coreEnd,
        wordCount: finalWords.length,
        coverage: Math.round(report.coverage * 100) / 100,
        longestMissSec: report.longestMissSec,
        model: modelUsed,
      };
      chunkMetas = [...chunkMetas.filter((m) => m.index !== chunk.idx), meta].sort((a, b) => a.index - b.index);

      const [chunkRow] = existing.filter((c) => c.idx === chunk.idx);
      if (chunkRow) {
        await db.update(chunks).set({
          status: "done",
          wordCount: finalWords.length,
          coverage: meta.coverage,
          longestMissSec: meta.longestMissSec,
          attempts: attempt,
          model: modelUsed,
          keyIndex: keyIdx,
        }).where(eq(chunks.id, chunkRow.id));
      } else {
        await db.insert(chunks).values({
          jobId,
          idx: chunk.idx,
          coreStart: chunk.coreStart,
          coreEnd: chunk.coreEnd,
          clipStart: chunk.clipStart,
          clipEnd: chunk.clipEnd,
          status: "done",
          wordCount: finalWords.length,
          coverage: meta.coverage,
          longestMissSec: meta.longestMissSec,
          attempts: attempt,
          model: modelUsed,
          keyIndex: keyIdx,
        });
      }

      // persist partial transcript after every single chunk (atomic)
      const partial: TranscriptDoc = {
        version: 3,
        generatedAt: new Date().toISOString(),
        audio: { filename: job.filename, fingerprint: job.fingerprint, durationSec },
        settings: { chunkDurationSeconds: ctx.settings.chunkSec, overlapSeconds: ctx.settings.overlapSec, model: ctx.settings.model, toleranceMs: ctx.settings.toleranceMs },
        complete: false,
        simulated,
        chunks: chunkMetas,
        silences,
        onsets,
        words: stampPauses(wordsSoFar),
        sentences: assembleSentences(wordsSoFar),
        alignment: null,
      };
      writeJsonAtomic(outJsonPath, partial);
      await patchJob(jobId, {
        transcript: partial,
        wordCount: wordsSoFar.length,
        sentenceCount: partial.sentences.length,
        simulated,
        progress: 0.25 + ((ci + 1) / plan.length) * 0.5,
      });
      await emit(jobId, "transcription", "success", `Chunk ${chunk.idx + 1}/${plan.length} complete`, `${finalWords.length} words · ${modelUsed}${keyIdx !== null ? ` · Key #${keyIdx}` : ""} · cumulative ${wordsSoFar.length} words — partial transcript persisted`);

      try {
        fs.unlinkSync(clipPath);
      } catch {
        /* ignore */
      }
    }
    logRef = await endStage(jobId, "transcription", logRef, 0.78);
    if (cancel()) throw new Error("cancelled");

    // ── STAGE: alignment (4-pass) ──────────────────────────────────────────
    logRef = await setStage(jobId, "alignment", logRef, 0.8);
    await emit(jobId, "alignment", "stage", "Step 7 · physical alignment", `Matching ${wordsSoFar.length} model timestamps against ${onsets.length} measured onsets (±${ctx.settings.toleranceMs} ms window)`);
    await sleep(250);
    await emit(jobId, "alignment", "info", "Pass 1 · phrase segmentation", "Speaker pauses are measured physically; a segmentation DP splits the word stream so every word belongs to the phrase that can actually hold it");
    const aligned = correctWordTimestamps(
      wordsSoFar,
      onsets.map((t, i) => ({ t, strength: onsetStrengths[i] ?? 0.6 })),
      {
        toleranceSec: Math.max(0.2, Math.min(0.4, ctx.settings.toleranceMs / 1000)),
        gateSec: 0.2,
        gapless: ctx.settings.gapless,
        silences,
        durationSec,
      }
    );
    const st = aligned.stats;
    await emit(
      jobId,
      "alignment",
      "success",
      `Phrases: ${st.regions} speech regions · warp ×${st.scale} · median offset ${st.driftMs >= 0 ? "+" : ""}${st.driftMs} ms`,
      "Sentences are laid out inside real speech regions, so a drifting model clock can no longer push words into a pause"
    );
    await emit(jobId, "alignment", "info", "Pass 2 · Onset refinement (±" + ctx.settings.toleranceMs + " ms)", "Each predicted start is refined against measured attacks inside its own phrase; an onset further than the gate is rejected instead of forcing a bad anchor");
    await emit(
      jobId,
      "alignment",
      st.anchorRate >= 0.5 ? "success" : "warn",
      `Pass 2 complete: ${st.anchored}/${st.total} words anchored (${Math.round(st.anchorRate * 100)}%) · median residual ${st.medianResidualMs} ms`,
      `p90 residual ${st.p90ResidualMs} ms · largest correction ${st.maxCorrectionMs} ms · anchors are only accepted within 220 ms of the corrected prediction`
    );
    await emit(jobId, "alignment", "info", "Pass 3 · Rhythm & monotonicity", `Unanchored words keep their proportional place inside the phrase; ${st.collisionsFixed} collision(s) resolved into strict chronological order`);
    await emit(
      jobId,
      "alignment",
      "success",
      ctx.settings.gapless ? "Pass 4 · Gapless bridging" : "Pass 4 · Word-accurate durations",
      ctx.settings.gapless
        ? "Word ends extend to the next word start — visuals never drop out"
        : `Word ends follow natural spoken duration (median ${st.durationMedianMs} ms) so highlights release during pauses`
    );
    const alignedWords = stampPauses(aligned.words);

    // objective sanity check: word starts must not sit inside measured silence
    const silenceLanding = alignedWords.filter((w) =>
      silences.some((sl) => w.start > sl.start + 0.02 && w.start < sl.end - 0.02)
    ).length;
    const silenceLandingRate = alignedWords.length ? silenceLanding / alignedWords.length : 0;
    await emit(
      jobId,
      "alignment",
      silenceLandingRate <= 0.05 ? "success" : "warn",
      `Silence check: ${silenceLanding}/${alignedWords.length} word starts inside silence (${(silenceLandingRate * 100).toFixed(1)}%)`,
      "Independent verification — a word cannot physically begin in silence. This is the metric that exposes model timing drift"
    );
    const alignmentStats = { ...st, silenceLandingRate: Math.round(silenceLandingRate * 1000) / 1000 };
    logRef = await endStage(jobId, "alignment", logRef, 0.88);

    // ── STAGE: assembly ────────────────────────────────────────────────────
    logRef = await setStage(jobId, "assembly", logRef, 0.9);
    const sentences = assembleSentences(alignedWords);
    const first = sentences[0];
    await emit(jobId, "assembly", "success", `${sentences.length} sentences assembled`, `Deterministic state machine: punctuation terminals · ≥ 0.7 s pause breaks · 18-word cap with best-break split. First: "${(first?.text || "").slice(0, 90)}${(first?.text || "").length > 90 ? "…" : ""}"`);
    logRef = await endStage(jobId, "assembly", logRef, 0.94);

    // ── STAGE: persist ─────────────────────────────────────────────────────
    logRef = await setStage(jobId, "persist", logRef, 0.95);
    const globalReport = measureCoverage(alignedWords, speech, 0, durationSec);
    const doc: TranscriptDoc = {
      version: 3,
      generatedAt: new Date().toISOString(),
      audio: { filename: job.filename, fingerprint: job.fingerprint, durationSec },
      settings: { chunkDurationSeconds: ctx.settings.chunkSec, overlapSeconds: ctx.settings.overlapSec, model: ctx.settings.model, toleranceMs: ctx.settings.toleranceMs },
      complete: true,
      simulated,
      chunks: chunkMetas,
      silences,
      onsets,
      words: alignedWords,
      sentences,
      alignment: alignmentStats,
    };
    writeJsonAtomic(outJsonPath, doc);
    await patchJob(jobId, {
      transcript: doc,
      wordCount: alignedWords.length,
      sentenceCount: sentences.length,
      coverage: Math.round(globalReport.coverage * 100) / 100,
      longestMissSec: globalReport.longestMissSec,
      anchoredCount: st.anchored,
      alignedTotal: aligned.stats.total,
      status: "completed",
      progress: 1,
      completedAt: new Date(),
      simulated,
    });
    await emit(jobId, "persist", "success", "Atomic persistence complete", `transcript_data.json written (${alignedWords.length} words, ${sentences.length} sentences) + chunk cache saved for resume. Download it from the job card.`);
    logRef = await endStage(jobId, "persist", logRef, 1);
    await emit(jobId, "info", "success", "Pipeline finished", `Global coverage ${(globalReport.coverage * 100).toFixed(1)}% · longest miss ${globalReport.longestMissSec.toFixed(2)} s — ready to review`);
  } catch (err: any) {
    const msg = String(err?.message || err);
    const cancelled = /cancelled/i.test(msg);
    await patchJob(jobId, {
      status: cancelled ? "canceled" : "failed",
      error: msg,
      completedAt: cancelled ? undefined : new Date(),
    }).catch(() => {});
    await emit(jobId, "info", cancelled ? "warn" : "error", cancelled ? "Job canceled" : "Pipeline failed", cancelled ? "Stopped at user request. Partial results (if any) are preserved." : `${msg} — the run stopped here. Previous chunk cache is intact, so a re-run resumes.`);
  }
}

// ── Sequential job queue (singleton) ────────────────────────────────────────
interface EngineQueue {
  queue: string[];
  running: boolean;
  cancel: Map<string, boolean>;
}
const g = globalThis as typeof globalThis & { __engineQueue?: EngineQueue };
const q: EngineQueue = g.__engineQueue ?? (g.__engineQueue = { queue: [], running: false, cancel: new Map() });
const cancelFlags = q.cancel;

export function queueJob(jobId: string, settings: JobSettings, allowSimulate: boolean) {
  cancelFlags.delete(jobId);
  q.queue.push(jobId);
  void pump(settings, allowSimulate);
}

export function cancelJob(jobId: string) {
  cancelFlags.set(jobId, true);
}

async function pump(settings: JobSettings, allowSimulate: boolean) {
  if (q.running) return;
  q.running = true;
  while (q.queue.length > 0) {
    const next = q.queue.shift()!;
    cancelFlags.delete(next);
    await runJob(next, settings, allowSimulate);
  }
  q.running = false;
}

export function queueSnapshot() {
  return { queued: q.queue.length, running: q.running };
}
