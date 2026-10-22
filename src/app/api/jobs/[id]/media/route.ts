import { eq } from "drizzle-orm";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { createReadStream, existsSync, statSync } from "node:fs";
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
  ".m4v": "video/mp4",
  ".mov": "video/quicktime",
  ".mkv": "video/x-matroska",
  ".avi": "video/x-msvideo",
  ".ogg": "audio/ogg",
  ".opus": "audio/ogg",
  ".flac": "audio/flac",
  ".aac": "audio/aac",
  ".webm": "video/webm",
  ".aiff": "audio/x-aiff",
  ".aif": "audio/x-aiff",
};

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job || !job.mediaPath) {
    return Response.json({ error: "Media not found" }, { status: 404 });
  }

  // Prefer web-compatible proxy when generated (.mkv, HEVC .mov, .avi, .aiff)
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const base = path.basename(job.mediaPath);
  const rawPath = path.join(uploadsDir, base);
  const webMp4 = path.join(uploadsDir, `${base}.web.mp4`);
  const webMp3 = path.join(uploadsDir, `${base}.web.mp3`);
  const targetPath = existsSync(webMp4) ? webMp4 : existsSync(webMp3) ? webMp3 : rawPath;
  if (!existsSync(targetPath)) {
    return Response.json({ error: "Media file missing on disk" }, { status: 404 });
  }

  const stat = statSync(targetPath);
  const total = stat.size;
  const range = req.headers.get("range");
  let start = 0;
  let end = Math.max(0, total - 1);
  let status = 200;

  if (range) {
    const m = range.match(/bytes=(\d*)-(\d*)/);
    if (m) {
      if (m[1]) start = Math.min(parseInt(m[1], 10), end);
      if (m[2]) end = Math.min(parseInt(m[2], 10), total - 1);
      if (start > end) start = 0;
      status = 206;
    }
  }

  const stream = createReadStream(targetPath, { start, end });
  const headers: Record<string, string> = {
    "Content-Type": MIME[path.extname(targetPath).toLowerCase()] || "application/octet-stream",
    "Accept-Ranges": "bytes",
    "Content-Length": String(end - start + 1),
    "Cache-Control": "no-store",
  };
  if (status === 206) headers["Content-Range"] = `bytes ${start}-${end}/${total}`;

  return new Response(Readable.toWeb(stream) as unknown as ReadableStream, { status, headers });
}
