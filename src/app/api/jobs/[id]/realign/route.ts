import { eq } from "drizzle-orm";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { queueRealign } from "@/lib/engine/runner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) return Response.json({ error: "Job not found" }, { status: 404 });
  if (job.status === "working" || job.status === "queued") {
    return Response.json({ error: "Job is already running" }, { status: 409 });
  }
  if (!job.transcript?.words?.length) {
    return Response.json({ error: "No transcript to re-align — run a full transcription first" }, { status: 409 });
  }
  await db.update(jobs).set({ status: "queued", stage: "alignment", error: null }).where(eq(jobs.id, id));
  queueRealign(id);
  return Response.json({ ok: true });
}
