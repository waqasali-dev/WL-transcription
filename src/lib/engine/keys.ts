import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { geminiKeys } from "@/db/schema";
import { AVAILABLE_MODELS, type KeyInfo, type KeyModelUsage } from "@/lib/types";

export const RPD_RESET_HOUR_LOCAL = 13; // daily window resets at 1:00 PM local

export interface KeySlot {
  idx: number;
  apiKey: string;
  keyId: string;
  from: string;
  project: string;
  source: "env" | "local";
  dbId: number | null;
  model: string;
}

interface ModelState {
  rpmLog: number[]; // timestamps of requests in the last 60s
  rpdUsed: number;
  rpdWindowStart: string;
  minuteUntil: number; // 429-minute cooldown expiry (ms)
  dailyUntil: number; // 429-daily cooldown expiry (ms)
}

interface KeyState {
  idx: number;
  apiKey: string;
  keyId: string;
  from: string;
  project: string;
  source: "env" | "local";
  dbId: number | null;
  disabledReason: string | null;
  lastUsedAt: number | null;
  models: Map<string, ModelState>;
}

export function rpdWindowStart(now = new Date()): Date {
  const d = new Date(now);
  d.setHours(RPD_RESET_HOUR_LOCAL, 0, 0, 0);
  if (now.getTime() < d.getTime()) d.setDate(d.getDate() - 1);
  return d;
}

function keyIdFor(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex").slice(0, 16);
}

function modelState(k: KeyState, model: string, now = new Date()): ModelState {
  let m = k.models.get(model);
  const win = rpdWindowStart(now).toISOString();
  if (!m || m.rpdWindowStart !== win) {
    m = { rpmLog: [], rpdUsed: 0, rpdWindowStart: win, minuteUntil: 0, dailyUntil: 0 };
    k.models.set(model, m);
  }
  return m;
}

class KeyManager {
  keys: KeyState[] = [];
  private lastLoad = 0;

  /** Discover env keys (api1..N, GEMINI_API_KEY, GEMINI_API_KEY_N) + DB keys */
  async load(force = false): Promise<void> {
    const now = Date.now();
    if (!force && now - this.lastLoad < 10_000 && this.keys.length) return;
    this.lastLoad = now;

    const envData: Record<string, string> = { ...process.env } as Record<string, string>;
    const indexes = new Set<number>();
    for (const name of Object.keys(envData)) {
      const m = name.match(/^api(\d+)$/i) || name.match(/^GEMINI_API_KEY_(\d+)$/i);
      if (m) indexes.add(parseInt(m[1], 10));
    }
    if ((envData["GEMINI_API_KEY"] || "").trim()) indexes.add(0);

    const envKeys: KeyState[] = [];
    for (const i of [...indexes].sort((a, b) => a - b)) {
      const raw = (i === 0 ? envData["GEMINI_API_KEY"] : envData[`api${i}`] || envData[`API${i}`] || envData[`GEMINI_API_KEY_${i}`] || "").trim();
      if (!raw) continue;
      envKeys.push({
        idx: i,
        apiKey: raw,
        keyId: keyIdFor(raw),
        from: (i === 0 ? "" : envData[`from${i}`] || envData[`FROM${i}`] || "").trim() || `account_${i}`,
        project: (i === 0 ? "" : envData[`project${i}`] || envData[`PROJECT${i}`] || envData[`GEMINI_PROJECT_${i}`] || "").trim() || `project_${i}`,
        source: "env",
        dbId: null,
        disabledReason: null,
        lastUsedAt: null,
        models: new Map(),
      });
    }

    const dbKeys = await db.select().from(geminiKeys);
    const dbMap = new Map(dbKeys.map((k) => [k.keyHash, k]));
    const localKeys: KeyState[] = dbKeys.map((k) => ({
      idx: k.idx,
      apiKey: k.secret,
      keyId: k.keyHash.slice(0, 16),
      from: k.from || `account_${k.idx}`,
      project: k.project || `project_${k.idx}`,
      source: "local" as const,
      dbId: k.id,
      disabledReason: k.disabledReason,
      lastUsedAt: k.lastUsedAt ? k.lastUsedAt.getTime() : null,
      models: new Map(),
    }));

    // merge: env first, then local (dedupe by key hash)
    const seen = new Set<string>();
    const merged: KeyState[] = [];
    for (const k of [...envKeys, ...localKeys]) {
      if (seen.has(k.keyId)) continue;
      seen.add(k.keyId);
      merged.push(k);
    }
    merged.sort((a, b) => a.idx - b.idx);
    this.keys = merged;
  }

  count(): number {
    return this.keys.length;
  }

