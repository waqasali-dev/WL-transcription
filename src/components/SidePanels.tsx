"use client";
import { useRef, useState } from "react";
import { DEFAULT_MODELS, type AppSettings, type KeyInfo, type ModelConfig } from "@/lib/types";
import { fmtBytes, relTime } from "@/lib/format";
import { Badge, Button, Card, CardHeader, IconButton, Input, Progress } from "./ui";
import { IconCheck, IconKey, IconPlus, IconRefresh, IconSliders, IconTrash, IconUpload, IconX } from "./icons";

export async function uploadMediaFile(
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ id: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await new Promise<{ ok: boolean; status: number; body: any }>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/jobs");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      let body: any = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* ignore */
      }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, body });
    };
    xhr.onerror = () => resolve({ ok: false, status: 0, body: null });
    xhr.send(fd);
  });
  if (!res.ok) throw new Error(res.body?.error || `Upload failed (${res.status})`);
  return { id: res.body.id };
}

/* ═══ Minimal Batch Upload Dropzone ══════════════════════════════════════ */
export function UploadCard({ onQueued }: { onQueued: (firstId: string) => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState<{ index: number; total: number; pct: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptFiles = (incoming: FileList | null) => {
    if (!incoming?.length) return;
    setFiles(Array.from(incoming));
    setErr(null);
  };

  const submitAll = async () => {
    if (!files.length) return;
    setErr(null);
    let firstId = "";
    try {
      for (let i = 0; i < files.length; i++) {
        setUploading({ index: i + 1, total: files.length, pct: 0 });
        const { id } = await uploadMediaFile(files[i], (pct) =>
          setUploading({ index: i + 1, total: files.length, pct })
        );
        if (i === 0) firstId = id;
      }
      setFiles([]);
      if (firstId) onQueued(firstId);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setUploading(null);
    }
  };

  const totalBytes = files.reduce((a, f) => a + f.size, 0);

  return (
    <Card>
      <div className="p-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            acceptFiles(e.dataTransfer.files);
          }}
          className={`w-full rounded-lg border border-dashed px-3 py-4 text-center transition-colors ${
            drag
              ? "border-[var(--accent)] bg-[var(--accent-soft)]"
              : "border-[var(--border-strong)] bg-[var(--surface-2)] hover:border-[var(--accent)]"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".mp3,.wav,.m4a,.mp4,.mov,.mkv,.avi,.m4v,.ogg,.opus,.flac,.aac,.webm,.aiff,.aif"
            className="hidden"
            onChange={(e) => acceptFiles(e.target.files)}
          />
          {files.length ? (
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5">
                <Badge tone="accent">{files.length} selected</Badge>
                <span className="truncate font-mono text-[11px] font-medium text-[var(--fg)]">
                  {files.length === 1 ? files[0].name : `${files[0].name} +${files.length - 1}`}
                </span>
              </div>
              <div className="num font-mono text-[10px] text-[var(--fg-subtle)]">{fmtBytes(totalBytes)}</div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div
                className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
              >
                <IconUpload size={15} />
              </div>
              <div className="text-[12px] font-medium text-[var(--fg)]">Drop audio or video</div>
              <div className="mt-0.5 font-mono text-[9.5px] text-[var(--fg-faint)]">
                mp4 · mov · mkv · mp3 · wav · m4a · multi-file queue
              </div>
            </div>
          )}
        </button>

        {uploading && (
          <div className="mt-2">
            <Progress value={uploading.pct} />
            <div className="num mt-1 flex justify-between font-mono text-[9.5px] text-[var(--fg-subtle)]">
              <span>
                Uploading {uploading.index}/{uploading.total}
              </span>
              <span>{Math.round(uploading.pct * 100)}%</span>
            </div>
          </div>
        )}

        {err && (
          <div
            className="mt-2 rounded-md border px-2 py-1.5 text-[11px]"
            style={{
              borderColor: "color-mix(in oklab,var(--danger) 35%,transparent)",
              background: "var(--danger-soft)",
              color: "var(--danger)",
            }}
          >
            {err}
          </div>
        )}

        {files.length > 0 && (
          <div className="mt-2 flex gap-1.5">
            <Button variant="primary" size="sm" className="flex-1" onClick={submitAll} loading={!!uploading}>
              Transcribe {files.length > 1 ? `(${files.length} files)` : ""}
            </Button>
            <IconButton label="Clear selection" onClick={() => setFiles([])}>
              <IconX size={13} />
            </IconButton>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ═══ Slide-Over Studio Drawer Modal ═════════════════════════════════════ */
export function DrawerModal({
  open,
  title,
  subtitle,
  onClose,
  width = "lg",
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  width?: "md" | "lg" | "xl";
  children: React.ReactNode;
}) {
  if (!open) return null;
  const widthClass =
    width === "xl" ? "max-w-2xl" : width === "lg" ? "max-w-xl" : "max-w-md sm:max-w-lg";

  return (
    <div className="fixed inset-0 z-[110] flex justify-end" role="dialog" aria-modal>
      <div className="fixed inset-0 bg-[var(--overlay)] backdrop-blur-xs" onClick={onClose} />
      <div
        className={`relative z-10 flex h-full w-full ${widthClass} animate-fade flex-col border-l border-[var(--border-strong)] bg-[var(--surface)] shadow-[var(--shadow-lg)]`}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
          <div>
            <h2 className="text-[14px] font-semibold text-[var(--fg)]">{title}</h2>
            {subtitle && <p className="font-mono text-[11px] text-[var(--fg-subtle)] mt-0.5">{subtitle}</p>}
          </div>
          <IconButton label="Close" onClick={onClose}>
            <IconX size={15} />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/* ═══ Settings Panel Content ═════════════════════════════════════════════ */
export function SettingsCard({ value, onChange }: { value: AppSettings | null; onChange: (s: AppSettings) => void }) {
  const [f, setF] = useState<AppSettings>(
    value ?? {
      chunkSec: 30,
      overlapSec: 2,
      model: "auto",
      toleranceMs: 350,
      allowSimulate: true,
      models: DEFAULT_MODELS,
    }
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // New model creation form state
  const [newModel, setNewModel] = useState("");
  const [newRpm, setNewRpm] = useState(15);
  const [newRpd, setNewRpd] = useState(500);
  const [newPriority, setNewPriority] = useState<number | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  // Synchronize when value changes from outside
  const models = f.models?.length ? f.models : DEFAULT_MODELS;
  const totalPriorities = models.length;

  const handleSetPriority = (modelName: string, prio: number | null) => {
    setF((prev) => {
      const currentList = prev.models?.length ? prev.models : DEFAULT_MODELS;
      const nextList = currentList.map((m) => {
        if (m.model === modelName) {
          return { ...m, priority: prio };
        }
        if (prio !== null && m.priority === prio) {
          return { ...m, priority: null };
        }
        return m;
      });
      return { ...prev, models: nextList };
    });
  };

  const handleRemoveModel = (modelName: string) => {
    if (models.length <= 1) return;
    setF((prev) => {
      const currentList = prev.models?.length ? prev.models : DEFAULT_MODELS;
      const nextList = currentList.filter((m) => m.model !== modelName);
      return { ...prev, models: nextList };
    });
  };

  const handleAddModel = () => {
    const trimmed = newModel.trim();
    if (!trimmed) {
      setAddError("Model identifier is required.");
      return;
    }
    if (models.some((m) => m.model.toLowerCase() === trimmed.toLowerCase())) {
      setAddError(`Model "${trimmed}" is already in the pool.`);
      return;
    }
    const rpm = Math.max(1, Math.min(10000, Number(newRpm) || 15));
    const rpd = Math.max(1, Math.min(100000, Number(newRpd) || 100));

    const nextModels = models.map((m) =>
      newPriority !== null && m.priority === newPriority ? { ...m, priority: null } : m
    );

    nextModels.push({
      model: trimmed,
      rpm,
      rpd,
      priority: newPriority,
    });

    setF((prev) => ({ ...prev, models: nextModels }));
    setNewModel("");
    setNewRpm(15);
    setNewRpd(500);
    setNewPriority(null);
    setAddError(null);
  };

  const handleResetDefaults = () => {
    setF((prev) => ({ ...prev, models: DEFAULT_MODELS }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f,
          models,
        }),
      });
      if (r.ok) {
        onChange(await r.json());
        setSaved(true);
        setTimeout(() => setSaved(false), 1600);
      }
    } finally {
      setSaving(false);
    }
  };

  const field =
    "h-8.5 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 font-mono text-[12px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none";

  const prioritizedModels = [...models]
    .filter((m) => m.priority !== null)
    .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
  const unsetModels = models.filter((m) => m.priority === null);

  const defaultNames = new Set(DEFAULT_MODELS.map((m) => m.model));

  return (
    <div className="space-y-4">
      {/* ── Audio Chunks ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="label mb-1 block">Speech chunk (s)</span>
          <input
            type="number"
            min={10}
            max={60}
            value={f.chunkSec}
            onChange={(e) => setF({ ...f, chunkSec: +e.target.value || 30 })}
            className={field}
          />
        </label>
        <label className="block">
          <span className="label mb-1 block">Chunk overlap (s)</span>
          <input
            type="number"
            min={0}
            max={5}
            value={f.overlapSec}
            onChange={(e) => setF({ ...f, overlapSec: +e.target.value || 0 })}
            className={field}
          />
        </label>
      </div>

      {/* ── Preferred Gemini Tier ────────────────────────────────────────── */}
      <label className="block">
        <span className="label mb-1 block">Preferred Gemini tier</span>
        <select value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} className={field}>
          <option value="auto">Auto — Follow configured Model Priority pipeline (Recommended)</option>
          {models.map((m) => (
            <option key={m.model} value={m.model}>
              {m.model} ({m.priority ? `Priority ${m.priority}` : "Unset"} · {m.rpm} RPM / {m.rpd} RPD)
            </option>
          ))}
        </select>
      </label>

      {/* ── Model Priority & Rotation Pipeline ────────────────────────────── */}
      <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-3.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[12.5px] font-semibold text-[var(--fg)]">Model Priority & Failover Pipeline</div>
            <div className="text-[11px] text-[var(--fg-subtle)] leading-relaxed mt-0.5">
              Assign 1–{totalPriorities} priority levels. Priority 1 gets the request first. If it rate-limits or fails, the next priority takes over.
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-[10px] text-[var(--fg-subtle)] hover:text-[var(--fg)] underline transition-colors"
          >
            Reset defaults
          </button>
        </div>

        {/* Visual failover path */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5">
          <div className="text-[10.5px] font-mono text-[var(--fg-subtle)] mb-1.5 flex items-center justify-between">
            <span>Live Failover Chain</span>
            <span>{prioritizedModels.length} of {models.length} prioritized</span>
          </div>
          {prioritizedModels.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
              {prioritizedModels.map((m, idx) => (
                <div key={m.model} className="flex items-center gap-1.5">
                  <span
                    className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold text-[10.5px]"
                    style={{
                      background:
                        m.priority === 1
                          ? "rgba(245, 158, 11, 0.15)"
                          : m.priority === 2
                            ? "rgba(59, 130, 246, 0.15)"
                            : m.priority === 3
                              ? "rgba(139, 92, 246, 0.15)"
                              : "rgba(16, 185, 129, 0.15)",
                      color:
                        m.priority === 1
                          ? "#f59e0b"
                          : m.priority === 2
                            ? "#3b82f6"
                            : m.priority === 3
                              ? "#8b5cf6"
                              : "#10b981",
                    }}
                  >
                    <span className="opacity-70">#{m.priority}</span>
                    <span>{m.model.replace("gemini-", "")}</span>
                  </span>
                  {idx < prioritizedModels.length - 1 && (
                    <span className="text-[var(--fg-subtle)] text-[10px]">→</span>
                  )}
                </div>
              ))}
              {unsetModels.length > 0 && (
                <span className="text-[10px] text-[var(--fg-subtle)] ml-1">
                  (+{unsetModels.length} unset fallback{unsetModels.length > 1 ? "s" : ""})
                </span>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-[var(--fg-subtle)]">
              No priority levels assigned. Requests rotate evenly across all models.
            </div>
          )}
        </div>

        {/* Model Cards */}
        <div className="space-y-2.5">
          {models.map((m) => {
            const isCustom = !defaultNames.has(m.model);
            const prioColor =
              m.priority === 1
                ? "#f59e0b"
                : m.priority === 2
                  ? "#3b82f6"
                  : m.priority === 3
                    ? "#8b5cf6"
                    : m.priority != null
                      ? "#10b981"
                      : "var(--fg-subtle)";

            return (
              <div
                key={m.model}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 transition-colors hover:border-[var(--accent)]/40 space-y-2.5"
              >
                {/* Row 1: Model Name + Tag + Delete */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[12.5px] font-semibold text-[var(--fg)] truncate">
                      {m.model}
                    </span>
                    {isCustom ? (
                      <span className="rounded bg-[var(--accent)]/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[var(--accent)] shrink-0">
                        CUSTOM
                      </span>
                    ) : (
                      <span className="rounded bg-[var(--surface-3)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--fg-subtle)] shrink-0">
                        DEFAULT
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {models.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveModel(m.model)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--fg-subtle)] hover:bg-[var(--surface-3)] hover:text-[var(--danger)] transition-colors"
                        title={`Remove ${m.model}`}
                        aria-label={`Remove ${m.model}`}
                      >
                        <IconTrash size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Row 2: Limits badges on left, Priority picker on right */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-[var(--border)]/60">
                  <div className="flex items-center gap-1.5 font-mono text-[10.5px] text-[var(--fg-subtle)] shrink-0">
                    <span className="inline-flex items-center rounded bg-[var(--surface-2)] px-2 py-0.5 font-medium border border-[var(--border)]/60">
                      {m.rpm} RPM
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center rounded bg-[var(--surface-2)] px-2 py-0.5 font-medium border border-[var(--border)]/60">
                      {m.rpd} RPD
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-[11px] font-mono font-semibold"
                      style={{ color: prioColor }}
                    >
                      {m.priority === 1
                        ? "1st Priority"
                        : m.priority === 2
                          ? "2nd Priority"
                          : m.priority === 3
                            ? "3rd Priority"
                            : m.priority != null
                              ? `Priority ${m.priority}`
                              : "Unset"}
                    </span>
                    <select
                      value={m.priority ?? ""}
                      onChange={(e) =>
                        handleSetPriority(m.model, e.target.value === "" ? null : Number(e.target.value))
                      }
                      className="h-8 min-w-[135px] max-w-[185px] rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 font-mono text-[11px] text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
                      aria-label={`Priority for ${m.model}`}
                    >
                      <option value="">Unset (Fallback)</option>
                      {Array.from({ length: totalPriorities }, (_, i) => i + 1).map((p) => {
                        const takenBy = models.find((x) => x.priority === p && x.model !== m.model);
                        return (
                          <option key={p} value={p} disabled={Boolean(takenBy)}>
                            {`Priority ${p}${takenBy ? ` (${takenBy.model.replace("gemini-", "")})` : ""}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Add Custom Model ───────────────────────────────────────────── */}
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[var(--fg)] flex items-center gap-1.5">
              <IconPlus size={13} className="text-[var(--accent)]" />
              <span>Add Another Model to Pool</span>
            </span>
            <span className="text-[10px] text-[var(--fg-subtle)] font-mono">Usable for all keys</span>
          </div>

          <div className="space-y-2.5">
            <div>
              <label className="block text-[10.5px] font-medium text-[var(--fg-subtle)] mb-1">Model Name</label>
              <input
                type="text"
                placeholder="e.g. gemini-2.0-flash-exp"
                value={newModel}
                onChange={(e) => {
                  setNewModel(e.target.value);
                  setAddError(null);
                }}
                className={field}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10.5px] font-medium text-[var(--fg-subtle)] mb-1">RPM Limit</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={newRpm}
                  onChange={(e) => setNewRpm(Math.max(1, +e.target.value || 15))}
                  className={field}
                />
              </div>
              <div>
                <label className="block text-[10.5px] font-medium text-[var(--fg-subtle)] mb-1">RPD Limit</label>
                <input
                  type="number"
                  min={1}
                  max={100000}
                  value={newRpd}
                  onChange={(e) => setNewRpd(Math.max(1, +e.target.value || 500))}
                  className={field}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-medium text-[var(--fg-subtle)] mb-1">Initial Priority</label>
              <select
                value={newPriority ?? ""}
                onChange={(e) => setNewPriority(e.target.value === "" ? null : Number(e.target.value))}
                className={field}
              >
                <option value="">Unset (No Priority / Fallback)</option>
                {Array.from({ length: totalPriorities + 1 }, (_, i) => i + 1).map((p) => {
                  const takenBy = models.find((x) => x.priority === p);
                  return (
                    <option key={p} value={p} disabled={Boolean(takenBy)}>
                      {`Priority ${p}${takenBy ? ` (taken by ${takenBy.model.replace("gemini-", "")})` : ""}`}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {addError && <div className="text-[11px] text-[var(--danger)] font-medium">{addError}</div>}

          <Button variant="secondary" size="sm" className="w-full justify-center mt-1" onClick={handleAddModel}>
            <IconPlus size={13} className="mr-1.5" />
            Add Model to Pool
          </Button>
        </div>
      </div>

      {/* ── Fallback Onset Tolerance ────────────────────────────────────── */}
      <label className="block">
        <span className="mb-1 flex items-center justify-between">
          <span className="label">Fallback onset tolerance</span>
          <span className="num font-mono text-[11px] font-medium" style={{ color: "var(--accent)" }}>
            ±{f.toleranceMs} ms
          </span>
        </span>
        <input
          type="range"
          min={150}
          max={600}
          step={25}
          value={f.toleranceMs}
          onChange={(e) => setF({ ...f, toleranceMs: +e.target.value })}
          className="scrub w-full"
        />
      </label>

      {/* ── Simulation Fallback Toggle ──────────────────────────────────── */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[12px] font-medium text-[var(--fg)]">Simulation fallback</div>
            <div className="mt-0.5 text-[11px] text-[var(--fg-subtle)]">
              Finish runs using real FFmpeg waveforms & scene cuts when no active API key is available.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setF({ ...f, allowSimulate: !f.allowSimulate })}
            className="relative h-5 w-9 shrink-0 rounded-full transition-colors"
            style={{ background: f.allowSimulate ? "var(--accent)" : "var(--surface-3)" }}
            aria-label="Toggle simulation fallback"
          >
            <span
              className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-xs transition-all"
              style={{ left: f.allowSimulate ? 18 : 2 }}
            />
          </button>
        </div>
      </div>

      {/* ── Save Button ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 pt-1">
        <Button variant="primary" size="md" className="flex-1" onClick={save} loading={saving}>
          Save configuration
        </Button>
        {saved && <Badge tone="success">Saved</Badge>}
      </div>
    </div>
  );
}

/* ═══ API Keys Pool Manager Content ══════════════════════════════════════ */
function cooldown(iso?: string) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return null;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  return `${Math.floor(s / 3600)}h ${Math.round((s % 3600) / 60)}m`;
}

export function KeysCard({
  keys,
  onImport,
  onRemove,
  onReset,
  busy,
}: {
  keys: KeyInfo[];
  onImport: (text: string, meta: { from: string; project: string }) => Promise<{ added: number; duplicates: number; invalid: number }>;
  onRemove: (id: number) => Promise<void>;
  onReset: () => Promise<void>;
  busy: boolean;
}) {
  const [bulk, setBulk] = useState("");
  const [from, setFrom] = useState("");
  const [project, setProject] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const lines = bulk.split(/\r?\n/).filter((l) => l.trim().length >= 20).length;
  const served = keys.reduce((a, k) => a + k.models.reduce((x, m) => x + m.rpdUsed, 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
        <div className="font-mono text-[11px] text-[var(--fg-muted)]">
          <strong className="text-[var(--fg)]">{keys.filter((k) => !k.disabledReason).length}</strong>/{keys.length} healthy ·{" "}
          <span className="num">{served}</span> served today
        </div>
        <Button size="xs" variant="secondary" onClick={onReset} disabled={!keys.length} icon={<IconRefresh size={11} />}>
          Reset quotas & flags
        </Button>
      </div>

      {/* Add unlimited keys form */}
      <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
        <div className="label">Add keys to LRU rotation pool (1 per line)</div>
        <textarea
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
          rows={3}
          placeholder={"AIzaSy...\nAIzaSy..., account@gmail.com, my-gcp-project"}
          className="w-full resize-y rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 font-mono text-[11px] leading-relaxed text-[var(--fg)] placeholder:text-[var(--fg-faint)] focus:border-[var(--accent)] focus:outline-none"
        />
        <div className="grid grid-cols-2 gap-2">
          <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="default email (optional)" />
          <Input value={project} onChange={(e) => setProject(e.target.value)} placeholder="default project (optional)" />
        </div>
        {err && <div className="text-[11px] text-[var(--danger)]">{err}</div>}
        {notice && <div className="text-[11px] text-[var(--success)]">{notice}</div>}
        <Button
          variant="accent"
          className="w-full"
          disabled={busy || !lines}
          loading={busy}
          onClick={async () => {
            setErr(null);
            setNotice(null);
            try {
              const r = await onImport(bulk, { from, project });
              setNotice(
                `Added ${r.added} key${r.added === 1 ? "" : "s"}${r.duplicates ? ` · ${r.duplicates} duplicate` : ""}${
                  r.invalid ? ` · ${r.invalid} skipped` : ""
                }`
              );
              setBulk("");
            } catch (e: any) {
              setErr(e?.message || String(e));
            }
          }}
        >
          Add {lines ? `${lines} ` : ""}key{lines === 1 ? "" : "s"} to rotation pool
        </Button>
      </div>

      {/* Key cards */}
      <div className="space-y-2">
        {!keys.length ? (
          <div className="rounded-lg border border-dashed border-[var(--border-strong)] p-6 text-center text-[12px] text-[var(--fg-subtle)]">
            No API keys yet. Paste one or more Gemini API keys above to enable live multi-key load balancing.
          </div>
        ) : (
          keys.map((k) => {
            const cd = k.models.find((m) => m.limited);
            return (
              <div
                key={k.idx}
                className="rounded-xl border p-3"
                style={{
                  borderColor: k.disabledReason
                    ? "color-mix(in oklab,var(--danger) 35%,transparent)"
                    : cd
                      ? "color-mix(in oklab,var(--warning) 35%,transparent)"
                      : "var(--border)",
                  background: k.disabledReason ? "var(--danger-soft)" : "var(--surface-2)",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span
                      className="num rounded bg-[var(--surface-3)] px-1.5 py-0.5 font-mono text-[10px] font-semibold"
                      style={{ color: "var(--accent)" }}
                    >
                      #{k.idx}
                    </span>
                    <span className="truncate font-mono text-[11.5px] font-medium text-[var(--fg)]">{k.masked}</span>
                    <Badge tone={k.source === "env" ? "info" : "neutral"}>{k.source}</Badge>
                  </div>
                  {k.source === "local" && (
                    <button
                      type="button"
                      onClick={() => onRemove(k.id!)}
                      className="text-[var(--fg-faint)] transition-colors hover:text-[var(--danger)]"
                      aria-label={`Remove key #${k.idx}`}
                    >
                      <IconTrash size={13} />
                    </button>
                  )}
                </div>
                <div className="mt-1 truncate font-mono text-[10px] text-[var(--fg-subtle)]">
                  {k.from || "—"} · {k.project || "—"}
                  {k.lastUsedAt ? ` · used ${relTime(k.lastUsedAt)}` : ""}
                </div>
                {k.disabledReason && <div className="mt-1 text-[10.5px] text-[var(--danger)]">{k.disabledReason}</div>}
                {!k.disabledReason && cd && (
                  <div className="mt-1 text-[10.5px] text-[var(--warning)]">
                    Cooldown active · resumes in {cooldown(cd.limitedUntil) ?? "moments"}
                  </div>
                )}
                <div className="mt-2 space-y-1">
                  {k.models.map((m) => (
                    <div key={m.model} className="flex items-center gap-2">
                      <span className="w-28 truncate font-mono text-[9.5px] text-[var(--fg-subtle)]">
                        {m.model.replace("gemini-", "")}
                      </span>
                      <div className="flex-1">
                        <Progress
                          value={m.rpmUsed / m.rpmLimit}
                          tone={m.rpmUsed >= m.rpmLimit ? "warning" : "accent"}
                          height={2.5}
                        />
                      </div>
                      <span className="num w-24 text-right font-mono text-[9.5px] text-[var(--fg-subtle)]">
                        {m.rpmUsed}/{m.rpmLimit}m · {m.rpdUsed}/{m.rpdLimit}d
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
