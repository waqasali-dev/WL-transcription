"use client";
import { useEffect, useRef, useState } from "react";
import type { EventRow } from "@/lib/types";
import { STAGES } from "@/lib/types";
import { StageNext } from "./StageRail";
import type { JobDetail } from "@/lib/types";
import { Chip } from "./ui";

const LEVEL_STYLE: Record<string, { color: string; label: string }> = {
  stage: { color: "text-acc", label: "STAGE" },
  success: { color: "text-ok", label: "OK" },
  warn: { color: "text-warn", label: "WARN" },
  error: { color: "text-bad", label: "ERR" },
  api: { color: "text-inf", label: "API" },
  model: { color: "text-acc2", label: "MODEL" },
  info: { color: "text-mut", label: "INFO" },
};

function stageLabel(stage: string): string | null {
  const s = STAGES.find((x) => x.key === stage);
  return s ? s.label : stage === "info" ? null : stage;
}

export function ActivityFeed({ events, job }: { events: EventRow[]; job: JobDetail }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [stick, setStick] = useState(true);

  const onScroll = () => {
    const el = boxRef.current;
    if (!el) return;
    setStick(el.scrollHeight - el.scrollTop - el.clientHeight < 60);
  };

  useEffect(() => {
    const el = boxRef.current;
    if (el && stick) el.scrollTop = el.scrollHeight;
  }, [events.length, stick]);

  const active = job.status === "working";

  return (
    <div className="flex h-[440px] min-h-0 flex-col rounded-lg border border-line bg-panel xl:h-auto xl:max-h-[720px] xl:flex-1">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
          <span className={active ? "text-acc" : ""}>
            {active ? "●" : "○"} live process log
          </span>
          <span className="text-dim">·</span>
          <span className="num text-mut">{events.length} events</span>
        </div>
        <div className="flex items-center gap-2">
          {stick && active && (
            <button
              onClick={() => {
                const el = boxRef.current;
                if (el) el.scrollTop = el.scrollHeight;
              }}
              className="font-mono text-[10px] text-dim hover:text-acc2"
            >
               follow
            </button>
          )}
          <StageNext job={job} />
        </div>
      </div>

      <div ref={boxRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto px-3 py-2 font-mono text-[11.5px] leading-relaxed">
        {events.length === 0 && (
          <div className="flex h-full min-h-32 items-center justify-center text-center text-dim">
            <div>
              <div className="text-sm text-mut">Waiting for first process output…</div>
              <div className="mt-1 text-[11px]">Every pipeline step streams here in real time.</div>
            </div>
          </div>
        )}

        {events.map((e, i) => {
          const st = LEVEL_STYLE[e.level] || LEVEL_STYLE.info;
          const isStage = e.level === "stage";
          const time = new Date(e.ts).toLocaleTimeString([], { hour12: false });
          const stag = stageLabel(e.stage);
          return (
            <div key={e.id} className={`animate-rise border-b border-line/40 py-1.5 last:border-0 ${isStage ? "ml-1 border-l-2 border-l-acc/50 pl-2" : ""}`}>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="num shrink-0 text-[10px] text-dim">{time}</span>
                <span className={`num w-10 shrink-0 text-[9px] tracking-wider ${st.color}`}>{st.label}</span>
                {stag && <Chip className="shrink-0">{stag}</Chip>}
                <span className={`min-w-0 break-words font-semibold ${isStage ? "text-acc2" : e.level === "error" ? "text-bad" : "text-ink"}`}>
                  {e.title}
                </span>
              </div>
              {e.message && (
                <div className={`mt-0.5 break-words pl-0 text-[11px] leading-snug ${e.level === "error" ? "text-bad/90" : "text-mut"}`}>
                  {e.message}
                </div>
              )}
            </div>
          );
        })}

        {active && (
          <div className="flex items-center gap-2 py-2">
            <span className="inline-flex items-end gap-[2px]" aria-hidden>
              <span className="h-3 w-[3px] origin-bottom animate-eq1 rounded-sm bg-acc" />
              <span className="h-3 w-[3px] origin-bottom animate-eq2 rounded-sm bg-acc2" />
              <span className="h-3 w-[3px] origin-bottom animate-eq3 rounded-sm bg-acc" />
            </span>
            <span className="text-[11px] text-dim">
              {job.stage === "transcription"
                ? `processing chunk — rotating keys, enforcing coverage gate…`
                : `stage: ${STAGES.find((s) => s.key === job.stage)?.blurb || job.stage}…`}
            </span>
            <span className="animate-blink text-acc">▍</span>
          </div>
        )}
        {job.status === "failed" && (
          <div className="py-2 text-[11px] text-bad">
            ✕ pipeline halted — {job.error}
          </div>
        )}
        {job.status === "completed" && (
          <div className="py-2 text-[11px] text-ok">✓ all stages complete — transcript ready below</div>
        )}
      </div>
    </div>
  );
}
