/**
 * CTC forced alignment (WhisperX-style).
 *
 * Gemini supplies the *text*; a wav2vec2 acoustic model supplies the *timing*.
 * We run the model over the audio to get per-20ms-frame character
 * log-probabilities, then Viterbi-align Gemini's exact characters against
 * those frames. Every word's start/end comes from where the acoustic model
 * actually heard its first and last letters — not from the LLM's guess and
 * not from "the nearest energy bump".
 */
import path from "node:path";
import type { Word } from "@/lib/types";

const MODEL_ID = process.env.CTC_MODEL_ID || "Xenova/wav2vec2-base-960h";
const MODEL_DTYPE = process.env.CTC_DTYPE || "q8";
export const FRAME_SEC = 0.02;
const SR = 16000;

// wav2vec2-base-960h character vocabulary
const VOCAB: Record<string, number> = {
  "<pad>": 0, "|": 4, E: 5, T: 6, A: 7, O: 8, N: 9, I: 10, H: 11, S: 12, R: 13, D: 14, L: 15, U: 16,
  M: 17, W: 18, C: 19, F: 20, G: 21, Y: 22, P: 23, B: 24, V: 25, K: 26, "'": 27, X: 28, J: 29, Q: 30, Z: 31,
};
const BLANK = 0;
const SEP = 4;
const V = 32;

type Log = (title: string, message: string, level?: "info" | "success" | "warn") => void;

// ── Model loading (process-wide singleton) ──────────────────────────────────
interface Loaded {
  processor: any;
  model: any;
}
const g = globalThis as typeof globalThis & { __ctc?: Promise<Loaded> | null };

export async function loadCtcModel(onLog?: Log): Promise<Loaded> {
  if (!g.__ctc) {
    g.__ctc = (async () => {
      const tf: any = await import("@huggingface/transformers");
      tf.env.cacheDir = path.join(process.cwd(), ".data", "models");
      tf.env.allowLocalModels = true;
      const seen = new Map<string, number>();
      const progress_callback = (p: any) => {
        if (p?.status !== "progress" || !p.file || !p.total || p.total < 5_000_000) return;
        const pct = Math.floor((p.loaded / p.total) * 4) * 25;
        if ((seen.get(p.file) ?? -1) >= pct) return;
        seen.set(p.file, pct);
        onLog?.("Downloading acoustic model", `${p.file} — ${pct}% of ${(p.total / 1e6).toFixed(0)} MB (one-time; cached afterwards)`);
      };
      const processor = await tf.AutoProcessor.from_pretrained(MODEL_ID, { progress_callback });
      const model = await tf.AutoModelForCTC.from_pretrained(MODEL_ID, { dtype: MODEL_DTYPE, progress_callback });
      return { processor, model };
    })();
    g.__ctc.catch(() => {
      g.__ctc = null; // allow retry on next job
    });
  }
  return g.__ctc;
}

// ── Emissions: log-softmax character posteriors on a global 20 ms grid ─────
export interface Emissions {
  data: Float32Array; // frames × V log-probs
  mx: Float32Array; // per-frame max log-prob (garbage/wildcard emission)
  frames: number;
}

