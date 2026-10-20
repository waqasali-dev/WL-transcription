import { keyManager } from "@/lib/engine/keys";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const dbId = parseInt(id, 10);
  if (!Number.isFinite(dbId)) return Response.json({ error: "Invalid key id" }, { status: 400 });
  await keyManager.removeKey(dbId);
  const info = await keyManager.describe();
  return Response.json({ ok: true, keys: info.keys });
}
