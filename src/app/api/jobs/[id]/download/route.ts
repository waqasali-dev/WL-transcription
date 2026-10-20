import { eq } from "drizzle-orm";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) return Response.json({ error: "Job not found" }, { status: 404 });

  const filePath = path.join(process.cwd(), ".data", "output", id, "transcript_data.json");
  if (job.transcript && fs.existsSync(filePath)) {
    const buf = fs.readFileSync(filePath);
    const safe = (job.filename || "audio").replace(/[^\w.-]+/g, "_");
    return new Response(buf, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${safe}.transcript_data.json"`,
      },
    });
  }
  if (job.transcript) {
    return new Response(JSON.stringify(job.transcript, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="transcript_data.json"`,
      },
    });
  }
  return Response.json({ error: "Transcript not ready yet" }, { status: 409 });
}
