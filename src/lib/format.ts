export function fmtClock(sec: number | null | undefined, withMs = true): string {
  if (sec == null || !Number.isFinite(sec) || sec < 0) sec = 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec - h * 3600 - m * 60;
  const ss = withMs ? s.toFixed(3).padStart(6, "0") : String(Math.floor(s)).padStart(2, "0");
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${ss}`
    : `${String(m).padStart(2, "0")}:${ss}`;
}

export function fmtSrtTime(sec: number): string {
  const s = Math.max(0, sec);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = Math.floor(s % 60);
  const ms = Math.round((s - Math.floor(s)) * 1000);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

export function fmtVttTime(sec: number): string {
  return fmtSrtTime(sec).replace(",", ".");
}

export function fmtBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function fmtSec(sec: number | null | undefined, digits = 2): string {
  if (sec == null || !Number.isFinite(sec)) return "—";
  return `${sec.toFixed(digits)}s`;
}

export function fmtMs(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
}

export function fmtPct(v: number | null | undefined, digits = 0): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${(v * 100).toFixed(digits)}%`;
}

export function relTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(d)) return "—";
  if (d < 45_000) return "just now";
  if (d < 3_600_000) return `${Math.round(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.round(d / 3_600_000)}h ago`;
  return `${Math.round(d / 86_400_000)}d ago`;
}

export function resolution(w: number, h: number): string {
  if (!w || !h) return "—";
  const common: Record<string, string> = {
    "1920x1080": "1080p",
    "1280x720": "720p",
    "3840x2160": "4K",
    "2560x1440": "1440p",
    "854x480": "480p",
    "640x360": "360p",
    "1080x1920": "1080p vertical",
    "720x1280": "720p vertical",
  };
  return common[`${w}x${h}`] || `${w}×${h}`;
}

export function truncate(s: string, n: number): string {
  if (!s) return "";
  return s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`;
}

export function plural(n: number, one: string, many?: string): string {
  return `${n.toLocaleString()} ${n === 1 ? one : many ?? `${one}s`}`;
}
