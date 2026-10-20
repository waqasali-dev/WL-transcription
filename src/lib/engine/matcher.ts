import type { AlignmentStats, Silence, Word } from "@/lib/types";

export const round3 = (n: number) => Math.round(n * 1000) / 1000;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export interface AlignmentOptions {
  silences?: Silence[];
  durationSec?: number;
  /** local refinement window around the phrase-mapped prediction, seconds */
  toleranceSec?: number;
  /** a physical onset is only accepted this close to the prediction */
  gateSec?: number;
  gapless?: boolean;
  maxWordSec?: number;
}

interface Onset {
  t: number;
  strength: number;
}

export interface AlignmentReport extends AlignmentStats {
  driftMs: number;
  scale: number;
  medianResidualMs: number;
  p90ResidualMs: number;
  anchorRate: number;
  maxCorrectionMs: number;
  durationMedianMs: number;
  regions: number;
}

export interface AlignmentResult {
  words: Word[];
  stats: AlignmentReport;
}

function medianOf(values: number[]): number {
  if (!values.length) return 0;
  const s = values.slice().sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Why this matcher is built around pauses, not nearest onsets.
 *
 * Measured on real speech (JFK, 11.09 s, known transcript): a "nearest onset"
 * matcher placed "what / your / country" 0.7–1.1 s late because the model had
 * put them inside an actual 1.1 s pause. No amount of local onset nudging can
 * repair that — the words were in the wrong phrase.
 *
 * Speaker pauses are the one piece of evidence that is both cheap and
 * unambiguous. So:
 *   1. endpoint warp puts the model's clock on the recording's clock,
 *   2. every word is assigned to the speech region between two pauses,
 *   3. words are laid out inside their region (model rhythm preserved),
 *   4. onsets only refine a start within ±window, never move it to another
 *      phrase — the tight prior is what makes anchoring safe.
 */

/** Merge speech regions across pauses shorter than `minPause` (breaths, clicks). */
function speechRegions(silences: Silence[], durationSec: number, minPause = 0.45): Silence[] {
  const merged = silences
    .filter((s) => s.end - s.start >= minPause)
    .sort((a, b) => a.start - b.start);
  const regions: Silence[] = [];
  let cursor = 0;
  for (const s of merged) {
    if (s.start > cursor + 0.05) regions.push({ start: cursor, end: s.start });
    cursor = Math.max(cursor, s.end);
  }
  if (cursor < durationSec - 0.05) regions.push({ start: cursor, end: durationSec });
  // Merge speech islands that are too short to carry a phrase (breaths,
  // camera audio tails). They would otherwise steal a word from its phrase.
  const mergedRegions: Silence[] = [];
  for (const r of regions) {
    if (mergedRegions.length === 0) {
      mergedRegions.push({ ...r });
      continue;
    }
    const prev = mergedRegions[mergedRegions.length - 1];
    if (r.end - r.start < 0.42) {
      prev.end = r.end;
    } else {
      mergedRegions.push({ ...r });
    }
  }
  if (mergedRegions.length && mergedRegions[0].end - mergedRegions[0].start < 0.42 && mergedRegions.length > 1) {
    mergedRegions[1].start = mergedRegions[0].start;
    mergedRegions.shift();
  }
  const cleaned = mergedRegions.filter((r) => r.end - r.start > 0.2);
  return cleaned.length ? cleaned : [{ start: 0, end: durationSec }];
}

function regionDistance(t: number, r: Silence): number {
  if (t < r.start) return r.start - t;
  if (t > r.end) return t - r.end;
  return 0;
}

/**
 * Monotone assignment of words → speech regions (O(words · regions)).
 * Words keep their order; cost is distance of the warped model time to the
 * region, plus a small penalty for skipping a region (so silence regions are
 * not silently swallowed unless the timing says so).
 */
function assignRegions(times: number[], regions: Silence[]): number[] {
  const n = times.length;
  const R = regions.length;
  const out = new Array<number>(n).fill(0);
  if (R === 1) return out;
  const COST_CAP = 1.2;
  const dp: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row = new Array<number>(R).fill(Infinity);
    // running minimum of the previous row over regions <= r (monotone order)
    let prevBest = i === 0 ? 0 : Infinity;
    for (let r = 0; r < R; r++) {
      if (i > 0) prevBest = Math.min(prevBest, dp[i - 1][r]);
      const cost = Math.min(COST_CAP, regionDistance(times[i], regions[r]));
      row[r] = cost + (i === 0 ? 0 : prevBest);
    }
    dp.push(row);
  }
  let bestR = 0;
  for (let r = 1; r < R; r++) if (dp[n - 1][r] < dp[n - 1][bestR]) bestR = r;
  out[n - 1] = bestR;
  for (let i = n - 1; i > 0; i--) {
    const target = out[i];
    let pick = 0;
    let best = Infinity;
    for (let r = 0; r <= target; r++) {
      if (dp[i - 1][r] < best) {
        best = dp[i - 1][r];
        pick = r;
      }
    }
    out[i - 1] = pick;
  }
  return out;
}

