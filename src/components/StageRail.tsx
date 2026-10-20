"use client";
import { STAGES, type JobDetail, type StageState } from "@/lib/types";
import { Chip, IconCheck, IconClock, Spinner } from "./ui";

export function StageRail({ job }: { job: JobDetail }) {
  const log: StageState[] = job.stageLog || [];
  const doneStages = new Set(log.filter((s) => s.doneAt).map((s) => s.stage));
  const activeStage = job.status === "working" ? (job.stage as string) : null;
  const started = job.status === "working" || job.status === "completed";
  const chunks = job.chunks;
  const doneChunks = chunks.filter((c) => c.status === "done").length;

  const metaFor = (key: string): string | null => {
    switch (key) {
      case "analysis":
        if (job.durationSec != null) {
          const speech = (job.transcript?.silences ?? job.silences ?? []) as { start: number; end: number }[];
          const silN = speech.length;
          return `${job.durationSec.toFixed(3)}s · ${silN} silences`;
        }
        return null;
      case "onsets":
        return job.onsets && job.onsets.length > 0 ? `${job.onsets.length.toLocaleString()} onsets measured` : null;
      case "chunking":
        return chunks.length > 0 ? `${chunks.length} chunks planned` : null;
      case "transcription":
        return chunks.length > 0 ? `${doneChunks}/${chunks.length} chunks · ${job.wordCount} words` : null;
      case "alignment":
        return job.anchoredCount != null ? `${job.anchoredCount}/${job.alignedTotal} anchored to waveform` : null;
      case "assembly":
        return job.sentenceCount > 0 ? `${job.sentenceCount} sentences` : null;
      case "persist":
        return job.status === "completed" ? "transcript_data.json ✓" : null;
      default:
        return null;
    }
  };

  const durFor = (key: string): string | null => {
    const s = log.find((x) => x.stage === key);
    if (!s) return null;
    const a = new Date(s.startedAt).getTime();
    const b = s.doneAt ? new Date(s.doneAt).getTime() : Date.now();
    const d = (b - a) / 1000;
    return d < 60 ? `${d.toFixed(1)}s` : `${(d / 60).toFixed(1)}m`;
  };

  return (
    <div className="grid gap-1.5 md:grid-cols-4">
      {STAGES.map((s, i) => {
        const done = doneStages.has(s.key) || job.status === "completed";
        const active = activeStage === s.key;
        const pending = !done && !active;
        const meta = metaFor(s.key);
        const dur = durFor(s.key);
        return (
          <div
            key={s.key}
            className={`relative rounded-md border px-2.5 py-2 transition-colors ${
              active ? "border-acc/60 bg-acc/10" : done ? "border-ok/30 bg-ok/5" : "border-line bg-panel2/60"
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="flex min-w-0 items-center gap-1.5">
                <span className={`num font-mono text-[9px] ${active ? "text-acc" : done ? "text-ok" : "text-dim"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={`truncate text-[11px] font-semibold ${active ? "text-acc2" : done ? "text-ink" : "text-mut"}`}>
                  {s.label}
                </span>
              </span>
              <span className="shrink-0">
                {active ? (
                  <Spinner className="h-3.5 w-3.5 text-acc" />
                ) : done ? (
                  <IconCheck className="h-3.5 w-3.5 text-ok" />
                ) : (
                  <IconClock className="h-3.5 w-3.5 text-dim" />
                )}
              </span>
            </div>
            <div className={`num mt-1 truncate font-mono text-[9.5px] ${active ? "text-acc2/80" : "text-dim"}`}>
              {active ? s.blurb : meta || (started && !done ? s.blurb : "")}
            </div>
            {dur && <div className="mt-0.5 text-right font-mono text-[9px] text-dim">{dur}</div>}
          </div>
        );
      })}
    </div>
  );
}

export function StageNext({ job }: { job: JobDetail }) {
  if (job.status !== "working") return null;
  const curIdx = STAGES.findIndex((s) => s.key === job.stage);
  const next = curIdx >= 0 && curIdx < STAGES.length - 1 ? STAGES[curIdx + 1] : null;
  return (
    <div className="flex items-center gap-2 font-mono text-[10px] text-dim">
      <Chip tone="acc">
        <span className="animate-pulse-soft">●</span> working: {STAGES[curIdx]?.label || job.stage}
      </Chip>
      {next && <span>next → {next.label}</span>}
    </div>
  );
}
