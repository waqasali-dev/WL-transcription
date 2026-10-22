import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import type { Silence } from "@/lib/types";

export const FFMPEG: string = ffmpegInstaller.path;
export const FFPROBE: string = ffprobeInstaller.path;

export function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function run(
  cmd: string,
  args: string[],
  opts: { timeoutMs?: number; input?: Buffer; signal?: AbortSignal } = {}
): Promise<{ stdout: Buffer; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = (execFile as any)(
      cmd,
      args,
      {
        encoding: "buffer",
        maxBuffer: 1024 * 1024 * 256,
        timeout: opts.timeoutMs ?? 180_000,
        signal: opts.signal,
      } as any,
      (err: Error | null, stdout: Buffer, stderr: Buffer) => {
        if (opts.signal?.aborted) {
          reject(new Error("cancelled"));
          return;
        }
        if (err) reject(err);
        else resolve({ stdout, stderr: stderr ? stderr.toString() : "" });
      }
    );
    if (opts.input && child.stdin) {
      child.stdin.write(opts.input);
      child.stdin.end();
    }
  });
}

// ── Step 1: Exact duration measurement ────────────────────────────────────────
export async function probeDuration(filePath: string, signal?: AbortSignal): Promise<number> {
  try {
    const { stdout } = await run(
      FFPROBE,
      ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", filePath],
      { signal }
    );
    const duration = parseFloat(stdout.toString().trim());
    if (Number.isFinite(duration) && duration > 0) return round3(duration);
  } catch (e: any) {
    if (signal?.aborted) throw new Error("cancelled");
  }
  const { stderr } = await run(FFMPEG, ["-hide_banner", "-i", filePath], { timeoutMs: 60_000, signal }).catch((err: any) => {
    // ffmpeg -i without output exits non-zero intentionally while printing headers to stderr
    if (signal?.aborted) throw new Error("cancelled");
    return { stderr: String(err?.stderr?.toString?.() || err?.message || "") };
  });
  const m = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (m) {
    const h = parseInt(m[1], 10);
    const mi = parseInt(m[2], 10);
    const s = parseFloat(m[3]);
    return round3(h * 3600 + mi * 60 + s);
  }
  const wav = parseWavHeader(filePath);
  if (wav) return round3(wav.samples.length / wav.sampleRate);
  throw new Error("Could not determine media duration");
}

// ── Step 1: Silence boundary detection (silencedetect) ───────────────────────
export async function detectSilences(
  filePath: string,
  { noiseDb = -35, minSilenceSec = 0.35, signal }: { noiseDb?: number; minSilenceSec?: number; signal?: AbortSignal } = {}
): Promise<Silence[]> {
  const { stderr } = await run(
    FFMPEG,
    ["-hide_banner", "-nostats", "-i", filePath, "-af", `silencedetect=noise=${noiseDb}dB:d=${minSilenceSec}`, "-f", "null", "-"],
    { signal }
  );
  const silences: Silence[] = [];
  let currentStart: number | null = null;
  for (const line of stderr.split(/\r?\n/)) {
    const startMatch = line.match(/silence_start:\s*(-?[\d.]+)/);
    const endMatch = line.match(/silence_end:\s*([\d.]+)/);
    if (startMatch) currentStart = Math.max(0, parseFloat(startMatch[1]));
    if (endMatch && currentStart !== null) {
      silences.push({
        start: round3(currentStart),
        end: round3(parseFloat(endMatch[1])),
      });
      currentStart = null;
    }
  }
  return silences;
}

// ── Adaptive silence threshold ───────────────────────────────────────────────
export function adaptiveNoiseDb(samples: Int16Array, sampleRate = 16000): number {
  const hop = Math.round(sampleRate * 0.05);
  const levels: number[] = [];
  for (let i = 0; i + hop <= samples.length; i += hop) {
    let sum = 0;
    for (let j = i; j < i + hop; j++) sum += samples[j] * samples[j];
    const rms = Math.sqrt(sum / hop) / 32768;
    levels.push(20 * Math.log10(Math.max(rms, 1e-6)));
  }
  if (!levels.length) return -35;
  levels.sort((a, b) => a - b);
  const p15 = levels[Math.floor(levels.length * 0.15)];
  return Math.round(Math.min(-22, Math.max(-55, p15 + 5)) * 10) / 10;
}

