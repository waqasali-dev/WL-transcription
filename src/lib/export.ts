import { fmtClock, fmtSrtTime, fmtVttTime } from "./format";
import type { JobDetail, TranscriptDoc } from "./types";

export type ExportFormat = "json" | "srt" | "vtt" | "edl" | "csv" | "md" | "txt";

function baseName(filename: string): string {
  return (filename || "transcript").replace(/\.[^.]+$/, "").replace(/[^\w\-. ]+/g, "_").trim() || "transcript";
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** WebVTT — HTML5 <track> captions & modern web players. */
export function toVtt(doc: TranscriptDoc): string {
  const out = ["WEBVTT", ""];
  doc.sentences.forEach((s, i) => {
    const last = doc.words[s.wordEnd];
    const end = last ? (last.spokenEnd ?? last.end) : s.end;
    out.push(`${i + 1}`);
    out.push(`${fmtVttTime(s.start)} --> ${fmtVttTime(Math.max(s.start + 0.2, end))}`);
    out.push(s.text);
    out.push("");
  });
  return out.join("\n");
}

/** SubRip — NLEs, YouTube, Vimeo. */
export function toSrt(doc: TranscriptDoc): string {
  const out: string[] = [];
  doc.sentences.forEach((s, i) => {
    const last = doc.words[s.wordEnd];
    const end = last ? (last.spokenEnd ?? last.end) : s.end;
    out.push(String(i + 1));
    out.push(`${fmtSrtTime(s.start)} --> ${fmtSrtTime(Math.max(s.start + 0.2, end))}`);
    out.push(s.text);
    out.push("");
  });
  return out.join("\n");
}

/**
 * CMX 3600 EDL — non-linear editor cut list for Premiere Pro, DaVinci Resolve,
 * and Final Cut Pro that automatically strips dead-air pauses >= 500 ms and
 * labels every active speech segment on the timeline!
 */
export function toEdl(doc: TranscriptDoc, fps = 24): string {
  const rate = fps && Number.isFinite(fps) && fps > 0 ? Math.round(fps) : 24;
  const tc = (sec: number) => {
    const totalFrames = Math.max(0, Math.round(sec * rate));
    const ff = totalFrames % rate;
    const totalSec = Math.floor(totalFrames / rate);
    const ss = totalSec % 60;
    const mm = Math.floor((totalSec % 3600) / 60);
    const hh = Math.floor(totalSec / 3600);
    return [hh, mm, ss, ff].map((v) => String(v).padStart(2, "0")).join(":");
  };

  // Group contiguous speech separated by pauses >= 450 ms (rough-cut edit list!)
  const cuts: { start: number; end: number; text: string }[] = [];
  if (doc.words.length > 0) {
    let curStart = Math.max(0, doc.words[0].start - 0.06);
    let curWords: string[] = [doc.words[0].word];
    for (let i = 0; i < doc.words.length; i++) {
      const w = doc.words[i];
      const spokenEnd = w.spokenEnd ?? w.end;
      const isLast = i === doc.words.length - 1;
      if (isLast || w.pauseAfterMs >= 450) {
        cuts.push({
          start: curStart,
          end: Math.min(doc.audio.durationSec, spokenEnd + 0.08),
          text: curWords.join(" "),
        });
        if (!isLast) {
          curStart = Math.max(0, doc.words[i + 1].start - 0.06);
          curWords = [doc.words[i + 1].word];
        }
      } else {
        curWords.push(doc.words[i + 1].word);
      }
    }
  }

  const lines = [`TITLE: ${doc.audio.filename}`, `FCM: NON-DROP FRAME`, ""];
  let recCursor = 0;
  cuts.forEach((c, idx) => {
    const dur = Math.max(1 / rate, c.end - c.start);
    const num = String(idx + 1).padStart(3, "0");
    lines.push(`${num}  AX       AA/V  C        ${tc(c.start)} ${tc(c.end)} ${tc(recCursor)} ${tc(recCursor + dur)}`);
    lines.push(`* FROM CLIP NAME: ${doc.audio.filename}`);
    lines.push(`* COMMENT: ${c.text.slice(0, 80)}`);
    lines.push("");
    recCursor += dur;
  });
  return lines.join("\n");
}

/** Plain text with timecodes. */
export function toTxt(doc: TranscriptDoc): string {
  return doc.sentences.map((s) => `[${fmtClock(s.start)}] ${s.text}`).join("\n\n");
}

/** CSV with full word-level precision. */
export function toCsv(doc: TranscriptDoc): string {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = ["word,start_sec,end_sec,spoken_end_sec,pause_after_ms,confidence,sentence_index"];
  doc.words.forEach((w, i) => {
    const sent = doc.sentences.find((s) => i >= s.wordStart && i <= s.wordEnd);
    rows.push(
      [
        esc(w.word),
        w.start.toFixed(3),
        w.end.toFixed(3),
        (w.spokenEnd ?? w.end).toFixed(3),
        w.pauseAfterMs,
        w.confidence != null ? w.confidence.toFixed(2) : "",
        sent ? sent.index : "",
      ].join(",")
    );
  });
  return rows.join("\n");
}

/** Markdown — synchronized audio + visual document. */
export function toMarkdown(
  doc: TranscriptDoc,
  meta: { filename: string; mediaKind: string; videoMeta?: JobDetail["videoMeta"] }
): string {
  const out: string[] = [];
  out.push(`# Synchronized Transcript — ${meta.filename}`);
  out.push("");
  out.push(`| Property | Value |`);
  out.push(`|---|---|`);
  out.push(`| **Media** | ${meta.mediaKind} |`);
  out.push(`| **Duration** | ${fmtClock(doc.audio.durationSec)} |`);
  if (doc.audio.fingerprint) out.push(`| **SHA-256 Fingerprint** | \`${doc.audio.fingerprint.slice(0, 16)}…\` |`);
  if (meta.videoMeta) {
    out.push(`| **Video** | ${meta.videoMeta.width}×${meta.videoMeta.height} @ ${meta.videoMeta.fps}fps (${meta.videoMeta.codec}) |`);
  }
  out.push(`| **Words** | ${doc.words.length} (mean confidence ${Math.round((doc.alignment?.avgConfidence ?? 0) * 100)}%) |`);
  out.push(`| **Sentences** | ${doc.sentences.length} |`);
  if (doc.video) {
    out.push(
      `| **Visual structure** | ${doc.video.sections.length} × 30s sections · ${doc.video.observations.length} × 5s slots · ${doc.video.overlapSeconds}s overlap |`
    );
    out.push(`| **Scene cuts** | ${doc.video.sceneCuts?.length ?? 0} frame-accurate |`);
  }
  out.push("");

  if (doc.video?.sections.length) {
    out.push("## Synchronized Visual + Audio Timeline");
    out.push("");
    for (const sec of doc.video.sections) {
      out.push(`### Section ${sec.index + 1} — \`${fmtClock(sec.start)} → ${fmtClock(sec.end)}\``);
      if (sec.summary) out.push(`> ${sec.summary}`);
      out.push("");
      for (const o of sec.observations) {
        out.push(`#### \`${fmtClock(o.start)} → ${fmtClock(o.end)}\``);
        out.push(`- **Visual**: ${o.description}`);
        if (o.speech) out.push(`- **Spoken**: “${o.speech}”`);
        if (o.audioRelation) out.push(`- **Sync**: ${o.audioRelation}`);
        if (o.events?.length) {
          out.push(
            `- **Events**: ${o.events
              .map((e) => `\`${fmtClock(e.time)}\` ${e.what}${e.syncedWord ? ` (on “${e.syncedWord}”)` : ""}`)
              .join(" · ")}`
          );
        }
        if (o.visibleText.length) out.push(`- **On-screen text**: ${o.visibleText.join(" · ")}`);
        out.push("");
      }
    }
  }

  out.push("## Speech Sentences");
  out.push("");
  for (const s of doc.sentences) {
    out.push(`> \`${fmtClock(s.start)} → ${fmtClock(s.end)}\`  ${s.text}`);
    out.push("");
  }
  return out.join("\n");
}

export function exportJob(fmt: ExportFormat, job: JobDetail, doc: TranscriptDoc) {
  const name = baseName(job.filename);
  switch (fmt) {
    case "json":
      download(`${name}.transcript_data.json`, JSON.stringify(doc, null, 2), "application/json");
      break;
    case "srt":
      download(`${name}.srt`, toSrt(doc), "text/plain");
      break;
    case "vtt":
      download(`${name}.vtt`, toVtt(doc), "text/vtt");
      break;
    case "edl":
      download(`${name}.roughcut.edl`, toEdl(doc, job.videoMeta?.fps || 24), "text/plain");
      break;
    case "csv":
      download(`${name}.words.csv`, toCsv(doc), "text/csv");
      break;
    case "md":
      download(
        `${name}.synced.md`,
        toMarkdown(doc, { filename: job.filename, mediaKind: job.mediaKind, videoMeta: job.videoMeta }),
        "text/markdown"
      );
      break;
    case "txt":
      download(`${name}.txt`, toTxt(doc), "text/plain");
      break;
  }
}

export const EXPORT_LABELS: { id: ExportFormat; label: string; ext: string; hint: string }[] = [
  { id: "json", label: "Splicer JSON (v5)", ext: ".json", hint: "Full word + 30s/5s visual schema" },
  { id: "edl", label: "Rough-Cut EDL", ext: ".edl", hint: "Strips dead-air pauses for Premiere / DaVinci" },
  { id: "srt", label: "SubRip Subtitles", ext: ".srt", hint: "Universal captions for NLEs & YouTube" },
  { id: "vtt", label: "WebVTT Captions", ext: ".vtt", hint: "HTML5 video player track" },
  { id: "md", label: "Synced Markdown", ext: ".md", hint: "Readable 30s/5s visual + speech doc" },
  { id: "csv", label: "Word Timings CSV", ext: ".csv", hint: "Millisecond word + confidence sheet" },
  { id: "txt", label: "Plain Timecoded", ext: ".txt", hint: "Clean timestamped prose" },
];

export async function copyTranscript(doc: TranscriptDoc, mode: "text" | "timecoded" = "text"): Promise<boolean> {
  const text =
    mode === "timecoded"
      ? doc.sentences.map((s) => `[${fmtClock(s.start)}] ${s.text}`).join("\n")
      : doc.sentences.map((s) => s.text).join(" ");
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
