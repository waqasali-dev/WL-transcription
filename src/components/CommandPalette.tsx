"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { fmtClock } from "@/lib/format";
import { EXPORT_LABELS, exportJob } from "@/lib/export";
import type { JobDetail, JobSummary } from "@/lib/types";
import type { ThemeMode } from "@/lib/theme";
import { Badge, Kbd } from "./ui";
import { IconDownload, IconFilm, IconKey, IconMoon, IconSearch, IconSliders, IconSun, IconWave } from "./icons";

interface PaletteItem {
  id: string;
  group: string;
  label: string;
  sub?: string;
  badge?: string;
  run: () => void;
}

export function CommandPalette({
  open,
  onClose,
  jobs,
  detail,
  onSelectJob,
  onSeekTo,
  onSetTheme,
  onOpenKeys,
  onOpenSettings,
}: {
  open: boolean;
  onClose: () => void;
  jobs: JobSummary[];
  detail: JobDetail | null;
  onSelectJob: (id: string) => void;
  onSeekTo: (sec: number) => void;
  onSetTheme: (m: ThemeMode) => void;
  onOpenKeys: () => void;
  onOpenSettings: () => void;
}) {
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const items = useMemo<PaletteItem[]>(() => {
    const list: PaletteItem[] = [];
    const needle = q.trim().toLowerCase();

    // Quick studio actions
    const actions: PaletteItem[] = [
      { id: "theme-light", group: "Appearance", label: "Switch to Bright (Light) theme", badge: "Theme", run: () => onSetTheme("light") },
      { id: "theme-dark", group: "Appearance", label: "Switch to Dark Studio theme", badge: "Theme", run: () => onSetTheme("dark") },
      { id: "theme-sys", group: "Appearance", label: "Follow System appearance", badge: "Auto", run: () => onSetTheme("system") },
      { id: "open-keys", group: "Studio", label: "Manage Gemini API Keys & Rotation Pool", badge: "Pool", run: onOpenKeys },
      { id: "open-settings", group: "Studio", label: "Configure Chunk, Overlap & Model Settings", badge: "Config", run: onOpenSettings },
    ];

    if (detail?.transcript) {
      for (const ex of EXPORT_LABELS) {
        actions.push({
          id: `exp-${ex.id}`,
          group: "Export",
          label: `Export ${ex.label}`,
          sub: ex.hint,
          badge: ex.ext,
          run: () => exportJob(ex.id, detail, detail.transcript!),
        });
      }
    }

    for (const a of actions) {
      if (!needle || `${a.label} ${a.sub ?? ""} ${a.group}`.toLowerCase().includes(needle)) {
        list.push(a);
      }
    }

    // Jobs in library
    for (const j of jobs) {
      if (!needle || j.filename.toLowerCase().includes(needle)) {
        list.push({
          id: `job-${j.id}`,
          group: "Library",
          label: j.filename,
          sub: `${j.status} · ${j.wordCount} words`,
          badge: j.mediaKind,
          run: () => onSelectJob(j.id),
        });
      }
    }

    // Active transcript sentences & visual observations when searching
    if (detail?.transcript) {
      const sents = detail.transcript.sentences;
      let count = 0;
      for (const s of sents) {
        if (needle && s.text.toLowerCase().includes(needle)) {
          list.push({
            id: `sent-${s.index}`,
            group: "Jump to Speech",
            label: s.text,
            badge: fmtClock(s.start, false),
            run: () => onSeekTo(s.start),
          });
          if (++count >= 20) break;
        }
      }
      const obs = detail.transcript.video?.observations ?? [];
      let vCount = 0;
      for (const o of obs) {
        const hay = `${o.description} ${o.visibleText.join(" ")} ${o.audioRelation}`.toLowerCase();
        if (needle && hay.includes(needle)) {
          list.push({
            id: `obs-${o.index}`,
            group: "Jump to Video Moment",
            label: o.description,
            sub: o.visibleText.length ? `On-screen: ${o.visibleText.join(" · ")}` : undefined,
            badge: fmtClock(o.start, false),
            run: () => onSeekTo(o.start),
          });
          if (++vCount >= 15) break;
        }
      }
    }

    return list;
  }, [q, jobs, detail, onSelectJob, onSeekTo, onSetTheme, onOpenKeys, onOpenSettings]);

  useEffect(() => {
    setCursor(0);
  }, [q]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center pt-[12vh] px-4" role="dialog" aria-modal>
      <div className="fixed inset-0 bg-[var(--overlay)] backdrop-blur-xs" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl animate-rise overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
        <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-3.5 py-2.5">
          <IconSearch size={15} className="shrink-0 text-[var(--fg-subtle)]" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor((c) => Math.min(items.length - 1, c + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) => Math.max(0, c - 1));
              } else if (e.key === "Enter" && items[cursor]) {
                e.preventDefault();
                items[cursor].run();
                onClose();
              } else if (e.key === "Escape") {
                e.preventDefault();
                onClose();
              }
            }}
            placeholder={
              detail?.transcript
                ? "Jump to spoken phrase, visual scene, export format, or switch theme…"
                : "Search library, switch Bright/Dark theme, or configure studio…"
            }
            className="h-7 flex-1 bg-transparent text-[13px] text-[var(--fg)] placeholder:text-[var(--fg-faint)] focus:outline-none"
          />
          <Kbd>Esc</Kbd>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-1.5">
          {!items.length ? (
            <div className="py-10 text-center text-[12px] text-[var(--fg-subtle)]">No matching commands, phrases, or scenes.</div>
          ) : (
            items.map((item, i) => {
              const prevGroup = i > 0 ? items[i - 1].group : null;
              const active = i === cursor;
              return (
                <div key={item.id}>
                  {item.group !== prevGroup && (
                    <div className="label px-2.5 pt-2.5 pb-1">{item.group}</div>
                  )}
                  <button
                    type="button"
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => {
                      item.run();
                      onClose();
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                      active ? "bg-[var(--surface-3)] text-[var(--fg)]" : "text-[var(--fg-muted)] hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="shrink-0 text-[var(--fg-subtle)]">
                        {item.group === "Appearance" ? (
                          item.id.includes("light") ? <IconSun size={14} /> : <IconMoon size={14} />
                        ) : item.group === "Export" ? (
                          <IconDownload size={14} />
                        ) : item.group === "Library" ? (
                          item.badge === "video" ? <IconFilm size={14} /> : <IconWave size={14} />
                        ) : item.id === "open-keys" ? (
                          <IconKey size={14} />
                        ) : item.id === "open-settings" ? (
                          <IconSliders size={14} />
                        ) : (
                          <IconSearch size={14} />
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-[12.5px] font-medium text-[var(--fg)]">{item.label}</div>
                        {item.sub && <div className="truncate text-[11px] text-[var(--fg-subtle)]">{item.sub}</div>}
                      </div>
                    </div>
                    {item.badge && (
                      <Badge tone={item.group.includes("Video") ? "visual" : item.group.includes("Speech") ? "accent" : "neutral"}>
                        {item.badge}
                      </Badge>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-1.5 font-mono text-[10px] text-[var(--fg-subtle)]">
          <span>↑↓ navigate · ↵ select</span>
          <span>⌘K command palette</span>
        </div>
      </div>
    </div>
  );
}
