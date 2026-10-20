import type { AlignmentStats, Sentence, Silence, Word } from "@/lib/types";

export const round3 = (n: number) => Math.round(n * 1000) / 1000;

// ── Step 6: chunk-relative → global seconds, sort, bridge micro-pauses ──────
export function normalizeClipWords(
  words: { word: string; start: number; end: number }[],
  clipStartSec: number
): Word[] {
  const mapped = words
    .filter((w) => Number.isFinite(w.start) && Number.isFinite(w.end) && w.word.length > 0)
    .map((w) => ({
      word: w.word,
      start: round3(Math.max(0, w.start + clipStartSec)),
      end: round3(Math.max(w.start + clipStartSec, w.end + clipStartSec)),
      pauseAfterMs: 0,
    }))
    .sort((a, b) => a.start - b.start);

  // bridge micro-pauses (< 20ms) so consecutive words are continuous
  for (let i = 0; i < mapped.length - 1; i++) {
    const gap = mapped[i + 1].start - mapped[i].end;
    if (gap < 0.02) mapped[i].end = round3(mapped[i + 1].start);
  }
  return mapped;
}

// ── Step 6: snap word starts that fall inside long silences to speech resume ─
export function snapWordsToSpeech(words: Word[], silences: Silence[]): Word[] {
  return words.map((w) => {
    const silence = silences.find((s) => w.start > s.start && w.start < s.end && s.end - s.start >= 0.5);
    if (!silence) return w;
    return { ...w, start: round3(silence.end) };
  });
}

// ── Step 6: core window filter (drops overlap duplicates) ───────────────────
export function coreFilter(words: Word[], coreStart: number, coreEnd: number): Word[] {
  return words.filter((w) => {
    const mid = (w.start + w.end) / 2;
    return mid >= coreStart - 0.05 && mid <= coreEnd + 0.05;
  });
}

// ── Step 6: speech coverage quality gate ────────────────────────────────────
export interface CoverageReport {
  coverage: number;
  longestMissSec: number;
  speechSec: number;
}

export function measureCoverage(
  words: Word[],
  speech: Silence[],
  coreStart: number,
  coreEnd: number
): CoverageReport {
  // effective word spans: each word covers from its start to the next word's start (gapless)
  const spans: { start: number; end: number }[] = [];
  for (let i = 0; i < words.length; i++) {
    const start = words[i].start;
    const end = i + 1 < words.length ? words[i + 1].start : words[i].end;
    spans.push({ start, end: Math.max(end, start + 0.05) });
  }

  let speechSec = 0;
  let coveredSec = 0;
  let longestMiss = 0;

  for (const iv of speech) {
    const a = Math.max(iv.start, coreStart);
    const b = Math.min(iv.end, coreEnd);
    if (b - a <= 0.02) continue;
    speechSec += b - a;

    let cursor = a;
    let missStart = a;
    let anyCovered = false;
    for (const s of spans) {
      if (s.end <= cursor) continue;
      if (s.start >= b) break;
      const coverA = Math.max(s.start, cursor);
      const coverB = Math.min(s.end, b);
      if (coverA < coverB) {
        if (coverA > missStart + 0.02) {
          longestMiss = Math.max(longestMiss, coverA - missStart);
        }
        coveredSec += coverB - coverA;
        cursor = Math.max(cursor, coverB);
        missStart = cursor;
        anyCovered = true;
      }
    }
    if (!anyCovered && b - a > longestMiss) longestMiss = b - a;
    if (cursor > missStart && cursor < b) longestMiss = Math.max(longestMiss, b - cursor);
  }

  return {
    coverage: speechSec > 0.05 ? Math.min(1, coveredSec / speechSec) : 1,
    longestMissSec: round3(longestMiss),
    speechSec: round3(speechSec),
  };
}

// ── Step 7: The 4-Pass Timestamp Matching Algorithm ─────────────────────────
export interface AlignmentResult {
  words: Word[];
  stats: AlignmentStats;
  collisionsFixed: number;
}