  /** Atomic slot reservation — claims RPM+RPD before dispatch */
  pickAndReserve(opts: { preferredModel?: string; now?: number } = {}): { slot: KeySlot; usage: KeyModelUsage } | null {
    const now = opts.now ?? Date.now();
    const pool = this.modelPool(opts.preferredModel);
    for (const key of this.keys) {
      if (key.disabledReason) continue;
      for (const { model, rpm, rpd } of pool) {
        const ms = modelState(key, model);
        ms.rpmLog = ms.rpmLog.filter((t) => now - t < 60_000);
        if (ms.rpmLog.length >= rpm) continue;
        if (ms.rpdUsed >= rpd) continue;
        if (ms.minuteUntil > now || ms.dailyUntil > now) continue;
        // reserve
        ms.rpmLog.push(now);
        ms.rpdUsed += 1;
        key.lastUsedAt = now;
        void this.persist(key);
        return {
          slot: {
            idx: key.idx,
            apiKey: key.apiKey,
            keyId: key.keyId,
            from: key.from,
            project: key.project,
            source: key.source,
            dbId: key.dbId,
            model,
          },
          usage: { model, rpmUsed: ms.rpmLog.length, rpmLimit: rpm, rpdUsed: ms.rpdUsed, rpdLimit: rpd, limited: false },
        };
      }
    }
    return null;
  }

  modelPool(preferredModel?: string): { model: string; rpm: number; rpd: number }[] {
    const all = AVAILABLE_MODELS.filter((m) => !this.deadModels.has(m.model));
    if (preferredModel && preferredModel !== "auto") {
      const pref = all.find((m) => m.model === preferredModel);
      if (pref) return [pref, ...all.filter((m) => m.model !== preferredModel)];
    }
    return all;
  }

  deadModels = new Set<string>();
  markModelDead(model: string) {
    this.deadModels.add(model);
  }

  markKeyDisabled(slot: KeySlot, reason: string) {
    const k = this.keys.find((x) => x.keyId === slot.keyId);
    if (k) {
      k.disabledReason = reason;
      if (k.dbId) void this.persist(k);
    }
  }

  markModelLimited(slot: KeySlot, daily: boolean) {
    const k = this.keys.find((x) => x.keyId === slot.keyId);
    if (!k) return;
    const ms = modelState(k, slot.model);
    if (daily) {
      ms.dailyUntil = rpdWindowStart(new Date(Date.now() + 1000 * 60 * 60 * 24)).getTime();
    } else {
      ms.minuteUntil = Date.now() + 75_000;
    }
  }

  /** Short cooldown used after transient 5xx errors so rotation moves on
   *  to the next key/model combo instead of hammering the hot model. */
  markModelCooldown(slot: KeySlot, ms: number) {
    const k = this.keys.find((x) => x.keyId === slot.keyId);
    if (!k) return;
    const st = modelState(k, slot.model);
    st.minuteUntil = Math.max(st.minuteUntil, Date.now() + ms);
  }

  /**
   * True when some key could yield a slot within `horizonMs`. RPM saturation
   * and cooldowns count as hopeful (they roll off); disabled keys and
   * RPD-exhausted models do not — in that case waiting cannot help.
   */
  outlook(horizonMs = 120_000): boolean {
    const now = Date.now();
    const models = AVAILABLE_MODELS.filter((m) => !this.deadModels.has(m.model));
    for (const k of this.keys) {
      if (k.disabledReason) continue;
      for (const m of models) {
        const ms = modelState(k, m.model);
        if (ms.rpdUsed >= m.rpd) continue;
        if (ms.dailyUntil > now + horizonMs) continue;
        return true;
      }
    }
    return false;
  }

  recordError(slot: KeySlot) {
    const k = this.keys.find((x) => x.keyId === slot.keyId);
    if (!k) return;
    const ms = modelState(k, slot.model);
    // return the RPM reservation
    ms.rpmLog.pop();
  }

  private async persist(k: KeyState) {
    if (!k.dbId) return;
    let total = 0;
    let win = "";
    for (const m of k.models.values()) {
      total += m.rpdUsed;
      win = m.rpdWindowStart;
    }
    try {
      await db
        .update(geminiKeys)
        .set({
          rpdUsed: total,
          rpdWindowStart: win || null,
          disabledReason: k.disabledReason,
          lastUsedAt: k.lastUsedAt ? new Date(k.lastUsedAt) : null,
        })
        .where(eq(geminiKeys.id, k.dbId));
    } catch {
      /* non-fatal */
    }
  }