export async function computeEmissions(
  samples: Float32Array,
  onLog?: Log,
  { windowSec = 20, padSec = 1 } = {}
): Promise<Emissions> {
  const { processor, model } = await loadCtcModel(onLog);
  const durationSec = samples.length / SR;
  const frames = Math.ceil(durationSec / FRAME_SEC) + 1;
  const data = new Float32Array(frames * V);
  // default every frame to "certain blank" so un-covered frames are harmless
  for (let f = 0; f < frames; f++) {
    for (let v = 0; v < V; v++) data[f * V + v] = v === BLANK ? 0 : -30;
  }

  const windows = Math.max(1, Math.ceil(durationSec / windowSec));
  let lastLogged = 0;
  for (let w = 0; w < windows; w++) {
    const coreS = w * windowSec;
    const coreE = Math.min(durationSec, coreS + windowSec);
    const s = Math.max(0, coreS - padSec);
    const e = Math.min(durationSec, coreE + padSec);
    const slice = samples.subarray(Math.floor(s * SR), Math.floor(e * SR));
    if (slice.length < SR * 0.1) continue;

    const inputs = await processor(slice);
    const out = await model(inputs);
    const logits = out.logits;
    const T: number = logits.dims[1];
    const raw = logits.data as Float32Array;
    const ratio = slice.length / SR / T;

    for (let t = 0; t < T; t++) {
      const time = s + t * ratio;
      if (time < coreS - 1e-6 || time >= coreE) continue;
      const gf = Math.round(time / FRAME_SEC);
      if (gf < 0 || gf >= frames) continue;
      // log-softmax
      let mx = -Infinity;
      for (let v = 0; v < V; v++) mx = Math.max(mx, raw[t * V + v]);
      let sum = 0;
      for (let v = 0; v < V; v++) sum += Math.exp(raw[t * V + v] - mx);
      const lse = mx + Math.log(sum);
      for (let v = 0; v < V; v++) data[gf * V + v] = raw[t * V + v] - lse;
    }
    if (typeof logits.dispose === "function") logits.dispose();

    const pct = Math.round(((w + 1) / windows) * 100);
    if (pct - lastLogged >= 25 || w === windows - 1) {
      lastLogged = pct;
      onLog?.(`Acoustic frames ${pct}%`, `wav2vec2 scored ${coreE.toFixed(1)} s / ${durationSec.toFixed(1)} s of audio at 20 ms resolution`);
    }
  }
  const mx = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    let m = -Infinity;
    for (let v = 0; v < V; v++) m = Math.max(m, data[f * V + v]);
    mx[f] = m;
  }
  return { data, mx, frames };
}

