"use client";
import { useEffect, useState } from "react";
import type { AppSettings } from "@/lib/types";
import { AVAILABLE_MODELS } from "@/lib/types";
import { Panel } from "./ui";

export function SettingsPanel({ initial, onChange }: { initial: AppSettings | null; onChange: (s: AppSettings) => void }) {
  const [form, setForm] = useState<AppSettings>({ chunkSec: 30, overlapSec: 2, model: "auto", toleranceMs: 350, allowSimulate: true, gapless: false });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (initial) setForm(initial);
  }, [initial]);

  const save = async () => {
    const res = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (res.ok) {
      onChange(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  };

  const num = (v: string, d: number) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : d;
  };

  return (
    <Panel title="Pipeline settings" right={<span className="font-mono text-[10px] text-dim">{saved ? "saved ✓" : "applies to new jobs"}</span>}>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-dim">Chunk (s)</span>
          <input
            type="number"
            min={10}
            max={60}
            value={form.chunkSec}
            onChange={(e) => setForm({ ...form, chunkSec: num(e.target.value, 30) })}
            className="num w-full rounded border border-line2 bg-panel2 px-2 py-1.5 font-mono text-xs text-ink outline-none focus:border-acc/60"
          />
        </label>
        <label className="block">
          <span className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-dim">Overlap (s)</span>
          <input
            type="number"
            min={0}
            max={5}
            value={form.overlapSec}
            onChange={(e) => setForm({ ...form, overlapSec: num(e.target.value, 2) })}
            className="num w-full rounded border border-line2 bg-panel2 px-2 py-1.5 font-mono text-xs text-ink outline-none focus:border-acc/60"
          />
        </label>
        <label className="col-span-2 block">
          <span className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-dim">Preferred model</span>
          <select
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            className="w-full rounded border border-line2 bg-panel2 px-2 py-1.5 font-mono text-xs text-ink outline-none focus:border-acc/60"
          >
            <option value="auto">auto — rotate full pool</option>
            {AVAILABLE_MODELS.map((m) => (
              <option key={m.model} value={m.model}>
                {m.model} · {m.rpm} RPM / {m.rpd} RPD
              </option>
            ))}
          </select>
        </label>
        <label className="col-span-2 block">
          <span className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-wide text-dim">
            <span>Onset tolerance</span>
            <span className="text-acc">{form.toleranceMs} ms</span>
          </span>
          <input
            type="range"
            min={150}
            max={600}
            step={25}
            value={form.toleranceMs}
            onChange={(e) => setForm({ ...form, toleranceMs: parseInt(e.target.value, 10) })}
            className="w-full accent-[#e8a33d]"
          />
        </label>
        <label className="col-span-2 flex cursor-pointer items-center justify-between rounded border border-line bg-panel2 px-2 py-2">
          <span className="text-xs text-mut">
            Gapless bridging
            <span className="ml-1 font-mono text-[9px] text-dim">{form.gapless ? "ends stretched to next word" : "word-accurate ends"}</span>
          </span>
          <button
            type="button"
            onClick={() => setForm({ ...form, gapless: !form.gapless })}
            className={`relative h-4.5 w-8 rounded-full transition-colors ${form.gapless ? "bg-acc" : "bg-raise"}`}
            aria-label="toggle gapless bridging"
          >
            <span className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-canvas transition-all ${form.gapless ? "left-4" : "left-0.5"}`} />
          </button>
        </label>
        <label className="col-span-2 flex cursor-pointer items-center justify-between rounded border border-line bg-panel2 px-2 py-2">
          <span className="text-xs text-mut">Simulation fallback</span>
          <button
            type="button"
            onClick={() => setForm({ ...form, allowSimulate: !form.allowSimulate })}
            className={`relative h-4.5 w-8 rounded-full transition-colors ${form.allowSimulate ? "bg-acc" : "bg-raise"}`}
            aria-label="toggle simulation fallback"
          >
            <span
              className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-canvas transition-all ${form.allowSimulate ? "left-4" : "left-0.5"}`}
            />
          </button>
        </label>
      </div>
      <button
        onClick={save}
        className="mt-3 w-full rounded-md border border-line2 bg-raise px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-acc/50 hover:text-acc2"
      >
        Save settings
      </button>
      <p className="mt-2 text-[11px] leading-relaxed text-dim">
        Gapless bridging keeps captions on screen through pauses; word-accurate ends release each word when it stops sounding (better for review and
        karaoke-style highlighting).
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-dim">
        With simulation fallback on, a run that cannot reach a live Gemini key finishes with clearly-labeled synthetic text so the full acoustic
        pipeline stays demonstrable.
      </p>
    </Panel>
  );
}