// ── Step 1: Active speech intervals ──────────────────────────────────────────
export function speechIntervals(silences: Silence[], duration: number) {
  const intervals: Silence[] = [];
  let cursor = 0;
  for (const s of silences) {
    if (s.start > cursor) intervals.push({ start: cursor, end: s.start });
    cursor = Math.max(cursor, s.end);
  }
  if (cursor < duration) intervals.push({ start: cursor, end: duration });
  return intervals.filter((i) => i.end - i.start > 0.05);
}

// ── Pure-JS WAV parsing (fallback if the ffmpeg binary is unavailable) ──────
export function parseWavHeader(filePath: string): { samples: Float32Array; sampleRate: number } | null {
  try {
    const buf = fs.readFileSync(/*turbopackIgnore: true*/ filePath);
    if (buf.length < 44 || buf.toString("ascii", 0, 4) !== "RIFF") return null;
    const sampleRate = buf.readUInt32LE(24);
    const bitsPerSample = buf.readUInt16LE(34);
    const channels = buf.readUInt16LE(22);
    let offset = 12;
    let dataStart = -1;
    let dataLen = 0;
    while (offset + 8 <= buf.length) {
      const chunkId = buf.toString("ascii", offset, offset + 4);
      const chunkSize = buf.readUInt32LE(offset + 4);
      if (chunkId === "data") {
        dataStart = offset + 8;
        dataLen = chunkSize;
        break;
      }
      offset += 8 + chunkSize + (chunkSize % 2);
    }
    if (dataStart < 0) return null;
    const total = Math.min(dataLen, buf.length - dataStart);
    let samples: Float32Array;
    if (bitsPerSample === 16) {
      const n = Math.floor(total / 2 / channels);
      samples = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        samples[i] = buf.readInt16LE(dataStart + i * channels * 2) / 32768;
      }
    } else if (bitsPerSample === 32) {
      const isFloat = buf.includes(Buffer.from("WAVE"));
      const n = Math.floor(total / 4 / channels);
      samples = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const o = dataStart + i * channels * 4;
        samples[i] = isFloat ? buf.readFloatLE(o) : buf.readInt32LE(o) / 2147483648;
      }
    } else {
      return null;
    }
    return { samples, sampleRate };
  } catch {
    return null;
  }
}

function resampleLinear(src: Float32Array, fromHz: number, toHz: number): Float32Array {
  if (fromHz === toHz) return src;
  const ratio = fromHz / toHz;
  const outLen = Math.floor(src.length / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const pos = i * ratio;
    const i0 = Math.floor(pos);
    const i1 = Math.min(i0 + 1, src.length - 1);
    const frac = pos - i0;
    out[i] = src[i0] * (1 - frac) + src[i1] * frac;
  }
  return out;
}

// ── Step 2: Decode to 16 kHz mono 16-bit PCM (single pass per job!) ─────────
export async function decodePcm16(filePath: string, sampleRate = 16000, signal?: AbortSignal): Promise<Int16Array> {
  let ffmpegError: Error | null = null;
  try {
    const { stdout } = await run(
      FFMPEG,
      ["-v", "error", "-i", filePath, "-ac", "1", "-ar", String(sampleRate), "-f", "s16le", "pipe:1"],
      { timeoutMs: 300_000, signal }
    );
    const evenBytes = Math.floor(stdout.length / 2) * 2;
    const bytes = Buffer.from(stdout.buffer, stdout.byteOffset, evenBytes);
    const out = new Int16Array(evenBytes / 2);
    for (let i = 0; i < out.length; i++) out[i] = bytes.readInt16LE(i * 2);
    if (out.length < sampleRate / 4) throw new Error(`ffmpeg decoded only ${out.length} samples`);
    return out;
  } catch (err) {
    if (signal?.aborted) throw new Error("cancelled");
    ffmpegError = err instanceof Error ? err : new Error(String(err));
  }
  const wav = parseWavHeader(filePath);
  if (!wav) {
    throw new Error(
      `Could not decode audio — ffmpeg said: ${ffmpegError?.message?.slice(0, 220) || "unknown error"}. ` +
        `Supported inputs: mp3, wav, m4a, mp4, mov, mkv, ogg, flac, aac, webm, aiff.`
    );
  }
  const res = resampleLinear(wav.samples, wav.sampleRate, sampleRate);
  const out = new Int16Array(res.length);
  for (let i = 0; i < res.length; i++) {
    out[i] = Math.max(-32768, Math.min(32767, Math.round(res[i] * 32767)));
  }
  return out;
}