// ── Text normalization: Gemini word → acoustic character string ─────────────
const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function under1000(n: number): string {
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} hundred`);
    n %= 100;
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : ""));
  } else if (n > 0 || parts.length === 0) {
    parts.push(ONES[n]);
  }
  return parts.join(" ");
}

export function numberToWords(n: number): string {
  if (!Number.isFinite(n)) return "";
  if (n < 0) return `minus ${numberToWords(-n)}`;
  n = Math.floor(n);
  if (n === 0) return "zero";
  const scales: [number, string][] = [
    [1e12, "trillion"],
    [1e9, "billion"],
    [1e6, "million"],
    [1e3, "thousand"],
  ];
  const parts: string[] = [];
  for (const [v, name] of scales) {
    if (n >= v) {
      parts.push(`${under1000(Math.floor(n / v))} ${name}`);
      n %= v;
    }
  }
  if (n > 0) parts.push(under1000(n));
  return parts.join(" ");
}

function spellNumberToken(raw: string): string {
  const clean = raw.replace(/,/g, "");
  // years / model numbers like 2024, 1990, 5090 → "twenty twenty four"
  if (/^\d{4}$/.test(clean)) {
    const n = parseInt(clean, 10);
    const hi = Math.floor(n / 100);
    const lo = n % 100;
    if (hi % 10 !== 0 && lo !== 0) return `${under1000(hi)} ${lo < 10 ? `oh ${ONES[lo]}` : under1000(lo)}`;
    if (hi % 10 !== 0 && lo === 0) return `${under1000(hi)} hundred`;
  }
  if (/^\d+\.\d+$/.test(clean)) {
    const [a, b] = clean.split(".");
    return `${numberToWords(parseInt(a, 10))} point ${b.split("").map((d) => ONES[+d]).join(" ")}`;
  }
  const ord = clean.match(/^(\d+)(st|nd|rd|th)$/i);
  if (ord) return `${numberToWords(parseInt(ord[1], 10))} th`;
  if (/^\d+$/.test(clean)) return numberToWords(parseInt(clean, 10));
  return clean;
}

/** Map a Gemini word to the character string the acoustic model will hear. */
export function acousticChars(word: string): string {
  let w = word.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  w = w.replace(/[’‘`´]/g, "'");
  let suffix = "";
  // currency: "$6,000" → "six thousand dollars"
  const cur = w.match(/^([$€£])([\d,.]+)(k|m|bn|b)?/i);
  if (cur) {
    const unit = cur[1] === "$" ? "dollars" : cur[1] === "€" ? "euros" : "pounds";
    const mult = cur[3] ? ({ k: " thousand", m: " million", b: " billion", bn: " billion" } as Record<string, string>)[cur[3].toLowerCase()] : "";
    w = `${spellNumberToken(cur[2])}${mult} ${unit}`;
  }
  if (/%$/.test(w)) {
    w = w.replace(/%$/, "");
    suffix = " percent";
  }
  w = w
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/@/g, " at ")
    .replace(/=/g, " equals ");
  // spell digit runs (e.g. "RTX5090" → "RTX fifty ninety", "4K" → "four K")
  w = w.replace(/\d[\d,]*(?:\.\d+)?(?:st|nd|rd|th)?/gi, (m) => ` ${spellNumberToken(m)} `);
  w = (w + suffix).toUpperCase();
  // keep letters and apostrophes; anything else becomes a word separator
  w = w.replace(/[^A-Z']+/g, " ").replace(/^'+|'+$/g, "").trim();
  return w.replace(/\s+/g, "|");
}

// ── CTC Viterbi (full blank-state topology) ─────────────────────────────────
interface SegmentAlignment {
  ok: boolean;
  /** per word: [startFrame, endFrameExclusive, confidence] or null when the word had no characters */
  spans: ([number, number, number] | null)[];
}

interface Penalties {
  lead: number; // leading blank may absorb unrelated audio (prior speech tail)
  gap: number; // between-word blanks may absorb speech the transcript missed
  trail: number; // trailing blank absorbs speech beyond this batch
}

function alignSegment(em: Emissions, f0: number, f1: number, wordChars: string[], pen: Penalties): SegmentAlignment {
  const tokens: number[] = [];
  const wordTok: [number, number][] = []; // [firstTokenIdx, lastTokenIdx] per word, -1 if empty
  for (const chars of wordChars) {
    if (!chars) {
      wordTok.push([-1, -1]);
      continue;
    }
    if (tokens.length) tokens.push(SEP);
    const first = tokens.length;
    for (const c of chars) tokens.push(c === "|" ? SEP : VOCAB[c] ?? SEP);
    wordTok.push([first, tokens.length - 1]);
  }
  const T = f1 - f0;
  const L = tokens.length;
  const empty: SegmentAlignment = { ok: false, spans: wordChars.map(() => null) };
  if (L === 0 || T <= 0) return empty;
  // minimum frames needed: one per token + one blank between identical neighbours
  let need = L;
  for (let i = 1; i < L; i++) if (tokens[i] === tokens[i - 1]) need++;
  if (need > T) return empty;

  const e = em.data;
  const S = 2 * L + 1;
  const ext = new Int32Array(S);
  for (let s = 0; s < S; s++) ext[s] = s % 2 === 0 ? BLANK : tokens[(s - 1) >> 1];

  // garbage penalty per blank state (0 = plain CTC blank)
  const garb = new Float64Array(S);
  for (let st = 0; st < S; st += 2) {
    const before = st > 0 ? ext[st - 1] : -1;
    const after = st < S - 1 ? ext[st + 1] : -1;
    if (before === SEP || after === SEP) garb[st] = pen.gap;
  }
  garb[0] = pen.lead;
  garb[S - 1] = pen.trail;
  const emitAt = (t: number, st: number) => {
    const v = e[(f0 + t) * V + ext[st]];
    const gp = garb[st];
    return gp > 0 ? Math.max(v, em.mx[f0 + t] - gp) : v;
  };

  const NEG = -1e30;
  let prev = new Float64Array(S).fill(NEG);
  let cur = new Float64Array(S).fill(NEG);
  const bp = new Uint8Array(T * S);
  prev[0] = emitAt(0, 0);
  prev[1] = emitAt(0, 1);

  for (let t = 1; t < T; t++) {
    // states reachable at frame t / still able to finish: prune the band
    const sMax = Math.min(S - 1, 2 * t + 1);
    const sMin = Math.max(0, S - 2 * (T - t));
    cur.fill(NEG);
    for (let s = sMin; s <= sMax; s++) {
      let best = prev[s];
      let b = 0;
      if (s >= 1 && prev[s - 1] > best) {
        best = prev[s - 1];
        b = 1;
      }
      if (s >= 2 && ext[s] !== BLANK && ext[s] !== ext[s - 2] && prev[s - 2] > best) {
        best = prev[s - 2];
        b = 2;
      }
      if (best <= NEG) continue;
      cur[s] = best + emitAt(t, s);
      bp[t * S + s] = b;
    }
    const tmp = prev;
    prev = cur;
    cur = tmp;
  }

  let s = prev[S - 1] >= prev[S - 2] ? S - 1 : S - 2;
  if (prev[s] <= NEG) return empty;

  // backtrack → frame ranges per token
  const tokFirst = new Int32Array(L).fill(-1);
  const tokLast = new Int32Array(L).fill(-1);
  const tokProb = new Float64Array(L);
  const tokCount = new Int32Array(L);
  for (let t = T - 1; t >= 0; t--) {
    if (s % 2 === 1) {
      const k = (s - 1) >> 1;
      if (tokLast[k] < 0) tokLast[k] = t;
      tokFirst[k] = t;
      tokProb[k] += Math.exp(e[(f0 + t) * V + ext[s]]);
      tokCount[k] += 1;
    }
    if (t > 0) s -= bp[t * S + s];
  }

  const spans = wordTok.map(([a, b]) => {
    if (a < 0) return null;
    let conf = 0;
    let n = 0;
    for (let k = a; k <= b; k++) {
      if (tokens[k] === SEP) continue;
      conf += tokCount[k] ? tokProb[k] / tokCount[k] : 0;
      n++;
    }
    return [f0 + tokFirst[a], f0 + tokLast[b] + 1, n ? conf / n : 0] as [number, number, number];
  });
  return { ok: true, spans };
}

// ── Orchestrator ────────────────────────────────────────────────────────────
export interface ForcedAlignOutput {
  words: Word[];
  aligned: number;
  interpolated: number;
  refined: number;
  collisionsFixed: number;
  avgConfidence: number;
  lowConfidence: number;
  segments: number;
  failedSegments: number;
}

export interface Segment {
  start: number;
  end: number;
}

/** 10 ms RMS envelope used to refine starts (attack) and spoken ends (decay). */
function envelope(samples: Float32Array) {
  const hop = 80; // 5 ms hop
  const win = 160; // 10 ms window
  const n = Math.max(0, Math.floor((samples.length - win) / hop));
  const env = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = i * hop; j < i * hop + win; j++) sum += samples[j] * samples[j];
    env[i] = Math.sqrt(sum / win);
  }
  const sorted = Array.from(env).sort((a, b) => a - b);
  const floor = sorted[Math.floor(sorted.length * 0.2)] || 0;
  return { env, floor, hopSec: hop / SR };
}

