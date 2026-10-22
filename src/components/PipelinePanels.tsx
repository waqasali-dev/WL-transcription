"use client";
import { useEffect, useRef, useState } from "react";
import { STAGES, type EventRow, type JobDetail, type StageState } from "@/lib/types";
import { Badge, Card, CardHeader, Divider, Empty, EqBars, Progress, Segmented, Spinner, Stat } from "./ui";
import { IconActivity, IconCheck, IconChevron, IconScissors, IconSearch, IconX } from "./icons";
import { fmtBytes, fmtClock, fmtMs } from "@/lib/format";

/**
 * Engaging Cursor-IDE-style Live Pipeline Experience when a job is working,
 * which smoothly collapses into a sleek 1-line summary bar once completed so
 * the transcript & video player take center stage without clutter!
 */
export function StageRail({ job, liveConnected }: { job: JobDetail; liveConnected?: boolean }) {
  const isWorking = job.status === "working" || job.status === "queued";
  const [expanded, setExpanded] = useState(isWorking);
  const [elapsedNow, setElapsedNow] = useState(() => Date.now());

  useEffect(() => {
    setExpanded(isWorking);
  }, [job.id, isWorking]);

  useEffect(() => {
    if (!isWorking) return;
    const t = setInterval(() => setElapsedNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [isWorking]);

  const log: StageState[] = job.stageLog || [];
  const doneStages = new Set(log.filter((s) => s.doneAt).map((s) => s.stage));
  const activeStage = job.status === "working" ? job.stage : null;
  const doneChunks = job.chunks.filter((c) => c.status === "done").length;
  const v = job.transcript?.video;
  const totalSections = job.durationSec ? Math.max(1, Math.ceil(job.durationSec / 30)) : 0;

  const latestEvent = job.events.length ? job.events[job.events.length - 1] : null;
  const curStageIdx = STAGES.findIndex((s) => s.key === activeStage);
  const nextStage = curStageIdx >= 0 && curStageIdx < STAGES.length - 1 ? STAGES[curStageIdx + 1] : null;

  const totalElapsedMs = (() => {
    if (!log.length) return null;
    const t0 = new Date(log[0].startedAt).getTime();
    const tEnd = job.completedAt ? new Date(job.completedAt).getTime() : elapsedNow;
    return Math.max(0, tEnd - t0);
  })();

  const meta = (key: string): string | null => {
    switch (key) {
      case "discovery":
        return doneStages.has("discovery") || job.status === "completed" ? "LRU pool ready" : null;
      case "analysis":
        return job.durationSec != null ? `${job.durationSec.toFixed(2)}s · ${job.silences?.length ?? 0} pauses` : null;
      case "onsets":
        return job.onsets?.length ? `${job.onsets.length.toLocaleString()} attacks` : null;
      case "chunking":
        return job.chunks.length ? `${job.chunks.length} snapped clips` : null;
      case "transcription":
        return job.chunks.length ? `${doneChunks}/${job.chunks.length} · ${job.wordCount} words` : null;
      case "alignment":
        return job.anchoredCount != null
          ? `${job.anchoredCount}/${job.alignedTotal} · ${Math.round((job.transcript?.alignment?.avgConfidence ?? 0) * 100)}% conf`
          : null;
      case "video":
        if (job.mediaKind !== "video") return "audio-only";
        return v
          ? v.complete
            ? `${v.observations.length} × 5s · ${v.sceneCuts?.length ?? 0} cuts`
            : `${v.sections.length}/${totalSections} sections`
          : totalSections
            ? `${totalSections} × 30s (${Math.ceil(job.durationSec! / 5)} × 5s)`
            : null;
      case "assembly":
        return job.sentenceCount ? `${job.sentenceCount} sentences` : null;
      case "persist":
        return job.status === "completed" ? "atomic JSON v5" : null;
      default:
        return null;
    }
  };

  const durOf = (key: string) => {
    const s = log.find((x) => x.stage === key);
    if (!s) return null;
    const a = new Date(s.startedAt).getTime();
    const b = s.doneAt ? new Date(s.doneAt).getTime() : elapsedNow;
    return fmtMs(Math.max(0, b - a));
  };

  // Compact 1-line summary bar when finished unless expanded
  if (!isWorking && !expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-left transition-colors hover:bg-[var(--surface-2)]"
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-[11.5px]">
          <span className="inline-flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--success)]">
            <IconCheck size={11} />
          </span>
          <span className="font-medium text-[var(--fg)]">
            {job.status === "completed" ? "All pipeline stages complete" : `Stopped at ${job.stage}`}
          </span>
          <span className="font-mono text-[10.5px] text-[var(--fg-subtle)]">
            {totalElapsedMs != null ? `in ${fmtMs(totalElapsedMs)}` : ""}
            {job.chunks.length ? ` · ${doneChunks}/${job.chunks.length} chunks` : ""}
            {job.transcript?.alignment?.avgConfidence != null
              ? ` · ${Math.round(job.transcript.alignment.avgConfidence * 100)}% CTC conf`
              : ""}
            {v ? ` · ${v.observations.length} × 5s video windows` : ""}
          </span>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] text-[var(--fg-subtle)]">
          inspect stages <IconChevron size={12} className="rotate-90" />
        </span>
      </button>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Live "Cursor IDE" active thinking / working header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {isWorking ? <EqBars active /> : <IconActivity size={14} className="text-[var(--success)]" />}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-[12.5px] font-semibold text-[var(--fg)]">
                {isWorking
                  ? latestEvent?.title || `Running ${STAGES[curStageIdx]?.label || job.stage}…`
                  : "Pipeline Execution Trace"}
              </span>
              {isWorking && liveConnected && <Badge tone="success">live SSE</Badge>}
              {isWorking && nextStage && (
                <span className="hidden font-mono text-[10px] text-[var(--fg-subtle)] sm:inline">
                  next → {nextStage.label}
                </span>
              )}
            </div>
            {isWorking && latestEvent?.message && (
              <div className="mt-0.5 truncate font-mono text-[10.5px] text-[var(--fg-muted)]">{latestEvent.message}</div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {totalElapsedMs != null && (
            <span className="num font-mono text-[11px] font-medium text-[var(--fg-muted)]">{fmtMs(totalElapsedMs)}</span>
          )}
          {isWorking && (
            <Badge tone="accent" className="num">
              {Math.round(job.progress * 100)}%
            </Badge>
          )}
          {!isWorking && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="rounded-md px-2 py-1 font-mono text-[10px] text-[var(--fg-subtle)] hover:bg-[var(--surface-3)] hover:text-[var(--fg)]"
            >
              collapse
            </button>
          )}
        </div>
      </div>

      {isWorking && <Progress value={job.progress} height={2.5} className="rounded-none" />}

      {/* 9-stage precision matrix */}
      <div className="grid gap-px bg-[var(--border)] sm:grid-cols-3">
        {STAGES.map((s, i) => {
          const skipped = s.key === "video" && job.mediaKind !== "video";
          const done = !skipped && (doneStages.has(s.key) || job.status === "completed");
          const active = activeStage === s.key;
          const m = meta(s.key);
          const d = durOf(s.key);
          return (
            <div
              key={s.key}
              className={`relative px-3 py-2 transition-colors ${
                active ? "bg-[var(--accent-soft)]" : skipped ? "bg-[var(--bg-subtle)] opacity-70" : "bg-[var(--surface)]"
              }`}
            >
              {active && <span className="absolute inset-y-0 left-0 w-[2.5px]" style={{ background: "var(--accent)" }} />}
              <div className="flex items-center justify-between gap-1.5">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span
                    className="num font-mono text-[9.5px] font-semibold"
                    style={{ color: active ? "var(--accent)" : done ? "var(--success)" : "var(--fg-faint)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="truncate text-[11.5px] font-medium"
                    style={{ color: active || done ? "var(--fg)" : "var(--fg-subtle)" }}
                  >
                    {s.label}
                  </span>
                </span>
                {active ? (
                  <Spinner className="h-3 w-3 text-[var(--accent)]" />
                ) : done ? (
                  <IconCheck size={12} className="text-[var(--success)]" />
                ) : skipped ? (
                  <span className="font-mono text-[9px] text-[var(--fg-faint)]">skip</span>
                ) : null}
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <span className="num truncate font-mono text-[9.5px] text-[var(--fg-subtle)]">{m || s.blurb}</span>
                {d && !skipped && <span className="num shrink-0 font-mono text-[9px] text-[var(--fg-faint)]">{d}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Chunk Progress Strip when chunks exist */}
      {job.chunks.length > 0 && (
        <div className="border-t border-[var(--border)] bg-[var(--surface)] px-3.5 py-2">
          <div className="mb-1.5 flex items-center justify-between font-mono text-[9.5px] text-[var(--fg-subtle)]">
            <span>Silence-snapped audio chunks ({doneChunks}/{job.chunks.length})</span>
            <span>{job.wordCount.toLocaleString()} words extracted</span>
          </div>
          <div className="grid grid-cols-4 gap-1 sm:grid-cols-6 md:grid-cols-8">
            {job.chunks.map((c) => {
              const bg =
                c.status === "done"
                  ? "bg-[var(--success-soft)] border-[color-mix(in_oklab,var(--success)_35%,transparent)] text-[var(--success)]"
                  : c.status === "transcribing"
                    ? "bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--accent)] animate-pulse"
                    : c.status === "failed"
                      ? "bg-[var(--danger-soft)] border-[color-mix(in_oklab,var(--danger)_35%,transparent)] text-[var(--danger)]"
                      : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--fg-faint)]";
              return (
                <div
                  key={c.idx}
                  title={`Chunk #${c.idx + 1} [${c.coreStart.toFixed(1)}s → ${c.coreEnd.toFixed(1)}s] · ${c.status}${
                    c.wordCount ? ` · ${c.wordCount}w` : ""
                  }${c.model ? ` · ${c.model}` : ""}`}
                  className={`flex items-center justify-between rounded border px-1.5 py-1 font-mono text-[9.5px] ${bg}`}
                >
                  <span className="num font-semibold">#{c.idx + 1}</span>
                  <span className="num">{c.status === "done" ? `${c.wordCount}w` : c.status.slice(0, 4)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

const LEVEL_STYLE: Record<string, { c: string; l: string }> = {
  stage: { c: "var(--accent)", l: "RUN" },
  success: { c: "var(--success)", l: "OK" },
  warn: { c: "var(--warning)", l: "WARN" },
  error: { c: "var(--danger)", l: "ERR" },
  api: { c: "var(--info)", l: "KEY" },
  model: { c: "var(--visual)", l: "AI" },
  info: { c: "var(--fg-subtle)", l: "LOG" },
};

/**
 * Clean tabbed Right Inspector:
 *  - `log`: Real-time streaming process log with search & level pills
 *  - `metrics`: Precision CTC confidence, chunk coverage breakdown, video sync, source specs
 *  - `cuts`: Interactive NLE Cut & Pause Jump List (every FFmpeg scene cut + dead-air silence >= 400ms!)
 */
export function RightInspector({
  job,
  onSeek,
}: {
  job: JobDetail;
  onSeek: (sec: number) => void;
}) {
  const [tab, setTab] = useState<"log" | "metrics" | "cuts">(job.status === "working" ? "log" : "metrics");
  const [filter, setFilter] = useState("");
  const [level, setLevel] = useState<string>("all");
  const boxRef = useRef<HTMLDivElement>(null);
  const [stick, setStick] = useState(true);

  useEffect(() => {
    setTab(job.status === "working" || job.status === "queued" ? "log" : "metrics");
  }, [job.id, job.status]);

  useEffect(() => {
    const el = boxRef.current;
    if (el && stick && tab === "log") el.scrollTop = el.scrollHeight;
  }, [job.events.length, stick, tab]);

  const a = job.transcript?.alignment;
  const v = job.transcript?.video;
  const sceneCuts = v?.sceneCuts ?? [];
  const silences = (job.silences ?? []).filter((s) => s.end - s.start >= 0.4);

  const filteredEvents = job.events.filter((e) => {
    if (level !== "all" && e.level !== level) return false;
    if (filter && !`${e.title} ${e.message}`.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="border-b border-[var(--border)] p-2.5">
        <Segmented
          size="xs"
          className="w-full"
          value={tab}
          onChange={setTab}
          options={[
            { id: "log", label: `Log (${job.events.length})` },
            { id: "metrics", label: "Metrics" },
            { id: "cuts", label: `Cuts (${sceneCuts.length + silences.length})` },
          ]}
        />
      </div>

      {tab === "log" && (
        <>
          <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--border)] px-2.5 py-2">
            <div className="relative flex-1">
              <IconSearch size={11} className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-[var(--fg-faint)]" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter stream…"
                className="h-6.5 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] pl-6 pr-6 font-mono text-[10.5px] text-[var(--fg)] placeholder:text-[var(--fg-faint)] focus:border-[var(--accent)] focus:outline-none"
              />
              {filter && (
                <button
                  type="button"
                  onClick={() => setFilter("")}
                  className="absolute top-1/2 right-1.5 -translate-y-1/2 text-[var(--fg-faint)] hover:text-[var(--fg)]"
                >
                  <IconX size={10} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              {["all", "warn", "error", "api"].map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLevel(l)}
                  className={`h-6 rounded px-1.5 font-mono text-[9.5px] transition-colors ${
                    level === l ? "bg-[var(--surface-3)] text-[var(--fg)]" : "text-[var(--fg-faint)] hover:text-[var(--fg-muted)]"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div
            ref={boxRef}
            onScroll={() => {
              const el = boxRef.current;
              if (el) setStick(el.scrollHeight - el.scrollTop - el.clientHeight < 48);
            }}
            className="max-h-[62vh] min-h-[260px] overflow-y-auto font-mono text-[10.5px] leading-relaxed"
          >
            {!filteredEvents.length ? (
              <Empty title="No events yet" hint="Live process steps stream here in real time." />
            ) : (
              filteredEvents.map((e) => {
                const st = LEVEL_STYLE[e.level] ?? LEVEL_STYLE.info;
                return (
                  <div key={e.id} className="border-b border-[var(--border)] px-3 py-1.5 last:border-0 hover:bg-[var(--surface-2)]">
                    <div className="flex items-baseline gap-1.5">
                      <span className="num shrink-0 text-[9px] text-[var(--fg-faint)]">
                        {new Date(e.ts).toLocaleTimeString([], { hour12: false })}
                      </span>
                      <span className="num w-7 shrink-0 text-[8.5px] font-bold" style={{ color: st.c }}>
                        {st.l}
                      </span>
                      <span
                        className="min-w-0 break-words font-medium"
                        style={{ color: e.level === "error" ? "var(--danger)" : e.level === "stage" ? "var(--accent)" : "var(--fg)" }}
                      >
                        {e.title}
                      </span>
                    </div>
                    {e.message && <div className="mt-0.5 break-words pl-10 text-[10px] text-[var(--fg-muted)]">{e.message}</div>}
                  </div>
                );
              })
            )}
            {job.status === "working" && (
              <div className="flex items-center gap-2 px-3 py-2 text-[var(--accent)]">
                <Spinner className="h-3 w-3" />
                <span className="text-[10px] text-[var(--fg-subtle)]">awaiting next engine event…</span>
              </div>
            )}
          </div>
        </>
      )}

      {tab === "metrics" && (
        <div className="max-h-[68vh] space-y-3 overflow-y-auto p-3">
          <Divider label="acoustic precision" />
          <div>
            <Stat
              label="Alignment engine"
              value={a?.method === "ctc-forced" ? "20ms wav2vec2 CTC" : a ? "Drift fallback" : "Pending"}
              tone={a?.method === "ctc-forced" ? "success" : undefined}
            />
            <Stat label="Words placed" value={a ? `${a.anchored}/${a.total}` : "—"} />
            <Stat
              label="Mean acoustic conf"
              value={a?.avgConfidence != null ? `${Math.round(a.avgConfidence * 100)}%` : "—"}
              tone={(a?.avgConfidence ?? 0) >= 0.65 ? "success" : "warning"}
            />
            <Stat
              label="Uncertain words (<35%)"
              value={a?.lowConfidence ?? "—"}
              tone={(a?.lowConfidence ?? 0) > 15 ? "warning" : undefined}
            />
            <Stat label="Waveform attacks refined" value={a?.refined ?? "—"} />
            <Stat label="Speech coverage" value={job.coverage != null ? `${Math.round(job.coverage * 100)}%` : "—"} />
            <Stat label="Longest miss" value={job.longestMissSec != null ? `${job.longestMissSec.toFixed(2)}s` : "—"} />
          </div>

          {v && (
            <>
              <Divider label="video synchronization" />
              <div>
                <Stat label="30s sections" value={v.sections.length} />
                <Stat label="5s visual windows" value={v.observations.length} />
                <Stat label="Boundary overlap" value={`${v.overlapSeconds}.0s`} />
                <Stat label="FFmpeg scene cuts" value={v.sceneCuts?.length ?? 0} tone="accent" />
                <Stat label="Synced event markers" value={v.observations.reduce((n, o) => n + (o.events?.length ?? 0), 0)} />
              </div>
            </>
          )}

          <Divider label="source specification" />
          <div>
            <Stat label="File size" value={fmtBytes(job.sizeBytes)} />
            <Stat label="Duration" value={job.durationSec != null ? fmtClock(job.durationSec) : "—"} />
            {job.fingerprint && <Stat label="SHA-256" value={`${job.fingerprint.slice(0, 10)}…`} />}
            {job.videoMeta && <Stat label="Video stream" value={`${job.videoMeta.width}×${job.videoMeta.height} · ${job.videoMeta.fps}fps`} />}
            {job.videoMeta && <Stat label="Video codec" value={job.videoMeta.codec} />}
          </div>
        </div>
      )}

      {tab === "cuts" && (
        <div className="max-h-[68vh] space-y-3 overflow-y-auto p-3">
          {sceneCuts.length > 0 && (
            <div>
              <div className="label mb-1.5">FFmpeg Scene Cuts ({sceneCuts.length})</div>
              <div className="flex flex-wrap gap-1">
                {sceneCuts.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onSeek(c)}
                    className="num inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 font-mono text-[10px] text-[var(--fg)] transition-colors hover:border-[var(--visual)] hover:text-[var(--visual)]"
                  >
                    <IconScissors size={10} /> {fmtClock(c)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="label mb-1.5">Dead-Air Silences ≥ 400ms ({silences.length})</div>
            {!silences.length ? (
              <div className="text-[11px] text-[var(--fg-subtle)]">Continuous narration — no dead-air gaps ≥ 400ms.</div>
            ) : (
              <div className="space-y-1">
                {silences.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onSeek(Math.max(0, s.start - 0.15))}
                    className="flex w-full items-center justify-between rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5 font-mono text-[10.5px] transition-colors hover:border-[var(--accent)]"
                  >
                    <span className="num text-[var(--fg)]">
                      {fmtClock(s.start)} → {fmtClock(s.end)}
                    </span>
                    <Badge tone="warning">{(s.end - s.start).toFixed(2)}s gap</Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
