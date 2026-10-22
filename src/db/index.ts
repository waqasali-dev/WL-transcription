import path from "node:path";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

export type AppDb = ReturnType<typeof drizzlePglite>;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __transcriptorPgliteClient?: PGlite;
  __transcriptorDb?: AppDb;
};

function initDb(): AppDb {

  if (globalForDb.__transcriptorDb) {
    return globalForDb.__transcriptorDb;
  }

  if (databaseUrl && !databaseUrl.startsWith("pglite://")) {
    const pool =
      globalForDb.__arenaNextJsPostgresqlPool ??
      new Pool({
        connectionString: databaseUrl,
      });

    if (process.env.NODE_ENV !== "production") {
      globalForDb.__arenaNextJsPostgresqlPool = pool;
    }

    const instance = drizzlePg(pool) as unknown as AppDb;
    globalForDb.__transcriptorDb = instance;
    return instance;

  }

  // Fallback to embedded PGlite for zero-configuration local persistence
  const dataDir = path.join(process.cwd(), ".data", "pgdata");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const client =
    globalForDb.__transcriptorPgliteClient ??
    new PGlite(dataDir);

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__transcriptorPgliteClient = client;
  }

  // Ensure tables and default settings row exist
  void client
    .exec(
      `
    CREATE TABLE IF NOT EXISTS jobs (
      id text PRIMARY KEY,
      filename text NOT NULL,
      size_bytes integer NOT NULL DEFAULT 0,
      media_path text,
      media_url text,
      media_kind text NOT NULL DEFAULT 'audio',
      video_meta jsonb,
      duration_sec real,
      fingerprint text,
      status text NOT NULL DEFAULT 'queued',
      stage text NOT NULL DEFAULT 'queued',
      progress real NOT NULL DEFAULT 0,
      error text,
      simulated boolean NOT NULL DEFAULT false,
      word_count integer NOT NULL DEFAULT 0,
      sentence_count integer NOT NULL DEFAULT 0,
      coverage real,
      longest_miss_sec real,
      anchored_count integer,
      aligned_total integer,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      started_at timestamp with time zone,
      completed_at timestamp with time zone,
      settings jsonb,
      stage_log jsonb,
      onsets jsonb,
      silences jsonb,
      energy jsonb,
      transcript jsonb
    );

    CREATE TABLE IF NOT EXISTS chunks (
      id bigserial PRIMARY KEY,
      job_id text NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      idx integer NOT NULL,
      core_start real NOT NULL,
      core_end real NOT NULL,
      clip_start real NOT NULL,
      clip_end real NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      word_count integer NOT NULL DEFAULT 0,
      coverage real,
      longest_miss_sec real,
      attempts integer NOT NULL DEFAULT 0,
      model text,
      key_index integer,
      error text
    );

    CREATE TABLE IF NOT EXISTS events (
      id bigserial PRIMARY KEY,
      job_id text NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      ts timestamp with time zone NOT NULL DEFAULT now(),
      stage text NOT NULL DEFAULT 'info',
      level text NOT NULL DEFAULT 'info',
      title text NOT NULL DEFAULT '',
      message text NOT NULL DEFAULT '',
      data jsonb
    );

    CREATE TABLE IF NOT EXISTS gemini_keys (
      id bigserial PRIMARY KEY,
      idx integer NOT NULL DEFAULT 1,
      key_hash text NOT NULL UNIQUE,
      secret text NOT NULL,
      "from" text NOT NULL DEFAULT '',
      project text NOT NULL DEFAULT '',
      source text NOT NULL DEFAULT 'local',
      rpd_used integer NOT NULL DEFAULT 0,
      rpd_window_start text,
      disabled_reason text,
      last_used_at timestamp with time zone,
      created_at timestamp with time zone NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      id integer PRIMARY KEY DEFAULT 1,
      chunk_sec integer NOT NULL DEFAULT 30,
      overlap_sec integer NOT NULL DEFAULT 2,
      model text NOT NULL DEFAULT 'auto',
      tolerance_ms integer NOT NULL DEFAULT 350,
      allow_simulate boolean NOT NULL DEFAULT true,
      models text
    );

    ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS models text;

    INSERT INTO app_settings (id, chunk_sec, overlap_sec, model, tolerance_ms, allow_simulate)
    VALUES (1, 30, 2, 'auto', 350, true)
    ON CONFLICT (id) DO NOTHING;
  `
    )
    .catch((err) => {
      console.error("[db] PGlite table init error:", err);
    });

  const instance = drizzlePglite(client);
  globalForDb.__transcriptorDb = instance;
  return instance;
}

export const db = initDb();
export const pool = globalForDb.__arenaNextJsPostgresqlPool;