  async addKey(opts: { key: string; from: string; project: string; idx?: number }): Promise<KeyState> {
    await this.load();
    const apiKey = opts.key.trim();
    const hash = crypto.createHash("sha256").update(apiKey).digest("hex");
    const existing = this.keys.find((k) => k.keyId === hash.slice(0, 16));
    if (existing) return existing;
    const idx = opts.idx ?? Math.max(0, ...this.keys.map((k) => k.idx)) + 1;
    const inserted = await db
      .insert(geminiKeys)
      .values({ idx, keyHash: hash, secret: apiKey, from: opts.from.trim(), project: opts.project.trim(), source: "local" })
      .onConflictDoNothing({ target: geminiKeys.keyHash })
      .returning();
    let row = inserted[0];
    if (!row) {
      // raced a duplicate insert — fetch the existing row
      const [found] = await db.select().from(geminiKeys).where(eq(geminiKeys.keyHash, hash)).limit(1);
      if (found) {
        const ks: KeyState = {
          idx: found.idx,
          apiKey: found.secret,
          keyId: hash.slice(0, 16),
          from: found.from,
          project: found.project,
          source: "local",
          dbId: found.id,
          disabledReason: found.disabledReason,
          lastUsedAt: found.lastUsedAt ? found.lastUsedAt.getTime() : null,
          models: new Map(),
        };
        this.keys.push(ks);
        this.keys.sort((a, b) => a.idx - b.idx);
        return ks;
      }
      row = { idx, keyHash: hash, secret: apiKey, from: opts.from.trim(), project: opts.project.trim(), source: "local" } as any;
    }
    const k: KeyState = {
      idx: row.idx,
      apiKey,
      keyId: hash.slice(0, 16),
      from: row.from,
      project: row.project,
      source: "local",
      dbId: row.id,
      disabledReason: null,
      lastUsedAt: null,
      models: new Map(),
    };
    this.keys.push(k);
    this.keys.sort((a, b) => a.idx - b.idx);
    return k;
  }

  /** Bulk-add many keys at once (the rotation pool can grow without bound). */
  async addKeys(items: { key: string; from: string; project: string }[]): Promise<{
    added: number;
    duplicates: number;
    invalid: number;
    total: number;
  }> {
    await this.load();
    return this.addKeysLoaded(items);
  }

  private async addKeysLoaded(items: { key: string; from: string; project: string }[]): Promise<{
    added: number;
    duplicates: number;
    invalid: number;
    total: number;
  }> {
    let added = 0;
    let duplicates = 0;
    let invalid = 0;
    for (const item of items) {
      const raw = (item.key || "").trim();
      if (!raw || raw.length < 20) {
        invalid += 1;
        continue;
      }
      const id16 = crypto.createHash("sha256").update(raw).digest("hex").slice(0, 16);
      if (this.keys.some((k) => k.keyId === id16)) {
        duplicates += 1;
        continue;
      }
      await this.addKey({ key: raw, from: item.from || "", project: item.project || "" });
      added += 1;
    }
    return { added, duplicates, invalid, total: this.keys.length };
  }

  async removeKey(dbId: number): Promise<void> {
    await db.delete(geminiKeys).where(eq(geminiKeys.id, dbId));
    this.keys = this.keys.filter((k) => k.dbId !== dbId);
  }

  async resetQuotas(): Promise<void> {
    for (const k of this.keys) {
      k.disabledReason = null;
      k.models.clear();
      if (k.dbId) {
        try {
          await db.update(geminiKeys).set({ disabledReason: null, rpdUsed: 0 }).where(eq(geminiKeys.id, k.dbId));
        } catch {
          /* ignore */
        }
      }
    }
  }

  async describe(): Promise<{ keys: KeyInfo[]; models: { model: string; rpm: number; rpd: number }[] }> {
    await this.load();
    const keys: KeyInfo[] = this.keys.map((k) => ({
      id: k.dbId,
      idx: k.idx,
      label: `api${k.idx === 0 ? "" : k.idx}`,
      masked: `${k.apiKey.slice(0, 6)}…${k.apiKey.slice(-4)}`,
      from: k.from,
      project: k.project,
      source: k.source,
      models: AVAILABLE_MODELS.filter((m) => !this.deadModels.has(m.model)).map((m) => {
        const ms = modelState(k, m.model);
        const rpmUsed = ms.rpmLog.filter((t) => Date.now() - t < 60_000).length;
        const until = Math.max(ms.minuteUntil, ms.dailyUntil);
        return {
          model: m.model,
          rpmUsed,
          rpmLimit: m.rpm,
          rpdUsed: ms.rpdUsed,
          rpdLimit: m.rpd,
          limited: until > Date.now(),
          limitedUntil: until > Date.now() ? new Date(until).toISOString() : undefined,
        };
      }),
      disabledReason: k.disabledReason,
      lastUsedAt: k.lastUsedAt ? new Date(k.lastUsedAt).toISOString() : null,
    }));
    return { keys, models: AVAILABLE_MODELS.map((m) => ({ ...m })) };
  }
}

const g = globalThis as typeof globalThis & { __keyManager?: KeyManager };
export const keyManager = g.__keyManager ?? (g.__keyManager = new KeyManager());