/**
 * Local onset refinement inside one region.
 * Predictions are already phrase-correct, so candidates are limited to
 * ±window and accepted within `gate`; a monotone DP keeps the assignment
 * globally consistent. Returns refined starts (NaN = keep prediction).
 */
function refineRegion(
  pred: number[],
  regionOnsets: Onset[],
  window: number,
  gate: number
): number[] {
  const refined = new Array<number>(pred.length).fill(NaN);
  if (!regionOnsets.length || !pred.length) return refined;

  const candidates = pred.map((p) => {
    const row: { t: number; cost: number }[] = [];
    for (const o of regionOnsets) {
      const d = Math.abs(o.t - p);
      if (d > window || d > gate) continue;
      row.push({ t: o.t, cost: d / window + 0.12 * (1 - clamp(o.strength, 0, 1)) });
    }
    return row;
  });

  let prevOnset = -Infinity;
  for (let i = 0; i < pred.length; i++) {
    let best = -1;
    let bestCost = Infinity;
    for (let c = 0; c < candidates[i].length; c++) {
      const cand = candidates[i][c];
      if (i > 0 && cand.t <= prevOnset + 0.02) continue;
      if (cand.cost < bestCost) {
        bestCost = cand.cost;
        best = c;
      }
    }
    if (best >= 0) {
      prevOnset = candidates[i][best].t;
      refined[i] = prevOnset;
    } else if (i > 0) {
      prevOnset = Math.max(prevOnset, pred[i]);
    }
  }
  // enforce monotonicity of accepted anchors
  let last = -Infinity;
  for (let i = 0; i < refined.length; i++) {
    if (!Number.isFinite(refined[i])) continue;
    if (refined[i] <= last) refined[i] = NaN;
    else last = refined[i];
  }
  return refined;
}

/**
 * Split the word stream into the detected speech regions.
 *
 * Each region has a physical time budget; each word has a clamped duration
 * weight. A segmentation DP minimises the mismatch, so a phrase boundary is
 * placed where the accumulated word durations run out — not where a drifting
 * model clock happens to be. This is what keeps "ask" after the 1.16 s pause
 * instead of inside the first phrase.
 */
function segmentByWeights(weights: number[], regions: Silence[], secPerWeight: number): number[] {
  const n = weights.length;
  const R = regions.length;
  const out = new Array<number>(n).fill(0);
  if (R <= 1 || n === 0) return out;
  // guard: proportional split keeps very long transcripts linear
  if (n > 900) {
    const total = regions.reduce((a, r) => a + (r.end - r.start), 0) || 1;
    let cursor = 0;
    for (let r = 0; r < R; r++) {
      const share = Math.round((n * (regions[r].end - regions[r].start)) / total);
      for (let k = 0; k < share && cursor < n; k++) out[cursor++] = r;
    }
    while (cursor < n) out[cursor++] = R - 1;
    return out;
  }
  const prefix = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i] + weights[i];
  const target = regions.map((r) => (r.end - r.start) / secPerWeight);
  const dp: Float64Array[] = Array.from({ length: R + 1 }, () => new Float64Array(n + 1).fill(Infinity));
  const back: Int32Array[] = Array.from({ length: R + 1 }, () => new Int32Array(n + 1).fill(-1));
  dp[0][0] = 0;
  for (let r = 1; r <= R; r++) {
    for (let j = 0; j <= n; j++) {
      let best = Infinity;
      let bestI = -1;
      for (let i = 0; i <= j; i++) {
        const prev = dp[r - 1][i];
        if (!Number.isFinite(prev)) continue;
        const used = prefix[j] - prefix[i];
        const cost = Math.abs(used - target[r - 1]);
        const emptyPenalty = j === i && r < R ? 0.22 : 0;
        const v = prev + cost + emptyPenalty;
        if (v < best) {
          best = v;
          bestI = i;
        }
      }
      dp[r][j] = best;
      back[r][j] = bestI;
    }
  }
  // walk back the region boundaries
  let j = n;
  for (let r = R; r >= 1; r--) {
    const i = back[r][j] >= 0 ? back[r][j] : j;
    for (let k = i; k < j; k++) out[k] = r - 1;
    j = i;
  }
  for (let k = 0; k < j; k++) out[k] = 0;
  return out;
}

