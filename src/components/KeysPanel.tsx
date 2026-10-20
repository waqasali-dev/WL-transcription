"use client";
import { useState } from "react";
import type { KeyInfo } from "@/lib/types";
import { Bar, Chip, Panel, Spinner } from "./ui";

function fmtUntil(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso).getTime() - Date.now();
  if (d <= 0) return null;
  const s = Math.round(d / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  const h = Math.floor(s / 3600);
  return `${h}h ${Math.round((s % 3600) / 60)}m`;
}

export function KeysPanel({
  keys,
  onAdd,
  onImport,
  onRemove,
  onReset,
  busy,
}: {
  keys: KeyInfo[];
  onAdd: (k: { key: string; from: string; project: string }) => Promise<void>;
  onImport: (keys: string, meta: { from: string; project: string }) => Promise<{ added: number; duplicates: number; invalid: number }>;
  onRemove: (id: number) => Promise<void>;
  onReset: () => Promise<void>;
  busy: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [bulk, setBulk] = useState("");
  const [from, setFrom] = useState("");
  const [project, setProject] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const lineCount = bulk.split(/\r?\n/).filter((l) => l.trim().length >= 20).length;
  const servedTotal = keys.reduce((a, k) => a + k.models.reduce((x, m) => x + m.rpdUsed, 0), 0);
  const coolingKeys = keys.filter((k) => k.models.some((m) => m.limited)).length;

  return (
    <Panel
      title="Gemini keys & quotas"
      right={
        <>
          <span className="font-mono text-[10px] text-dim" title="Requests served today across all keys">
            {servedTotal} served
          </span>
          {coolingKeys > 0 && <Chip tone="warn">{coolingKeys} cooling</Chip>}
          <button
            onClick={onReset}
            disabled={keys.length === 0}
            className="rounded border border-line2 px-1.5 py-0.5 font-mono text-[10px] text-mut transition-colors hover:border-acc/50 hover:text-acc2 disabled:opacity-40"
            title="Reset RPM/RPD tracking & clear disabled flags and cooldowns"
          >
            reset quotas
          </button>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded border border-acc/40 bg-acc/10 px-1.5 py-0.5 font-mono text-[10px] text-acc2 transition-colors hover:bg-acc/20"
          >
            {showForm ? "close" : "+ add keys"}
          </button>
        </>
      }
    >
      {keys.length === 0 && (
        <div className="mb-2 rounded border border-warn/40 bg-warn/10 px-2 py-2 text-[11px] leading-relaxed text-warn">
          No API keys configured. The engine will run in <b>SIMULATION MODE</b> — real acoustic analysis & alignment, synthetic text. Add keys
          below (or set <code className="font-mono">api1=…</code> in <code className="font-mono">.env</code>) for true transcription.
        </div>
      )}

      <div className="max-h-[380px] space-y-2 overflow-y-auto pr-0.5">
        {keys.map((k) => {
          const cooling = k.models.find((m) => m.limited);
          return (
            <div key={k.idx} className={`rounded border px-2 py-2 ${k.disabledReason ? "border-bad/40 bg-bad/5" : cooling ? "border-warn/40 bg-warn/5" : "border-line bg-panel2"}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="num rounded bg-raise px-1 font-mono text-[10px] text-acc2">#{k.idx}</span>
                  <span className="truncate font-mono text-[11px] text-ink">{k.masked}</span>
                  <Chip tone={k.source === "env" ? "inf" : "mut"}>{k.source}</Chip>
                  {keys.length > 1 && <Chip tone="inf">rotation pool</Chip>}
                </div>
                {k.source === "local" && (
                  <button
                    onClick={() => onRemove(k.id!)}
                    className="font-mono text-[10px] text-dim transition-colors hover:text-bad"
                    title="Remove key"
                  >
                    remove
                  </button>
                )}
              </div>
              <div className="mt-0.5 truncate font-mono text-[10px] text-dim">
                {k.from} · {k.project}
                {k.lastUsedAt ? ` · last used ${new Date(k.lastUsedAt).toLocaleTimeString()}` : ""}
              </div>
              {k.disabledReason && <div className="mt-1 text-[10px] text-bad">disabled: {k.disabledReason}</div>}
              {cooling && !k.disabledReason && (
                <div className="mt-1 text-[10px] text-warn">
                  cooling down — {cooling.model} resumes in {fmtUntil(cooling.limitedUntil) || "…"} (rotator skipped this key)
                </div>
              )}
              <div className="mt-1.5 space-y-1">
                {k.models.slice(0, 4).map((m) => (
                  <div key={m.model} className="flex items-center gap-1.5">
                    <span className={`w-32 truncate font-mono text-[9px] ${m.limited ? "text-warn" : "text-dim"}`}>{m.model.replace("gemini-", "")}</span>
                    <div className="flex-1">
                      <Bar value={m.rpmUsed} max={m.rpmLimit} tone={m.rpmUsed >= m.rpmLimit ? "bad" : m.limited ? "warn" : "acc"} />
                    </div>
                    <span className="num w-[104px] text-right font-mono text-[9px] text-dim">
                      {m.rpmUsed}/{m.rpmLimit} rpm · {m.rpdUsed}/{m.rpdLimit} d
                    </span>
                  </div>
                ))}
                {k.models.length > 4 && (
                  <div className="font-mono text-[9px] text-dim">
                    +{k.models.length - 4} models in pool · total today {k.models.reduce((a, m) => a + m.rpdUsed, 0)} requests
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="mt-3 space-y-2 rounded border border-line bg-panel2 p-2">
          <textarea
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            rows={4}
            placeholder={"Paste keys — one per line (unlimited pool):\nAIzaSy…key1\nAIzaSy…key2, account@gmail.com, gcp-project\nAIzaSy…key3"}
            className="w-full resize-y rounded border border-line2 bg-canvas px-2 py-1.5 font-mono text-xs leading-relaxed text-ink outline-none placeholder:text-dim focus:border-acc/60"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="default account email"
              className="w-full rounded border border-line2 bg-canvas px-2 py-1.5 font-mono text-xs text-ink outline-none placeholder:text-dim focus:border-acc/60"
            />
            <input
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="default GCP project"
              className="w-full rounded border border-line2 bg-canvas px-2 py-1.5 font-mono text-xs text-ink outline-none placeholder:text-dim focus:border-acc/60"
            />
          </div>
          {err && <div className="text-[11px] text-bad">{err}</div>}
          {notice && <div className="text-[11px] text-ok">{notice}</div>}
          <button
            disabled={busy || lineCount === 0}
            onClick={async () => {
              setErr(null);
              setNotice(null);
              try {
                const r = await onImport(bulk, { from, project });
                setNotice(
                  `Added ${r.added} new key${r.added === 1 ? "" : "s"}${r.duplicates ? ` · ${r.duplicates} already in pool` : ""}${
                    r.invalid ? ` · ${r.invalid} invalid line${r.invalid === 1 ? "" : "s"} skipped` : ""
                  }. Pool size: ${keys.length + r.added}.`
                );
                setBulk("");
              } catch (e: any) {
                setErr(e?.message || String(e));
              }
            }}
            className="w-full rounded bg-acc px-2 py-1.5 text-xs font-semibold text-canvas transition-colors hover:bg-acc2 disabled:opacity-40"
          >
            {busy ? <Spinner className="mr-1 inline h-3 w-3" /> : null} Add {lineCount} key{lineCount === 1 ? "" : "s"} to rotation pool
          </button>
          <p className="text-[10px] leading-relaxed text-dim">
            Each line may optionally be <code className="font-mono">key, from email, GCP project</code>. Duplicates and short lines are skipped
            automatically. Keys are stored locally (SHA-256 id, never logged). RPM is a rolling 60 s window; RPD resets daily at 1:00 PM local.
          </p>
        </div>
      )}
    </Panel>
  );
}