export async function forcedAlign(opts: {
  words: Word[];
  samples: Float32Array;
  segments: Segment[];
  onsets: number[];
  durationSec: number;
  onLog?: Log;
  emissions?: Emissions | null;
}): Promise<ForcedAlignOutput> {
  const { words, samples, segments, onsets, durationSec, onLog } = opts;
  const em = opts.emissions ?? (await computeEmissions(samples, onLog));
  const n = words.length;
  const starts = new Float64Array(n).fill(NaN);
  const ends = new Float64Array(n).fill(NaN);
  const conf = new Float64Array(n).fill(NaN);
  const chars = words.map((w) => acousticChars(w.word));

  // Streaming Viterbi over word ORDER (Gemini timestamps are only a window
  // hint — they can be seconds off). Align ~48 words from a moving cursor,
  // commit the first 70 %, slide, repeat. Bounded memory for any length.
  void segments;
  const BATCH = 48;
  let failed = 0;
  let batches = 0;
  let p = 0;
  let cursor = 0;
  const estTotal = Math.max(1, Math.ceil(n / Math.floor(BATCH * 0.7)));
  while (p < n) {
    const B = Math.min(n - p, BATCH);
    const final = p + B >= n;
    const idxs: number[] = [];
    for (let i = p; i < p + B; i++) idxs.push(i);
    const charCount = idxs.reduce((acc, i) => acc + chars[i].length, 0);
    const estByChars = (charCount / 11) * 1.6 + 8;
    const gemSpan = words[p + B - 1].end - words[p].start;
    const estByGemini = Number.isFinite(gemSpan) && gemSpan > 0 ? gemSpan * 1.4 + 8 : 0;
    const spanSec = Math.max(25, estByChars, estByGemini);
    const f0 = cursor;
    let f1 = final ? em.frames : Math.min(em.frames, f0 + Math.ceil(spanSec / FRAME_SEC));
    const pen: Penalties = { lead: 1.0, gap: 2.5, trail: final ? 1.0 : 0.4 };
    let res = alignSegment(em, f0, f1, idxs.map((i) => chars[i]), pen);
    if (!res.ok && f1 < em.frames) {
      f1 = em.frames;
      res = alignSegment(em, f0, f1, idxs.map((i) => chars[i]), pen);
    }
    const commit = final ? B : Math.max(1, Math.floor(B * 0.7));
    batches++;
    if (!res.ok) {
      failed++;
      onLog?.(`Window ${batches}: alignment fell back`, `${commit} words could not be force-aligned — interpolating from neighbours`, "warn");
      p += commit;
      continue;
    }
    let confSum = 0;
    let confN = 0;
    let lastEnd = cursor;
    for (let j = 0; j < commit; j++) {
      const sp = res.spans[j];
      if (!sp) continue;
      const i = idxs[j];
      starts[i] = sp[0] * FRAME_SEC;
      ends[i] = sp[1] * FRAME_SEC;
      conf[i] = sp[2];
      confSum += sp[2];
      confN++;
      lastEnd = Math.max(lastEnd, sp[1]);
    }
    cursor = lastEnd;
    onLog?.(
      `Viterbi window ${batches}/${Math.max(batches, estTotal)} · words ${p + 1}–${p + commit}`,
      `placed ${confN} words between ${(starts[idxs[0]] || f0 * FRAME_SEC).toFixed(2)} s and ${(lastEnd * FRAME_SEC).toFixed(2)} s · mean acoustic confidence ${confN ? Math.round((confSum / confN) * 100) : 0}%`
    );
    p += commit;
  }

  // ── interpolate words with no characters / failed segments ──────────────
  let aligned = 0;
  for (let i = 0; i < n; i++) if (Number.isFinite(starts[i])) aligned++;
  let interpolated = 0;
  for (let i = 0; i < n; i++) {
    if (Number.isFinite(starts[i])) continue;
    let a = i - 1;
    while (a >= 0 && !Number.isFinite(starts[a])) a--;
    let b = i + 1;
    while (b < n && !Number.isFinite(starts[b])) b++;
    const leftT = a >= 0 ? ends[a] : Math.max(0, words[i].start);
    const rightT = b < n ? starts[b] : Math.min(durationSec, words[b - 1]?.end ?? durationSec);
    // distribute the run [a+1, b-1] by original relative timing
    const run: number[] = [];
    for (let j = a + 1; j < b; j++) run.push(j);
    const weights = run.map((j) => Math.max(1, (chars[j] || words[j].word).length));
    const total = weights.reduce((x, y) => x + y, 0);
    let t = leftT;
    const span = Math.max(0.05 * run.length, rightT - leftT);
    run.forEach((j, r) => {
      const d = (weights[r] / total) * span;
      starts[j] = t;
      ends[j] = t + d;
      t += d;
      interpolated++;
    });
  }

  // ── waveform refinement: attack (start) and decay (spoken end) ──────────
  const { env, floor, hopSec } = envelope(samples);
  // CTC letter spikes sit in the MIDDLE of a word's first sound, so starts
  // trail the physical attack by ~20–80 ms. Within 120 ms before the CTC start
  // (never into the previous word) find the pause trough and move to the first
  // sustained 6 dB rise — only if the rise is continuous into the word and
  // reaches ≥ 10 dB (rejects breath blips that dip again).
  void onsets;
  let refined = 0;
  const halfWin = 0.005;
  for (let i = 0; i < n; i++) {
    if (!Number.isFinite(conf[i])) continue;
    const prevEnd = i > 0 ? ends[i - 1] : 0;
    const lo = Math.max(prevEnd + 0.01, starts[i] - 0.22);
    const fLo = Math.max(0, Math.floor(lo / hopSec));
    const fS = Math.min(env.length - 3, Math.round(starts[i] / hopSec));
    if (fS - fLo < 3) continue;
    let tf = fLo;
    for (let f = fLo; f <= fS; f++) if (env[f] < env[tf]) tf = f;
    const thr = Math.max(env[tf] * 2, 1e-5);
    let att = -1;
    for (let f = tf + 1; f <= fS; f++) {
      if (env[f] > thr && env[f + 1] > thr && env[f + 2] > thr) {
        att = f;
        break;
      }
    }
    if (att < 0 || att >= fS) continue;
    let continuous = true;
    for (let f = att; f <= fS; f++) {
      if (env[f] < thr * 0.8) {
        continuous = false;
        break;
      }
    }
    let peak = 0;
    for (let f = att; f <= Math.min(env.length - 1, fS + 8); f++) peak = Math.max(peak, env[f]);
    if (!continuous || peak < env[tf] * 3.16) continue;
    const t = att * hopSec + halfWin;
    // long soft lead-ins (nasals, soft vowels) are accepted beyond 120 ms only
    // when they are speech-loud (within 14 dB of the word's peak) — quieter
    // swells are background (music bed), not the word
    if (starts[i] - t > 0.12) {
      const lead: number[] = [];
      for (let f = att; f < fS; f++) lead.push(env[f]);
      lead.sort((x, y) => x - y);
      if ((lead[lead.length >> 1] ?? 0) < peak / 5) continue;
    }
    if (t < starts[i] && t > prevEnd) {
      starts[i] = t;
      refined++;
    }
  }
  for (let i = 0; i < n; i++) {
    // extend the spoken end through the energy decay (max 220 ms)
    const nextStart = i + 1 < n ? starts[i + 1] : durationSec;
    const fi = Math.floor(starts[i] / hopSec);
    const fe = Math.min(env.length - 1, Math.floor(ends[i] / hopSec));
    let peak = 0;
    for (let f = Math.max(0, fi); f <= fe; f++) peak = Math.max(peak, env[f]);
    const thr = Math.max(floor * 1.6, peak * 0.12);
    let f = fe;
    const limit = Math.min(env.length - 1, Math.floor(Math.min(nextStart - 0.01, ends[i] + 0.22) / hopSec));
    while (f < limit && env[f + 1] > thr) f++;
    ends[i] = Math.max(ends[i], Math.min((f + 1) * hopSec, nextStart));
  }

  // ── monotonicity ─────────────────────────────────────────────────────────
  let collisionsFixed = 0;
  for (let i = 1; i < n; i++) {
    if (starts[i] < starts[i - 1] + 0.01) {
      starts[i] = starts[i - 1] + 0.01;
      collisionsFixed++;
    }
  }

  const r3 = (x: number) => Math.round(x * 1000) / 1000;
  const out: Word[] = words.map((w, i) => {
    const start = Math.max(0, starts[i]);
    const nextStart = i + 1 < n ? starts[i + 1] : Math.min(durationSec, ends[i] + 0.15);
    const spokenEnd = Math.min(Math.max(ends[i], start + 0.04), Math.max(nextStart, start + 0.04));
    return {
      word: w.word,
      start: r3(start),
      // gapless bridging: visual end = next word's acoustic start
      end: r3(Math.max(nextStart, start + 0.04)),
      spokenEnd: r3(spokenEnd),
      pauseAfterMs: i + 1 < n ? Math.max(0, Math.round((nextStart - spokenEnd) * 1000)) : 0,
      confidence: Number.isFinite(conf[i]) ? Math.round(conf[i] * 100) / 100 : undefined,
    };
  });

  const confVals = Array.from(conf).filter((c) => Number.isFinite(c));
  return {
    words: out,
    aligned,
    interpolated,
    refined,
    collisionsFixed,
    avgConfidence: confVals.length ? confVals.reduce((a, b) => a + b, 0) / confVals.length : 0,
    lowConfidence: confVals.filter((c) => c < 0.35).length,
    segments: batches,
    failedSegments: failed,
  };
}

