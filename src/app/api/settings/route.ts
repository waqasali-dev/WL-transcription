import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appSettings } from "@/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function ensureRow() {
  const rows = await db.select().from(appSettings).limit(1);
  if (rows.length > 0) return rows[0];
  const inserted = await db.insert(appSettings).values({ id: 1 }).returning();
  return inserted[0];
}

export async function GET() {
  const row = await ensureRow();
  return Response.json({
    chunkSec: row.chunkSec,
    overlapSec: row.overlapSec,
    model: row.model,
    toleranceMs: row.toleranceMs,
    allowSimulate: row.allowSimulate,
  });
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const row = await ensureRow();
  const clamp = (n: unknown, lo: number, hi: number, d: number) => {
    const v = typeof n === "number" && Number.isFinite(n) ? n : d;
    return Math.min(hi, Math.max(lo, Math.round(v)));
  };
  await db
    .update(appSettings)
    .set({
      chunkSec: clamp(body?.chunkSec, 10, 60, 30),
      overlapSec: clamp(body?.overlapSec, 0, 5, 2),
      toleranceMs: clamp(body?.toleranceMs, 150, 600, 350),
      model: typeof body?.model === "string" ? body.model : row.model,
      allowSimulate: typeof body?.allowSimulate === "boolean" ? body.allowSimulate : row.allowSimulate,
    })
    .where(eq(appSettings.id, 1));
  const [fresh] = await db.select().from(appSettings).where(eq(appSettings.id, 1));
  return Response.json({
    chunkSec: fresh.chunkSec,
    overlapSec: fresh.overlapSec,
    model: fresh.model,
    toleranceMs: fresh.toleranceMs,
    allowSimulate: fresh.allowSimulate,
  });
}
