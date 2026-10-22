"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { applyTheme, persistTheme, readStoredTheme, resolveTheme, systemTheme, type ResolvedTheme, type ThemeMode } from "@/lib/theme";

interface ThemeCtx {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("dark");
  const [resolved, setResolved] = useState<ResolvedTheme>("dark");

  useEffect(() => {
    const m = readStoredTheme();
    setModeState(m);
    setResolved(applyTheme(m));
    if (m === "system" && window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: light)");
      const onChange = () => setResolved(applyTheme("system"));
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    setResolved(applyTheme(m));
    persistTheme(m);
  }, []);

  const toggle = useCallback(() => {
    const current = resolveTheme(readStoredTheme());
    const next: ThemeMode = current === "dark" ? "light" : "dark";
    setMode(next);
  }, [setMode]);

  const value = useMemo(() => ({ mode, resolved, setMode, toggle }), [mode, resolved, setMode, toggle]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}

/** Reflects the OS preference without persisting (used by the "system" option). */
export function useSystemPreference(): ResolvedTheme {
  const [t, setT] = useState<ResolvedTheme>(() => (typeof window === "undefined" ? "dark" : systemTheme()));
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => setT(systemTheme());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return t;
}
