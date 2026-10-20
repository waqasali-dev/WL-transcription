import type { Silence } from "@/lib/types";
import {
  computeEnergyBins,
  decodePcm16,
  probeDuration,
  round3,
  speechIntervals,
} from "@/lib/engine/audio";

// ─────────────────────────────────────────────────────────────────────────────
// Frame-level acoustic feature extraction.
//
// The original RMS-difference ODF fires on loudness jumps and misses fricatives
// and plosives, producing ~3 onsets per word. This implementation uses the
// standard spectral-flux onset detection function (log-compressed magnitude
// spectrum, half-wave rectified difference) which isolates consonant attacks,
// then picks peaks with a local median + MAD threshold.
// ─────────────────────────────────────────────────────────────────────────────

const SAMPLE_RATE = 16000;
const FFT_SIZE = 512;
const HOP = 160; // 10 ms
const BIN_HZ = SAMPLE_RATE / FFT_SIZE; // 31.25 Hz
const BAND_LO = Math.max(1, Math.round(150 / BIN_HZ));
const BAND_HI = Math.min(FFT_SIZE / 2, Math.round(6500 / BIN_HZ));

/** In-place iterative radix-2 FFT. */
function fft(re: Float32Array, im: Float32Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wRe = Math.cos(ang);
    const wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1;
      let curIm = 0;
      for (let k = 0; k < len / 2; k++) {
        const aRe = re[i + k];
        const aIm = im[i + k];
        const bRe = re[i + k + len / 2] * curRe - im[i + k + len / 2] * curIm;
        const bIm = re[i + k + len / 2] * curIm + im[i + k + len / 2] * curRe;
        re[i + k] = aRe + bRe;
        im[i + k] = aIm + bIm;
        re[i + k + len / 2] = aRe - bRe;
        im[i + k + len / 2] = aIm - bIm;
        const nextRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = nextRe;
      }
    }
  }
}

export interface AcousticFeatures {
  frameMs: number;
  /** Per-frame RMS level in dBFS */
  dbfs: number[];
  /** Half-wave rectified log-spectral flux, normalised to its own p95 */
  flux: Float32Array;
  noiseFloorDb: number;
  silenceThresholdDb: number;
  silences: Silence[];
  onsets: number[];
  onsetStrengths: number[];
}

