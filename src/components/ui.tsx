"use client";
import { forwardRef, useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";

/* ── Button ──────────────────────────────────────────────────────────────── */
type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type Size = "xs" | "sm" | "md";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-[var(--fg)] text-[var(--bg)] hover:opacity-90 active:opacity-80 shadow-[var(--shadow-sm)]",
  secondary:
    "bg-[var(--surface-2)] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-3)] hover:border-[var(--border-strong)]",
  ghost: "text-[var(--fg-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]",
  danger:
    "bg-[var(--danger-soft)] text-[var(--danger)] border border-[color-mix(in_oklab,var(--danger)_35%,transparent)] hover:bg-[var(--danger)] hover:text-white",
  accent:
    "bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90 active:opacity-80 shadow-[var(--shadow-sm)]",
};

const SIZE: Record<Size, string> = {
  xs: "h-6 px-2 text-[11px] gap-1 rounded-md",
  sm: "h-8 px-2.5 text-xs gap-1.5 rounded-md",
  md: "h-9.5 px-3.5 text-[13px] gap-2 rounded-lg",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "sm", icon, loading, className = "", children, disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex select-none items-center justify-center font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-45 ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      {...rest}
    >
      {loading ? <Spinner className="h-3.5 w-3.5" /> : icon}
      {children}
    </button>
  );
});

/* ── IconButton ─────────────────────────────────────────────────────────── */
export const IconButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; label: string; active?: boolean }>(
  function IconButton({ variant = "ghost", label, active, className = "", children, ...rest }, ref) {
    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${
          variant === "primary"
            ? "bg-[var(--fg)] text-[var(--bg)] hover:opacity-90"
            : variant === "accent"
              ? "bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90"
              : active
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-[var(--fg-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
        } ${className}`}
        {...rest}
      >
        {children}
      </button>
    );
  }
);

/* ── Badge ──────────────────────────────────────────────────────────────── */
type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "info" | "visual";
const TONE: Record<Tone, string> = {
  neutral: "bg-[var(--surface-3)] text-[var(--fg-muted)] border-[var(--border)]",
  accent: "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent-border)]",
  success: "bg-[var(--success-soft)] text-[var(--success)] border-[color-mix(in_oklab,var(--success)_32%,transparent)]",
  warning: "bg-[var(--warning-soft)] text-[var(--warning)] border-[color-mix(in_oklab,var(--warning)_32%,transparent)]",
  danger: "bg-[var(--danger-soft)] text-[var(--danger)] border-[color-mix(in_oklab,var(--danger)_32%,transparent)]",
  info: "bg-[var(--info-soft)] text-[var(--info)] border-[color-mix(in_oklab,var(--info)_32%,transparent)]",
  visual: "bg-[var(--visual-soft)] text-[var(--visual)] border-[color-mix(in_oklab,var(--visual)_32%,transparent)]",
};

export function Badge({
  tone = "neutral",
  className = "",
  children,
  title,
  dot,
  pulse,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
  title?: string;
  dot?: boolean;
  pulse?: boolean;
}) {
  return (
    <span
      title={title}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium leading-4 tracking-tight transition-all duration-150 ${TONE[tone]} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${pulse ? "animate-pulse" : ""}`}
          style={{ background: "currentColor" }}
        />
      )}
      {children}
    </span>
  );
}


/* ── Card ───────────────────────────────────────────────────────────────── */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)] ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  actions,
  icon,
  className = "",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between gap-3 border-b border-[var(--border)] px-3.5 py-2.5 ${className}`}>
      <div className="flex min-w-0 items-center gap-2.5">
        {icon && <span className="shrink-0 text-[var(--fg-subtle)]">{icon}</span>}
        <div className="min-w-0">
          <div className="truncate text-[12.5px] font-semibold leading-tight text-[var(--fg)]">{title}</div>
          {subtitle && <div className="mt-0.5 truncate font-mono text-[10.5px] leading-tight text-[var(--fg-subtle)]">{subtitle}</div>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </div>
  );
}

/* ── Progress ───────────────────────────────────────────────────────────── */
export function Progress({
  value,
  tone = "accent",
  height = 3,
  className = "",
}: {
  value: number;
  tone?: "accent" | "success" | "warning" | "info";
  height?: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value * 100));
  const bg =
    tone === "success" ? "var(--success)" : tone === "warning" ? "var(--warning)" : tone === "info" ? "var(--info)" : "var(--accent)";
  return (
    <div className={`w-full overflow-hidden rounded-full bg-[var(--surface-3)] ${className}`} style={{ height }}>
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%`, background: bg }}
      />
    </div>
  );
}

/* ── Segmented control ──────────────────────────────────────────────────── */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "sm",
  className = "",
}: {
  options: { id: T; label: string; icon?: ReactNode; hint?: string }[];
  value: T;
  onChange: (v: T) => void;
  size?: "xs" | "sm";
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-0.5 ${className}`}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          title={o.hint}
          className={`inline-flex items-center gap-1.5 rounded-md font-medium transition-colors ${
            size === "xs" ? "h-5.5 px-2 text-[10.5px]" : "h-7 px-2.5 text-[11.5px]"
          } ${value === o.id ? "bg-[var(--surface)] text-[var(--fg)] shadow-[var(--shadow-sm)]" : "text-[var(--fg-muted)] hover:text-[var(--fg)]"}`}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Input ──────────────────────────────────────────────────────────────── */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className = "", ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      className={`h-8 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 text-xs text-[var(--fg)] placeholder:text-[var(--fg-faint)] transition-colors focus:border-[var(--accent)] focus:outline-none ${className}`}
      {...rest}
    />
  );
});

/* ── Kbd ────────────────────────────────────────────────────────────────── */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-[var(--border)] bg-[var(--surface-2)] px-1.5 font-mono text-[10px] font-medium text-[var(--fg-muted)]">
      {children}
    </kbd>
  );
}

/* ── Spinner ────────────────────────────────────────────────────────────── */
export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${className} animate-spin`} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.6" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