export function correctWordTimestamps(
  words: Word[],
  onsets: number[],
  { toleranceSec = 0.35 } = {}
): AlignmentResult {
  const total = words.length;
  if (!onsets?.length || !total) {
    return {
      words: (words || []).map((w) => ({ ...w })),
      stats: { anchored: 0, interpolated: total, total, collisionsFixed: 0 },
      collisionsFixed: 0,
    };
  }

  const result = words.map((w) => ({ ...w, _anchor: false }));

  // ── PASS 1: Greedy Forward Matching (anchor AI words to physical onsets) ──
  let oi = 0;
  for (let wi = 0; wi < result.length; wi++) {
    const aiStart = words[wi].start;
    while (oi < onsets.length && onsets[oi] < aiStart - toleranceSec) oi++;
    let bestOi = -1;
    let bestDist = Infinity;
    for (let j = oi; j < onsets.length && onsets[j] <= aiStart + toleranceSec; j++) {
      const dist = Math.abs(onsets[j] - aiStart);
      if (dist < bestDist) {
        bestDist = dist;
        bestOi = j;
      }
    }
    if (bestOi >= 0) {
      result[wi].start = onsets[bestOi];
      result[wi]._anchor = true;
      oi = bestOi + 1;
    }
  }

  // ── PASS 2: Proportional linear interpolation of unanchored words ─────────
  const anchorIdxs = result.map((w, i) => (w._anchor ? i : -1)).filter((i) => i >= 0);

  if (anchorIdxs.length > 0 && anchorIdxs[0] > 0) {
    const ai = anchorIdxs[0];
    const drift = result[ai].start - words[ai].start;
    for (let i = 0; i < ai; i++) result[i].start = words[i].start + drift;
  }
  for (let a = 0; a < anchorIdxs.length - 1; a++) {
    const from = anchorIdxs[a];
    const to = anchorIdxs[a + 1];
    if (to - from <= 1) continue;
    const origFrom = words[from].start;
    const origTo = words[to].start;
    const corrFrom = result[from].start;
    const corrTo = result[to].start;
    const origRange = origTo - origFrom;
    if (origRange > 0) {
      for (let i = from + 1; i < to; i++) {
        const ratio = (words[i].start - origFrom) / origRange;
        result[i].start = corrFrom + ratio * (corrTo - corrFrom);
      }
    }
  }
  if (anchorIdxs.length > 0) {
    const li = anchorIdxs[anchorIdxs.length - 1];
    const drift = result[li].start - words[li].start;
    for (let i = li + 1; i < result.length; i++) result[i].start = words[i].start + drift;
  }

  // ── PASS 3: Monotonicity enforcement (strict chronological, ≥ 20ms) ──────
  let collisionsFixed = 0;
  for (let i = 1; i < result.length; i++) {
    if (result[i].start <= result[i - 1].start) {
      result[i].start = result[i - 1].start + 0.02;
      collisionsFixed += 1;
    }
  }

  // ── PASS 4: Gapless continuity bridging (word end = next word start) ─────
  for (let i = 0; i < result.length - 1; i++) {
    result[i].end = result[i + 1].start;
  }
  const last = result[result.length - 1];
  if (last.end <= last.start) last.end = last.start + 0.15;

  const anchored = result.filter((w) => w._anchor).length;
  return {
    words: result.map(({ _anchor, ...w }) => ({
      ...w,
      start: round3(w.start),
      end: round3(Math.max(w.end, w.start + 0.04)),
      pauseAfterMs: 0,
    })),
    stats: { anchored, interpolated: total - anchored, total, collisionsFixed },
    collisionsFixed,
  };
}

// compute pauseAfterMs for the persisted word list
export function stampPauses(words: Word[]): Word[] {
  return words.map((w, i) => {
    const next = words[i + 1];
    const pause = next ? Math.max(0, (next.start - w.end) * 1000) : 0;
    return { ...w, pauseAfterMs: Math.round(pause) };
  });
}

// ── Step 8: Deterministic sentence assembly ─────────────────────────────────
export function assembleSentences(
  words: Word[],
  { maxWords = 18, pauseBreakSec = 0.7 } = {}
): Sentence[] {
  const sentences: Sentence[] = [];
  let startIdx = 0;

  const flush = (endIdx: number) => {
    if (endIdx < startIdx) return;
    const slice = words.slice(startIdx, endIdx + 1);
    sentences.push({
      index: sentences.length,
      text: slice.map((w) => w.word).join(" "),
      wordStart: startIdx,
      wordEnd: endIdx,
      start: round3(slice[0].start),
      end: round3(slice[slice.length - 1].end),
    });
    startIdx = endIdx + 1;
  };

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const isLast = i === words.length - 1;
    const count = i - startIdx + 1;
    const endsWithPunct = /[.!?…]["')\]]*$/.test(w.word);
    const longPause = !isLast && words[i + 1].start - w.end >= pauseBreakSec && count >= 3;

    if (isLast || endsWithPunct || longPause) {
      flush(i);
    } else if (count >= maxWords) {
      let best = i;
      let bestScore = -Infinity;
      for (let j = startIdx + Math.floor(count / 2); j < i; j++) {
        const pause = words[j + 1].start - words[j].end;
        const score = pause + (/[,;:—-]$/.test(words[j].word) ? 1 : 0);
        if (score > bestScore) {
          best = j;
          bestScore = score;
        }
      }
      flush(best);
    }
  }
  return sentences;
}
