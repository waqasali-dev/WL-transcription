import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { DEFAULT_MODELS, type ModelConfig } from "@/lib/types";
import { keyManager } from "@/lib/engine/keys";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

let columnMigrated = false;
async function ensureColumn() {
  if (columnMigrated) return;
  try {
    await db.execute(sql`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS models text;`);
    columnMigrated = true;
  } catch {
    /* ignore */
  }
}

function parseModels(raw?: string | null): ModelConfig[] {
  if (!raw) return DEFAULT_MODELS;
  try {
    const list = JSON.parse(raw);
    if (Array.isArray(list) && list.length > 0) {
      return list;
    }
  } catch {
    /* fallback */
  }
  return DEFAULT_MODELS;
}

async function ensureRow() {
  await ensureColumn();
  const rows = await db.select().from(appSettings).limit(1);
  if (rows.length > 0) return rows[0];
  const inserted = await db
    .insert(appSettings)
    .values({ id: 1, models: JSON.stringify(DEFAULT_MODELS) })
    .returning();
  return inserted[0];
}

export async function GET() {
  const row = await ensureRow();
  const models = parseModels(row.models);
  keyManager.setModels(models);
  return Response.json({
    chunkSec: row.chunkSec,
    overlapSec: row.overlapSec,
    model: row.model,
    toleranceMs: row.toleranceMs,
    allowSimulate: row.allowSimulate,
    models,
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

  let modelsJson = row.models;
  let updatedModels: ModelConfig[] = parseModels(row.models);

  if (Array.isArray(body?.models)) {
    const seenNames = new Set<string>();
    const seenPriorities = new Set<number>();
    const sanitized: ModelConfig[] = [];

    for (const item of body.models) {
      const name = String(item?.model || "").trim();
      if (!name || seenNames.has(name)) continue;
      seenNames.add(name);

      const rpm = Math.max(1, Math.min(10000, Number(item.rpm) || 15));
      const rpd = Math.max(1, Math.min(100000, Number(item.rpd) || 100));

      let priority: number | null = null;
      if (typeof item.priority === "number" && item.priority > 0) {
        const p = Math.round(item.priority);
        if (!seenPriorities.has(p)) {
          priority = p;
          seenPriorities.add(p);
        }
      }

      sanitized.push({ model: name, rpm, rpd, priority });
    }

    if (sanitized.length > 0) {
      updatedModels = sanitized;
      modelsJson = JSON.stringify(sanitized);
    }
  }

  await db
    .update(appSettings)
    .set({
      chunkSec: clamp(body?.chunkSec, 10, 60, 30),
      overlapSec: clamp(body?.overlapSec, 0, 5, 2),
      toleranceMs: clamp(body?.toleranceMs, 150, 600, 350),
      model: typeof body?.model === "string" ? body.model : row.model,
      allowSimulate: typeof body?.allowSimulate === "boolean" ? body.allowSimulate : row.allowSimulate,
      models: modelsJson,
    })
    .where(eq(appSettings.id, 1));

  keyManager.setModels(updatedModels);

  const [fresh] = await db.select().from(appSettings).where(eq(appSettings.id, 1));
  return Response.json({
    chunkSec: fresh.chunkSec,
    overlapSec: fresh.overlapSec,
    model: fresh.model,
    toleranceMs: fresh.toleranceMs,
    allowSimulate: fresh.allowSimulate,
    models: parseModels(fresh.models),
  });
}
