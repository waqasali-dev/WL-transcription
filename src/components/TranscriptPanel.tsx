"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { fmtClock, type JobDetail } from "@/lib/types";
import { Chip, IconPause, IconPlay, Panel } from "./ui";

export function TranscriptPanel({ job }: { job: JobDetail }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollBoxRef = useRef<HTMLDivElement>(null);
  const sentEls = useRef<Map<number, HTMLDivElement>>(new Map());

  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [curWord, setCurWord] = useState(-1);
  const [timeTick, setTimeTick] = useState(0); // 0.1s resolution display

  const words = job.transcript?.words ?? [];
  const sentences = job.transcript?.sentences ?? [];
  const duration = job.durationSec ?? 0;
  const complete = job.transcript?.complete === true;
  const aligned = job.transcript?.alignment;

  // binary search: last word whose start <= t
  const wordIndexAt = useCallback(
    (t: number) => {
      if (words.length === 0) return -1;
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

  // reset when job changes
  useEffect(() => {
    setCurWord(-1);
    setPlaying(false);
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.id]);

  // rAF loop: canvas playhead + current word + time
  useEffect(() => {
    let raf = 0;
    let lastWord = -1;
    let lastTenth = -1;
    const loop = () => {
      const a = audioRef.current;
      const t = a ? a.currentTime : 0;
      const w = a ? wordIndexAt(t) : -1;
      const inGap = w >= 0 && t - words[w].start > 1.2 ? -1 : w;
      if (inGap !== lastWord) {
        lastWord = inGap;
        setCurWord(inGap);
        // autoscroll the active sentence
        const wObj = inGap >= 0 ? words[inGap] : null;
        if (wObj) {
          const sIdx = sentences.findIndex((s) => wObj.start >= s.start - 0.001 && wObj.start <= s.end + 0.5);
          const el = sIdx >= 0 ? sentEls.current.get(sIdx) : null;
          if (el && scrollBoxRef.current) {
            const box = scrollBoxRef.current;
            const top = el.offsetTop - box.offsetTop;
            if (top < box.scrollTop + 20 || top > box.scrollTop + box.clientHeight - 60) {
              box.scrollTo({ top: top - box.clientHeight / 3, behavior: "smooth" });
            }
          }
        }
      }
      const tenth = Math.floor(t * 10);
      if (tenth !== lastTenth) {
        lastTenth = tenth;
        setTimeTick(t);
      }
      drawWave(canvasRef.current, job, t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [job, words, sentences, wordIndexAt]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) void a.play();
    else a.pause();
  };

  const seek = (frac: number) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    a.currentTime = Math.max(0, Math.min(duration, frac * duration));
  };

  const curSentIdx = curWord >= 0 ? sentences.findIndex((s) => {
    const w = words[curWord];
    return w && w.start >= s.start - 0.001 && w.start <= s.end + 0.5;
  }) : -1;

  return (
    <div>
      <audio
        ref={audioRef}
        src={`/api/jobs/${job.id}/media`}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onRateChange={(e) => setRate((e.target as HTMLAudioElement).playbackRate)}
      />
      <Panel
        title={
          <>
            <span>Transcript · word-accurate playback</span>
            {job.simulated && <Chip tone="warn">simulated text</Chip>}
            {complete ? (
              <Chip tone="ok">aligned · {aligned ? `${aligned.anchored}/${aligned.total} anchored` : "done"}</Chip>
            ) : (
              <Chip tone="acc">draft · streaming chunks</Chip>
            )}
          </>
        }
        right={
          <div className="flex flex-wrap items-center gap-2">
            {aligned && (
              <span className="font-mono text-[9.5px] text-dim" title="offset / stretch / median onset residual / starts inside silence">
                drift {aligned.driftMs != null ? `${aligned.driftMs > 0 ? "+" : ""}${aligned.driftMs}ms` : "—"} · ×{aligned.scale ?? 1} ·
                residual {aligned.medianResidualMs ?? 0}ms · silence-landing {Math.round((aligned.silenceLandingRate ?? 0) * 100)}%
              </span>
            )}
            <span className="num font-mono text-[10px] text-dim">
              {fmtClock(timeTick)} / {fmtClock(duration)}
            </span>
          </div>
        }
      >
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                disabled={!duration}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-acc text-canvas transition-transform hover:scale-105 disabled:opacity-40"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <IconPause className="h-4.5 w-4.5" /> : <IconPlay className="h-4.5 w-4.5" />}
              </button>
              <select
                value={rate}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setRate(v);
                  if (audioRef.current) audioRef.current.playbackRate = v;
                }}
                className="rounded border border-line2 bg-panel2 px-1.5 py-1 font-mono text-[10px] text-mut outline-none"
                aria-label="playback rate"
              >
                {[0.75, 1, 1.25, 1.5, 2].map((r) => (
                  <option key={r} value={r}>
                    {r}×
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-2 hidden w-44 flex-col gap-1 font-mono text-[9px] text-dim md:flex">
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-4 bg-acc" /> played
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-4 bg-line2" /> energy
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-0.5 bg-acc2" /> acoustic onset
              </span>
              <span className="flex items-center gap-1.5">
                <span className="underline decoration-ok/60 decoration-dotted">word</span> anchored
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            {/* waveform */}
            <div
              className="relative h-20 cursor-crosshair overflow-hidden rounded border border-line bg-canvas/70"
              onClick={(e) => {
                const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                seek((e.clientX - r.left) / r.width);
              }}
            >
              <canvas ref={canvasRef} className="h-full w-full" />
              {!job.energy && (
                <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-dim">
                  waveform renders after acoustic analysis…
                </div>
              )}
            </div>

            {/* sentences */}
            <div
              ref={scrollBoxRef}
              className="mt-3 max-h-64 overflow-y-auto rounded border border-line bg-canvas/40 p-3"
            >
              {sentences.length === 0 ? (
                <div className="py-6 text-center font-mono text-[11px] text-dim">
                  <div className="animate-pulse-soft">transcript streams in chunk by chunk — first words appear here as each Gemini pass completes…</div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {sentences.map((s) => (
                    <div
                      key={s.index}
                      ref={(el) => {
                        if (el) sentEls.current.set(s.index, el);
                        else sentEls.current.delete(s.index);
                      }}
                      className={`rounded px-2 py-1 transition-colors ${curSentIdx === s.index ? "bg-raise/80 ring-1 ring-acc/40" : "hover:bg-panel2/60"}`}
                    >
                      <span className="num mr-2 font-mono text-[9.5px] text-dim">{fmtClock(s.start)}</span>
                      {s.text.split(" ").map((tok, i) => {
                        const wi = s.wordStart + i;
                        const w = words[wi];
                        const isCur = wi === curWord;
                        const hasPause = w && w.pauseAfterMs >= 250;
                        const isAnchored = w?.anchored === true;
                        return (
                          <span key={wi} className="whitespace-nowrap">
                            <span
                              onClick={() => {
                                const a = audioRef.current;
                                if (a && w) a.currentTime = Math.max(0, w.start);
                              }}
                              className={`cursor-pointer rounded px-0.5 transition-colors ${
                                isCur
                                  ? "bg-acc text-canvas"
                                  : isAnchored
                                    ? "text-ink underline decoration-ok/50 decoration-dotted underline-offset-2 hover:bg-raise"
                                    : "text-ink/70 hover:bg-raise"
                              }`}
                              title={
                                w
                                  ? `${w.start.toFixed(3)}s → ${w.end.toFixed(3)}s${w.aiStart != null ? `\nmodel said ${w.aiStart.toFixed(3)}s (Δ ${((w.start - w.aiStart) * 1000).toFixed(0)}ms)` : ""}\n${isAnchored ? "anchored to a measured acoustic onset" : "interpolated between anchors"} — click to seek`
                                  : undefined
                              }
                            >
                              {tok}
                            </span>
                            {hasPause && !isCur ? (
                              <span className="mx-1 inline-block h-1 w-1 translate-y-[-1px] rounded-full bg-warn/80" title="narrator pause" />
                            ) : (
                              " "
                            )}
                          </span>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

// ── imperative waveform rendering (no react re-render per frame) ─────────────
function drawWave(canvas: HTMLCanvasElement | null, job: JobDetail, t: number) {
  if (!canvas) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  if (W === 0) return;
  if (canvas.width !== Math.floor(W * dpr) || canvas.height !== Math.floor(H * dpr)) {
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  const dur = job.durationSec ?? 0;
  const frac = dur > 0 ? Math.min(1, t / dur) : 0;
  const mid = H / 2;

  // energy bars
  const bins = job.energy?.bins;
  if (bins && bins.length) {
    const bw = W / bins.length;
    for (let i = 0; i < bins.length; i++) {
      const h = Math.max(1, bins[i] * (H * 0.86));
      const played = i / bins.length <= frac;
      ctx.fillStyle = played ? "rgba(232,163,61,0.85)" : "rgba(44,55,69,0.9)";
      const x = i * bw;
      ctx.fillRect(x + 0.5, mid - h / 2, Math.max(1, bw - 1.2), h);
    }
  }

  // onset ticks
  if (job.onsets && job.onsets.length && dur > 0) {
    ctx.fillStyle = "rgba(243,193,116,0.9)";
    for (const o of job.onsets) {
      const x = (o / dur) * W;
      ctx.fillRect(x, 0, 1, 5);
    }
  }

  // silence bands (subtle)
  if (job.silences && dur > 0) {
    ctx.fillStyle = "rgba(10,12,16,0.35)";
    for (const s of job.silences) {
      const x = (s.start / dur) * W;
      const w = ((s.end - s.start) / dur) * W;
      ctx.fillRect(x, H - 2, Math.max(1, w), 2);
    }
  }

  // playhead
  if (dur > 0) {
    const x = frac * W;
    ctx.fillStyle = "rgba(231,236,243,0.9)";
    ctx.fillRect(x - 0.5, 0, 1, H);
    ctx.fillStyle = "rgba(232,163,61,1)";
    ctx.beginPath();
    ctx.moveTo(x - 4, 0);
    ctx.lineTo(x + 4, 0);
    ctx.lineTo(x, 6);
    ctx.closePath();
    ctx.fill();
  }
}