/* ── Status dot ─────────────────────────────────────────────────────────── */
export function StatusDot({ status }: { status: string }) {
  const color =
    status === "working"
      ? "var(--accent)"
      : status === "completed"
        ? "var(--success)"
        : status === "failed"
          ? "var(--danger)"
          : status === "queued"
            ? "var(--info)"
            : "var(--fg-faint)";
  return (
    <span className="relative inline-flex h-2 w-2 shrink-0">
      {status === "working" && (
        <span className="absolute inset-0 animate-breathe rounded-full" style={{ background: color }} />
      )}
      <span className="relative inline-block h-2 w-2 rounded-full" style={{ background: color }} />
    </span>
  );
}

/* ── Equalizer bars ─────────────────────────────────────────────────────── */
export function EqBars({ active }: { active: boolean }) {
  return (
    <span className="inline-flex h-3.5 items-end gap-[2px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`w-[2.5px] origin-bottom rounded-full ${active ? `animate-eq${i + 1}` : ""}`}
          style={{
            height: "100%",
            background: "var(--accent)",
            transform: active ? undefined : `scaleY(${[0.4, 0.65, 0.3][i]})`,
          }}
        />
      ))}
    </span>
  );
}

/* ── Empty state ────────────────────────────────────────────────────────── */
export function Empty({ icon, title, hint, action }: { icon?: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {icon && (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg-subtle)]">
          {icon}
        </div>
      )}
      <div className="text-[13px] font-semibold text-[var(--fg)]">{title}</div>
      {hint && <div className="mt-1 max-w-sm text-[11.5px] leading-relaxed text-[var(--fg-subtle)]">{hint}</div>}
      {action && <div className="mt-3.5">{action}</div>}
    </div>
  );
}

/* ── Stat row ───────────────────────────────────────────────────────────── */
export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: "accent" | "success" | "warning" | "danger" }) {
  const color = tone ? `var(--${tone === "accent" ? "accent" : tone})` : "var(--fg)";
  return (
    <div className="flex items-baseline justify-between gap-2 py-1">
      <span className="text-[11px] text-[var(--fg-subtle)]">{label}</span>
      <span className="num font-mono text-[11.5px] font-medium" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

/* ── Divider ────────────────────────────────────────────────────────────── */
export function Divider({ label }: { label?: string }) {
  if (!label) return <div className="h-px bg-[var(--border)]" />;
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-px flex-1 bg-[var(--border)]" />
      <span className="label">{label}</span>
      <div className="h-px flex-1 bg-[var(--border)]" />
    </div>
  );
}

/* ── Tooltip (CSS only, no deps) ────────────────────────────────────────── */
export function Tip({ children, tip, side = "top" }: { children: ReactNode; tip: string; side?: "top" | "bottom" }) {
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        className={`pointer-events-none absolute left-1/2 z-50 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 font-mono text-[10px] text-[var(--fg)] shadow-[var(--shadow-md)] group-hover/tip:block ${
          side === "top" ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]"
        }`}
      >
        {tip}
      </span>
    </span>
  );
}

/* ── Toast Notifications ─────────────────────────────────────────────────── */
export interface ToastItem {
  id: string;
  message: string;
  tone?: "accent" | "success" | "warning" | "danger" | "info";
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;
const toastListeners = new Set<ToastListener>();
let toastItems: ToastItem[] = [];

export function toast(message: string, tone: ToastItem["tone"] = "accent", duration = 3000) {
  const id = Math.random().toString(36).slice(2, 9);
  const item: ToastItem = { id, message, tone, duration };
  toastItems = [...toastItems, item];
  toastListeners.forEach((fn) => fn(toastItems));
  if (duration > 0) {
    setTimeout(() => {
      toastItems = toastItems.filter((t) => t.id !== id);
      toastListeners.forEach((fn) => fn(toastItems));
    }, duration);
  }
}

export function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>(toastItems);
  useEffect(() => {
    toastListeners.add(setItems);
    return () => {
      toastListeners.delete(setItems);
    };
  }, []);

  if (!items.length) return null;

  return (
    <div className="pointer-events-none fixed right-5 bottom-5 z-[200] flex flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 font-mono text-[11.5px] text-[var(--fg)] shadow-[var(--shadow-lg)] backdrop-blur-md animate-toast"
          style={{
            borderColor:
              t.tone === "success"
                ? "var(--success)"
                : t.tone === "danger"
                  ? "var(--danger)"
                  : t.tone === "warning"
                    ? "var(--warning)"
                    : "var(--accent)",
          }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{
              background:
                t.tone === "success"
                  ? "var(--success)"
                  : t.tone === "danger"
                    ? "var(--danger)"
                    : t.tone === "warning"
                      ? "var(--warning)"
                      : "var(--accent)",
            }}
          />
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

