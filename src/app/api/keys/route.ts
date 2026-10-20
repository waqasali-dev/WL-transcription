import { keyManager } from "@/lib/engine/keys";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const info = await keyManager.describe();
  return Response.json(info);
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Bulk import: { keys: "key1\nkey2,key3…" } or { keys: [{key,from,project}...] }
  // Each line may be `key` or `key, from email, GCP project`.
  const items: { key: string; from: string; project: string }[] = [];

  if (typeof body?.keys === "string" && body.keys.trim().length > 0) {
    const defFrom = String(body?.from || "").trim();
    const defProject = String(body?.project || "").trim();
    for (const line of body.keys.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const parts = trimmed.split(",").map((p: string) => p.trim());
      items.push({
        key: parts[0],
        from: parts[1] || defFrom,
        project: parts[2] || defProject,
      });
    }
  } else if (Array.isArray(body?.keys)) {
    for (const item of body.keys) {
      if (item && typeof item.key === "string") {
        items.push({
          key: item.key,
          from: typeof item.from === "string" ? item.from : "",
          project: typeof item.project === "string" ? item.project : "",
        });
      }
    }
  } else {
    // Single-key form
    const key = String(body?.key || "").trim();
    if (!key || key.length < 20) {
      return Response.json({ error: "API key looks too short — paste the full key" }, { status: 400 });
    }
    items.push({
      key,
      from: String(body?.from || "").trim(),
      project: String(body?.project || "").trim(),
    });
  }

  if (items.length === 0) {
    return Response.json({ error: "No keys found — paste at least one key" }, { status: 400 });
  }

  const result = await keyManager.addKeys(items);
  const info = await keyManager.describe();
  return Response.json({ ok: true, ...result, keys: info.keys });
}
