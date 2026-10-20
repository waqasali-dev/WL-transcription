"use client";
import type { JobDetail } from "@/lib/types";
import { Bar, Chip, IconCheck, IconX, Panel, Spinner } from "./ui";

export function ChunksPanel({ job }: { job: JobDetail }) {
  const doc = job.transcript;
  const metas = doc?.chunks ?? [];
  const rows = job.chunks;
  const total = Math.max(rows.length, metas.length, 0);

  return (
    <Panel
      title="Silence-snapped chunks"
      right={<span className="num font-mono text-[10px] text-dim">{total} planned · {rows.filter((c) => c.status === "done").length} done</span>}
    >
      {total === 0 ? (
        <div className="py-3 text-center text-[11px] text-dim">Chunk plan appears here after the acoustic analysis stage.</div>
      ) : (
        <div className="grid max-h-72 gap-1.5 overflow-y-auto pr-0.5">
          {rows.length === 0 &&
            metas.map((m) => (
              <ChunkCard
                key={m.index}
                idx={m.index}
                coreStart={m.coreStart}
                coreEnd={m.coreEnd}
                status={m.wordCount > 0 ? "done" : "pending"}
                wordCount={m.wordCount}
                coverage={m.coverage}
                model={m.model}
              />
            ))}
          {rows.length > 0 &&
            rows.map((c) => (
              <ChunkCard
                key={c.idx}
                idx={c.idx}
                coreStart={c.coreStart}
                coreEnd={c.coreEnd}
                status={c.status}
                wordCount={c.wordCount}
                coverage={c.coverage}
                model={c.model}
                keyIndex={c.keyIndex}
                attempts={c.attempts}
                error={c.error}
              />
            ))}
        </div>
      )}
    </Panel>
  );
}

function ChunkCard(props: {
  idx: number;
  coreStart: number;
  coreEnd: number;
  status: string;
  wordCount: number;
  coverage: number | null;
  model: string | null;
  keyIndex?: number | null;
  attempts?: number;
  error?: string | null;
}) {
  const { idx, coreStart, coreEnd, status, wordCount, coverage, model, keyIndex, attempts, error } = props;
  const done = status === "done";
  const active = status === "transcribing";
  return (
    <div className={`rounded border px-2 py-1.5 ${done ? "border-ok/25 bg-ok/5" : active ? "border-acc/50 bg-acc/10" : error ? "border-bad/40 bg-bad/5" : "border-line bg-panel2/60"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="num font-mono text-[10px] text-dim">#{String(idx).padStart(2, "0")}</span>
          <span className="num truncate font-mono text-[10.5px] text-mut">
            {coreStart.toFixed(1)}s → {coreEnd.toFixed(1)}s
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {done ? <IconCheck className="h-3.5 w-3.5 text-ok" /> : active ? <Spinner className="h-3.5 w-3.5 text-acc" /> : error ? <IconX className="h-3.5 w-3.5 text-bad" /> : <span className="h-2 w-2 rounded-full bg-dim" />}
        </div>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <div className="flex-1">
          {coverage != null && <Bar value={coverage} max={1} tone={coverage >= 0.85 ? "ok" : "warn"} />}
        </div>
        <span className="num font-mono text-[9px] text-dim">
          {coverage != null ? `${Math.round(coverage * 100)}%` : ""} cov
        </span>
        <span className="num font-mono text-[9px] text-dim">{wordCount} w</span>
      </div>
      <div className="mt-1 flex items-center gap-1.5">
        {model && <Chip tone={model === "simulation" ? "warn" : "inf"}>{model === "simulation" ? "sim" : model.replace("gemini-", "")}</Chip>}
        {keyIndex != null && keyIndex >= 0 && model !== "simulation" && (
          <span className="font-mono text-[9px] text-dim">key #{keyIndex}</span>
        )}
        {attempts != null && attempts > 1 && <span className="font-mono text-[9px] text-warn">{attempts} passes</span>}
      </div>
      {error && <div className="mt-1 truncate font-mono text-[9px] text-bad">{error}</div>}
    </div>
  );
}
