import { eq } from "drizzle-orm";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { createReadStream } from "node:fs";
import { statSync, existsSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const MIME: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".mp4": "video/mp4",
  ".ogg": "audio/ogg",
  ".flac": "audio/flac",
  ".aac": "audio/aac",
  ".webm": "audio/webm",
  ".aiff": "audio/x-aiff",
  ".aif": "audio/x-aiff",
};

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job || !job.mediaPath || !existsSync(job.mediaPath)) {
    return Response.json({ error: "Media not found" }, { status: 404 });
  }

  const stat = statSync(job.mediaPath);
  const total = stat.size;
  const range = req.headers.get("range");
  let start = 0;
  let end = total - 1;
  let status = 200;

  if (range) {
    const m = range.match(/bytes=(\d*)-(\d*)/);
    if (m) {
      if (m[1]) start = Math.min(parseInt(m[1], 10), total - 1);
      if (m[2]) end = Math.min(parseInt(m[2], 10), total - 1);
      if (start > end) start = 0;
      status = 206;
    }
  }

  const stream = createReadStream(job.mediaPath, { start, end });
  const headers: Record<string, string> = {
    "Content-Type": MIME[path.extname(job.mediaPath).toLowerCase()] || "application/octet-stream",
    "Accept-Ranges": "bytes",
    "Content-Length": String(end - start + 1),
    "Cache-Control": "no-store",
  };
  if (status === 206) headers["Content-Range"] = `bytes ${start}-${end}/${total}`;

  return new Response(Readable.toWeb(stream) as unknown as ReadableStream, { status, headers });
}
