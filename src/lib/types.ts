export type StageKey =
  | "discovery"
  | "analysis"
  | "onsets"
  | "chunking"
  | "transcription"
  | "alignment"
  | "assembly"
  | "persist";

export const STAGES: { key: StageKey; label: string; blurb: string }[] = [
  {
    key: "discovery",
    label: "Key Discovery & Quota",
    blurb: "Discovering Gemini keys · reserving RPM / RPD slots",
  },
  {
    key: "analysis",
    label: "Acoustic Analysis",
    blurb: "Exact duration · silencedetect · speech intervals",
  },
  {
    key: "onsets",
    label: "Waveform Onset Detection",
    blurb: "16 kHz PCM · 10 ms RMS · ODF peaks · 80 ms spacing",
  },
  {
    key: "chunking",
    label: "Silence-Snapped Chunking",
    blurb: "~30 s clips snapped to silence midpoints + 2 s overlap",
  },
  {
    key: "transcription",
    label: "Gemini Transcription",
    blurb: "Verbatim word JSON · multi-key rotation · coverage gate",
  },
  {
    key: "alignment",
    label: "Physical Alignment",
    blurb: "Robust drift/scale fit → monotone DP → interpolate → durations",
  },
  {
    key: "assembly",
    label: "Sentence Assembly",
    blurb: "Punctuation + pause + 18-word state machine",
  },
  {
    key: "persist",
    label: "Atomic Persistence",
    blurb: "transcript_data.json · resumable chunk cache",
  },
];

export interface Word {
  word: string;
  start: number;
  end: number;
  pauseAfterMs: number;
  /** true when the start was snapped to a measured acoustic onset */
  anchored?: boolean;
  /** the raw model timestamp before physical correction (diagnostics) */
  aiStart?: number;
}

export interface Sentence {
  index: number;
  text: string;
  wordStart: number;
  wordEnd: number;
  start: number;
  end: number;
}

export interface ChunkMeta {
  index: number;
  coreStart: number;
  coreEnd: number;
  wordCount: number;
  coverage: number;
  longestMissSec: number;
  model: string;
}

export interface Silence {
  start: number;
  end: number;
}

export interface AlignmentStats {
  anchored: number;
  interpolated: number;
  total: number;
  collisionsFixed: number;
  /** fitted offset between model time and physical waveform time */
  driftMs?: number;
  /** fitted stretch factor (model seconds → physical seconds) */
  scale?: number;
  medianResidualMs?: number;
  p90ResidualMs?: number;
  anchorRate?: number;
  maxCorrectionMs?: number;
  durationMedianMs?: number;
  /** % of word starts that land inside a detected silence (lower is better) */
  silenceLandingRate?: number;
}

export interface TranscriptDoc {
  version: number;
  generatedAt: string;
  audio: { filename: string; fingerprint: string | null; durationSec: number };
  settings: {
    chunkDurationSeconds: number;
    overlapSeconds: number;
    model: string;
    toleranceMs: number;
  };
  complete: boolean;
  simulated: boolean;
  chunks: ChunkMeta[];
  silences: Silence[];
  onsets: number[];
  words: Word[];
  sentences: Sentence[];
  alignment: AlignmentStats | null;
}

export interface StageState {
  stage: StageKey;
  startedAt: string;
  doneAt: string | null;
}

export interface JobSettings {
  chunkSec: number;
  overlapSec: number;
  model: string;
  toleranceMs: number;
  gapless: boolean;
}

export type JobStatus = "queued" | "working" | "completed" | "failed" | "canceled";

export type EventLevel = "info" | "stage" | "success" | "warn" | "error" | "api" | "model";

export interface EventRow {
  id: number;
  ts: string;
  stage: string;
  level: EventLevel;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
}

export interface ChunkRow {
  idx: number;
  coreStart: number;
  coreEnd: number;
  clipStart: number;
  clipEnd: number;
  status: string;
  wordCount: number;
  coverage: number | null;
  longestMissSec: number | null;
  attempts: number;
  model: string | null;
  keyIndex: number | null;
  error: string | null;
}

export interface KeyModelUsage {
  model: string;
  rpmUsed: number;
  rpmLimit: number;
  rpdUsed: number;
  rpdLimit: number;
  limited: boolean;
  /** ISO timestamp when the active 429 cooldown lifts (minute or daily) */
  limitedUntil?: string;
}

export interface KeyInfo {
  id: number | null;
  idx: number;
  label: string;
  masked: string;
  from: string;
  project: string;
  source: "env" | "local";
  models: KeyModelUsage[];
  disabledReason: string | null;
  lastUsedAt: string | null;
}

export interface JobSummary {
  id: string;
  filename: string;
  sizeBytes: number;
  durationSec: number | null;
  status: JobStatus;
  stage: string;
  progress: number;
  wordCount: number;
  sentenceCount: number;
  simulated: boolean;
  createdAt: string;
  completedAt: string | null;
  mediaUrl: string | null;
}

export interface JobDetail extends JobSummary {
  error: string | null;
  anchoredCount: number | null;
  alignedTotal: number | null;
  coverage: number | null;
  longestMissSec: number | null;
  fingerprint: string | null;
  settings: JobSettings | null;
  stageLog: StageState[] | null;
  onsets: number[] | null;
  silences: Silence[] | null;
  energy: { bins: number[]; peak: number } | null;
  transcript: TranscriptDoc | null;
  chunks: ChunkRow[];
  events: EventRow[];
}

export interface AppSettings {
  chunkSec: number;
  overlapSec: number;
  model: string;
  toleranceMs: number;
  allowSimulate: boolean;
  /** stretch word ends through pauses for motion graphics */
  gapless: boolean;
}

// Verified against GET /v1beta/models — the 2.5 series now returns 404 for new
// projects, so the pool targets the live 3.x lineup plus rolling aliases.
export const AVAILABLE_MODELS: { model: string; rpm: number; rpd: number }[] = [
  { model: "gemini-3.8-flash", rpm: 5, rpd: 20 },
  { model: "gemini-3.7-flash", rpm: 5, rpd: 20 },
  { model: "gemini-3.6-flash", rpm: 5, rpd: 20 },
  { model: "gemini-3.5-flash", rpm: 5, rpd: 20 },
  { model: "gemini-3.5-flash-lite", rpm: 15, rpd: 500 },
  { model: "gemini-3.1-flash-lite", rpm: 15, rpd: 500 },
  { model: "gemini-flash-latest", rpm: 10, rpd: 250 },
  { model: "gemini-flash-lite-latest", rpm: 15, rpd: 500 },
];

export function fmtClock(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return `${String(m).padStart(2, "0")}:${s.toFixed(3).padStart(6, "0")}`;
}

export function fmtSec(sec: number | null | undefined, digits = 2): string {
  if (sec == null || !Number.isFinite(sec)) return "—";
  return `${sec.toFixed(digits)}s`;
}

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
