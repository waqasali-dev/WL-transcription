import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chunks, events, jobs } from "@/db/schema";
import { assembleSentences } from "@/lib/engine/align";
import { refreshVideoSpeech } from "@/lib/engine/video";
import { cancelJob, OUT_DIR, patchJob, writeJsonAtomic } from "@/lib/engine/runner";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) return Response.json({ error: "Job not found" }, { status: 404 });

  const url = new URL(req.url);
  const since = Math.max(0, parseInt(url.searchParams.get("since") || "0", 10));
  const lite = url.searchParams.get("lite") === "1";

  const [chunkRows, eventRows] = await Promise.all([
    db.select().from(chunks).where(eq(chunks.jobId, id)).orderBy(asc(chunks.idx)),
    db.select().from(events).where(eq(events.jobId, id)).orderBy(asc(events.id)).limit(800),
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
    mediaKind: job.mediaKind as "audio" | "video",
    videoMeta: job.videoMeta,
    error: job.error,
    anchoredCount: job.anchoredCount,
    alignedTotal: job.alignedTotal,
    coverage: job.coverage,
    longestMissSec: job.longestMissSec,
    fingerprint: job.fingerprint,
    settings: job.settings,
    stageLog: job.stageLog,
    onsets: lite ? undefined : job.onsets,
    silences: lite ? undefined : job.silences,
    energy: lite ? undefined : job.energy,
    transcript: job.transcript,
    chunks: chunkRows,
    events: filtered,
  });
}

/**
 * Inline Studio Editor endpoint:
 * - { filename }: renames the job cleanly
 * - { wordIndex, word }: edits or deletes (when "") a spoken word while preserving
 *   exact acoustic timestamps, re-assembles deterministic sentences, re-syncs video
 *   slot speech + syncedWord markers, and writes atomically to disk + DB.
 * - { observationIndex, description, audioRelation }: edits a 5-second visual observation.
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) return Response.json({ error: "Job not found" }, { status: 404 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof body?.filename === "string" && body.filename.trim()) {
    updates.filename = body.filename.trim();
  }

  if (job.transcript && (typeof body?.wordIndex === "number" || typeof body?.observationIndex === "number")) {
    let doc = structuredClone(job.transcript);

    if (typeof body.wordIndex === "number" && body.wordIndex >= 0 && body.wordIndex < doc.words.length) {
      const nextText = String(body.word ?? "").trim();
      if (!nextText) {
        doc.words.splice(body.wordIndex, 1);
      } else {
        doc.words[body.wordIndex] = { ...doc.words[body.wordIndex], word: nextText };
      }
      doc.sentences = assembleSentences(doc.words);
      if (doc.video) {
        doc.video = refreshVideoSpeech(doc.video, doc.words);
      }
      updates.wordCount = doc.words.length;
      updates.sentenceCount = doc.sentences.length;
    }

    if (doc.video && typeof body.observationIndex === "number") {
      const obsIdx: number = body.observationIndex;
      for (const sec of doc.video.sections) {
        for (const o of sec.observations) {
          if (o.index === obsIdx) {
            if (typeof body.description === "string" && body.description.trim()) {
              o.description = body.description.trim();
              o.combinedText = o.speech ? `${o.description} Spoken: “${o.speech}”` : o.description;
            }
            if (typeof body.audioRelation === "string") {
              o.audioRelation = body.audioRelation.trim();
            }
          }
        }
      }
      doc.video.observations = doc.video.sections.flatMap((s) => s.observations);
    }

    if (updates.filename) {
      doc.audio.filename = updates.filename as string;
    }
    doc.generatedAt = new Date().toISOString();
    writeJsonAtomic(path.join(OUT_DIR(id), "transcript_data.json"), doc);
    updates.transcript = doc;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  await patchJob(id, updates);
  const [fresh] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return Response.json({ ok: true, transcript: fresh?.transcript, filename: fresh?.filename });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) return Response.json({ error: "Job not found" }, { status: 404 });

  if (job.status === "working" || job.status === "queued") {
    await cancelJob(id);
  }

  if (job.mediaPath) {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const base = path.basename(job.mediaPath);
    for (const name of [base, `${base}.web.mp4`, `${base}.web.mp3`]) {
      const candidate = path.join(uploadsDir, name);
      if (fs.existsSync(candidate)) {
        try {
          fs.unlinkSync(candidate);
        } catch {
          /* ignore */
        }
      }
    }
  }
  try {
    fs.rmSync(path.join(process.cwd(), ".data", "output", id), { recursive: true, force: true });
    fs.rmSync(path.join(process.cwd(), ".data", "tmp", id), { recursive: true, force: true });
  } catch {
    /* ignore */
  }

  await db.delete(events).where(eq(events.jobId, id));
  await db.delete(chunks).where(eq(chunks.jobId, id));
  await db.delete(jobs).where(eq(jobs.id, id));
  return Response.json({ ok: true });
}
