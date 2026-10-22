import {
  pgTable,
  text,
  integer,
  real,
  boolean,
  jsonb,
  timestamp,
  bigserial,
  index,
} from "drizzle-orm/pg-core";
import type {
  JobSettings,
  Silence,
  StageKey,
  StageState,
  TranscriptDoc,
  VideoMeta,
} from "@/lib/types";

export const jobs = pgTable("jobs", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  sizeBytes: integer("size_bytes").notNull().default(0),
  mediaPath: text("media_path"),
  mediaUrl: text("media_url"),
  mediaKind: text("media_kind").notNull().default("audio"),
  videoMeta: jsonb("video_meta").$type<VideoMeta>(),
  durationSec: real("duration_sec"),
  fingerprint: text("fingerprint"),
  status: text("status").notNull().default("queued"),
  stage: text("stage").notNull().default("queued"),
  progress: real("progress").notNull().default(0),
  error: text("error"),
  simulated: boolean("simulated").notNull().default(false),
  wordCount: integer("word_count").notNull().default(0),
  sentenceCount: integer("sentence_count").notNull().default(0),
  coverage: real("coverage"),
  longestMissSec: real("longest_miss_sec"),
  anchoredCount: integer("anchored_count"),
  alignedTotal: integer("aligned_total"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  settings: jsonb("settings").$type<JobSettings>(),
  stageLog: jsonb("stage_log").$type<StageState[]>(),
  onsets: jsonb("onsets").$type<number[]>(),
  silences: jsonb("silences").$type<Silence[]>(),
  energy: jsonb("energy").$type<{ bins: number[]; peak: number }>(),
  transcript: jsonb("transcript").$type<TranscriptDoc>(),
});

export const chunks = pgTable(
  "chunks",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    idx: integer("idx").notNull(),
    coreStart: real("core_start").notNull(),
    coreEnd: real("core_end").notNull(),
    clipStart: real("clip_start").notNull(),
    clipEnd: real("clip_end").notNull(),
    status: text("status").notNull().default("pending"),
    wordCount: integer("word_count").notNull().default(0),
    coverage: real("coverage"),
    longestMissSec: real("longest_miss_sec"),
    attempts: integer("attempts").notNull().default(0),
    model: text("model"),
    keyIndex: integer("key_index"),
    error: text("error"),
  },
  (t) => [index("chunks_job_idx").on(t.jobId)]
);

export const events = pgTable(
  "events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
    stage: text("stage").notNull().default("info"),
    level: text("level").notNull().default("info"),
    title: text("title").notNull().default(""),
    message: text("message").notNull().default(""),
    data: jsonb("data"),
  },
  (t) => [index("events_job_idx").on(t.jobId)]
);

export const geminiKeys = pgTable("gemini_keys", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  idx: integer("idx").notNull().default(1),
  keyHash: text("key_hash").notNull().unique(),
  secret: text("secret").notNull(),
  from: text("from").notNull().default(""),
  project: text("project").notNull().default(""),
  source: text("source").notNull().default("local"),
  rpdUsed: integer("rpd_used").notNull().default(0),
  rpdWindowStart: text("rpd_window_start"),
  disabledReason: text("disabled_reason"),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const appSettings = pgTable("app_settings", {
  id: integer("id").primaryKey().default(1),
  chunkSec: integer("chunk_sec").notNull().default(30),
  overlapSec: integer("overlap_sec").notNull().default(2),
  model: text("model").notNull().default("auto"),
  toleranceMs: integer("tolerance_ms").notNull().default(350),
  allowSimulate: boolean("allow_simulate").notNull().default(true),
});

export type { StageKey };