export function extractFeatures(samples: Int16Array): AcousticFeatures {
  const frameCount = Math.max(1, Math.floor((samples.length - FFT_SIZE) / HOP) + 1);
  const win = new Float32Array(FFT_SIZE);
  for (let i = 0; i < FFT_SIZE; i++) win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1));

  const dbfs = new Array<number>(frameCount);
  const flux = new Float32Array(frameCount);
  const prevMag = new Float32Array(FFT_SIZE / 2 + 1);
  const re = new Float32Array(FFT_SIZE);
  const im = new Float32Array(FFT_SIZE);

  for (let f = 0; f < frameCount; f++) {
    const start = f * HOP;
    let sum = 0;
    for (let i = 0; i < FFT_SIZE; i++) {
      const s = (samples[start + i] || 0) / 32768;
      sum += s * s;
      re[i] = s * win[i];
      im[i] = 0;
    }
    const rms = Math.sqrt(sum / FFT_SIZE);
    dbfs[f] = 20 * Math.log10(rms || 1e-9);

    fft(re, im);
    let diff = 0;
    for (let k = BAND_LO; k <= BAND_HI; k++) {
      const mag = Math.log1p(90 * Math.hypot(re[k], im[k]));
      const d = mag - prevMag[k];
      if (d > 0) diff += d;
      prevMag[k] = mag;
    }
    flux[f] = diff / (BAND_HI - BAND_LO + 1);
  }

  // normalise flux by its p95 so thresholds are level-independent
  const sortedFlux = Array.from(flux).sort((a, b) => a - b);
  const p95 = sortedFlux[Math.floor(sortedFlux.length * 0.95)] || 1;
  for (let i = 0; i < flux.length; i++) flux[i] = flux[i] / p95;

  // ── adaptive noise floor / silence threshold ────────────────────────────────
  // A fixed −35 dB fails on real recordings: with any room tone or music bed
  // silencedetect reports *zero* silences (the original bug). Estimate the
  // floor from the 10th percentile and put the gate 9 dB above it.
  const sortedDb = [...dbfs].sort((a, b) => a - b);
  const noiseFloorDb = sortedDb[Math.floor(sortedDb.length * 0.1)];
  const speechLevelDb = sortedDb[Math.floor(sortedDb.length * 0.9)];
  // Conservative gate: a pause is only a pause when it is close to the room
  // tone. An over-eager threshold (noise + 9 dB) classified quiet speech as
  // silence, which produced phantom pauses and let breath onsets become word
  // anchors. Stay low, and also require a clear 20 dB dip below loud speech.
  const silenceThresholdDb = Math.min(
    -24,
    Math.max(-60, Math.max(noiseFloorDb + 6, Math.min(noiseFloorDb + 13, speechLevelDb - 20)))
  );
  const minSilenceFrames = Math.round(0.35 * (1000 / 10));

  const silences: Silence[] = [];
  let runStart = -1;
  let runPeak = -120;
  const flushRun = (endFrame: number) => {
    // reject runs that contain a transient (breath, chair creak, music stab)
    if (runStart >= 0 && endFrame - runStart >= minSilenceFrames && runPeak <= silenceThresholdDb + 6) {
      silences.push({ start: round3((runStart * HOP) / SAMPLE_RATE), end: round3((endFrame * HOP) / SAMPLE_RATE) });
    }
    runStart = -1;
    runPeak = -120;
  };
  for (let f = 0; f <= frameCount; f++) {
    const quiet = f < frameCount && dbfs[f] < silenceThresholdDb;
    if (quiet) {
      if (runStart < 0) {
        runStart = f;
        runPeak = -120;
      }
      if (dbfs[f] > runPeak) runPeak = dbfs[f];
    } else if (runStart >= 0) {
      flushRun(f);
    }
  }

  // ── onset peak picking: local max above median + 3·MAD in ±300 ms ─────────
  const ctx = Math.round(300 / 10);
  const minGapFrames = Math.round(0.06 * 1000 / 10);
  const onsets: number[] = [];
  const onsetStrengths: number[] = [];
  const activity = silenceThresholdDb + 4;

  const median = (arr: number[]) => {
    const b = arr.slice().sort((x, y) => x - y);
    return b[Math.floor(b.length / 2)] ?? 0;
  };

  for (let f = 2; f < frameCount - 1; f++) {
    if (flux[f] < 0.012) continue; // absolute floor
    if (flux[f] < flux[f - 1] || flux[f] < flux[f + 1]) continue; // must be a local peak
    if (dbfs[f] < activity) continue; // must be in active speech, not room tone

    const lo = Math.max(0, f - ctx);
    const hi = Math.min(frameCount, f + ctx + 1);
    const local: number[] = [];
    for (let j = lo; j < hi; j++) local.push(flux[j]);
    const med = median(local);
    const mad = median(local.map((v) => Math.abs(v - med))) || 1e-4;
    const threshold = med + 3 * mad;

    if (flux[f] <= threshold) continue;
    if (onsets.length > 0 && f - Math.round(onsets[onsets.length - 1] * 100) < minGapFrames) continue;

    onsets.push(round3((f * HOP) / SAMPLE_RATE));
    // prominence relative to the local ambience, used as matching confidence
    onsetStrengths.push(round3(Math.min(1, (flux[f] - med) / (mad * 6 + 1e-6) / 4)));
  }

  // An onset inside a detected pause is air, not articulation: firing a word
  // there is exactly how the old matcher placed "ask" half a second early.
  const inSilence = (t: number) => silences.some((s) => t > s.start + 0.01 && t < s.end - 0.01);
  const keptOnsets: number[] = [];
  const keptStrengths: number[] = [];
  for (let i = 0; i < onsets.length; i++) {
    if (inSilence(onsets[i])) continue;
    keptOnsets.push(onsets[i]);
    keptStrengths.push(onsetStrengths[i]);
  }

  return {
    frameMs: (HOP / SAMPLE_RATE) * 1000,
    dbfs,
    flux,
    noiseFloorDb: round3(noiseFloorDb),
    silenceThresholdDb: round3(silenceThresholdDb),
    silences,
    onsets: keptOnsets,
    onsetStrengths: keptStrengths,
  };
}

export interface AudioFeatures {
  durationSec: number;
  silences: Silence[];
  speech: Silence[];
  onsets: number[];
  onsetStrengths: number[];
  energy: { bins: number[]; peak: number };
  noiseFloorDb: number;
  silenceThresholdDb: number;
  analysisMs: number;
}

/**
 * Full acoustic pass: duration → PCM decode → spectral flux onsets →
 * adaptive silences → speech intervals → waveform bins for the UI.
 */
export async function analyzeAudio(filePath: string): Promise<AudioFeatures> {
  const t0 = Date.now();
  const durationSec = await probeDuration(filePath);
  const samples = await decodePcm16(filePath, SAMPLE_RATE);
  const f = extractFeatures(samples);
  const energy = computeEnergyBins(samples, SAMPLE_RATE, 700);
  const speech = speechIntervals(f.silences, durationSec);
  return {
    durationSec,
    silences: f.silences,
    speech,
    onsets: f.onsets,
    onsetStrengths: f.onsetStrengths,
    energy,
    noiseFloorDb: f.noiseFloorDb,
    silenceThresholdDb: f.silenceThresholdDb,
    analysisMs: Date.now() - t0,
  };
}