/**
 * Converts Int16 PCM to Float32 [-1, 1] with gentle automatic gain normalization
 * on very quiet recordings (e.g. distant room mics < -18 dBFS peak), capped at +14 dB
 * so noise floors in silent files are never exploded into fake speech.
 */
export function pcmToNormalizedFloat32(pcm: Int16Array): { samples: Float32Array; gainDb: number } {
  const out = new Float32Array(pcm.length);
  let peak = 0;
  for (let i = 0; i < pcm.length; i++) {
    const v = pcm[i] / 32768;
    out[i] = v;
    const av = v < 0 ? -v : v;
    if (av > peak) peak = av;
  }
  // If signal has audible content (> -50 dBFS) but is quiet (< 0.45 peak), normalize toward 0.85 (max 5x = +14 dB)
  let gain = 1;
  if (peak > 0.003 && peak < 0.45) {
    gain = Math.min(5, 0.85 / peak);
    for (let i = 0; i < out.length; i++) {
      out[i] = Math.max(-1, Math.min(1, out[i] * gain));
    }
  }
  return { samples: out, gainDb: round3(20 * Math.log10(gain)) };
}

// ── Downsampled RMS energy profile for the UI waveform ───────────────────────
export function computeEnergyBins(samples: Int16Array, _sampleRate: number, bins = 600) {
  const binSize = Math.max(1, Math.floor(samples.length / bins));
  const out: number[] = [];
  let peak = 0;
  for (let b = 0; b < bins; b++) {
    const start = b * binSize;
    const end = Math.min(samples.length, start + binSize);
    let sum = 0;
    for (let i = start; i < end; i++) sum += samples[i] * samples[i];
    const rms = end > start ? Math.sqrt(sum / (end - start)) / 32768 : 0;
    out.push(rms);
    if (rms > peak) peak = rms;
  }
  if (peak > 0) {
    for (let i = 0; i < out.length; i++) out[i] = out[i] / peak;
  }
  return { bins: out.map((v) => round3(v)), peak: round3(peak) };
}

// ── Step 2: Physical waveform acoustic onset detection ───────────────────────
export function detectOnsetsFromSamples(
  samples: Int16Array,
  sampleRate: number,
  { windowMs = 10, hopMs = 5, minSpacingMs = 80 } = {}
): number[] {
  const windowSize = Math.round((sampleRate * windowMs) / 1000);
  const hopSize = Math.round((sampleRate * hopMs) / 1000);
  const minSpacingFrames = Math.round(minSpacingMs / hopMs);

  const energy: number[] = [];
  let peakEnergy = 0;
  for (let i = 0; i + windowSize <= samples.length; i += hopSize) {
    let sum = 0;
    for (let j = i; j < i + windowSize; j++) sum += samples[j] * samples[j];
    const rms = Math.sqrt(sum / windowSize) / 32768;
    energy.push(rms);
    if (rms > peakEnergy) peakEnergy = rms;
  }

  // Scale quiet recordings cleanly so onset floor adapts to room mic gain
  const gainScale = peakEnergy > 0.003 && peakEnergy < 0.25 ? Math.min(5, 0.4 / peakEnergy) : 1;
  if (gainScale > 1) {
    for (let i = 0; i < energy.length; i++) energy[i] *= gainScale;
  }

  const odf = new Float64Array(energy.length);
  for (let i = 1; i < energy.length; i++) {
    odf[i] = Math.max(0, energy[i] - energy[i - 1]);
  }

  const contextFrames = Math.round(200 / hopMs);
  const onsets: number[] = [];
  for (let i = 2; i < odf.length - 1; i++) {
    if (odf[i] < odf[i - 1] || odf[i] < odf[i + 1]) continue;

    const lo = Math.max(0, i - contextFrames);
    const hi = Math.min(odf.length, i + contextFrames + 1);
    const ctx: number[] = [];
    for (let j = lo; j < hi; j++) ctx.push(odf[j]);
    ctx.sort((a, b) => a - b);
    const p75 = ctx[Math.floor(ctx.length * 0.75)];
    const threshold = Math.max(p75 * 2, 0.003);

    if (odf[i] > threshold && energy[i] > 0.005) {
      if (onsets.length === 0 || i - onsets[onsets.length - 1] >= minSpacingFrames) {
        onsets.push(i);
      }
    }
  }

  return onsets.map((i) => round3((i * hopSize) / sampleRate));
}

