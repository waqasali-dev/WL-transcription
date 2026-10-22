"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useJobStream } from "@/hooks/useJobStream";
import { fmtBytes, fmtClock, relTime } from "@/lib/format";
import type { AppSettings, JobSummary, KeyInfo } from "@/lib/types";
import { Badge, Button, Card, Empty, IconButton, Input, Kbd, Progress, Segmented, Spinner, StatusDot, ToastContainer, toast } from "./ui";
import {
  IconBolt,
  IconFilm,
  IconKey,
  IconRefresh,
  IconScissors,
  IconSearch,
  IconSliders,
  IconStop,
  IconTrash,
  IconUpload,
  IconWave,
  IconX,
} from "./icons";
import { ThemeProvider, useTheme } from "./ThemeProvider";
import { KeyboardLayer, ThemeSwitcher } from "./KeyboardLayer";
import { RightInspector, StageRail } from "./PipelinePanels";
import { DrawerModal, KeysCard, SettingsCard, UploadCard, uploadMediaFile } from "./SidePanels";
import { TranscriptWorkspace, type ShortcutApi } from "./TranscriptWorkspace";
import { CommandPalette } from "./CommandPalette";

type Filter = "all" | "video" | "audio" | "failed";

export function Studio() {
  return (
    <ThemeProvider>
      <Workspace />
    </ThemeProvider>
  );
}

