import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { appSettings, jobs } from "@/db/schema";
import { queueJob, queueSnapshot } from "@/lib/engine/runner";
import { keyManager } from "@/lib/engine/keys";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_EXT = new Set([".mp3", ".wav", ".m4a", ".mp4", ".ogg", ".flac", ".aac", ".webm", ".aiff", ".aif"]);
const MAX_BYTES = 250 * 1024 * 1024;

function toSummary(row: typeof jobs.$inferSelect) {
  return {
    id: row.id,
    filename: row.filename,
    sizeBytes: row.sizeBytes,
    durationSec: row.durationSec,
    status: row.status,
    stage: row.stage,
    progress: row.progress,
    wordCount: row.wordCount,
    sentenceCount: row.sentenceCount,
    simulated: row.simulated,
    createdAt: row.createdAt,
    completedAt: row.completedAt,
    mediaUrl: row.mediaUrl,
  };
}

export async function GET() {
  const rows = await db.select().from(jobs).orderBy(desc(jobs.createdAt)).limit(30);
  const snap = queueSnapshot();
  const [keyRows] = await Promise.all([keyManager.load().then(() => keyManager.count())]);
  return Response.json({ jobs: rows.map(toSummary), queue: snap, keyCount: keyRows });
}

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") {
    return Response.json({ error: "No audio file uploaded" }, { status: 400 });
  }
  const name = (file as File).name || "audio";
  const ext = path.extname(name).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return Response.json(
      { error: `Unsupported format "${ext || "?"}. Allowed: ${[...ALLOWED_EXT].join(" ")}` },
      { status: 400 }
    );
  }
  const buf = Buffer.from(await (file as File).arrayBuffer());
  if (buf.length < 1024) {
    return Response.json({ error: "File is too small to be valid audio" }, { status: 400 });
  }
  if (buf.length > MAX_BYTES) {
    return Response.json({ error: "File exceeds the 250 MB limit" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const mediaName = `${id}${ext}`;
  const mediaPath = path.join(process.cwd(), "public", "uploads", mediaName);
  fs.mkdirSync(path.dirname(mediaPath), { recursive: true });
  fs.writeFileSync(mediaPath, buf);

  const [settings] = await db.select().from(appSettings).where(eq(appSettings.id, 1)).limit(1);
  const jobSettings = {
    chunkSec: settings?.chunkSec ?? 30,
    overlapSec: settings?.overlapSec ?? 2,
    model: settings?.model ?? "auto",
    toleranceMs: settings?.toleranceMs ?? 350,
    gapless: settings?.gapless ?? false,
  };

  const row = await db
    .insert(jobs)
    .values({
      id,
      filename: name,
      sizeBytes: buf.length,
      mediaPath,
      mediaUrl: `/api/jobs/${id}/media`,
      status: "queued",
      stage: "queued",
      progress: 0,
      settings: jobSettings,
    })
    .returning();

  queueJob(id, jobSettings, settings?.allowSimulate ?? true);
  return Response.json({ id: row[0].id }, { status: 201 });
}
