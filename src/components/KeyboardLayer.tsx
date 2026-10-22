"use client";
import { useEffect, useState } from "react";
import { SHORTCUTS } from "@/lib/search";
import { IconButton, Kbd } from "./ui";
import { IconKeyboard, IconMonitor, IconMoon, IconSun, IconX } from "./icons";
import { useTheme } from "./ThemeProvider";
import type { ShortcutApi } from "./TranscriptWorkspace";

/**
 * Explicit, unmistakable Dark / Bright / Auto segmented theme selector
 * right in the header bar, paired with global keyboard shortcuts (`?` overlay).
 */
export function ThemeSwitcher() {
  const { mode, setMode } = useTheme();
  const opts = [
    { id: "light" as const, label: "Bright", icon: <IconSun size={13} /> },
    { id: "dark" as const, label: "Dark", icon: <IconMoon size={13} /> },
    { id: "system" as const, label: "Auto", icon: <IconMonitor size={13} /> },
  ];

  return (
    <div
      role="group"
      aria-label="Theme mode"
      className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-0.5"
    >
      {opts.map((o) => {
        const active = mode === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => setMode(o.id)}
            title={`${o.label} appearance (Shift+D toggles)`}
            className={`inline-flex h-6.5 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium transition-all ${
              active
                ? "bg-[var(--surface)] text-[var(--fg)] shadow-[var(--shadow-sm)]"
                : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
            }`}
          >
            <span className={active ? "text-[var(--accent)]" : ""}>{o.icon}</span>
            <span className="hidden sm:inline">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function KeyboardLayer({
  onOpenPalette,
  transport,
}: {
  onOpenPalette: () => void;
  transport: ShortcutApi | null;
}) {
  const [help, setHelp] = useState(false);
  const { toggle: toggleTheme } = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable || target.tagName === "SELECT");

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenPalette();
        return;
      }
      if (e.key === "Escape") {
        setHelp(false);
        return;
      }
      if (typing || e.metaKey || e.ctrlKey) return;

      const k = e.key;
      if (k === "?") {
        e.preventDefault();
        setHelp((v) => !v);
        return;
      }
      if (e.shiftKey && k.toLowerCase() === "d") {
        e.preventDefault();
        toggleTheme();
        return;
      }
      if (k === "/") {
        e.preventDefault();
        transport?.focusSearch();
        return;
      }
      if (k === "1" || k === "2" || k === "3") {
        const map = ["sync", "speech", "visual"] as const;
        transport?.setView(map[Number(k) - 1]);
        return;
      }
      if (!transport) return;

      switch (k) {
        case " ":
          e.preventDefault();
          transport.toggle();
          break;
        case "j":
        case "ArrowLeft":
          e.preventDefault();
          e.shiftKey ? transport.prevSentence() : transport.seek(-3);
          break;
        case "l":
        case "ArrowRight":
          e.preventDefault();
          e.shiftKey ? transport.nextSentence() : transport.seek(3);
          break;
        case ",":
          e.preventDefault();
          e.shiftKey ? transport.rate(-1) : transport.nudge(-1);
          break;
        case ".":
          e.preventDefault();
          e.shiftKey ? transport.rate(1) : transport.nudge(1);
          break;
        case "i":
          e.preventDefault();
          transport.setLoop("in");
          break;
        case "o":
          e.preventDefault();
          transport.setLoop("out");
          break;
      }
      if (e.altKey && k.toLowerCase() === "l") {
        e.preventDefault();
        transport.setLoop("clear");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [transport, onOpenPalette, toggleTheme]);

  return (
    <>
      <IconButton label="Keyboard shortcuts (?)" onClick={() => setHelp(true)}>
        <IconKeyboard size={15} />
      </IconButton>

      {help && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="dialog" aria-modal>
          <div className="fixed inset-0 bg-[var(--overlay)] backdrop-blur-xs" onClick={() => setHelp(false)} />
          <div className="relative z-10 max-h-[85vh] w-full max-w-lg animate-rise overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
            <div className="sticky top-0 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/95 px-4 py-3 backdrop-blur">
              <h2 className="text-[13px] font-semibold">Keyboard Shortcuts</h2>
              <IconButton label="Close (Esc)" onClick={() => setHelp(false)}>
                <IconX size={14} />
              </IconButton>
            </div>
            <div className="p-4">
              {["Playback", "Frame-accurate", "Precision", "Navigate", "Interface"].map((group) => {
                const rows = SHORTCUTS.filter((s) => s.group === group);
                if (!rows.length) return null;
                return (
                  <div key={group} className="mb-4 last:mb-0">
                    <div className="label mb-1.5">{group}</div>
                    <div className="space-y-1">
                      {rows.map((s) => (
                        <div key={s.action} className="flex items-center justify-between gap-3 rounded-md px-2 py-1 hover:bg-[var(--surface-2)]">
                          <span className="text-[12px] text-[var(--fg-muted)]">{s.action}</span>
                          <span className="flex shrink-0 items-center gap-1">
                            {s.keys.map((key, i) => (
                              <Kbd key={i}>{key}</Kbd>
                            ))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
