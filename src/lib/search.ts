import type { Sentence, VideoObservation, Word } from "./types";

export interface SearchHit {
  kind: "sentence" | "observation";
  index: number;
  /** Global timestamp used for seeking */
  time: number;
  label: string;
  snippet: string;
}

export function buildSearchIndex(sentences: Sentence[], observations: VideoObservation[] | undefined): SearchHit[] {
  const hits: SearchHit[] = [];
  for (const s of sentences) {
    hits.push({ kind: "sentence", index: s.index, time: s.start, label: s.text, snippet: s.text });
  }
  for (const o of observations ?? []) {
    const label = [o.description, o.speech, o.audioRelation, ...(o.visibleText ?? [])].filter(Boolean).join(" ");
    hits.push({ kind: "observation", index: o.index, time: o.start, label, snippet: o.description });
  }
  return hits.sort((a, b) => a.time - b.time);
}

export function runSearch(haystack: string, needle: string): { match: boolean; parts: { text: string; hit: boolean }[] } {
  if (!needle.trim()) return { match: true, parts: [{ text: haystack, hit: false }] };
  const lower = haystack.toLowerCase();
  const q = needle.toLowerCase();
  const at = lower.indexOf(q);
  if (at < 0) return { match: false, parts: [{ text: haystack, hit: false }] };
  const parts: { text: string; hit: boolean }[] = [];
  if (at > 0) parts.push({ text: haystack.slice(0, at), hit: false });
  parts.push({ text: haystack.slice(at, at + q.length), hit: true });
  if (at + q.length < haystack.length) parts.push({ text: haystack.slice(at + q.length), hit: false });
  return { match: true, parts };
}

/** Words whose text matches the query (used for per-word highlighting). */
export function wordMatches(word: Word | undefined, needle: string): boolean {
  if (!word || !needle.trim()) return false;
  const strip = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}']+/gu, "");
  const w = strip(word.word);
  if (!w) return false;
  return w.includes(strip(needle));
}

/** Keyboard shortcut map shared by the help overlay and global handler. */
export const SHORTCUTS: { keys: string[]; action: string; group: string }[] = [
  { keys: ["Space"], action: "Play / pause", group: "Playback" },
  { keys: ["J", "→"], action: "Seek back 3 s", group: "Playback" },
  { keys: ["L", "←"], action: "Seek forward 3 s", group: "Playback" },
  { keys: ["Shift", "J"], action: "Previous sentence", group: "Playback" },
  { keys: ["Shift", "L"], action: "Next sentence", group: "Playback" },
  { keys: [","], action: "Previous frame (20 ms)", group: "Frame-accurate" },
  { keys: ["."], action: "Next frame (20 ms)", group: "Frame-accurate" },
  { keys: ["⇧", ","], action: "Speed down 0.25×", group: "Playback" },
  { keys: ["⇧", "."], action: "Speed up 0.25×", group: "Playback" },
  { keys: ["I"], action: "Set loop-in point", group: "Precision" },
  { keys: ["O"], action: "Set loop-out point", group: "Precision" },
  { keys: ["⌥", "L"], action: "Clear loop region", group: "Precision" },
  { keys: ["/"], action: "Focus transcript search", group: "Navigate" },
  { keys: ["⌘", "K"], action: "Command palette", group: "Navigate" },
  { keys: ["⇧", "D"], action: "Toggle dark / light", group: "Interface" },
  { keys: ["1", "2", "3"], action: "Switch transcript view", group: "Interface" },
  { keys: ["?"], action: "Shortcut reference", group: "Interface" },
  { keys: ["Esc"], action: "Dismiss overlay / clear search", group: "Interface" },
];

export function playbackRates(): number[] {
  return [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
}