// ── Per-chunk acoustic alignment (used inside the transcription loop) ───────
/**
 * Force-align one Gemini clip transcript (in Gemini's TEXT order) against the
 * exact clip audio. Returns words with acoustic times so overlap
 * de-duplication and the coverage gate no longer depend on LLM timestamps.
 */
export function alignClip(
  em: Emissions,
  words: Word[],
  clipStart: number,
  clipEnd: number
): { words: Word[]; ok: boolean; avgConf: number } {
  if (!words.length) return { words, ok: true, avgConf: 0 };
  const chars = words.map((w) => acousticChars(w.word));
  const f0 = Math.max(0, Math.floor(clipStart / FRAME_SEC));
  const f1 = Math.min(em.frames, Math.ceil(clipEnd / FRAME_SEC));
  const res = alignSegment(em, f0, f1, chars, { lead: 0.8, gap: 2.5, trail: 0.8 });
  if (!res.ok) return { words, ok: false, avgConf: 0 };
  const out: Word[] = words.map((w) => ({ ...w }));
  let confSum = 0;
  let confN = 0;
  res.spans.forEach((sp, i) => {
    if (!sp) return;
    out[i].start = sp[0] * FRAME_SEC;
    out[i].end = sp[1] * FRAME_SEC;
    out[i].spokenEnd = sp[1] * FRAME_SEC;
    out[i].confidence = sp[2];
    confSum += sp[2];
    confN++;
  });
  // words with no speakable letters sit between their neighbours
  for (let i = 0; i < out.length; i++) {
    if (res.spans[i]) continue;
    const prevEnd = i > 0 ? (out[i - 1].spokenEnd ?? out[i - 1].end) : clipStart;
    let j = i + 1;
    while (j < out.length && !res.spans[j]) j++;
    const nextStart = j < out.length ? out[j].start : Math.min(clipEnd, prevEnd + 0.3);
    out[i].start = prevEnd;
    out[i].end = out[i].spokenEnd = Math.max(prevEnd + 0.02, Math.min(nextStart, prevEnd + 0.3));
  }
  return { words: out, ok: true, avgConf: confN ? confSum / confN : 0 };
}

