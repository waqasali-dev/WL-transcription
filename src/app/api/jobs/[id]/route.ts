import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chunks, events, jobs } from "@/db/schema";
import { cancelJob } from "@/lib/engine/runner";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) return Response.json({ error: "Job not found" }, { status: 404 });

  const url = new URL(_req.url);
  const since = Math.max(0, parseInt(url.searchParams.get("since") || "0", 10));

  const [chunkRows, eventRows] = await Promise.all([
    db.select().from(chunks).where(eq(chunks.jobId, id)).orderBy(asc(chunks.idx)),
    db.select().from(events).where(eq(events.jobId, id)).orderBy(asc(events.id)).limit(500),
  ]);

  const filtered = since > 0 ? eventRows.filter((e) => e.id > since) : eventRows;

  return Response.json({
    id: job.id,
    filename: job.filename,
    sizeBytes: job.sizeBytes,
    durationSec: job.durationSec,
    status: job.status,
    stage: job.stage,
    progress: job.progress,
    wordCount: job.wordCount,
    sentenceCount: job.sentenceCount,
    simulated: job.simulated,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    mediaUrl: job.mediaUrl,
    error: job.error,
    anchoredCount: job.anchoredCount,
    alignedTotal: job.alignedTotal,
    coverage: job.coverage,
    longestMissSec: job.longestMissSec,
    fingerprint: job.fingerprint,
    settings: job.settings,
    stageLog: job.stageLog,
    onsets: job.onsets,
    silences: job.silences,
    energy: job.energy,
    transcript: job.transcript,
    chunks: chunkRows,
    events: filtered,
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) return Response.json({ error: "Job not found" }, { status: 404 });

  const active = job.status === "working" || job.status === "queued";
  if (active) cancelJob(id);

  if (job.mediaPath && fs.existsSync(job.mediaPath)) {
    try {
      fs.unlinkSync(job.mediaPath);
    } catch {
      /* ignore */
    }
  }
  const outDir = path.join(process.cwd(), ".data", "output", id);
  try {
    fs.rmSync(outDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }

  await db.delete(events).where(eq(events.jobId, id));
  await db.delete(chunks).where(eq(chunks.jobId, id));
  await db.delete(jobs).where(eq(jobs.id, id));
  return Response.json({ ok: true });
}
