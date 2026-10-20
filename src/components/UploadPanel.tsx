"use client";
import { useRef, useState } from "react";
import { STAGES } from "@/lib/types";
import { fmtBytes } from "@/lib/types";
import { Chip, IconUpload } from "./ui";

const ACCEPT = ".mp3,.wav,.m4a,.mp4,.ogg,.flac,.aac,.webm,.aiff,.aif";

export function UploadPanel({ onStarted, busy }: { onStarted: (id: string) => void; busy: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/jobs", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
      setFile(null);
      onStarted(data.id);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-lg border border-line bg-panel">
      <div className="border-b border-line px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
        Input Audio
      </div>
      <div className="p-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files?.[0];
            if (f) setFile(f);
            setError(null);
          }}
          className={`group w-full rounded-md border border-dashed px-3 py-4 text-center transition-colors ${
            drag ? "border-acc bg-acc/10" : "border-line2 bg-panel2 hover:border-acc/60 hover:bg-raise/60"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setFile(f);
              setError(null);
            }}
          />
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-md border border-line2 bg-raise text-acc transition-transform group-hover:scale-105">
            <IconUpload className="h-4.5 w-4.5" />
          </div>
          {file ? (
            <>
              <div className="truncate font-mono text-xs text-ink">{file.name}</div>
              <div className="mt-1 font-mono text-[10px] text-dim">{fmtBytes(file.size)} · drop replacement to change</div>
            </>
          ) : (
            <>
              <div className="text-xs font-medium text-mut">Drop audio here or click to browse</div>
              <div className="mt-1 font-mono text-[10px] text-dim">mp3 · wav · m4a · ogg · flac — up to 250 MB</div>
            </>
          )}
        </button>

        {error && <div className="mt-2 rounded border border-bad/40 bg-bad/10 px-2 py-1.5 text-xs text-bad">{error}</div>}

        <button
          onClick={submit}
          disabled={!file || uploading || busy}
          className="mt-2 w-full rounded-md bg-acc px-3 py-2 text-sm font-semibold text-canvas transition-colors hover:bg-acc2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {uploading ? "Uploading…" : busy ? "Queue busy — waiting…" : "Start precision transcription"}
        </button>

        <div className="mt-3">
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">Planned pipeline</div>
          <div className="grid grid-cols-2 gap-1">
            {STAGES.map((s, i) => (
              <div key={s.key} className="flex items-center gap-1.5 rounded border border-line bg-panel2 px-1.5 py-1">
                <span className="num font-mono text-[9px] text-dim">{String(i + 1).padStart(2, "0")}</span>
                <span className="truncate text-[10px] text-mut">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-2">
            <Chip tone="acc">frame-accurate</Chip>{" "}
            <Chip tone="ok">gapless</Chip>{" "}
            <Chip tone="inf">multi-key rotation</Chip>
          </div>
        </div>
      </div>
    </div>
  );
}