/**
 * Acoustic coverage gate: the acoustic model "hears" letters (confident
 * non-blank frames). Any cluster of heard letters that no transcribed word
 * covers is speech the transcriber skipped — works even under music beds,
 * where silence-based coverage is meaningless.
 */
export function acousticCoverage(
  em: Emissions,
  words: Word[],
  coreStart: number,
  coreEnd: number
): { coverage: number; longestMissSec: number; heard: number; missAt?: number } {
  const f0 = Math.max(0, Math.floor(coreStart / FRAME_SEC));
  const f1 = Math.min(em.frames, Math.ceil(coreEnd / FRAME_SEC));
  const spikes: number[] = [];
  for (let f = f0; f < f1; f++) {
    let b = 0;
    let bv = -Infinity;
    for (let v = 0; v < V; v++) {
      const x = em.data[f * V + v];
      if (x > bv) {
        bv = x;
        b = v;
      }
    }
    if (b !== BLANK && b !== SEP && bv > -0.7) spikes.push(f * FRAME_SEC);
  }
  if (!spikes.length) return { coverage: 1, longestMissSec: 0, heard: 0 };
  const spans = words
    .map((w) => [w.start - 0.12, (w.spokenEnd ?? w.end) + 0.12] as [number, number])
    .sort((a, b) => a[0] - b[0]);
  const uncovered: number[] = [];
  let k = 0;
  for (const t of spikes) {
    while (k < spans.length && spans[k][1] < t) k++;
    // check current and a few following spans (they can overlap)
    let hit = false;
    for (let m = k; m < spans.length && spans[m][0] <= t; m++) {
      if (t <= spans[m][1]) {
        hit = true;
        break;
      }
    }
    if (!hit) uncovered.push(t);
  }
  let longest = 0;
  let missAt: number | undefined;
  let cs = 0;
  for (let i = 1; i <= uncovered.length; i++) {
    if (i === uncovered.length || uncovered[i] - uncovered[i - 1] > 0.5) {
      const count = i - cs;
      const dur = uncovered[i - 1] - uncovered[cs] + 0.1;
      if (count >= 5 && dur > longest) {
        longest = dur;
        missAt = uncovered[cs];
      }
      cs = i;
    }
  }
  return {
    coverage: 1 - uncovered.length / spikes.length,
    longestMissSec: Math.round(longest * 1000) / 1000,
    heard: spikes.length,
    missAt,
  };
}
