import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appSettings, geminiKeys } from "@/db/schema";
import { DEFAULT_MODELS, type KeyInfo, type KeyModelUsage, type ModelConfig } from "@/lib/types";

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
  minuteUntil: number; // 429-minute / 5xx cooldown expiry (ms)
  dailyUntil: number; // 429-daily cooldown expiry (ms)
  dead: boolean; // per-key model unavailability (404 / unsupported)
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
    m = {
      rpmLog: m?.rpdWindowStart === win ? m.rpmLog : [],
      rpdUsed: 0,
      rpdWindowStart: win,
      minuteUntil: 0,
      dailyUntil: 0,
      dead: m?.dead ?? false,
    };
    k.models.set(model, m);
  }
  return m;
}

class KeyManager {
  keys: KeyState[] = [];
  private lastLoad = 0;
  private configuredModels: ModelConfig[] = [...DEFAULT_MODELS];

  setModels(models: ModelConfig[]) {
    if (Array.isArray(models) && models.length > 0) {
      this.configuredModels = models.map((m) => ({
        model: String(m.model).trim(),
        rpm: Math.max(1, Number(m.rpm) || 15),
        rpd: Math.max(1, Number(m.rpd) || 100),
        priority: typeof m.priority === "number" && m.priority > 0 ? Math.round(m.priority) : null,
      }));
    }
  }

  getModels(): ModelConfig[] {
    return this.configuredModels;
  }

  /**
   * Discover env keys (api1..N, GEMINI_API_KEY, GEMINI_API_KEY_N) + DB keys.
   * Crucially preserves all live in-memory `models` RPM logs, cooldowns, and
   * `lastUsedAt` timestamps across reloads so polling `/api/keys` or starting
   * a new job never wipes active rate-limit state.
   */
  async load(force = false): Promise<void> {
    const now = Date.now();
    if (!force && now - this.lastLoad < 10_000 && this.keys.length) return;
    this.lastLoad = now;

    try {
      const [appCfg] = await db
        .select({ models: appSettings.models })
        .from(appSettings)
        .where(eq(appSettings.id, 1))
        .limit(1);
      if (appCfg?.models) {
        const parsed = JSON.parse(appCfg.models);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.setModels(parsed);
        }
      }
    } catch {
      /* ignore */
    }

    const prevById = new Map(this.keys.map((k) => [k.keyId, k]));

    const envData: Record<string, string> = { ...process.env } as Record<string, string>;
    const indexes = new Set<number>();
    for (const name of Object.keys(envData)) {
      const m = name.match(/^api(\d+)$/i) || name.match(/^GEMINI_API_KEY_(\d+)$/i);
      if (m) indexes.add(parseInt(m[1], 10));
    }
    if ((envData["GEMINI_API_KEY"] || "").trim()) indexes.add(0);

    const envKeys: KeyState[] = [];
    for (const i of [...indexes].sort((a, b) => a - b)) {
      const raw = (
        i === 0
          ? envData["GEMINI_API_KEY"]
          : envData[`api${i}`] || envData[`API${i}`] || envData[`GEMINI_API_KEY_${i}`] || ""
      ).trim();
      if (!raw) continue;
      const kid = keyIdFor(raw);
      const prev = prevById.get(kid);
      envKeys.push({
        idx: i,
        apiKey: raw,
        keyId: kid,
        from: (i === 0 ? "" : envData[`from${i}`] || envData[`FROM${i}`] || "").trim() || `account_${i}`,
        project:
          (i === 0 ? "" : envData[`project${i}`] || envData[`PROJECT${i}`] || envData[`GEMINI_PROJECT_${i}`] || "").trim() ||
          `project_${i}`,
        source: "env",
        dbId: null,
        disabledReason: prev?.disabledReason ?? null,
        lastUsedAt: prev?.lastUsedAt ?? null,
        models: prev?.models ?? new Map(),
      });
    }

    const dbKeys = await db.select().from(geminiKeys);
    const currentWin = rpdWindowStart(new Date(now)).toISOString();
    const localKeys: KeyState[] = dbKeys.map((k) => {
      const kid = k.keyHash.slice(0, 16);
      const prev = prevById.get(kid);
      const models = prev?.models ?? new Map<string, ModelState>();
      // Hydrate persisted daily count on cold boot if window matches
      if (!prev && k.rpdUsed > 0 && k.rpdWindowStart === currentWin && this.configuredModels.length > 0) {
        models.set(this.configuredModels[0].model, {
          rpmLog: [],
          rpdUsed: k.rpdUsed,
          rpdWindowStart: currentWin,
          minuteUntil: 0,
          dailyUntil: 0,
          dead: false,
        });
      }
      return {
        idx: k.idx,
        apiKey: k.secret,
        keyId: kid,
        from: k.from || `account_${k.idx}`,
        project: k.project || `project_${k.idx}`,
        source: "local" as const,
        dbId: k.id,
        disabledReason: prev ? prev.disabledReason : k.disabledReason,
        lastUsedAt: prev?.lastUsedAt ?? (k.lastUsedAt ? k.lastUsedAt.getTime() : null),
        models,
      };
    });

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

