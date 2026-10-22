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
    }));
  // NEVER re-sort by LLM timestamps — Gemini's TEXT order is reliable, its
  // timestamps are not (sorting scrambled sentences like "HDMI, put USBA…").
  // Clamp to non-decreasing instead; the acoustic aligner fixes real timing.
  for (let i = 1; i < mapped.length; i++) {
    if (mapped[i].start < mapped[i - 1].start) mapped[i].start = mapped[i - 1].start;
    if (mapped[i].end < mapped[i].start) mapped[i].end = mapped[i].start;
  }

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

// ── Fallback aligner (used only if the acoustic model is unavailable) ───────
// The old greedy "snap to nearest onset within ±350 ms" moved words onto the
// wrong syllable (speech has ~3 onsets per word). Instead we estimate a
// smoothed drift curve from robust local offsets, apply it, and only snap
// when an onset sits within 60 ms of the drift-corrected time.
export interface AlignmentResult {
  words: Word[];
  stats: AlignmentStats;
  collisionsFixed: number;
}

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function nearestOnset(onsets: number[], t: number): number {
  let lo = 0;
  let hi = onsets.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (onsets[mid] < t) lo = mid + 1;
    else hi = mid;
  }
  let best = lo;
  if (lo > 0 && Math.abs(onsets[lo - 1] - t) < Math.abs(onsets[lo] - t)) best = lo - 1;
  return best;
}

export function correctWordTimestamps(
  words: Word[],
  onsets: number[],
  { toleranceSec = 0.35 } = {}
): AlignmentResult {
  const total = words.length;
  if (!total) {
    return { words: [], stats: { anchored: 0, interpolated: 0, total: 0, collisionsFixed: 0, method: "onset-dp" }, collisionsFixed: 0 };
  }
  const starts = words.map((w) => w.start);
  const spokenEnds = words.map((w) => w.spokenEnd ?? w.end);
  let anchored = 0;

  if (onsets.length) {
    // 1. raw local offsets (nearest onset within tolerance)
    const raw = starts.map((s) => {
      const j = nearestOnset(onsets, s);
      const d = onsets[j] - s;
      return Math.abs(d) <= toleranceSec ? d : NaN;
    });
    // 2. smoothed drift = running median of offsets over ±8 words
    const drift = starts.map((_, i) => {
      const win: number[] = [];
      for (let k = Math.max(0, i - 8); k <= Math.min(total - 1, i + 8); k++) if (Number.isFinite(raw[k])) win.push(raw[k]);
      return win.length >= 3 ? median(win) : 0;
    });
    // 3. apply drift, then snap only to a very close, unused onset
    const used = new Set<number>();
    for (let i = 0; i < total; i++) {
      const t = starts[i] + drift[i];
      spokenEnds[i] += drift[i];
      const j = nearestOnset(onsets, t);
      if (Math.abs(onsets[j] - t) <= 0.06 && !used.has(j)) {
        used.add(j);
        starts[i] = onsets[j];
        anchored++;
      } else {
        starts[i] = t;
      }
    }
  }

  let collisionsFixed = 0;
  for (let i = 1; i < total; i++) {
    if (starts[i] <= starts[i - 1] + 0.01) {
      starts[i] = starts[i - 1] + 0.02;
      collisionsFixed++;
    }
  }

  const out: Word[] = words.map((w, i) => {
    const start = round3(Math.max(0, starts[i]));
    const next = i + 1 < total ? starts[i + 1] : Math.max(spokenEnds[i], starts[i] + 0.15);
    const spokenEnd = round3(Math.min(Math.max(spokenEnds[i], start + 0.04), Math.max(next, start + 0.04)));
    return {
      word: w.word,
      start,
      end: round3(Math.max(next, start + 0.04)),
      spokenEnd,
      pauseAfterMs: i + 1 < total ? Math.max(0, Math.round((next - spokenEnd) * 1000)) : 0,
    };
  });
  return {
    words: out,
    stats: { anchored, interpolated: total - anchored, total, collisionsFixed, method: "onset-dp" },
    collisionsFixed,
  };
}

// compute pauseAfterMs from the real spoken end (not the bridged end)
export function stampPauses(words: Word[]): Word[] {
  return words.map((w, i) => {
    const next = words[i + 1];
    const pause = next ? Math.max(0, (next.start - (w.spokenEnd ?? w.end)) * 1000) : 0;
    return { ...w, pauseAfterMs: Math.round(pause) };
  });
}

// ── Step 8: Deterministic sentence assembly ─────────────────────────────────
// Uses the *measured* pause after each word (pauseAfterMs), since bridged ends
// always touch the next start and would hide every pause.
export function assembleSentences(
  words: Word[],
  { maxWords = 18, pauseBreakSec = 0.7 } = {}
): Sentence[] {
  const sentences: Sentence[] = [];
  let startIdx = 0;
  const pauseOf = (i: number) =>
    i + 1 < words.length ? (words[i].pauseAfterMs ?? 0) / 1000 || Math.max(0, words[i + 1].start - (words[i].spokenEnd ?? words[i].end)) : 0;

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
    const longPause = !isLast && pauseOf(i) >= pauseBreakSec && count >= 3;

    if (isLast || endsWithPunct || longPause) {
      flush(i);
    } else if (count >= maxWords) {
      let best = i;
      let bestScore = -Infinity;
      for (let j = startIdx + Math.floor(count / 2); j < i; j++) {
        const score = pauseOf(j) + (/[,;:—-]$/.test(words[j].word) ? 1 : 0);
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
