"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AppSettings, JobDetail, JobSummary, KeyInfo } from "@/lib/types";
import { fmtBytes, fmtClock, fmtSec } from "@/lib/types";
import { UploadPanel } from "./UploadPanel";
import { SettingsPanel } from "./SettingsPanel";
import { KeysPanel } from "./KeysPanel";
import { StageRail } from "./StageRail";
import { ActivityFeed } from "./ActivityFeed";
import { ChunksPanel } from "./ChunksPanel";
import { TranscriptPanel } from "./TranscriptPanel";
import { Chip, EqBars, IconBolt, IconDownload, IconStop, IconTrash, IconWave, Spinner, StatusDot } from "./ui";

export function Studio() {
  const [list, setList] = useState<JobSummary[]>([]);
  const [queueBusy, setQueueBusy] = useState(false);
  const [keyCount, setKeyCount] = useState(0);
  const [selId, setSelId] = useState<string | null>(null);
  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [keys, setKeys] = useState<KeyInfo[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [keysBusy, setKeysBusy] = useState(false);

  const sinceRef = useRef(0);
  const detailIdRef = useRef<string | null>(null);
  const followRef = useRef(true);
  const inflightRef = useRef(false);
  const tickRef = useRef(0);

  const anyActive = list.some((j) => j.status === "working" || j.status === "queued");

  const refresh = useCallback(async () => {
    if (inflightRef.current) return;
    inflightRef.current = true;
    try {
      tickRef.current += 1;
      const res = await fetch("/api/jobs", { cache: "no-store" });
      const data = await res.json();
      setList(data.jobs);
      setKeyCount(data.keyCount);
      setQueueBusy(data.queue?.running ?? false);

      const active = data.jobs.find((j: JobSummary) => j.status === "working") || data.jobs.find((j: JobSummary) => j.status === "queued");
      let id = selId;
      if (followRef.current) {
        if (active) id = active.id;
        else if (!id) id = data.jobs[0]?.id ?? null;
        if (id !== selId) setSelId(id);
      } else if (id && !data.jobs.some((j: JobSummary) => j.id === id)) {
        id = active?.id ?? data.jobs[0]?.id ?? null;
        setSelId(id);
      }

      if (id) {
        if (detailIdRef.current !== id) {
          detailIdRef.current = id;
          sinceRef.current = 0;
          setDetail(null);
        }
        const dRes = await fetch(`/api/jobs/${id}?since=${sinceRef.current}`, { cache: "no-store" });
        if (dRes.ok) {
          const d = await dRes.json();
          if (d.events?.length) {
            sinceRef.current = Math.max(sinceRef.current, ...d.events.map((e: { id: number }) => e.id));
          }
          setDetail((prev) => {
            if (!prev || detailIdRef.current !== id) return d;
            return { ...d, events: [...prev.events, ...d.events].slice(-500) };
          });
        }
      } else {
        detailIdRef.current = null;
        sinceRef.current = 0;
        setDetail(null);
      }

      if (tickRef.current % 5 === 1) {
        const kRes = await fetch("/api/keys", { cache: "no-store" });
        if (kRes.ok) setKeys((await kRes.json()).keys);
      }
    } finally {
      inflightRef.current = false;
    }
  }, [selId]);

  useEffect(() => {
    const settingsLoad = async () => {
      const r = await fetch("/api/settings", { cache: "no-store" });
      if (r.ok) setSettings(await r.json());
      const k = await fetch("/api/keys", { cache: "no-store" });
      if (k.ok) setKeys((await k.json()).keys);
    };
    void settingsLoad();
    void refresh();
    const iv = setInterval(() => void refresh(), anyActive ? 900 : 3000);
    return () => clearInterval(iv);
  }, [refresh, anyActive]);

  const selectJob = (id: string) => {
    followRef.current = false;
    setSelId(id);
  };

  const onStarted = (id: string) => {
    followRef.current = true;
    setSelId(id);
    void refresh();
  };

  const removeJob = async (id: string) => {
    await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    if (selId === id) {
      followRef.current = true;
      setSelId(null);
    }
    void refresh();
  };

  return (
    <div className="min-h-screen">
      {/* header */}
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1720px] items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-acc/40 bg-acc/10 text-acc">
              <IconWave className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-bold tracking-tight">
                  Splicer <span className="text-acc">·</span> Precision Audio Engine
                </span>
              </div>
              <div className="hidden font-mono text-[9.5px] uppercase tracking-[0.18em] text-dim sm:block">
                gemini native audio · ffmpeg waveform onsets · 4-pass gapless alignment
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <EqBars active={anyActive} />
            <Chip tone={anyActive ? "acc" : "mut"}>{anyActive ? "processing" : "idle"}</Chip>
            <Chip tone={keyCount > 0 ? "ok" : "warn"}>{keyCount} key{keyCount === 1 ? "" : "s"}</Chip>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1720px] gap-3 px-4 py-4 xl:grid-cols-[310px_minmax(0,1fr)_350px]">
        {/* left column */}
        <div className="flex flex-col gap-3">
          <UploadPanel onStarted={onStarted} busy={queueBusy} />
          <SettingsPanel initial={settings} onChange={setSettings} />

          {/* job list */}
          <div className="rounded-lg border border-line bg-panel">
            <div className="border-b border-line px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">Jobs</div>
            <div className="max-h-72 overflow-y-auto p-1.5">
              {list.length === 0 && <div className="px-2 py-3 text-center text-[11px] text-dim">No jobs yet — drop an audio file to start.</div>}
              <div className="space-y-1">
                {list.map((j) => (
                  <button
                    key={j.id}
                    onClick={() => selectJob(j.id)}
                    className={`group w-full rounded border px-2 py-1.5 text-left transition-colors ${
                      selId === j.id ? "border-acc/50 bg-acc/10" : "border-transparent hover:border-line2 hover:bg-panel2"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <StatusDot status={j.status} />
                        <span className="truncate text-xs font-medium text-ink">{j.filename}</span>
                        {j.simulated && <Chip tone="warn">sim</Chip>}
                      </span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          void removeJob(j.id);
                        }}
                        className="shrink-0 text-dim opacity-0 transition-opacity hover:text-bad group-hover:opacity-100"
                        title="Delete job"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <div className="num mt-1 flex items-center justify-between font-mono text-[9.5px] text-dim">
                      <span>
                        {j.status === "working"
                          ? `${Math.round(j.progress * 100)}% · ${j.stage}`
                          : `${j.status} · ${new Date(j.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                      </span>
                      <span>{j.wordCount > 0 ? `${j.wordCount} words` : fmtSec(j.durationSec)}</span>
                    </div>
                    {j.status === "working" && (
                      <div className="mt-1 h-0.5 w-full overflow-hidden rounded bg-raise">
                        <div className="h-full bg-acc transition-[width] duration-500" style={{ width: `${j.progress * 100}%` }} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <KeysPanel
            keys={keys}
            busy={keysBusy}
            onAdd={async (k) => {
              setKeysBusy(true);
              try {
                const r = await fetch("/api/keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(k) });
                const d = await r.json();
                if (!r.ok) throw new Error(d.error || "Failed to add key");
                setKeys(d.keys);
              } finally {
                setKeysBusy(false);
              }
            }}
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
                return { added: d.added ?? 0, duplicates: d.duplicates ?? 0, invalid: d.invalid ?? 0 };
              } finally {
                setKeysBusy(false);
              }
            }}
            onRemove={async (id) => {
              const r = await fetch(`/api/keys/${id}`, { method: "DELETE" });
              const d = await r.json();
              if (r.ok) setKeys(d.keys);
            }}
            onReset={async () => {
              setKeysBusy(true);
              try {
                const r = await fetch("/api/keys/reset", { method: "POST" });
                const d = await r.json();
                if (r.ok) setKeys(d.keys);
              } finally {
                setKeysBusy(false);
              }
            }}
          />
        </div>

        {/* center column */}
        <div className="flex min-w-0 flex-col gap-3">
          {detail ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-panel px-3 py-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusDot status={detail.status} />
                    <span className="truncate text-sm font-semibold text-ink">{detail.filename}</span>
                    {detail.simulated && <Chip tone="warn">simulated text</Chip>}
                    <Chip tone={detail.status === "completed" ? "ok" : detail.status === "failed" ? "bad" : "acc"}>{detail.status}</Chip>
                  </div>
                  <div className="num mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-dim">
                    <span>{fmtBytes(detail.sizeBytes)}</span>
                    {detail.durationSec != null && <span>duration {fmtClock(detail.durationSec)}</span>}
                    {detail.transcript && (
                      <span>
                        {detail.wordCount} words · {detail.sentenceCount} sentences
                      </span>
                    )}
                    {detail.coverage != null && <span>coverage {Math.round(detail.coverage * 100)}%</span>}
                    {detail.anchoredCount != null && <span>{detail.anchoredCount}/{detail.alignedTotal} waveform-anchored</span>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {(detail.status === "working" || detail.status === "queued") && (
                    <button
                      onClick={async () => {
                        await fetch(`/api/jobs/${detail.id}/cancel`, { method: "POST" });
                        void refresh();
                      }}
                      className="flex items-center gap-1 rounded border border-line2 px-2 py-1 font-mono text-[10px] text-mut transition-colors hover:border-warn/60 hover:text-warn"
                    >
                      <IconStop className="h-3 w-3" /> stop
                    </button>
                  )}
                  {detail.transcript && (
                    <a
                      href={`/api/jobs/${detail.id}/download`}
                      className="flex items-center gap-1 rounded border border-acc/40 bg-acc/10 px-2 py-1 font-mono text-[10px] text-acc2 transition-colors hover:bg-acc/20"
                    >
                      <IconDownload className="h-3 w-3" /> transcript_data.json
                    </a>
                  )}
                  {detail.status === "failed" && <span className="max-w-56 truncate font-mono text-[10px] text-bad" title={detail.error || ""}>{detail.error}</span>}
                </div>
              </div>

              <StageRail job={detail} />
              <ActivityFeed events={detail.events} job={detail} />
            </>
          ) : (
            <IdleScreen keyCount={keyCount} />
          )}
        </div>

        {/* right column */}
        <div className="flex flex-col gap-3">
          {detail ? (
            <>
              <ChunksPanel job={detail} />
              <EngineCard job={detail} />
            </>
          ) : (
            <div className="rounded-lg border border-line bg-panel p-4 text-[11px] leading-relaxed text-dim">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em]">How it works</div>
              <ol className="list-decimal space-y-1.5 pl-4">
                <li>FFmpeg measures the exact waveform: silences, speech intervals and every consonant attack (acoustic onsets).</li>
                <li>Audio is sliced into ~30 s windows snapped to the <b className="text-mut">middle of silences</b> — words are never cut in half.</li>
                <li>Each clip goes to Gemini's native audio model with a strict word-timestamp schema, rotating across all your keys on 429/403.</li>
                <li>A coverage gate rejects any chunk that misses more than 15% of detected speech and retries with corrective feedback.</li>
                <li>A 4-pass algorithm re-anchors every word to a physical onset, interpolates, enforces monotonic order and bridges all gaps.</li>
              </ol>
            </div>
          )}
        </div>
      </main>

      {/* transcript — full width */}
      <div className="mx-auto max-w-[1720px] px-4 pb-10">
        {detail ? <TranscriptPanel job={detail} /> : <TranscriptPlaceholder />}
      </div>
    </div>
  );
}

function IdleScreen({ keyCount }: { keyCount: number }) {
  return (
    <div className="grid-bg flex min-h-[420px] flex-1 flex-col items-center justify-center rounded-lg border border-line bg-panel px-6 py-10 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-acc/40 bg-acc/10 text-acc">
        <IconBolt className="h-7 w-7" />
      </div>
      <h1 className="text-xl font-bold tracking-tight">Engine is armed and idle</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-mut">
        Drop an audio file on the left. Every stage — acoustic analysis, onset detection, silence-snapped chunking, Gemini rotation, the 4-pass
        aligner and atomic persistence — streams live into the process log below.
      </p>
      {keyCount === 0 && (
        <p className="mt-3 max-w-md rounded border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
          No Gemini keys yet: the run will complete in simulation mode (synthetic text, real waveform alignment). Add keys for true transcription.
        </p>
      )}
      <div className="mt-6 flex items-center gap-2 font-mono text-[10px] text-dim">
        <Spinner className="h-3.5 w-3.5" /> watching /api/jobs · ready
      </div>
    </div>
  );
}

function TranscriptPlaceholder() {
  return (
    <div className="rounded-lg border border-line bg-panel p-6 text-center">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-dim">Transcript · word-accurate playback</div>
      <div className="mx-auto mt-4 max-w-sm text-sm text-mut">
        Select a job — or upload audio — and the transcript will stream here chunk by chunk, synced to the waveform with word-level highlighting.
      </div>
    </div>
  );
}

function EngineCard({ job }: { job: JobDetail }) {
  const a = job.transcript?.alignment;
  const ev = job.events || [];
  const rotations = ev.filter((e) => e.level === "warn" && /rotat/i.test(`${e.title} ${e.message}`)).length;
  const apiOk = ev.filter((e) => e.level === "model").length;
  const servedKeys = new Set(
    job.chunks.filter((c) => c.keyIndex != null && c.keyIndex >= 0).map((c) => c.keyIndex)
  ).size;
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-line bg-panel">
        <div className="border-b border-line px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">Alignment quality · measured</div>
        <div className="space-y-2 p-3 font-mono text-[11px]">
          <Row label="words anchored to onsets" value={a ? `${a.anchored}/${a.total} (${Math.round((a.anchorRate ?? a.anchored / Math.max(1, a.total)) * 100)}%)` : "pending"} done={!!a && (a.anchorRate ?? 0) >= 0.5} />
          <Row label="model drift / stretch" value={a ? `${a.driftMs ?? 0}ms · ×${a.scale ?? 1}` : "—"} done={!!a && Math.abs(a.driftMs ?? 0) < 250} />
          <Row label="onset residual (median / p90)" value={a ? `${a.medianResidualMs ?? 0} / ${a.p90ResidualMs ?? 0} ms` : "—"} done={!!a && (a.medianResidualMs ?? 999) < 90} />
          <Row label="largest correction applied" value={a ? `${a.maxCorrectionMs ?? 0}ms` : "—"} done={!!a} />
          <Row label="interpolated words" value={a ? String(a.interpolated) : "—"} done={!!a} />
          <Row label="starts landing in silence" value={a?.silenceLandingRate != null ? `${(a.silenceLandingRate * 100).toFixed(1)}%` : "—"} done={a?.silenceLandingRate != null && a.silenceLandingRate <= 0.05} />
          <Row label="median word duration" value={a?.durationMedianMs != null ? `${a.durationMedianMs}ms` : "—"} done={!!a} />
          <Row label="speech coverage" value={job.coverage != null ? `${Math.round(job.coverage * 100)}%` : "—"} done={job.coverage != null} />
          <Row label="longest unexplained miss" value={job.longestMissSec != null ? `${job.longestMissSec.toFixed(2)}s` : "—"} done={job.longestMissSec != null} />
        </div>
      </div>
      <div className="rounded-lg border border-line bg-panel">
        <div className="border-b border-line px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">API rotation</div>
        <div className="space-y-2 p-3 font-mono text-[11px]">
          <Row label="rotation events (429/403 failovers)" value={String(rotations)} done={rotations > 0} />
          <Row label="successful model calls" value={String(apiOk)} done={apiOk > 0} />
          <Row label="distinct keys used by this job" value={servedKeys > 0 ? String(servedKeys) : "—"} done={servedKeys > 0} />
          <Row label="pool behavior" value={rotations > 0 ? "rotated on pressure" : "single-key smooth"} done={true} />
          <Row
            label="acquisition"
            value={job.status === "working" ? "waiting for slots when busy (120s deadline)" : "idle"}
            done={job.status !== "working"}
          />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, done }: { label: string; value: string; done: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] text-dim">{label}</span>
      <span className={`num ${done ? "text-acc2" : "text-mut"}`}>{value}</span>
    </div>
  );
}
