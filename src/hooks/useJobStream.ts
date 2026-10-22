"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { EventRow, JobDetail, JobSummary, TranscriptDoc } from "@/lib/types";

export interface JobStream {
  jobs: JobSummary[];
  detail: JobDetail | null;
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  select: (id: string | null) => void;
  refresh: (forceFull?: boolean) => Promise<void>;
  updateTranscriptOptimistic: (doc: TranscriptDoc, filename?: string) => void;
  queueRunning: boolean;
  keyCount: number;
  healthyKeyCount: number;
  liveConnected: boolean;
}

/**
 * Streams job state using real-time Server-Sent Events (`/api/jobs/[id]/stream`)
 * combined with lightweight `?lite=1` delta fetches (caching heavy `energy`,
 * `onsets`, and `silences` arrays once loaded) + visibility-aware fallback polling.
 */
export function useJobStream(): JobStream {
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [queueRunning, setQueueRunning] = useState(false);
  const [keyCount, setKeyCount] = useState(0);
  const [healthyKeyCount, setHealthyKeyCount] = useState(0);
  const [liveConnected, setLiveConnected] = useState(false);

  const sinceRef = useRef(0);
  const detailIdRef = useRef<string | null>(null);
  const hasAcousticCacheRef = useRef(false);
  const inFlight = useRef(false);
  const followRef = useRef(true);
  const visibleRef = useRef(true);
  const selectedRef = useRef<string | null>(null);
  const jobsRef = useRef<JobSummary[]>([]);
  jobsRef.current = jobs;
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = new URLSearchParams(window.location.search).get("job");
    if (id) {
      setSelectedId(id);
      selectedRef.current = id;
      followRef.current = false;
    }
  }, []);

  const select = useCallback((id: string | null) => {
    followRef.current = id === null;
    setSelectedId(id);
    selectedRef.current = id;
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (id) url.searchParams.set("job", id);
      else url.searchParams.delete("job");
      window.history.replaceState({}, "", url);
    }
  }, []);

  useEffect(() => {
    const onVis = () => {
      visibleRef.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const refresh = useCallback(async (forceFull = false) => {
    if (inFlight.current || (!forceFull && !visibleRef.current)) return;
    inFlight.current = true;
    try {
      const res = await fetch("/api/jobs", { cache: "no-store" });
      if (!res.ok) throw new Error(`Job list failed (${res.status})`);
      const data = await res.json();
      const list: JobSummary[] = data.jobs ?? [];
      setJobs((prev) => {
        if (
          prev.length === list.length &&
          prev.every(
            (p, i) =>
              p.id === list[i]?.id &&
              p.status === list[i]?.status &&
              p.stage === list[i]?.stage &&
              p.progress === list[i]?.progress &&
              p.wordCount === list[i]?.wordCount &&
              p.completedAt === list[i]?.completedAt
          )
        ) {
          return prev;
        }
        return list;
      });
      setQueueRunning(Boolean(data.queue?.running));
      setKeyCount(data.keyCount ?? 0);
      setHealthyKeyCount(data.healthyKeyCount ?? data.keyCount ?? 0);
      setError(null);

      const active = list.find((j) => j.status === "working") ?? list.find((j) => j.status === "queued");

      let id = selectedRef.current;
      if (followRef.current && active) id = active.id;
      else if (followRef.current && !id) id = list[0]?.id ?? null;
      else if (id && !list.some((j) => j.id === id)) id = active?.id ?? list[0]?.id ?? null;

      if (id !== selectedRef.current) {
        selectedRef.current = id;
        setSelectedId(id);
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          if (id) url.searchParams.set("job", id);
          else url.searchParams.delete("job");
          window.history.replaceState({}, "", url);
        }
      }

      if (id) {
        if (detailIdRef.current !== id) {
          detailIdRef.current = id;
          sinceRef.current = 0;
          hasAcousticCacheRef.current = false;
          setDetail(null);
          setLoading(true);
        }
        const useLite = !forceFull && hasAcousticCacheRef.current;
        const dRes = await fetch(`/api/jobs/${id}?since=${sinceRef.current}${useLite ? "&lite=1" : ""}`, {
          cache: "no-store",
        });
        if (dRes.ok) {
          const d: JobDetail = await dRes.json();
          if (d.energy && d.onsets && d.silences) {
            hasAcousticCacheRef.current = true;
          }
          if (d.events?.length) {
            sinceRef.current = Math.max(sinceRef.current, ...d.events.map((e) => e.id));
          }
          setDetail((prev) => {
            if (!prev || detailIdRef.current !== id) return d;
            const mergedEvents = d.events?.length
              ? dedupeEvents([...prev.events, ...d.events]).slice(-800)
              : prev.events;
            return {
              ...d,
              energy: d.energy ?? prev.energy,
              onsets: d.onsets ?? prev.onsets,
              silences: d.silences ?? prev.silences,
              events: mergedEvents,
            };
          });
        }
      } else {
        detailIdRef.current = null;
        sinceRef.current = 0;
        hasAcousticCacheRef.current = false;
        setDetail(null);
      }
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  // Trigger immediate refresh when selectedId changes explicitly
  useEffect(() => {
    void refresh(true);
  }, [selectedId, refresh]);

  // Real-time SSE connection for instant (<15ms) event & progress streaming
  const isSelectedActive = Boolean(
    selectedId && jobs.some((j) => j.id === selectedId && (j.status === "working" || j.status === "queued"))
  );

  useEffect(() => {
    if (!selectedId || !isSelectedActive) {
      setLiveConnected(false);
      return;
    }
    const es = new EventSource(`/api/jobs/${selectedId}/stream`);
    es.onopen = () => setLiveConnected(true);
    es.onerror = () => setLiveConnected(false);
    es.onmessage = (ev) => {
      try {
        const pkt = JSON.parse(ev.data);
        if (pkt.type === "event" && pkt.event) {
          const row = pkt.event as EventRow;
          sinceRef.current = Math.max(sinceRef.current, row.id);
          setDetail((prev) => {
            if (!prev || prev.id !== selectedId) return prev;
            return { ...prev, events: dedupeEvents([...prev.events, row]).slice(-800) };
          });
        } else if (pkt.type === "state") {
          setDetail((prev) => {
            if (!prev || prev.id !== selectedId) return prev;
            return {
              ...prev,
              status: (pkt.status as JobDetail["status"]) ?? prev.status,
              stage: pkt.stage ?? prev.stage,
              progress: typeof pkt.progress === "number" ? pkt.progress : prev.progress,
            };
          });
          setJobs((prev) =>
            prev.map((j) =>
              j.id === selectedId
                ? {
                    ...j,
                    status: (pkt.status as JobSummary["status"]) ?? j.status,
                    stage: pkt.stage ?? j.stage,
                    progress: typeof pkt.progress === "number" ? pkt.progress : j.progress,
                  }
                : j
            )
          );
          if (debounceTimer.current) clearTimeout(debounceTimer.current);
          debounceTimer.current = setTimeout(() => {
            void refresh();
          }, 180);
        }
      } catch {
        /* ignore malformed packet */
      }
    };
    return () => {
      es.close();
      setLiveConnected(false);
    };
  }, [selectedId, isSelectedActive, refresh]);

  // Calm background heartbeat poll (SSE handles real-time push; polling serves as safety net)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    const loop = async () => {
      if (stopped) return;
      await refresh();
      if (stopped) return;
      const busy = jobsRef.current.some((j) => j.status === "working" || j.status === "queued");
      timer = setTimeout(loop, busy ? 2500 : 5000);
    };
    timer = setTimeout(loop, 2500);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [refresh]);

  const updateTranscriptOptimistic = useCallback((doc: TranscriptDoc, filename?: string) => {
    setDetail((prev) =>
      prev
        ? {
            ...prev,
            filename: filename ?? prev.filename,
            transcript: doc,
            wordCount: doc.words.length,
            sentenceCount: doc.sentences.length,
          }
        : prev
    );
    if (filename) {
      setJobs((prev) => prev.map((j) => (j.id === selectedRef.current ? { ...j, filename } : j)));
    }
  }, []);

  return {
    jobs,
    detail,
    loading,
    error,
    selectedId,
    select,
    refresh,
    updateTranscriptOptimistic,
    queueRunning,
    keyCount,
    healthyKeyCount,
    liveConnected,
  };
}

function dedupeEvents(list: EventRow[]): EventRow[] {
  const seen = new Set<number>();
  const out: EventRow[] = [];
  for (const e of list) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    out.push(e);
  }
  return out;
}