function Workspace() {
  const stream = useJobStream();
  const {
    jobs,
    detail,
    selectedId,
    select,
    refresh,
    updateTranscriptOptimistic,
    queueRunning,
    keyCount,
    healthyKeyCount,
    liveConnected,
  } = stream;
  const { setMode: setThemeMode } = useTheme();

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [keys, setKeys] = useState<KeyInfo[]>([]);
  const [keysBusy, setKeysBusy] = useState(false);
  const [keysDrawer, setKeysDrawer] = useState(false);
  const [settingsDrawer, setSettingsDrawer] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState("");
  const [windowDrag, setWindowDrag] = useState(false);

  const [jobFilter, setJobFilter] = useState<Filter>("all");
  const [jobQuery, setJobQuery] = useState("");
  const [mobilePanel, setMobilePanel] = useState<"workspace" | "inspector">("workspace");
  const [transport, setTransport] = useState<ShortcutApi | null>(null);

  const handleRegisterShortcuts = useCallback((api: ShortcutApi | null) => {
    setTransport((prev) => (prev === api ? prev : api));
  }, []);

  const loadKeysAndSettings = useCallback(async () => {
    const [s, k] = await Promise.all([
      fetch("/api/settings", { cache: "no-store" }),
      fetch("/api/keys", { cache: "no-store" }),
    ]);
    if (s.ok) setSettings(await s.json());
    if (k.ok) setKeys((await k.json()).keys);
  }, []);

  useEffect(() => {
    void loadKeysAndSettings();
  }, [loadKeysAndSettings]);

  // Global window drag-and-drop overlay so dropping files ANYWHERE queues immediately
  useEffect(() => {
    let depth = 0;
    const onEnter = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
        depth++;
        setWindowDrag(true);
      }
    };
    const onOver = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) e.preventDefault();
    };
    const onLeave = () => {
      depth = Math.max(0, depth - 1);
      if (depth === 0) setWindowDrag(false);
    };
    const onDrop = async (e: DragEvent) => {
      if (!e.dataTransfer?.files?.length) return;
      // Ignore if dropped directly inside the UploadCard button (handled there)
      if ((e.target as HTMLElement | null)?.closest("button")) {
        depth = 0;
        setWindowDrag(false);
        return;
      }
      e.preventDefault();
      depth = 0;
      setWindowDrag(false);
      const dropped = Array.from(e.dataTransfer.files);
      let firstId = "";
      for (let i = 0; i < dropped.length; i++) {
        try {
          const { id } = await uploadMediaFile(dropped[i]);
          if (!firstId) firstId = id;
        } catch {
          /* individual invalid files skipped */
        }
      }
      if (firstId) {
        select(firstId);
        void refresh(true);
      }
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragover", onOver);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [select, refresh]);

  const filteredJobs = useMemo(() => {
    let list = jobs;
    if (jobFilter === "video" || jobFilter === "audio") list = list.filter((j) => j.mediaKind === jobFilter);
    else if (jobFilter === "failed") list = list.filter((j) => j.status === "failed");
    if (jobQuery.trim()) {
      const q = jobQuery.toLowerCase();
      list = list.filter((j) => j.filename.toLowerCase().includes(q));
    }
    return list;
  }, [jobs, jobFilter, jobQuery]);

  const deleteJob = async (id: string) => {
    await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    if (selectedId === id) select(null);
    toast("Job removed from library", "info");
    void refresh(true);
  };

  const cancelJob = async (id: string) => {
    await fetch(`/api/jobs/${id}/cancel`, { method: "POST" });
    toast("Processing cancelled", "warning");
    void refresh(true);
  };

  const retry = async (id: string) => {
    const r = await fetch(`/api/jobs/${id}/retry`, { method: "POST" });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      toast(d.error || "Could not queue retry", "danger");
      return;
    }
    toast("Retry queued for incomplete chunks", "accent");
    void refresh(true);
  };

  const realign = async (id: string) => {
    const r = await fetch(`/api/jobs/${id}/realign`, { method: "POST" });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      toast(d.error || "Could not start re-alignment", "danger");
      return;
    }
    toast("Acoustic forced alignment queued", "accent");
    void refresh(true);
  };

  const commitRename = async () => {
    setRenaming(false);
    if (!detail || !renameVal.trim() || renameVal.trim() === detail.filename) return;
    const res = await fetch(`/api/jobs/${detail.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: renameVal.trim() }),
    });
    if (res.ok) {
      const d = await res.json();
      toast("Job renamed successfully", "success");
      if (d.transcript) updateTranscriptOptimistic(d.transcript, d.filename);
      else void refresh(true);
    }
  };


  return (
    <div className="min-h-screen">
      {/* Global Drag Overlay */}
      {windowDrag && (
        <div className="pointer-events-none fixed inset-0 z-[150] flex items-center justify-center bg-[var(--overlay)] backdrop-blur-xs">
          <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-[var(--accent)] bg-[var(--surface)] px-12 py-10 shadow-[var(--shadow-lg)]">
            <IconUpload size={28} className="mb-3 text-[var(--accent)]" />
            <div className="text-[15px] font-semibold text-[var(--fg)]">Drop audio or video files to queue</div>
            <div className="mt-1 font-mono text-[11px] text-[var(--fg-subtle)]">
              Batch multi-file upload supported · automatic silence snapping & multi-key rotation
            </div>
          </div>
        </div>
      )}

      {/* ── Minimal Precision Header Bar ──────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-13 max-w-[1840px] items-center justify-between gap-3 px-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-7.5 w-7.5 items-center justify-center rounded-lg"
              style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
            >
              <IconWave size={16} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[14px] font-semibold tracking-tight text-[var(--fg)]">Splicer</span>
              <span className="hidden font-mono text-[10px] text-[var(--fg-subtle)] md:inline">
                Audio + Video Engine
              </span>
            </div>
          </div>

          {/* Center Command Palette Trigger */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="hidden h-8 w-full max-w-md items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 text-[12px] text-[var(--fg-subtle)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--fg)] md:flex"
          >
            <span className="flex items-center gap-2">
              <IconSearch size={13} />
              <span>Search jobs, jump to phrase or scene, export…</span>
            </span>
            <span className="flex items-center gap-0.5">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>

          {/* Right Studio Controls + Explicit Bright / Dark / Auto Switcher */}
          <div className="flex items-center gap-2">
            {/* Live SSE Sync Indicator */}
            <div
              className="hidden items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 font-mono text-[10.5px] text-[var(--fg-muted)] sm:flex"
              title={liveConnected ? "Live server-sent events stream active" : "Reconnecting to event stream"}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  liveConnected ? "bg-[var(--success)] shadow-[0_0_8px_var(--success)] animate-pulse" : "bg-[var(--warning)]"
                }`}
              />
              <span className="hidden lg:inline">{liveConnected ? "Live Sync" : "Syncing"}</span>
            </div>

            {queueRunning && (
              <Badge tone="accent" pulse dot>
                <Spinner className="h-2.5 w-2.5" /> running
              </Badge>
            )}

            <button
              type="button"
              onClick={() => {
                void loadKeysAndSettings();
                setKeysDrawer(true);
              }}
              className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 font-mono text-[11px] font-medium text-[var(--fg)] transition-colors hover:border-[var(--border-strong)]"
              title="Configure Gemini API rotation pool"
            >
              <IconKey size={12} className={healthyKeyCount > 0 ? "text-[var(--success)]" : "text-[var(--warning)]"} />
              <span className="num">
                {healthyKeyCount}/{keyCount}
              </span>
              <span className="hidden text-[var(--fg-subtle)] sm:inline">keys</span>
            </button>

            <button
              type="button"
              onClick={() => {
                void loadKeysAndSettings();
                setSettingsDrawer(true);
              }}
              className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 text-[11.5px] font-medium text-[var(--fg-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--fg)]"
              title="Pipeline settings"
            >
              <IconSliders size={12} />
              <span className="hidden sm:inline">Settings</span>
            </button>

            <ThemeSwitcher />
            <KeyboardLayer onOpenPalette={() => setPaletteOpen(true)} transport={transport} />
          </div>
        </div>
      </header>

      {/* ── Focused 3-Column Studio Workspace ─────────────────────────── */}
      <div className="mx-auto grid max-w-[1840px] gap-4 px-4 py-4 lg:grid-cols-[276px_minmax(0,1fr)] xl:grid-cols-[276px_minmax(0,1fr)_320px]">
        {/* Left Sidebar — Upload + Clean Library */}
        <aside className="space-y-3">
          <UploadCard
            onQueued={(id) => {
              select(id);
              void refresh(true);
            }}
          />

          <Card className="overflow-hidden">
            <div className="space-y-2 border-b border-[var(--border)] p-2.5">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[12px] font-semibold text-[var(--fg)]">Library</span>
                <span className="num font-mono text-[10px] text-[var(--fg-subtle)]">{jobs.length}</span>
              </div>
              <div className="relative">
                <IconSearch size={12} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[var(--fg-faint)]" />
                <Input
                  value={jobQuery}
                  onChange={(e) => setJobQuery(e.target.value)}
                  placeholder="Filter library…"
                  className="h-7 pl-7 pr-6 font-mono text-[11px]"
                />
                {jobQuery && (
                  <button
                    type="button"
                    onClick={() => setJobQuery("")}
                    className="absolute top-1/2 right-2 -translate-y-1/2 text-[var(--fg-faint)] hover:text-[var(--fg)]"
                  >
                    <IconX size={11} />
                  </button>
                )}
              </div>
              <Segmented
                size="xs"
                className="w-full"
                value={jobFilter}
                onChange={setJobFilter}
                options={[
                  { id: "all", label: "All" },
                  { id: "video", label: "Video" },
                  { id: "audio", label: "Audio" },
                  { id: "failed", label: "Failed" },
                ]}
              />
            </div>

            <div className="max-h-[calc(100vh-340px)] min-h-[180px] overflow-y-auto p-1.5">
              {!filteredJobs.length ? (
                <Empty
                  icon={<IconFilm size={18} />}
                  title={jobs.length ? "No matching jobs" : "No media yet"}
                  hint={jobs.length ? "Clear your filter above." : "Drop any MP3, WAV, M4A, MP4, MOV, or MKV file."}
                />
              ) : (
                <div className="space-y-0.5">
                  {filteredJobs.map((j) => (
                    <JobRow
                      key={j.id}
                      job={j}
                      selected={selectedId === j.id}
                      onSelect={() => select(j.id)}
                      onDelete={() => deleteJob(j.id)}
                      onCancel={() => cancelJob(j.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </Card>
        </aside>

        {/* Center Main Stage */}
        <main className="min-w-0 space-y-3">
          {!detail ? (
            <Card className="overflow-hidden">
              <div className="grid-bg py-12">
                <Empty
                  icon={<IconBolt size={22} />}
                  title="Precision Audio + Video Studio"
                  hint="Drop one or multiple audio/video files anywhere on screen. Every word is force-aligned at 20 ms resolution with wav2vec2 CTC, and every video section describes 5-second windows with 1-second overlap locked to physical FFmpeg scene cuts."
                />
              </div>
              <div className="grid gap-px border-t border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
                {[
                  { k: "20 ms Acoustic Alignment", v: "wav2vec2 ONNX CTC + physical waveform attack & decay refinement" },
                  { k: "Synced Video Storyboard", v: "30s sections · 5s core slots · 1.0s overlap · pixel scene cuts" },
                  { k: "LRU Key Load Balancer", v: "Model-first round-robin across unlimited keys + instant 429 failover" },
                ].map((x) => (
                  <div key={x.k} className="bg-[var(--surface)] px-4 py-3.5">
                    <div className="text-[12px] font-semibold text-[var(--fg)]">{x.k}</div>
                    <div className="mt-1 text-[11px] leading-relaxed text-[var(--fg-subtle)]">{x.v}</div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <>
              {/* Clean Minimal Job Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-sm)]">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusDot status={detail.status} />
                    {renaming ? (
                      <input
                        autoFocus
                        value={renameVal}
                        onChange={(e) => setRenameVal(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void commitRename();
                          if (e.key === "Escape") setRenaming(false);
                        }}
                        className="h-7 rounded border border-[var(--accent)] bg-[var(--surface-2)] px-2 text-[14px] font-semibold text-[var(--fg)] focus:outline-none"
                      />
                    ) : (
                      <h1
                        onDoubleClick={() => {
                          setRenameVal(detail.filename);
                          setRenaming(true);
                        }}
                        title="Double-click to rename"
                        className="cursor-text truncate text-[14.5px] font-semibold tracking-tight text-[var(--fg)]"
                      >
                        {detail.filename}
                      </h1>
                    )}
                    <Badge tone={detail.mediaKind === "video" ? "visual" : "info"}>{detail.mediaKind}</Badge>
                    {detail.simulated && <Badge tone="warning">simulated</Badge>}
                    {detail.status !== "completed" && (
                      <Badge tone={detail.status === "failed" ? "danger" : "accent"}>{detail.status}</Badge>
                    )}
                  </div>

                  <div className="num mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[10.5px] text-[var(--fg-subtle)]">
                    <span>{fmtBytes(detail.sizeBytes)}</span>
                    {detail.durationSec != null && <span>· {fmtClock(detail.durationSec)}</span>}
                    {detail.wordCount > 0 && <span>· {detail.wordCount.toLocaleString()} words</span>}
                    {detail.sentenceCount > 0 && <span>· {detail.sentenceCount} sentences</span>}
                    {detail.transcript?.video && (
                      <span>· {detail.transcript.video.observations.length} × 5s visual slots</span>
                    )}
                  </div>

                  {detail.status === "failed" && detail.error && (
                    <div
                      className="mt-2 rounded-lg border px-2.5 py-1.5 text-[11.5px]"
                      style={{
                        borderColor: "color-mix(in oklab,var(--danger) 32%,transparent)",
                        background: "var(--danger-soft)",
                        color: "var(--danger)",
                      }}
                    >
                      {detail.error}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  {(detail.status === "working" || detail.status === "queued") && (
                    <Button size="xs" variant="danger" icon={<IconStop size={11} />} onClick={() => cancelJob(detail.id)}>
                      Stop
                    </Button>
                  )}
                  {detail.transcript?.words?.length && detail.status !== "working" && detail.status !== "queued" && (
                    <Button
                      size="xs"
                      variant="secondary"
                      icon={<IconScissors size={11} />}
                      onClick={() => realign(detail.id)}
                      title="Re-run 20 ms acoustic alignment without using API quota"
                    >
                      Re-align
                    </Button>
                  )}
                  {detail.status !== "working" && detail.status !== "queued" && retryable(detail) > 0 && (
                    <Button
                      size="xs"
                      variant="secondary"
                      icon={<IconRefresh size={11} />}
                      onClick={() => retry(detail.id)}
                      title="Retry failed/incomplete chunks while keeping finished chunks cached"
                    >
                      Retry ({retryable(detail)})
                    </Button>
                  )}
                  <IconButton label="Delete job" onClick={() => deleteJob(detail.id)}>
                    <IconTrash size={14} />
                  </IconButton>
                </div>
              </div>

              {/* Engaging Live Pipeline / Collapsible Completion Bar */}
              <StageRail job={detail} liveConnected={liveConnected} />

              {/* Mobile Workspace / Inspector Switch */}
              <div className="flex justify-center xl:hidden">
                <Segmented
                  size="xs"
                  value={mobilePanel}
                  onChange={setMobilePanel}
                  options={[
                    { id: "workspace", label: "Studio Transcript" },
                    { id: "inspector", label: "Log, Metrics & Cuts" },
                  ]}
                />
              </div>

              <div className={mobilePanel === "workspace" ? "" : "hidden xl:block"}>
                <TranscriptWorkspace
                  job={detail}
                  registerShortcuts={handleRegisterShortcuts}
                  onTranscriptEdited={(nextDoc) => updateTranscriptOptimistic(nextDoc)}
                />
              </div>
            </>
          )}
        </main>

        {/* Right Contextual Inspector Rail */}
        <aside className={`${mobilePanel === "inspector" ? "block" : "hidden"} xl:block`}>
          {detail ? (
            <RightInspector
              job={detail}
              onSeek={(sec) => {
                setMobilePanel("workspace");
                transport?.seekAbsolute(sec, true);
              }}
            />
          ) : (
            <Card className="p-4">
              <div className="label mb-2">Studio Capabilities</div>
              <ul className="space-y-2 text-[11.5px] leading-relaxed text-[var(--fg-muted)]">
                <li>
                  <strong className="text-[var(--fg)]">Bright & Dark Themes:</strong> Switch anytime in the header (`Shift+D`) with zero page flash.
                </li>
                <li>
                  <strong className="text-[var(--fg)]">Inline Editing:</strong> Double-click any spoken word or 5-second visual slot to refine text without losing timestamps.
                </li>
                <li>
                  <strong className="text-[var(--fg)]">Rough-Cut EDL Export:</strong> Export `CMX 3600 .edl` timelines that strip pauses ≥ 450 ms for Premiere & DaVinci.
                </li>
                <li>
                  <strong className="text-[var(--fg)]">Silent & MKV Video Ready:</strong> Handles audio-less screen recordings and non-web containers automatically.
                </li>
              </ul>
            </Card>
          )}
        </aside>
      </div>

      {/* Drawers & Command Palette */}
      <DrawerModal
        open={keysDrawer}
        title="Gemini API Keys & Load Balancer"
        subtitle="Model-first LRU round-robin across unlimited keys"
        width="lg"
        onClose={() => setKeysDrawer(false)}
      >
        <KeysCard
          keys={keys}
          busy={keysBusy}
          onImport={async (text, meta) => {
            setKeysBusy(true);
            try {
              const r = await fetch("/api/keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keys: text, from: meta.from, project: meta.project }),
              });
              const d = await r.json();
              if (!r.ok) throw new Error(d.error || "Import failed");
              setKeys(d.keys);
              void refresh();
              return { added: d.added ?? 0, duplicates: d.duplicates ?? 0, invalid: d.invalid ?? 0 };
            } finally {
              setKeysBusy(false);
            }
          }}
          onRemove={async (id) => {
            const r = await fetch(`/api/keys/${id}`, { method: "DELETE" });
            if (r.ok) {
              setKeys((await r.json()).keys);
              void refresh();
            }
          }}
          onReset={async () => {
            setKeysBusy(true);
            try {
              const r = await fetch("/api/keys/reset", { method: "POST" });
              if (r.ok) {
                setKeys((await r.json()).keys);
                void refresh();
              }
            } finally {
              setKeysBusy(false);
            }
          }}
        />
      </DrawerModal>

      <DrawerModal
        open={settingsDrawer}
        title="Engine Settings"
        subtitle="Chunk planning, model priority & failover pipeline"
        width="lg"
        onClose={() => setSettingsDrawer(false)}
      >
        <SettingsCard value={settings} onChange={setSettings} />
      </DrawerModal>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        jobs={jobs}
        detail={detail}
        onSelectJob={(id) => select(id)}
        onSeekTo={(sec) => transport?.seekAbsolute(sec, true)}
        onSetTheme={(m) => setThemeMode(m)}
        onOpenKeys={() => {
          void loadKeysAndSettings();
          setKeysDrawer(true);
        }}
        onOpenSettings={() => {
          void loadKeysAndSettings();
          setSettingsDrawer(true);
        }}
      />

      <ToastContainer />
    </div>
  );
}

function JobRow({
  job,
  selected,
  onSelect,
  onDelete,
  onCancel,
}: {
  job: JobSummary;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const active = job.status === "working" || job.status === "queued";
  return (
    <div
      className={`group relative cursor-pointer rounded-lg border px-2.5 py-2 transition-all duration-150 ${
        selected
          ? "border-[var(--accent-border)] bg-[var(--accent-soft)] glow-accent shadow-xs"
          : "border-transparent hover:bg-[var(--surface-2)]"
      }`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="flex items-center gap-2">
        <StatusDot status={job.status} />
        <span
          className="shrink-0"
          style={{ color: job.mediaKind === "video" ? "var(--visual)" : "var(--info)" }}
          title={job.mediaKind}
        >
          {job.mediaKind === "video" ? <IconFilm size={12} /> : <IconWave size={12} />}
        </span>
        <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[var(--fg)]">{job.filename}</span>
        {job.status === "working" && (
          <span className="live-eq-bar shrink-0" title="Processing audio pipeline">
            <span />
            <span />
            <span />
          </span>
        )}
        <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          {active && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
              className="rounded p-1 text-[var(--fg-subtle)] hover:bg-[var(--surface-3)] hover:text-[var(--warning)]"
              aria-label="Stop job"
            >
              <IconStop size={11} />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded p-1 text-[var(--fg-subtle)] hover:bg-[var(--surface-3)] hover:text-[var(--danger)]"
            aria-label="Delete job"
          >
            <IconTrash size={11} />
          </button>
        </span>
      </div>
      <div className="num mt-0.5 flex items-center justify-between gap-2 pl-[18px] font-mono text-[9.5px] text-[var(--fg-subtle)]">
        <span>
          {job.status === "working"
            ? `${Math.round(job.progress * 100)}% · ${job.stage}`
            : job.status === "completed"
              ? `${job.wordCount.toLocaleString()} words`
              : job.status}
        </span>
        <span>{relTime(job.createdAt)}</span>
      </div>
      {active && (
        <div className="mt-1.5 ml-[18px]">
          <Progress value={job.progress} height={2} />
        </div>
      )}
    </div>
  );
}

function retryable(job: { status: string; chunks: { status: string }[] }): number {
  const failedChunks = job.chunks.filter((c) => c.status !== "done").length;
  if (failedChunks > 0) return failedChunks;
  return job.status === "failed" || job.status === "canceled" ? 1 : 0;
}
