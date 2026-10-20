import { keyManager } from "@/lib/engine/keys";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  await keyManager.resetQuotas();
  const info = await keyManager.describe();
  return Response.json({ ok: true, keys: info.keys });
}