export function correctWordTimestamps(
  wordsInput: Word[],
  onsetsInput: (number | Onset)[],
  opts: AlignmentOptions = {}
): AlignmentResult {
  const window = opts.toleranceSec ?? 0.28;
  const gate = opts.gateSec ?? 0.14;
  const gapless = opts.gapless ?? false;
  const maxWordSec = opts.maxWordSec ?? 1.4;

  const words = wordsInput.filter((w) => Number.isFinite(w.start) && Number.isFinite(w.end) && w.word.length > 0);
  if (!words.length) {
    return {
      words: [],
      stats: {
        anchored: 0, interpolated: 0, total: 0, collisionsFixed: 0, driftMs: 0, scale: 1,
        medianResidualMs: 0, p90ResidualMs: 0, anchorRate: 0, maxCorrectionMs: 0,
        durationMedianMs: 0, regions: 0,
      },
    };
  }

  const onsets: Onset[] = onsetsInput
    .map((o) => (typeof o === "number" ? { t: o, strength: 0.6 } : o))
    .filter((o) => Number.isFinite(o.t))
    .sort((a, b) => a.t - b.t);

  const durationSec = Math.max(
    opts.durationSec ?? 0,
    words[words.length - 1].end || 0,
    onsets.length ? onsets[onsets.length - 1].t + 0.2 : 0
  );
  const silences = opts.silences ?? [];
  const regions = speechRegions(silences, durationSec);

  // ── durational weights ────────────────────────────────────────────────────
  // Model timestamps drift, but relative word *lengths* stay stable. Raw
  // durations are inflated whenever a model stretches an end through a pause,
  // so they are clamped before being used as weights.
  const weights = words.map((w) => clamp(w.end - w.start, 0.12, 0.55));
  const totalWeight = weights.reduce((x, y) => x + y, 0) || 1;
  const totalSpeech = regions.reduce((x, r) => x + (r.end - r.start), 0) || durationSec;
  // speech seconds per unit of clamped word weight
  const secPerWeight = clamp(totalSpeech / totalWeight, 0.4, 3.0);

  const finalStarts = new Array<number>(words.length).fill(NaN);
  const predStarts = new Array<number>(words.length).fill(NaN);
  const anchoredFlags = new Array<boolean>(words.length).fill(false);

  const firstStart = words[0].start;
  const lastEnd = Math.max(...words.map((w) => w.end));
  const aiSpan = Math.max(0.5, lastEnd - firstStart);
  const b = clamp(totalSpeech / aiSpan, 0.6, 1.6); // reported warp factor
  const warped = words.map((w) => regions[0].start + b * (w.start - firstStart));

  if (regions.length <= 1) {
    // Continuous speech: preserve the model's own rhythm (it is usually good),
    // then let onsets nudge individual starts.
    const r = regions[0];
    for (let i = 0; i < words.length; i++) {
      finalStarts[i] = clamp(warped[i], r.start, r.end - 0.05);
      predStarts[i] = finalStarts[i];
    }
    const regionOnsets = onsets.filter((o) => o.t >= r.start - 0.05 && o.t <= r.end + 0.05);
    const refined = refineRegion(finalStarts, regionOnsets, window, gate);
    for (let i = 0; i < words.length; i++) {
      if (Number.isFinite(refined[i])) {
        finalStarts[i] = refined[i];
        anchoredFlags[i] = true;
      }
    }
  } else {
    const regionOfWord = segmentByWeights(weights, regions, secPerWeight);
    let i = 0;
    while (i < words.length) {
      const rIdx = regionOfWord[i];
      let j = i;
      while (j + 1 < words.length && regionOfWord[j + 1] === rIdx) j++;
      const r = regions[rIdx];
      const wts = weights.slice(i, j + 1);
      const wsum = wts.reduce((x, y) => x + y, 0) || 1;
      const regionOnsets = onsets.filter((o) => o.t >= r.start - 0.05 && o.t <= r.end + 0.05);
      const firstOnset = regionOnsets.find((o) => o.t >= r.start && o.t <= r.start + 0.45);
      const layoutStart = firstOnset ? firstOnset.t : r.start + Math.min(0.04, (r.end - r.start) * 0.03);
      const targetSpan = Math.min(r.end - layoutStart, wsum * secPerWeight);
      for (let k = 0; k <= j - i; k++) {
        const before = wts.slice(0, k).reduce((x, y) => x + y, 0);
        const offset = (before / wsum) * Math.max(0.05, targetSpan - 0.06);
        predStarts[i + k] = clamp(layoutStart + offset, r.start, r.end - 0.04);
        finalStarts[i + k] = predStarts[i + k];
      }
      const refined = refineRegion(finalStarts.slice(i, j + 1), regionOnsets, window, gate);
      for (let k = 0; k <= j - i; k++) {
        if (Number.isFinite(refined[k])) {
          finalStarts[i + k] = refined[k];
          anchoredFlags[i + k] = true;
        }
      }
      i = j + 1;
    }
  }

  // 5 ─ strict monotonicity
  let collisions = 0;
  for (let i = 0; i < finalStarts.length; i++) {
    if (!Number.isFinite(finalStarts[i])) finalStarts[i] = warped[i];
    finalStarts[i] = clamp(finalStarts[i], 0, durationSec);
    if (i > 0 && finalStarts[i] <= finalStarts[i - 1] + 0.02) {
      finalStarts[i] = finalStarts[i - 1] + 0.03;
      collisions++;
    }
  }

  // 6 ─ durations: natural spoken length (or gapless bridging)
  const out: Word[] = words.map((w, i) => {
    const start = round3(finalStarts[i]);
    const nextStart = i + 1 < words.length ? finalStarts[i + 1] : Infinity;
    const dur = clamp(weights[i] * secPerWeight, 0.09, maxWordSec);
    let end = gapless && Number.isFinite(nextStart) ? nextStart : start + dur;
    if (Number.isFinite(nextStart)) end = Math.min(end, nextStart - (gapless ? 0 : 0.01));
    if (gapless && !Number.isFinite(nextStart)) end = start + Math.min(dur, 0.9);
    end = Math.max(end, start + 0.05);
    return {
      word: w.word,
      start,
      end: round3(end),
      pauseAfterMs: 0,
      anchored: anchoredFlags[i],
      aiStart: round3(w.aiStart ?? w.start),
    };
  });

  const anchored = anchoredFlags.filter(Boolean).length;
  const residuals: number[] = [];
  const corrections: number[] = [];
  for (let i = 0; i < words.length; i++) {
    if (!anchoredFlags[i]) continue;
    residuals.push(Math.abs(finalStarts[i] - (Number.isFinite(predStarts[i]) ? predStarts[i] : warped[i])) * 1000);
    corrections.push(Math.abs(finalStarts[i] - words[i].start) * 1000);
  }

  return {
    words: out,
    stats: {
      anchored,
      interpolated: words.length - anchored,
      total: words.length,
      collisionsFixed: collisions,
      driftMs: Math.round((medianOf(words.map((w, i) => finalStarts[i] - w.start))) * 1000),
      scale: Math.round(b * 1000) / 1000,
      medianResidualMs: Math.round(medianOf(residuals)),
      p90ResidualMs: Math.round(
        residuals.length ? residuals.slice().sort((x, y) => x - y)[Math.floor(residuals.length * 0.9)] : 0
      ),
      anchorRate: Math.round((anchored / words.length) * 1000) / 1000,
      maxCorrectionMs: Math.round(corrections.length ? Math.max(...corrections) : 0),
      durationMedianMs: Math.round(medianOf(out.map((w) => (w.end - w.start) * 1000))),
      regions: regions.length,
    },
  };
}