  healthyCount(): number {
    return this.keys.filter((k) => !k.disabledReason).length;
  }

  /** Recommended worker concurrency based on active non-disabled keys. */
  concurrencyHint(maxWorkers = 3): number {
    const healthy = this.healthyCount();
    if (healthy <= 1) return 1;
    return Math.min(maxWorkers, healthy);
  }

  /**
   * Atomic Model-First, Least-Recently-Used Round-Robin slot reservation.
   * Tries the highest-priority model across ALL healthy keys (ordered by
   * least-recently-used + lowest active RPM load) before falling back to the
   * next model tier, maximizing quality and throughput across unlimited keys.
   */
  pickAndReserve(opts: { preferredModel?: string; now?: number } = {}): { slot: KeySlot; usage: KeyModelUsage } | null {
    const now = opts.now ?? Date.now();
    const pool = this.modelPool(opts.preferredModel);
    const activeKeys = this.keys.filter((k) => !k.disabledReason);
    if (!activeKeys.length) return null;

    for (const { model, rpm, rpd } of pool) {
      const candidates: { key: KeyState; ms: ModelState }[] = [];
      for (const key of activeKeys) {
        const ms = modelState(key, model);
        if (ms.dead) continue;
        ms.rpmLog = ms.rpmLog.filter((t) => now - t < 60_000);
        if (ms.rpmLog.length >= rpm) continue;
        if (ms.rpdUsed >= rpd) continue;
        if (ms.minuteUntil > now || ms.dailyUntil > now) continue;
        candidates.push({ key, ms });
      }
      if (!candidates.length) continue;

      // Pick least-recently-used key (tie-breaking on lowest RPM utilization)
      candidates.sort((a, b) => {
        const luA = a.key.lastUsedAt ?? 0;
        const luB = b.key.lastUsedAt ?? 0;
        if (luA !== luB) return luA - luB;
        return a.ms.rpmLog.length - b.ms.rpmLog.length;
      });

      const { key, ms } = candidates[0];
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
        usage: {
          model,
          rpmUsed: ms.rpmLog.length,
          rpmLimit: rpm,
          rpdUsed: ms.rpdUsed,
          rpdLimit: rpd,
          limited: false,
        },
      };
    }
    return null;
  }

  modelPool(preferredModel?: string): ModelConfig[] {
    const all = [...this.configuredModels];
    all.sort((a, b) => {
      if (a.priority != null && b.priority != null) return a.priority - b.priority;
      if (a.priority != null && b.priority == null) return -1;
      if (a.priority == null && b.priority != null) return 1;
      return 0;
    });
    if (preferredModel && preferredModel !== "auto") {
      const pref = all.find((m) => m.model === preferredModel);
      if (pref) return [pref, ...all.filter((m) => m.model !== preferredModel)];
    }
    return all;
  }

  /** Marks a model dead ONLY on the specific key where it returned 404/unsupported. */
  markModelDeadOnKey(slot: KeySlot) {
    const k = this.keys.find((x) => x.keyId === slot.keyId);
    if (!k) return;
    const ms = modelState(k, slot.model);
    ms.dead = true;
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

  markModelCooldown(slot: KeySlot, ms: number) {
    const k = this.keys.find((x) => x.keyId === slot.keyId);
    if (!k) return;
    const st = modelState(k, slot.model);
    st.minuteUntil = Math.max(st.minuteUntil, Date.now() + ms);
  }

  outlook(horizonMs = 120_000): boolean {
    const now = Date.now();
    for (const k of this.keys) {
      if (k.disabledReason) continue;
      for (const m of this.configuredModels) {
        const ms = modelState(k, m.model);
        if (ms.dead) continue;
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
    ms.rpmLog.pop();
    ms.rpdUsed = Math.max(0, ms.rpdUsed - 1);
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

  async addKeys(items: { key: string; from: string; project: string }[]): Promise<{
    added: number;
    duplicates: number;
    invalid: number;
    total: number;
  }> {
    await this.load();
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
      models: this.configuredModels.map((m) => {
        const ms = modelState(k, m.model);
        const rpmUsed = ms.rpmLog.filter((t) => Date.now() - t < 60_000).length;
        const until = Math.max(ms.minuteUntil, ms.dailyUntil);
        return {
          model: m.model,
          rpmUsed,
          rpmLimit: m.rpm,
          rpdUsed: ms.rpdUsed,
          rpdLimit: m.rpd,
          limited: ms.dead || until > Date.now(),
          limitedUntil: until > Date.now() ? new Date(until).toISOString() : undefined,
        };
      }),
      disabledReason: k.disabledReason,
      lastUsedAt: k.lastUsedAt ? new Date(k.lastUsedAt).toISOString() : null,
    }));
    return { keys, models: this.configuredModels.map((m) => ({ ...m })) };
  }
}

const g = globalThis as typeof globalThis & { __keyManager?: KeyManager };
if (g.__keyManager && typeof (g.__keyManager as any).setModels !== "function") {
  const oldKeys = g.__keyManager.keys;
  g.__keyManager = new KeyManager();
  g.__keyManager.keys = oldKeys;
}
export const keyManager = g.__keyManager ?? (g.__keyManager = new KeyManager());
