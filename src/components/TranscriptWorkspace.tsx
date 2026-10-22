"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fmtClock, plural, resolution } from "@/lib/format";
import { playbackRates, wordMatches } from "@/lib/search";
import { copyTranscript, EXPORT_LABELS, exportJob } from "@/lib/export";
import type { JobDetail, TranscriptDoc, VideoObservation } from "@/lib/types";
import { Badge, Button, IconButton, Input, Segmented, Spinner, Tip } from "./ui";
import {
  IconCheck,
  IconCopy,
  IconDownload,
  IconEye,
  IconPause,
  IconPlay,
  IconRepeat,
  IconScissors,
  IconSearch,
  IconSkipBack,
  IconSkipFwd,
  IconWarn,
  IconX,
} from "./icons";

export type ViewMode = "sync" | "speech" | "visual";

export interface ShortcutApi {
  toggle: () => void;
  seek: (delta: number) => void;
  seekAbsolute: (sec: number, play?: boolean) => void;
  nudge: (frames: number) => void;
  prevSentence: () => void;
  nextSentence: () => void;
  rate: (dir: 1 | -1) => void;
  setLoop: (which: "in" | "out" | "clear") => void;
  setView: (v: ViewMode) => void;
  focusSearch: () => void;
}

interface Props {
  job: JobDetail;
  registerShortcuts: (api: ShortcutApi | null) => void;
  onTranscriptEdited: (doc: TranscriptDoc) => void;
}

