export type StageKey =
  | "discovery"
  | "analysis"
  | "onsets"
  | "chunking"
  | "transcription"
  | "alignment"
  | "video"
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
    blurb: "Verbatim text · multi-key rotation · acoustic coverage gate",
  },
  {
    key: "alignment",
    label: "Acoustic Forced Alignment",
    blurb: "wav2vec2 CTC Viterbi · letter-level timing · waveform edge refinement",
  },
  {
    key: "video",
    label: "Synchronized Video Analysis",
    blurb: "30 s sections · 5 s observations · 1 s visual context overlap",
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
  /** acoustic start of the first letter (seconds) */
  start: number;
  /** gapless visual end = next word's start */
  end: number;
  pauseAfterMs: number;
  /** when the voice actually stopped (energy decay), before gapless bridging */
  spokenEnd?: number;
  /** mean acoustic-model posterior of the word's letters (0–1) */
  confidence?: number;
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
  method?: "ctc-forced" | "onset-dp";
  avgConfidence?: number;
  lowConfidence?: number;
  refined?: number;
}

export interface VideoMeta {
  width: number;
  height: number;
  fps: number;
  codec: string;
  hasAudio: boolean;
}

export interface VideoEventMarker {
  /** Global timestamp in seconds (snapped to FFmpeg physical frame cuts when within tolerance) */
  time: number;
  /** What visibly happened at this moment (cut, gesture, graphic, UI change, camera move) */
  what: string;
  /** Exact acoustically-aligned word being spoken at `time`, if speech is active */
  syncedWord?: string;
}

export interface VideoObservation {
  index: number;
  sectionIndex: number;
  start: number;
  end: number;
  /** Inspected clip window with 1 s overlap padding around the 5 s core */
  contextStart: number;
  contextEnd: number;
  description: string;
  actions: string[];
  subjects: string[];
  visibleText: string[];
  shot: string;
  audioRelation: string;
  speech: string;
  combinedText: string;
  confidence: number;
  /** Exact FFmpeg pixel-detected scene cut timestamps within [start, end] */
  sceneCuts?: number[];
  /** Timestamped visual events inside this 5 s window, synced to exact spoken words */
  events?: VideoEventMarker[];
}

export interface VideoSection {
  index: number;
  start: number;
  end: number;
  clipStart: number;
  clipEnd: number;
  model: string;
  keyIndex: number | null;
  /** Cohesive audiovisual narrative summarizing this 30 s section */
  summary?: string;
  observations: VideoObservation[];
}

export interface VideoTranscript {
  complete: boolean;
  simulated?: boolean;
  sectionDurationSeconds: 30;
  observationDurationSeconds: 5;
  overlapSeconds: 1;
  meta: VideoMeta;
  /** Frame-accurate scene cuts across the full video measured via FFmpeg */
  sceneCuts?: number[];
  sections: VideoSection[];
  observations: VideoObservation[];
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
  video?: VideoTranscript;
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
  mediaKind: "audio" | "video";
  videoMeta: VideoMeta | null;
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

export interface ModelConfig {
  model: string;
  rpm: number;
  rpd: number;
  priority: number | null; // 1-based priority index, or null for unset
}

export const DEFAULT_MODELS: ModelConfig[] = [
  { model: "gemini-3.6-flash", rpm: 5, rpd: 20, priority: 1 },
  { model: "gemini-3.5-flash", rpm: 5, rpd: 20, priority: 2 },
  { model: "gemini-3.5-flash-lite", rpm: 15, rpd: 500, priority: 3 },
  { model: "gemini-3.1-flash-lite", rpm: 15, rpd: 500, priority: 4 },
  { model: "gemini-2.5-flash", rpm: 10, rpd: 100, priority: null },
  { model: "gemini-2.5-flash-lite", rpm: 15, rpd: 500, priority: null },
];

export const AVAILABLE_MODELS: { model: string; rpm: number; rpd: number }[] = DEFAULT_MODELS.map(
  ({ model, rpm, rpd }) => ({ model, rpm, rpd })
);

export interface AppSettings {
  chunkSec: number;
  overlapSec: number;
  model: string;
  toleranceMs: number;
  allowSimulate: boolean;
  models: ModelConfig[];
}

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