export async function detectOnsets(filePath: string): Promise<number[]> {
  const samples = await decodePcm16(filePath, 16000);
  return detectOnsetsFromSamples(samples, 16000);
}

// ── Chunk slicing to a temp mono 16 kHz MP3 (with automatic loudnorm / gain) ─
export async function sliceToMp3(
  src: string,
  startSec: number,
  endSec: number,
  outPath: string,
  signal?: AbortSignal
): Promise<void> {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await run(
    FFMPEG,
    [
      "-y",
      "-v",
      "error",
      "-ss",
      String(Math.max(0, startSec)),
      "-to",
      String(Math.max(0, endSec)),
      "-i",
      src,
      "-ac",
      "1",
      "-ar",
      "16000",
      "-c:a",
      "libmp3lame",
      "-b:a",
      "96k",
      outPath,
    ],
    { signal }
  );
}

/**
 * Ensures any non-browser-native container/codec (.mkv, .avi, HEVC .mov, .aiff, .wma)
 * has a fast browser-playable MP4/MP3 proxy so `<video>` / `<audio>` playback
 * works across Chrome, Safari, Firefox, and Edge without black screens.
 */
export async function ensureBrowserPlayable(
  filePath: string,
  mediaKind: "audio" | "video",
  videoCodec?: string,
  signal?: AbortSignal
): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  if (mediaKind === "video") {
    const webContainer = ext === ".mp4" || ext === ".webm";
    const webCodec = !videoCodec || /^(h264|avc1|vp8|vp9|av1)$/i.test(videoCodec);
    if (webContainer && webCodec) return filePath;
    const proxyPath = path.join(path.dirname(/*turbopackIgnore: true*/ filePath), `${path.basename(filePath)}.web.mp4`);
    if (fs.existsSync(/*turbopackIgnore: true*/ proxyPath)) return proxyPath;
    await run(
      FFMPEG,
      [
        "-y",
        "-v",
        "error",
        "-i",
        filePath,
        "-vf",
        "scale=trunc(iw/2)*2:trunc(ih/2)*2",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "23",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        proxyPath,
      ],
      { timeoutMs: 300_000, signal }
    );
    return proxyPath;
  }

  // Audio: .aiff / .aif / .wma aren't supported in Chrome/Firefox HTMLAudioElement
  if (ext === ".aiff" || ext === ".aif") {
    const proxyPath = path.join(path.dirname(/*turbopackIgnore: true*/ filePath), `${path.basename(filePath)}.web.mp3`);
    if (fs.existsSync(/*turbopackIgnore: true*/ proxyPath)) return proxyPath;
    await run(
      FFMPEG,
      ["-y", "-v", "error", "-i", filePath, "-c:a", "libmp3lame", "-b:a", "192k", proxyPath],
      { timeoutMs: 180_000, signal }
    );
    return proxyPath;
  }
  return filePath;
}

export interface AudioFeatures {
  durationSec: number;
  silences: Silence[];
  speech: Silence[];
  onsets: number[];
  energy: { bins: number[]; peak: number };
  samplesMs: number;
}

export async function analyzeAudio(filePath: string): Promise<AudioFeatures> {
  const t0 = Date.now();
  const durationSec = await probeDuration(filePath);
  const samples = await decodePcm16(filePath, 16000);
  const energy = computeEnergyBins(samples, 16000, 600);
  const silences = await detectSilences(filePath, { noiseDb: adaptiveNoiseDb(samples) });
  const speech = speechIntervals(silences, durationSec);
  const onsets = detectOnsetsFromSamples(samples, 16000);
  return {
    durationSec,
    silences,
    speech,
    onsets,
    energy,
    samplesMs: Date.now() - t0,
  };
}