export function TranscriptWorkspace({ job, registerShortcuts, onTranscriptEdited }: Props) {
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveScrollRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const slotEls = useRef<Map<number, HTMLDivElement>>(new Map());
  const sentEls = useRef<Map<number, HTMLDivElement>>(new Map());
  const loopRef = useRef<{ a: number | null; b: number | null }>({ a: null, b: null });

  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [rate, setRate] = useState(1);
  const [zoom, setZoom] = useState<1 | 2 | 4 | 8>(1);
  const [hoverSec, setHoverSec] = useState<number | null>(null);
  const [view, setView] = useState<ViewMode>(job.mediaKind === "video" ? "sync" : "speech");
  const [query, setQuery] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPauses, setShowPauses] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editingWordIdx, setEditingWordIdx] = useState<number | null>(null);
  const [editingWordVal, setEditingWordVal] = useState("");
  const [editingObsIdx, setEditingObsIdx] = useState<number | null>(null);
  const [editingObsVal, setEditingObsVal] = useState("");
  const [uncertainCursor, setUncertainCursor] = useState(-1);
  const [loop, setLoopState] = useState<{ a: number | null; b: number | null }>({ a: null, b: null });
  const [hud, setHud] = useState(true);
  const [looping, setLooping] = useState(false);

  const doc = job.transcript;
  const words = doc?.words ?? [];
  const sentences = doc?.sentences ?? [];
  const video = doc?.video;
  const observations = video?.observations ?? [];
  const duration = job.durationSec ?? 0;
  const frame = 0.02; // 20 ms CTC frame resolution
  const isVideo = job.mediaKind === "video";

  useEffect(() => {
    setView(job.mediaKind === "video" ? "sync" : "speech");
    setTime(0);
    setPlaying(false);
    setZoom(1);
    setUncertainCursor(-1);
    setEditingWordIdx(null);
    setEditingObsIdx(null);
    setLoopState({ a: null, b: null });
    loopRef.current = { a: null, b: null };
    setQuery("");
    const m = mediaRef.current;
    if (m) {
      m.pause();
      m.currentTime = 0;
      m.playbackRate = 1;
    }
    setRate(1);
  }, [job.id, job.mediaKind]);

  const wordIndexAt = useCallback(
    (t: number) => {
      if (!words.length) return -1;
      let lo = 0;
      let hi = words.length - 1;
      let ans = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (words[mid].start <= t) {
          ans = mid;
          lo = mid + 1;
        } else hi = mid - 1;
      }
      return ans;
    },
    [words]
  );

  const uncertainIndices = useMemo(() => {
    const out: number[] = [];
    words.forEach((w, i) => {
      if (w.confidence != null && w.confidence < 0.35) out.push(i);
    });
    return out;
  }, [words]);

  const curWord = wordIndexAt(time);
  const curSentence = curWord >= 0 ? sentences.findIndex((s) => curWord >= s.wordStart && curWord <= s.wordEnd) : -1;
  const activeObs: VideoObservation | null = observations.find((o) => time >= o.start && time < o.end) ?? null;

  // ── rAF loop: timeline canvas, zoomed scroll follow, word tracking, A-B loop ─
  useEffect(() => {
    let raf = 0;
    let lastTenth = -1;
    let lastWord = -1;
    let lastObs = -2;
    const tick = () => {
      const m = mediaRef.current;
      const t = m ? m.currentTime : 0;

      if (m && looping && loopRef.current.a != null && loopRef.current.b != null) {
        const { a, b } = loopRef.current;
        if (t < a - 0.05 || t >= b) {
          m.currentTime = a;
        }
      }

      // Auto-follow playhead inside zoomed waveform viewport
      if (zoom > 1 && m && !m.paused && waveScrollRef.current && duration > 0) {
        const wrap = waveScrollRef.current;
        const px = (t / duration) * wrap.scrollWidth;
        if (px < wrap.scrollLeft + 40 || px > wrap.scrollLeft + wrap.clientWidth - 60) {
          wrap.scrollLeft = Math.max(0, px - wrap.clientWidth * 0.35);
        }
      }

      const w = wordIndexAt(t);
      if (w !== lastWord) {
        lastWord = w;
        if (view === "speech" && w >= 0 && editingWordIdx === null) {
          const sIdx = sentences.findIndex((s) => w >= s.wordStart && w <= s.wordEnd);
          const el = sIdx >= 0 ? sentEls.current.get(sIdx) : null;
          const box = document.getElementById("tw-scroll");
          if (el && box) {
            const top = el.offsetTop - box.offsetTop;
            if (top < box.scrollTop + 20 || top > box.scrollTop + box.clientHeight - 60) {
              box.scrollTo({ top: Math.max(0, top - box.clientHeight / 3), behavior: "smooth" });
            }
          }
        }
      }
      if (view === "sync" && isVideo && editingObsIdx === null) {
        const oi = observations.findIndex((o) => t >= o.start && t < o.end);
        if (oi !== lastObs) {
          lastObs = oi;
          const box = document.getElementById("tw-scroll");
          const el = oi >= 0 ? slotEls.current.get(oi) : null;
          if (el && box && m && !m.paused) {
            const top = el.offsetTop - box.offsetTop;
            if (top < box.scrollTop + 24 || top > box.scrollTop + box.clientHeight - 110) {
              box.scrollTo({ top: Math.max(0, top - 56), behavior: "smooth" });
            }
          }
        }
      }
      const tenth = Math.floor(t * 10);
      if (tenth !== lastTenth) {
        lastTenth = tenth;
        setTime(t);
      }
      drawTimeline(canvasRef.current, job, t, loopRef.current, activeObs?.start ?? null, activeObs?.end ?? null, zoom);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [
    job,
    words,
    sentences,
    observations,
    view,
    isVideo,
    looping,
    zoom,
    duration,
    editingWordIdx,
    editingObsIdx,
    wordIndexAt,
    activeObs?.start,
    activeObs?.end,
  ]);

  // ── Transport controls ──────────────────────────────────────────────────
  const toggle = useCallback(() => {
    const m = mediaRef.current;
    if (!m) return;
    if (m.paused) void m.play();
    else m.pause();
  }, []);

  const seekTo = useCallback(
    (sec: number, autoplay = false) => {
      const m = mediaRef.current;
      if (!m) return;
      m.currentTime = Math.max(0, Math.min(duration || Infinity, sec));
      setTime(m.currentTime);
      if (autoplay) void m.play();
    },
    [duration]
  );

  const seekDelta = useCallback((d: number) => seekTo((mediaRef.current?.currentTime ?? 0) + d), [seekTo]);
  const nudge = useCallback((frames: number) => seekTo((mediaRef.current?.currentTime ?? 0) + frames * frame), [seekTo]);

  const stepSentence = useCallback(
    (dir: 1 | -1) => {
      if (!sentences.length) return;
      if (dir === 1) {
        const next = sentences.find((s) => s.start > (mediaRef.current?.currentTime ?? 0) + 0.15);
        seekTo(next?.start ?? sentences[sentences.length - 1].start, true);
      } else {
        const t = mediaRef.current?.currentTime ?? 0;
        const prev = [...sentences].reverse().find((s) => s.start < t - 0.4) ?? sentences[0];
        seekTo(prev.start, true);
      }
    },
    [sentences, seekTo]
  );

  const changeRate = useCallback((dir: 1 | -1) => {
    const rates = playbackRates();
    setRate((r) => {
      const i = rates.indexOf(r);
      const ni = Math.max(0, Math.min(rates.length - 1, (i < 0 ? 2 : i) + dir));
      const nr = rates[ni];
      if (mediaRef.current) mediaRef.current.playbackRate = nr;
      return nr;
    });
  }, []);

  const setLoop = useCallback((which: "in" | "out" | "clear") => {
    const t = mediaRef.current?.currentTime ?? 0;
    setLoopState((prev) => {
      const next =
        which === "clear"
          ? { a: null, b: null }
          : which === "in"
            ? { ...prev, a: t, b: prev.b != null && prev.b > t ? prev.b : null }
            : { ...prev, b: t, a: prev.a != null && prev.a < t ? prev.a : Math.max(0, t - 2) };
      loopRef.current = next;
      setLooping(next.a != null && next.b != null);
      return next;
    });
  }, []);

  const focusSearch = useCallback(() => {
    searchRef.current?.focus();
    searchRef.current?.select();
  }, []);

  const api = useMemo<ShortcutApi>(
    () => ({
      toggle,
      seek: seekDelta,
      seekAbsolute: seekTo,
      nudge,
      prevSentence: () => stepSentence(-1),
      nextSentence: () => stepSentence(1),
      rate: changeRate,
      setLoop,
      setView,
      focusSearch,
    }),
    [toggle, seekDelta, seekTo, nudge, stepSentence, changeRate, setLoop, focusSearch]
  );

  useEffect(() => {
    registerShortcuts(api);
    return () => registerShortcuts(null);
  }, [api, registerShortcuts]);

  // ── Inline editing persistence ──────────────────────────────────────────
  const saveWordEdit = useCallback(
    async (wordIndex: number, nextWord: string) => {
      setEditingWordIdx(null);
      if (!doc || words[wordIndex]?.word === nextWord.trim()) return;
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordIndex, word: nextWord }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.transcript) onTranscriptEdited(d.transcript);
      }
    },
    [doc, words, job.id, onTranscriptEdited]
  );

  const saveObsEdit = useCallback(
    async (observationIndex: number, description: string) => {
      setEditingObsIdx(null);
      if (!doc || !description.trim()) return;
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ observationIndex, description }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.transcript) onTranscriptEdited(d.transcript);
      }
    },
    [doc, job.id, onTranscriptEdited]
  );

  // Step through uncertain CTC words for instant proofreading
  const jumpNextUncertain = useCallback(() => {
    if (!uncertainIndices.length) return;
    const nextPos = (uncertainCursor + 1) % uncertainIndices.length;
    setUncertainCursor(nextPos);
    const wi = uncertainIndices[nextPos];
    const w = words[wi];
    if (w) {
      seekTo(Math.max(0, w.start - 0.15), true);
    }
  }, [uncertainIndices, uncertainCursor, words, seekTo]);

  // ── Search hits ─────────────────────────────────────────────────────────
  const searchPool = useMemo(() => {
    if (view === "visual") {
      return observations.map((o) => ({
        idx: o.index,
        text: [o.description, o.speech, o.audioRelation, ...(o.visibleText ?? [])].join(" "),
      }));
    }
    return sentences.map((s) => ({ idx: s.index, text: s.text }));
  }, [view, sentences, observations]);

  const hitIndices = useMemo(() => {
    if (!query.trim()) return new Set<number>();
    const q = query.toLowerCase();
    return new Set(searchPool.filter((r) => r.text.toLowerCase().includes(q)).map((r) => r.idx));
  }, [searchPool, query]);

  const visiblePool = useMemo(
    () => (query.trim() ? searchPool.filter((r) => hitIndices.has(r.idx)) : searchPool),
    [searchPool, query, hitIndices]
  );

  const jumpToHit = useCallback(
    (dir: 1 | -1) => {
      if (!visiblePool.length) return;
      const t = mediaRef.current?.currentTime ?? 0;
      const target =
        dir === 1
          ? visiblePool.find((r) => {
              const t0 = view === "visual" ? observations.find((o) => o.index === r.idx)?.start : sentences.find((s) => s.index === r.idx)?.start;
              return (t0 ?? 0) > t + 0.1;
            }) ?? visiblePool[0]
          : [...visiblePool].reverse().find((r) => {
              const t0 = view === "visual" ? observations.find((o) => o.index === r.idx)?.start : sentences.find((s) => s.index === r.idx)?.start;
              return (t0 ?? 0) < t - 0.1;
            }) ?? visiblePool[visiblePool.length - 1];
      const t0 = view === "visual" ? observations.find((o) => o.index === target.idx)?.start : sentences.find((s) => s.index === target.idx)?.start;
      if (t0 != null) seekTo(Math.max(0, t0 - 0.1), true);
    },
    [visiblePool, observations, sentences, view, seekTo]
  );

  const doCopy = useCallback(async () => {
    if (!doc) return;
    const ok = await copyTranscript(doc, "timecoded");
    setCopied(ok);
    setTimeout(() => setCopied(false), 1600);
  }, [doc]);

  const plannedSlots = useMemo(() => {
    if (!isVideo || !duration) return [];
    const out: { section: number; start: number; end: number; ctxStart: number; ctxEnd: number }[] = [];
    for (let s = 0; s < duration - 0.001; s += 30) {
      const se = Math.min(duration, s + 30);
      for (let t = s; t < se - 0.001; t += 5) {
        const te = Math.min(se, t + 5);
        out.push({ section: Math.floor(s / 30), start: t, end: te, ctxStart: Math.max(0, t - 1), ctxEnd: Math.min(duration, te + 1) });
      }
    }
    return out;
  }, [isVideo, duration]);

  const hoverWord = hoverSec != null ? words[wordIndexAt(hoverSec)] : null;
  const loopLen = loop.a != null && loop.b != null ? loop.b - loop.a : null;

  return (
    <div className="space-y-3">
      {/* ── Video Cinema Stage (or hidden HTMLAudioElement for audio jobs) ─ */}
      {isVideo ? (
        <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-black shadow-[var(--shadow-md)]">
          <video
            ref={(el) => {
              mediaRef.current = el;
            }}
            src={`/api/jobs/${job.id}/media`}
            preload="metadata"
            playsInline
            onClick={toggle}
            className="mx-auto max-h-[50vh] w-full cursor-pointer bg-black object-contain"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
          />
          <div className="pointer-events-none absolute top-2.5 right-2.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setHud((v) => !v)}
              className="pointer-events-auto inline-flex items-center gap-1 rounded-md border border-white/15 bg-black/65 px-2 py-1 font-mono text-[10px] text-white/85 backdrop-blur transition-colors hover:bg-black/85"
            >
              <IconEye size={12} /> HUD {hud ? "on" : "off"}
            </button>
          </div>
          {hud && (activeObs || (curSentence >= 0 && sentences[curSentence])) && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 space-y-1.5 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-4 pt-8 pb-3">
              {activeObs && (
                <div className="mx-auto max-w-4xl border-l-2 pl-2.5 text-[12px] leading-snug text-white/90" style={{ borderColor: "#a78bfa" }}>
                  <span className="num mr-2 font-mono text-[10px] uppercase tracking-wider text-[#c4b5fd]">
                    {fmtClock(activeObs.start, false)}–{fmtClock(activeObs.end, false)}
                  </span>
                  {activeObs.description}
                </div>
              )}
              {curSentence >= 0 && sentences[curSentence] && (
                <div className="mx-auto max-w-3xl text-center">
                  <span className="inline-block rounded-lg bg-black/80 px-3 py-1 text-[14px] font-medium leading-snug text-white backdrop-blur">
                    {sentences[curSentence].text}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <audio
          ref={(el) => {
            mediaRef.current = el;
          }}
          src={`/api/jobs/${job.id}/media`}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
      )}

      {/* ── Precision DAW / NLE Waveform & Transport Dock ───────────────── */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-sm)]">
        {/* Zoomable scrollable waveform viewport */}
        <div className="relative">
          {hoverSec != null && duration > 0 && (
            <div className="pointer-events-none mb-1.5 flex items-center justify-between font-mono text-[10px] text-[var(--fg-subtle)]">
              <span>
                scrub <strong className="num text-[var(--fg)]">{fmtClock(hoverSec)}</strong>
                {hoverWord ? ` · “${hoverWord.word}”` : ""}
              </span>
              <span>click anywhere on waveform to seek</span>
            </div>
          )}
          <div
            ref={waveScrollRef}
            className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)]"
          >
            <div
              style={{ width: `${zoom * 100}%` }}
              className="relative h-16 cursor-crosshair"
              onMouseMove={(e) => {
                if (!duration) return;
                const r = e.currentTarget.getBoundingClientRect();
                setHoverSec(Math.max(0, Math.min(duration, ((e.clientX - r.left) / r.width) * duration)));
              }}
              onMouseLeave={() => setHoverSec(null)}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                seekTo(((e.clientX - r.left) / r.width) * duration);
              }}
            >
              <canvas ref={canvasRef} className="h-full w-full block" />
              {!job.energy && (
                <div className="absolute inset-0 flex items-center justify-center font-mono text-[10.5px] text-[var(--fg-faint)]">
                  waveform energy + onset envelope renders right after acoustic decode…
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 5-second visual slot timeline strip on video jobs */}
        {isVideo && plannedSlots.length > 0 && (
          <div className="mt-2 flex h-4.5 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--bg-subtle)]">
            {plannedSlots.map((s, i) => {
              const obs = observations.find((o) => o.sectionIndex === s.section && Math.abs(o.start - s.start) < 0.05);
              const active = time >= s.start && time < s.end;
              const sectionEdge = Math.abs(s.start % 30) < 0.02 && i > 0;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => seekTo(s.start, true)}
                  title={`${fmtClock(s.start)} → ${fmtClock(s.end)} (1s overlap ${fmtClock(s.ctxStart)}–${fmtClock(s.ctxEnd)})${
                    obs ? ` · ${obs.description}` : " · pending"
                  }`}
                  className={`relative min-w-[6px] flex-1 border-r border-[var(--bg)] transition-colors last:border-r-0 ${
                    sectionEdge ? "border-l-2 border-l-[var(--visual)]" : ""
                  } ${
                    active
                      ? "bg-[var(--accent)]"
                      : obs
                        ? "bg-[var(--surface-3)] hover:bg-[var(--accent-soft)]"
                        : "bg-[var(--surface-2)] hover:bg-[var(--surface-3)]"
                  }`}
                >
                  {obs && (
                    <span
                      className="absolute inset-x-0 bottom-0 h-[2px]"
                      style={{ background: obs.confidence < 0.45 ? "var(--warning)" : "var(--success)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Clean minimal transport bar */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5">
            <IconButton label="Previous sentence (Shift+J)" onClick={() => stepSentence(-1)}>
              <IconSkipBack size={15} />
            </IconButton>
            <button
              type="button"
              onClick={toggle}
              disabled={!duration}
              aria-label={playing ? "Pause (Space)" : "Play (Space)"}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--accent-fg)] shadow-[var(--shadow-sm)] transition-transform hover:scale-105 active:scale-95 disabled:opacity-40"
              style={{ background: "var(--accent)" }}
            >
              {playing ? <IconPause size={16} /> : <IconPlay size={16} />}
            </button>
            <IconButton label="Next sentence (Shift+L)" onClick={() => stepSentence(1)}>
              <IconSkipFwd size={15} />
            </IconButton>
          </div>

          <div className="num flex items-baseline gap-1 font-mono text-[12px]">
            <span className="font-semibold text-[var(--fg)]">{fmtClock(time)}</span>
            <span className="text-[var(--fg-faint)]">/ {fmtClock(duration)}</span>
          </div>

          <Tip tip={`Playback speed (${rate}×) — click to cycle, right-click to slow`}>
            <button
              type="button"
              onClick={() => changeRate(1)}
              onContextMenu={(e) => {
                e.preventDefault();
                changeRate(-1);
              }}
              className="num h-7 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 font-mono text-[11px] font-medium text-[var(--fg-muted)] hover:text-[var(--fg)]"
            >
              {rate}×
            </button>
          </Tip>

          {/* Waveform zoom selector */}
          <div className="hidden items-center rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-0.5 font-mono text-[10px] sm:inline-flex">
            {([1, 2, 4, 8] as const).map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setZoom(z)}
                title={`Waveform zoom ${z}×`}
                className={`rounded px-1.5 py-0.5 transition-colors ${
                  zoom === z ? "bg-[var(--surface)] font-semibold text-[var(--fg)] shadow-2xs" : "text-[var(--fg-subtle)] hover:text-[var(--fg)]"
                }`}
              >
                {z}×
              </button>
            ))}
          </div>

          <div className="hidden h-5 w-px bg-[var(--border)] md:block" />

          {/* 20ms CTC Frame step + A/B Loop */}
          <div className="hidden items-center gap-0.5 md:flex">
            <Tip tip="Step −20ms frame (,)">
              <Button size="xs" variant="ghost" onClick={() => nudge(-1)}>
                −20ms
              </Button>
            </Tip>
            <Tip tip="Step +20ms frame (.)">
              <Button size="xs" variant="ghost" onClick={() => nudge(1)}>
                +20ms
              </Button>
            </Tip>
            <Tip tip="Loop In (I)">
              <Button size="xs" variant={loop.a != null ? "accent" : "ghost"} onClick={() => setLoop("in")}>
                In
              </Button>
            </Tip>
            <Tip tip="Loop Out (O)">
              <Button size="xs" variant={loop.b != null ? "accent" : "ghost"} onClick={() => setLoop("out")}>
                Out
              </Button>
            </Tip>
          </div>

          {loop.a != null && loop.b != null && (
            <div className="flex items-center gap-1">
              <Badge tone="accent">
                <IconRepeat size={10} /> {loopLen?.toFixed(2)}s
              </Badge>
              <IconButton label="Clear loop (Alt+L)" onClick={() => setLoop("clear")}>
                <IconX size={12} />
              </IconButton>
            </div>
          )}

          {/* Transcript / Visual search */}
          <div className="ml-auto flex items-center gap-1.5">
            <div className="relative">
              <IconSearch size={12} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[var(--fg-faint)]" />
              <Input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    jumpToHit(e.shiftKey ? -1 : 1);
                  }
                  if (e.key === "Escape") {
                    setQuery("");
                    e.currentTarget.blur();
                  }
                }}
                placeholder={view === "visual" ? "Filter visuals… (/)" : "Find in transcript… (/)"}
                className="h-7.5 w-44 pl-7 pr-6 font-mono text-[11px]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-[var(--fg-faint)] hover:text-[var(--fg)]"
                  aria-label="Clear search"
                >
                  <IconX size={11} />
                </button>
              )}
            </div>
            {query && (
              <Badge tone={hitIndices.size ? "accent" : "danger"}>
                {hitIndices.size}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* ── Mode Bar + Editor Tools + Export Menu ───────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {isVideo ? (
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { id: "sync", label: "Synced Stream", hint: "30s sections · 5s visual + speech blocks (1)" },
                { id: "speech", label: "Transcript", hint: "Clean prose transcript (2)" },
                { id: "visual", label: "Storyboard", hint: "5-second visual cards (3)" },
              ]}
            />
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] font-semibold text-[var(--fg)]">Transcript</span>
              {doc?.alignment && (
                <Badge tone={doc.alignment.method === "ctc-forced" ? "success" : "warning"}>
                  {doc.alignment.method === "ctc-forced"
                    ? `${Math.round((doc.alignment.avgConfidence ?? 0) * 100)}% CTC precision`
                    : "drift fallback"}
                </Badge>
              )}
            </div>
          )}

          {/* Uncertain-word review stepper */}
          {uncertainIndices.length > 0 && (
            <Button
              size="xs"
              variant="secondary"
              icon={<IconWarn size={11} className="text-[var(--warning)]" />}
              onClick={jumpNextUncertain}
              title="Jump through low-confidence words and hear each in context"
            >
              Review {uncertainCursor >= 0 ? `${uncertainCursor + 1}/` : ""}
              {uncertainIndices.length} uncertain
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {isVideo && videoMeta(job) && (
            <Badge tone="visual">
              {resolution(job.videoMeta!.width, job.videoMeta!.height)} · {video?.sceneCuts?.length ?? 0} cuts
            </Badge>
          )}

          <Button
            size="xs"
            variant={showPauses ? "secondary" : "ghost"}
            onClick={() => setShowPauses((v) => !v)}
            title="Show/hide dead-air pause badges (≥ 450 ms)"
          >
            Pauses
          </Button>

          <Button
            size="xs"
            variant={editMode ? "accent" : "ghost"}
            onClick={() => setEditMode((v) => !v)}
            title="Click any word or 5s visual block to edit text while keeping exact timestamps"
          >
            {editMode ? "Editing ON" : "Edit text"}
          </Button>

          <Button size="xs" variant="ghost" icon={copied ? <IconCheck size={12} /> : <IconCopy size={12} />} onClick={doCopy}>
            {copied ? "Copied" : "Copy"}
          </Button>

          <div className="relative">
            <Button size="xs" variant="primary" icon={<IconDownload size={12} />} onClick={() => setShowExport((v) => !v)}>
              Export
            </Button>
            {showExport && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowExport(false)} />
                <div className="absolute top-[calc(100%+6px)] right-0 z-50 w-64 animate-rise rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] p-1.5 shadow-[var(--shadow-lg)]">
                  {EXPORT_LABELS.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => {
                        if (doc) exportJob(e.id, job, doc);
                        setShowExport(false);
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-[var(--surface-2)]"
                    >
                      <div className="min-w-0">
                        <div className="text-[11.5px] font-medium text-[var(--fg)]">{e.label}</div>
                        <div className="truncate text-[10px] text-[var(--fg-subtle)]">{e.hint}</div>
                      </div>
                      <Badge tone="neutral">{e.ext}</Badge>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content Surface ────────────────────────────────────────── */}
      <div
        id="tw-scroll"
        className="max-h-[65vh] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]"
      >
        {view === "sync" && isVideo && (
          <SyncView
            job={job}
            query={query}
            hitIndices={hitIndices}
            time={time}
            curWord={curWord}
            showPauses={showPauses}
            editMode={editMode}
            editingWordIdx={editingWordIdx}
            editingWordVal={editingWordVal}
            onStartEditWord={(idx, val) => {
              setEditingWordIdx(idx);
              setEditingWordVal(val);
            }}
            onChangeEditWord={setEditingWordVal}
            onCommitWord={saveWordEdit}
            onCancelEditWord={() => setEditingWordIdx(null)}
            editingObsIdx={editingObsIdx}
            editingObsVal={editingObsVal}
            onStartEditObs={(idx, val) => {
              setEditingObsIdx(idx);
              setEditingObsVal(val);
            }}
            onChangeEditObs={setEditingObsVal}
            onCommitObs={saveObsEdit}
            onCancelEditObs={() => setEditingObsIdx(null)}
            observations={observations}
            words={words}
            slotEls={slotEls}
            onSeek={seekTo}
            duration={duration}
          />
        )}
        {view === "speech" && (
          <SpeechView
            sentences={sentences}
            words={words}
            query={query}
            hitIndices={hitIndices}
            curWord={curWord}
            curSentence={curSentence}
            showPauses={showPauses}
            editMode={editMode}
            editingWordIdx={editingWordIdx}
            editingWordVal={editingWordVal}
            onStartEditWord={(idx, val) => {
              setEditingWordIdx(idx);
              setEditingWordVal(val);
            }}
            onChangeEditWord={setEditingWordVal}
            onCommitWord={saveWordEdit}
            onCancelEditWord={() => setEditingWordIdx(null)}
            sentEls={sentEls}
            onSeek={seekTo}
            jobStatus={job.status}
          />
        )}
        {view === "visual" && isVideo && <VisualView job={job} onSeek={seekTo} time={time} />}
      </div>
    </div>
  );
}

function videoMeta(job: JobDetail) {
  return job.videoMeta;
}

/* ═══ Shared Editable Word Token ══════════════════════════════════════════ */
function WordToken({
  w,
  wi,
  displayText,
  isCur,
  query,
  showPauses,
  editMode,
  editingWordIdx,
  editingWordVal,
  onStartEditWord,
  onChangeEditWord,
  onCommitWord,
  onCancelEditWord,
  onSeek,
}: {
  w: NonNullable<JobDetail["transcript"]>["words"][number] | undefined;
  wi: number;
  displayText: string;
  isCur: boolean;
  query: string;
  showPauses: boolean;
  editMode: boolean;
  editingWordIdx: number | null;
  editingWordVal: string;
  onStartEditWord: (idx: number, val: string) => void;
  onChangeEditWord: (val: string) => void;
  onCommitWord: (idx: number, val: string) => void;
  onCancelEditWord: () => void;
  onSeek: (sec: number, play?: boolean) => void;
}) {
  if (editingWordIdx === wi) {
    return (
      <input
        autoFocus
        value={editingWordVal}
        onChange={(e) => onChangeEditWord(e.target.value)}
        onBlur={() => onCommitWord(wi, editingWordVal)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onCommitWord(wi, editingWordVal);
          } else if (e.key === "Escape") {
            e.preventDefault();
            onCancelEditWord();
          }
        }}
        style={{ width: `${Math.max(4, editingWordVal.length + 2)}ch` }}
        className="mx-0.5 inline-block rounded border border-[var(--accent)] bg-[var(--surface-2)] px-1 py-0 font-mono text-[12.5px] text-[var(--fg)] focus:outline-none"
      />
    );
  }

  return (
    <span className="whitespace-nowrap">
      <span
        onClick={() => {
          if (editMode && w) {
            onStartEditWord(wi, w.word);
          } else if (w) {
            onSeek(Math.max(0, w.start - 0.04), true);
          }
        }}
        onDoubleClick={() => {
          if (w) onStartEditWord(wi, w.word);
        }}
        className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-[var(--surface-3)] ${
          editMode ? "ring-1 ring-inset ring-[var(--border-strong)]" : ""
        }`}
        style={{
          background: isCur ? "var(--accent)" : undefined,
          color: isCur ? "var(--accent-fg)" : undefined,
          textDecoration: w?.confidence != null && w.confidence < 0.35 ? "underline dotted" : undefined,
          textDecorationColor: "var(--warning)",
          textUnderlineOffset: 3,
        }}
        title={
          w
            ? `${w.start.toFixed(3)}s → ${(w.spokenEnd ?? w.end).toFixed(3)}s · pause ${w.pauseAfterMs}ms${
                w.confidence != null ? ` · ${Math.round(w.confidence * 100)}% conf` : ""
              } (click to play, double-click to edit)`
            : undefined
        }
      >
        {highlight(displayText, query, !!w && wordMatches(w, query))}
      </span>
      {showPauses && w && w.pauseAfterMs >= 450 && !isCur && (
        <span
          onClick={() => onSeek(w.spokenEnd ?? w.end, true)}
          title={`Dead-air silence: ${w.pauseAfterMs} ms`}
          className="mx-1 inline-flex cursor-pointer items-center rounded bg-[var(--warning-soft)] px-1 py-px font-mono text-[9px] text-[var(--warning)]"
        >
          {(w.pauseAfterMs / 1000).toFixed(2)}s
        </span>
      )}{" "}
    </span>
  );
}

/* ═══ SYNC VIEW: 30s sections → 5s visual + speech blocks ════════════════ */
function SyncView({
  job,
  query,
  hitIndices,
  time,
  curWord,
  showPauses,
  editMode,
  editingWordIdx,
  editingWordVal,
  onStartEditWord,
  onChangeEditWord,
  onCommitWord,
  onCancelEditWord,
  editingObsIdx,
  editingObsVal,
  onStartEditObs,
  onChangeEditObs,
  onCommitObs,
  onCancelEditObs,
  observations,
  words,
  slotEls,
  onSeek,
  duration,
}: {
  job: JobDetail;
  query: string;
  hitIndices: Set<number>;
  time: number;
  curWord: number;
  showPauses: boolean;
  editMode: boolean;
  editingWordIdx: number | null;
  editingWordVal: string;
  onStartEditWord: (idx: number, val: string) => void;
  onChangeEditWord: (val: string) => void;
  onCommitWord: (idx: number, val: string) => void;
  onCancelEditWord: () => void;
  editingObsIdx: number | null;
  editingObsVal: string;
  onStartEditObs: (idx: number, val: string) => void;
  onChangeEditObs: (val: string) => void;
  onCommitObs: (idx: number, val: string) => void;
  onCancelEditObs: () => void;
  observations: VideoObservation[];
  words: NonNullable<JobDetail["transcript"]>["words"];
  slotEls: React.RefObject<Map<number, HTMLDivElement>>;
  onSeek: (sec: number, play?: boolean) => void;
  duration: number;
}) {
  const sections = useMemo(() => {
    if (!duration) return [];
    const total = Math.max(1, Math.ceil(duration / 30));
    return Array.from({ length: total }, (_, i) => ({ index: i, start: i * 30, end: Math.min(duration, (i + 1) * 30) }));
  }, [duration]);

  const slotsOf = useCallback(
    (start: number, end: number) => {
      const out: { start: number; end: number; ctxStart: number; ctxEnd: number }[] = [];
      for (let t = start; t < end - 0.001; t += 5) {
        const te = Math.min(end, t + 5);
        out.push({ start: t, end: te, ctxStart: Math.max(0, t - 1), ctxEnd: Math.min(duration, te + 1) });
      }
      return out;
    },
    [duration]
  );

  const wordsIn = useCallback(
    (a: number, b: number) => {
      const res: { w: (typeof words)[number]; i: number }[] = [];
      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        const mid = (w.start + (w.spokenEnd ?? w.end)) / 2;
        if (mid >= a && (mid < b || (Math.abs(b - duration) < 0.05 && mid <= b + 0.05))) res.push({ w, i });
      }
      return res;
    },
    [words, duration]
  );

  if (!sections.length) {
    return (
      <div className="flex items-center justify-center gap-2 p-10 text-center text-[12px] text-[var(--fg-subtle)]">
        <Spinner className="h-3.5 w-3.5" /> probing video stream…
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--border)]">
      {sections.map((sec) => {
        const done = job.transcript?.video?.sections.find((s) => s.index === sec.index);
        return (
          <section key={sec.index}>
            <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--surface)]/95 px-4 py-2 backdrop-blur">
              <div className="flex items-center gap-2">
                <span className="num rounded bg-[var(--surface-3)] px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-[var(--fg)]">
                  Section {sec.index + 1}
                </span>
                <span className="num font-mono text-[11px] text-[var(--fg-muted)]">
                  {fmtClock(sec.start)} → {fmtClock(sec.end)}
                </span>
                <Badge tone={done ? "success" : "neutral"}>
                  {done ? plural(done.observations.length, "5s slot") : "queued"}
                </Badge>
              </div>
              <span className="font-mono text-[10px] text-[var(--fg-subtle)]">
                {done ? (
                  <>
                    {done.model.replace("gemini-", "")}
                    {done.keyIndex != null ? ` · key #${done.keyIndex}` : ""} · 1s overlap
                  </>
                ) : (
                  "30s section · 1s overlap"
                )}
              </span>
            </header>

            {done?.summary && (
              <p className="border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-[12px] leading-relaxed text-[var(--fg-muted)]">
                {done.summary}
              </p>
            )}

            <div className="divide-y divide-[var(--border)]">
              {slotsOf(sec.start, sec.end).map((slot, si) => {
                const obs = done?.observations.find((o) => Math.abs(o.start - slot.start) < 0.05);
                const gIdx = obs ? observations.findIndex((x) => x.index === obs.index) : -1;
                const slotActive = time >= slot.start && time < slot.end;
                const sw = wordsIn(slot.start, slot.end);
                const hit = query.trim() && obs ? hitIndices.has(obs.index) : false;

                return (
                  <div
                    key={si}
                    ref={(el) => {
                      if (gIdx >= 0) {
                        if (el) slotEls.current.set(gIdx, el);
                        else slotEls.current.delete(gIdx);
                      }
                    }}
                    className={`grid gap-3 px-4 py-3 transition-colors lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] ${
                      slotActive ? "bg-[var(--accent-soft)]" : hit ? "bg-[var(--info-soft)]" : "hover:bg-[var(--surface-2)]/60"
                    }`}
                  >
                    {/* Visual column */}
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => onSeek(slot.start, true)}
                          className="num inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold hover:underline"
                          style={{ color: "var(--accent)" }}
                        >
                          {fmtClock(slot.start)} → {fmtClock(slot.end)}
                        </button>
                        <span className="num font-mono text-[9.5px] text-[var(--fg-faint)]">
                          overlap {fmtClock(slot.ctxStart, false)}–{fmtClock(slot.ctxEnd, false)}
                        </span>
                      </div>

                      {obs ? (
                        <>
                          {editingObsIdx === obs.index ? (
                            <div className="mt-1.5 space-y-1.5">
                              <textarea
                                autoFocus
                                rows={2}
                                value={editingObsVal}
                                onChange={(e) => onChangeEditObs(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    onCommitObs(obs.index, editingObsVal);
                                  } else if (e.key === "Escape") {
                                    onCancelEditObs();
                                  }
                                }}
                                className="w-full rounded-md border border-[var(--accent)] bg-[var(--surface-2)] p-2 text-[12px] text-[var(--fg)] focus:outline-none"
                              />
                              <div className="flex gap-1.5">
                                <Button size="xs" variant="accent" onClick={() => onCommitObs(obs.index, editingObsVal)}>
                                  Save
                                </Button>
                                <Button size="xs" variant="ghost" onClick={onCancelEditObs}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p
                              onClick={() => {
                                if (editMode) onStartEditObs(obs.index, obs.description);
                              }}
                              onDoubleClick={() => onStartEditObs(obs.index, obs.description)}
                              title="Double-click to edit visual description"
                              className={`mt-1.5 text-[12.5px] leading-relaxed text-[var(--fg)] ${
                                editMode ? "cursor-text rounded ring-1 ring-[var(--border-strong)] px-1.5 py-1" : ""
                              }`}
                            >
                              {obs.description}
                            </p>
                          )}

                          {obs.events && obs.events.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {obs.events.map((ev, k) => (
                                <button
                                  key={k}
                                  type="button"
                                  onClick={() => onSeek(ev.time, true)}
                                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9.5px] transition-opacity hover:opacity-80"
                                  style={{
                                    borderColor: "color-mix(in oklab, var(--visual) 35%, transparent)",
                                    background: "var(--visual-soft)",
                                    color: "var(--visual)",
                                  }}
                                >
                                  <span className="num font-semibold">{fmtClock(ev.time)}</span>
                                  <span>{ev.what}</span>
                                  {ev.syncedWord && <span style={{ color: "var(--accent)" }}>on “{ev.syncedWord}”</span>}
                                </button>
                              ))}
                            </div>
                          )}

                          {(obs.shot || obs.actions.length > 0 || obs.visibleText.length > 0) && (
                            <div className="mt-2 flex flex-wrap items-center gap-1">
                              {obs.shot && <Badge tone="neutral">{obs.shot}</Badge>}
                              {obs.actions.slice(0, 3).map((x) => (
                                <Badge key={x} tone="info">
                                  {x}
                                </Badge>
                              ))}
                              {obs.visibleText.slice(0, 3).map((x) => (
                                <Badge key={x} tone="accent">
                                  {x}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="mt-2 flex items-center gap-2 font-mono text-[11px] text-[var(--fg-faint)]">
                          {job.status === "working" ? (
                            <>
                              <Spinner className="h-3 w-3" /> awaiting 30s section analysis…
                            </>
                          ) : (
                            "pending analysis"
                          )}
                        </div>
                      )}
                    </div>

                    {/* Speech column */}
                    <div className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-2.5">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="label">Spoken · {sw.length}w</span>
                        <span className="font-mono text-[9px] text-[var(--fg-faint)]">
                          {editMode ? "click word to edit" : "double-click to edit"}
                        </span>
                      </div>
                      {sw.length ? (
                        <div className="text-[13px] leading-[1.8]">
                          {sw.map(({ w, i }) => (
                            <WordToken
                              key={i}
                              w={w}
                              wi={i}
                              displayText={w.word}
                              isCur={i === curWord}
                              query={query}
                              showPauses={showPauses}
                              editMode={editMode}
                              editingWordIdx={editingWordIdx}
                              editingWordVal={editingWordVal}
                              onStartEditWord={onStartEditWord}
                              onChangeEditWord={onChangeEditWord}
                              onCommitWord={onCommitWord}
                              onCancelEditWord={onCancelEditWord}
                              onSeek={onSeek}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="font-mono text-[11px] text-[var(--fg-faint)]">
                          {words.length === 0 && job.status === "working" ? "aligning speech…" : "no speech in this 5s window"}
                        </div>
                      )}
                      {obs?.audioRelation && (
                        <div className="mt-2 border-t border-[var(--border)] pt-1.5 text-[11px] leading-snug text-[var(--fg-muted)]">
                          <span className="font-mono text-[9.5px] font-semibold" style={{ color: "var(--accent)" }}>
                            sync ↳
                          </span>{" "}
                          {obs.audioRelation}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ═══ SPEECH VIEW: Clean Editorial Document ══════════════════════════════ */
function SpeechView({
  sentences,
  words,
  query,
  hitIndices,
  curWord,
  curSentence,
  showPauses,
  editMode,
  editingWordIdx,
  editingWordVal,
  onStartEditWord,
  onChangeEditWord,
  onCommitWord,
  onCancelEditWord,
  sentEls,
  onSeek,
  jobStatus,
}: {
  sentences: NonNullable<JobDetail["transcript"]>["sentences"];
  words: NonNullable<JobDetail["transcript"]>["words"];
  query: string;
  hitIndices: Set<number>;
  curWord: number;
  curSentence: number;
  showPauses: boolean;
  editMode: boolean;
  editingWordIdx: number | null;
  editingWordVal: string;
  onStartEditWord: (idx: number, val: string) => void;
  onChangeEditWord: (val: string) => void;
  onCommitWord: (idx: number, val: string) => void;
  onCancelEditWord: () => void;
  sentEls: React.RefObject<Map<number, HTMLDivElement>>;
  onSeek: (sec: number, play?: boolean) => void;
  jobStatus: string;
}) {
  if (!sentences.length) {
    return (
      <div className="flex items-center justify-center gap-2 p-12 text-center font-mono text-[11.5px] text-[var(--fg-subtle)]">
        {jobStatus === "working" && <Spinner className="h-3.5 w-3.5" />}
        <span>
          {jobStatus === "working" ? "transcript words appear live as each chunk finishes…" : "no spoken words detected in this media"}
        </span>
      </div>
    );
  }
  return (
    <div className="p-4">
      <div className="space-y-1.5">
        {sentences.map((s) => {
          const hit = query.trim() ? hitIndices.has(s.index) : false;
          const active = s.index === curSentence;
          return (
            <div
              key={s.index}
              ref={(el) => {
                if (el) sentEls.current.set(s.index, el);
                else sentEls.current.delete(s.index);
              }}
              className={`group flex gap-3 rounded-lg px-3 py-2 transition-colors ${
                active ? "bg-[var(--accent-soft)]" : hit ? "bg-[var(--info-soft)]" : "hover:bg-[var(--surface-2)]"
              }`}
            >
              <button
                type="button"
                onClick={() => onSeek(s.start, true)}
                className="num mt-1 w-14 shrink-0 text-left font-mono text-[10.5px] text-[var(--fg-subtle)] transition-colors hover:text-[var(--accent)]"
              >
                {fmtClock(s.start, false)}
              </button>
              <p className="min-w-0 flex-1 text-[14px] leading-[1.85] text-[var(--fg)]">
                {Array.from({ length: s.wordEnd - s.wordStart + 1 }, (_, i) => {
                  const wi = s.wordStart + i;
                  const w = words[wi];
                  if (!w) return null;
                  return (
                    <WordToken
                      key={wi}
                      w={w}
                      wi={wi}
                      displayText={w.word}
                      isCur={wi === curWord}
                      query={query}
                      showPauses={showPauses}
                      editMode={editMode}
                      editingWordIdx={editingWordIdx}
                      editingWordVal={editingWordVal}
                      onStartEditWord={onStartEditWord}
                      onChangeEditWord={onChangeEditWord}
                      onCommitWord={onCommitWord}
                      onCancelEditWord={onCancelEditWord}
                      onSeek={onSeek}
                    />
                  );
                })}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══ VISUAL VIEW: 5-Second Storyboard Cards ═════════════════════════════ */
function VisualView({ job, onSeek, time }: { job: JobDetail; onSeek: (s: number, p?: boolean) => void; time: number }) {
  const video = job.transcript?.video;
  if (!video?.sections.length) {
    return (
      <div className="p-10 text-center font-mono text-[11.5px] text-[var(--fg-subtle)]">
        storyboard populates section by section…
      </div>
    );
  }
  return (
    <div className="space-y-4 p-4">
      {video.sections.map((sec) => (
        <div key={sec.index}>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-1.5">
            <span className="num font-mono text-[11px] font-semibold text-[var(--fg)]">
              Section {sec.index + 1} · {fmtClock(sec.start, false)} → {fmtClock(sec.end, false)}
            </span>
            <span className="font-mono text-[10px] text-[var(--fg-subtle)]">
              {sec.model.replace("gemini-", "")}
              {sec.keyIndex != null ? ` · key #${sec.keyIndex}` : ""}
            </span>
          </div>
          {sec.summary && <p className="mb-2.5 text-[12px] leading-relaxed text-[var(--fg-muted)]">{sec.summary}</p>}
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {sec.observations.map((o) => {
              const active = time >= o.start && time < o.end;
              return (
                <button
                  key={o.index}
                  type="button"
                  onClick={() => onSeek(o.start, true)}
                  className={`min-w-0 rounded-xl border p-3 text-left transition-all ${
                    active
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="num font-mono text-[10.5px] font-semibold" style={{ color: "var(--accent)" }}>
                      {fmtClock(o.start, false)} → {fmtClock(o.end, false)}
                    </span>
                    <span
                      className="num font-mono text-[9.5px]"
                      style={{ color: o.confidence < 0.45 ? "var(--warning)" : "var(--success)" }}
                    >
                      {Math.round(o.confidence * 100)}%
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--fg)]">{o.description}</p>
                  {o.speech && (
                    <p
                      className="mt-2 border-l-2 pl-2 text-[11px] leading-snug"
                      style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
                    >
                      “{o.speech}”
                    </p>
                  )}
                  {o.audioRelation && <p className="mt-1.5 text-[10.5px] leading-snug text-[var(--fg-muted)]">↳ {o.audioRelation}</p>}
                  {(o.shot || o.visibleText.length > 0) && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {o.shot && <Badge tone="neutral">{o.shot}</Badge>}
                      {o.visibleText.slice(0, 2).map((x) => (
                        <Badge key={x} tone="accent">
                          {x}
                        </Badge>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function highlight(text: string, query: string, force: boolean) {
  if (!force || !query.trim()) return text;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="hit-active">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

/* ═══ High-Precision Zoomable Waveform Renderer ══════════════════════════ */
function drawTimeline(
  canvas: HTMLCanvasElement | null,
  job: JobDetail,
  t: number,
  loop: { a: number | null; b: number | null },
  obsStart: number | null,
  obsEnd: number | null,
  zoom: number
) {
  if (!canvas) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  if (!W) return;
  if (canvas.width !== Math.floor(W * dpr) || canvas.height !== Math.floor(H * dpr)) {
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  const dur = job.durationSec ?? 0;
  if (!dur) return;
  const frac = Math.min(1, t / dur);
  const mid = H / 2;
  const styles = getComputedStyle(document.documentElement);
  const played = styles.getPropertyValue("--wave-played").trim() || "#e59934";
  const idle = styles.getPropertyValue("--wave-idle").trim() || "#2a3342";
  const onset = styles.getPropertyValue("--wave-onset").trim() || played;
  const cut = styles.getPropertyValue("--wave-cut").trim() || "#a78bfa";

  // Energy bars
  const bins = job.energy?.bins;
  if (bins?.length) {
    const bw = W / bins.length;
    for (let i = 0; i < bins.length; i++) {
      const h = Math.max(1.5, bins[i] * (H * 0.8));
      ctx.fillStyle = i / bins.length <= frac ? played : idle;
      ctx.globalAlpha = i / bins.length <= frac ? 0.92 : 0.85;
      ctx.fillRect(i * bw + 0.5, mid - h / 2, Math.max(1, bw - 1.2), h);
    }
    ctx.globalAlpha = 1;
  }

  // Word boundary ticks when zoomed in (>= 2x)
  if (zoom >= 2 && job.transcript?.words?.length) {
    ctx.fillStyle = "rgba(148,163,184,0.22)";
    for (const w of job.transcript.words) {
      ctx.fillRect((w.start / dur) * W, 6, 1, H - 12);
    }
  }

  // A-B loop region
  if (loop.a != null && loop.b != null) {
    ctx.fillStyle = "rgba(229,153,52,0.14)";
    const x0 = (loop.a / dur) * W;
    const x1 = (loop.b / dur) * W;
    ctx.fillRect(x0, 0, Math.max(1, x1 - x0), H);
    ctx.fillStyle = played;
    ctx.fillRect(x0, 0, 1.5, H);
    ctx.fillRect(x1 - 1.5, 0, 1.5, H);
  }

  // Active 5s visual observation highlight band
  if (obsStart != null && obsEnd != null) {
    ctx.fillStyle = "rgba(167,139,250,0.12)";
    const x0 = (obsStart / dur) * W;
    ctx.fillRect(x0, 0, ((obsEnd - obsStart) / dur) * W, H);
  }

  // Acoustic onset ticks (top)
  if (job.onsets?.length) {
    ctx.fillStyle = onset;
    ctx.globalAlpha = 0.72;
    for (const o of job.onsets) ctx.fillRect((o / dur) * W, 0, 1, 4);
    ctx.globalAlpha = 1;
  }

  // FFmpeg physical scene cuts (bottom violet markers)
  const cuts = job.transcript?.video?.sceneCuts;
  if (cuts?.length) {
    ctx.fillStyle = cut;
    for (const c of cuts) ctx.fillRect((c / dur) * W - 0.5, H - 6, 1.5, 6);
  }

  // Playhead
  const x = frac * W;
  ctx.fillStyle = played;
  ctx.fillRect(x - 0.5, 0, 1.5, H);
  ctx.beginPath();
  ctx.moveTo(x - 4.5, 0);
  ctx.lineTo(x + 4.5, 0);
  ctx.lineTo(x, 6.5);
  ctx.closePath();
  ctx.fill();
}
