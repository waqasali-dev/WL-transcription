import type { ReactNode } from "react";

type IconProps = { className?: string };

const S = (props: IconProps & { d: string; viewBox?: string }) => (
  <svg
    viewBox={props.viewBox || "0 0 24 24"}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className || "h-4 w-4"}
    aria-hidden
  >
    <path d={props.d} />
  </svg>
);

export const IconWave = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className={p.className || "h-4 w-4"} aria-hidden>
    <path d="M2 12h2M20 12h2M6 8v8M10 5v14M14 7v10M18 9v6" />
  </svg>
);
export const IconBolt = (p: IconProps) => <S {...p} d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" />;
export const IconKey = (p: IconProps) => (
  <S {...p} d="M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L19 3m-3.5 3.5L18 9m-4-1l2.5 2.5" />
);
export const IconCheck = (p: IconProps) => <S {...p} d="M4 12.5 9.5 18 20 6.5" />;
export const IconWarn = (p: IconProps) => <S {...p} d="M12 3 2.5 20h19L12 3zm0 6v5m0 3.5v.01" />;
export const IconX = (p: IconProps) => <S {...p} d="M5 5l14 14M19 5 5 19" />;
export const IconPlay = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={p.className || "h-4 w-4"} aria-hidden>
    <path d="M7 4.5v15l13-7.5-13-7.5Z" />
  </svg>
);
export const IconPause = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={p.className || "h-4 w-4"} aria-hidden>
    <path d="M6.5 4h3.6v16H6.5zM13.9 4h3.6v16h-3.6z" />
  </svg>
);
export const IconUpload = (p: IconProps) => <S {...p} d="M12 16V4m0 0 4.5 4.5M12 4 7.5 8.5M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17" />;
export const IconDownload = (p: IconProps) => <S {...p} d="M12 4v12m0 0 4.5-4.5M12 16l-4.5-4.5M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17" />;
export const IconTrash = (p: IconProps) => <S {...p} d="M4 7h16M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7m4 0-1 13a1.5 1.5 0 0 1-1.5 1.4h-9A1.5 1.5 0 0 1 6 20L5 7m5 4v6m4-6v6" />;
export const IconActivity = (p: IconProps) => <S {...p} d="M3 12h4l2.5-7 4.5 14 2.5-7H21" />;
export const IconCpu = (p: IconProps) => (
  <S {...p} d="M9 2v3m6-3v3M9 19v3m6-3v3M2 9h3m-3 6h3m14-6h3m-3 6h3M6.5 5h11A1.5 1.5 0 0 1 19 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 17.5v-11A1.5 1.5 0 0 1 6.5 5Zm3 5h5v5h-5z" />
);
export const IconScissors = (p: IconProps) => <S {...p} d="M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 0 14 12M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0 0 14-12" />;
export const IconTarget = (p: IconProps) => <S {...p} d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-3.5v.01" />;
export const IconFile = (p: IconProps) => <S {...p} d="M6 3h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm8 0v4h4M9 12h6m-6 4h6" />;
export const IconRadio = (p: IconProps) => (
  <S {...p} d="M12 12v.01M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19 5a10 10 0 0 1 0 14M5 19A10 10 0 0 1 5 5" />
);
export const IconLayers = (p: IconProps) => <S {...p} d="m12 3 9 5-9 5-9-5 9-5Zm-9 9.5 9 5 9-5M3 17l9 5 9-5" />;
export const IconClock = (p: IconProps) => <S {...p} d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3.5 2" />;
export const IconStop = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={p.className || "h-4 w-4"} aria-hidden>
    <rect x="6" y="6" width="12" height="12" rx="1.5" />
  </svg>
);

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${className} animate-spin`} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function Chip({ children, tone = "mut", className = "" }: { children: ReactNode; tone?: "mut" | "acc" | "ok" | "warn" | "bad" | "inf"; className?: string }) {
  const tones: Record<string, string> = {
    mut: "border-line2 text-mut bg-panel2",
    acc: "border-acc/40 text-acc2 bg-acc/10",
    ok: "border-ok/40 text-ok bg-ok/10",
    warn: "border-warn/40 text-warn bg-warn/10",
    bad: "border-bad/40 text-bad bg-bad/10",
    inf: "border-inf/40 text-inf bg-inf/10",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function Bar({ value, max, tone = "acc", className = "" }: { value: number; max: number; tone?: "acc" | "ok" | "warn" | "bad" | "inf"; className?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const colors: Record<string, string> = { acc: "bg-acc", ok: "bg-ok", warn: "bg-warn", bad: "bg-bad", inf: "bg-inf" };
  return (
    <div className={`h-1 w-full overflow-hidden rounded-full bg-raise ${className}`}>
      <div className={`h-full rounded-full ${colors[tone]} transition-[width] duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Panel({ title, right, children, className = "" }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-line bg-panel ${className}`}>
      {title != null && (
        <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
          <div className="flex min-w-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">{title}</div>
          <div className="flex shrink-0 items-center gap-1.5">{right}</div>
        </div>
      )}
      <div className="p-3">{children}</div>
    </div>
  );
}

export function EqBars({ active, className = "" }: { active: boolean; className?: string }) {
  return (
    <span className={`inline-flex h-3.5 items-end gap-[2px] ${className}`} aria-hidden>
      <span className={`w-[3px] origin-bottom rounded-sm bg-acc ${active ? "animate-eq1" : "scale-y-[0.35]"}`} style={{ height: "100%" }} />
      <span className={`w-[3px] origin-bottom rounded-sm bg-acc2 ${active ? "animate-eq2" : "scale-y-[0.55]"}`} style={{ height: "100%" }} />
      <span className={`w-[3px] origin-bottom rounded-sm bg-acc ${active ? "animate-eq3" : "scale-y-[0.3]"}`} style={{ height: "100%" }} />
    </span>
  );
}

export function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    queued: "bg-inf",
    working: "bg-acc animate-pulse-soft",
    completed: "bg-ok",
    failed: "bg-bad",
    canceled: "bg-dim",
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${map[status] || "bg-dim"}`} />;
}
