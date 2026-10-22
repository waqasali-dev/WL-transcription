import { eq, and, ne } from "drizzle-orm";
import { db } from "@/db";
import { chunks, events, jobs } from "@/db/schema";
import { queueRetryFailed } from "@/lib/engine/runner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Retry only the chunks that failed or produced no words, keeping every
 * successful chunk's cached result. Fixes the gap where one bad chunk left a
 * permanent hole in an otherwise complete transcript.
 */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) return Response.json({ error: "Job not found" }, { status: 404 });
  if (job.status === "working" || job.status === "queued") {
    return Response.json({ error: "Job is already running" }, { status: 409 });
  }
  if (!job.mediaPath) return Response.json({ error: "Media file missing" }, { status: 409 });

  const rows = await db.select().from(chunks).where(eq(chunks.jobId, id));
  const bad = rows.filter((c) => c.status !== "done" || c.wordCount === 0);

  // Nothing cached yet → this is effectively a full re-run
  await db.delete(chunks).where(and(eq(chunks.jobId, id), ne(chunks.status, "done")));
  if (job.transcript) {
    const kept = job.transcript.chunks.filter((m) => {
      const row = rows.find((r) => r.idx === m.index);
      return row ? row.status === "done" && row.wordCount > 0 : m.wordCount > 0;
    });
    const keptWords = job.transcript.words.filter((w) =>
      kept.some((k) => w.start >= k.coreStart - 0.05 && w.start < k.coreEnd + 0.05)
    );
    await db
      .update(jobs)
      .set({
        transcript: { ...job.transcript, chunks: kept, words: keptWords, complete: false },
        wordCount: keptWords.length,
        status: "queued",
        stage: "transcription",
        progress: 0.25,
        error: null,
      })
      .where(eq(jobs.id, id));
  } else {
    await db
      .update(jobs)
      .set({ status: "queued", stage: "transcription", progress: 0.2, error: null })
      .where(eq(jobs.id, id));
  }

  await db.insert(events).values({
    jobId: id,
    stage: "transcription",
    level: "stage",
    title: "Retry queued",
    message: bad.length
      ? "Retrying " + bad.length + " failed chunk" + (bad.length === 1 ? "" : "s") + " (" + bad.map((b) => "#" + b.idx).join(", ") + ") — successful chunks stay cached"
      : "No failed chunks found — resuming from cache",
  });

  queueRetryFailed(id);
  return Response.json({ ok: true, retrying: bad.length });
}
