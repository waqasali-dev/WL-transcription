import { keyManager, type KeySlot } from "@/lib/engine/keys";

export const WORDS_SCHEMA = {
  type: "object",
  properties: {
    words: {
      type: "array",
      items: {
        type: "object",
        properties: {
          w: { type: "string", description: "The spoken word, with attached punctuation." },
          s: { type: "number", description: "Start time in seconds from the beginning of THIS clip." },
          e: { type: "number", description: "End time in seconds extending through trailing pause." },
        },
        required: ["w", "s", "e"],
      },
    },
  },
  required: ["words"],
} as const;

export const TRANSCRIBER_SYSTEM_PROMPT = `You are a precision verbatim speech transcriber producing word-level timestamps synchronized for motion graphics and video editing.

CRITICAL TIMING & CONTINUITY RULES:
1. START OF NEXT IS END OF PREVIOUS (NO TIMING GAPS):
   - The start time of the next word MUST be the end time of the previous one (word[i].e == word[i+1].s).
   - When a narrator speaks, there are natural pauses (200ms to 500ms) between words and sentences.
   - Do NOT cut off the end timestamp when the person finishes uttering the word sound. The word's end timestamp MUST extend all the way through any trailing pause until the exact instant the narrator speaks the FIRST sound of the subsequent word.

2. VERBATIM ACCURACY:
   - Transcribe EVERY spoken word in the clip, from the first sound to the last. Never summarise, skip, or paraphrase.
   - Keep punctuation attached to words ("line," "blockchain.") so sentence boundaries are recoverable.
   - Timestamps are seconds measured from the start of the clip you are given.`;

export class GeminiError extends Error {
  status: number | null;
  kind: "auth" | "rate" | "daily" | "transient" | "model" | "payload" | "aborted" | "unknown";
  constructor(message: string, status: number | null, kind: GeminiError["kind"]) {
    super(message);
    this.status = status;
    this.kind = kind;
  }
}

function classify(status: number | null, body: any): GeminiError["kind"] {
  const msg = String(body?.error?.message || "");
  if (status === 401 || status === 403) return "auth";
  if (status === 400 && /API key not valid|API_KEY_INVALID|API key format|key expired/i.test(msg)) return "auth";
  if (status === 429) return /daily|per day|requests per day/i.test(msg) ? "daily" : "rate";
  if (status === 404 || /NOT_FOUND|model.*not.*found|is not supported for generateContent/i.test(msg)) return "model";
  if (status === 413 || (status === 400 && /payload size|too large|exceeds the limit/i.test(msg))) return "payload";
  if (status === 400 && /not enabled|permission|billing/i.test(msg)) return "auth";
  if ((status !== null && status >= 500) || status === 408 || status === null) return "transient";
  return "unknown";
}

export interface RawWord {
  word: string;
  start: number;
  end: number;
}

function parseJsonObject(text: string): any {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  return JSON.parse(t);
}

export function parseWordsResponse(text: string): RawWord[] {
  const parsed = parseJsonObject(text);
  const arr = Array.isArray(parsed) ? parsed : parsed?.words;
  if (!Array.isArray(arr)) throw new GeminiError("Model response did not contain a words array", null, "transient");
  return arr
    .filter((w: any) => w && typeof w.w === "string" && typeof w.s === "number" && typeof w.e === "number")
    .map((w: any) => ({ word: String(w.w).trim(), start: w.s, end: w.e }));
}

function abortSleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(new GeminiError("cancelled", null, "aborted"));
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new GeminiError("cancelled", null, "aborted"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

async function callGemini(opts: {
  apiKey: string;
  model: string;
  prompt: string;
  mediaBase64: string;
  mimeType: string;
  systemInstruction?: string;
  schema?: Record<string, unknown>;
  temperature?: number;
  signal?: AbortSignal;
}): Promise<string> {
  if (opts.signal?.aborted) throw new GeminiError("cancelled", null, "aborted");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:generateContent`;
  const timeoutSig = AbortSignal.timeout(180_000);
  const combinedSignal = opts.signal ? AbortSignal.any([opts.signal, timeoutSig]) : timeoutSig;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "x-goog-api-key": opts.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: opts.systemInstruction || TRANSCRIBER_SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [
              { text: opts.prompt },
              { inlineData: { mimeType: opts.mimeType, data: opts.mediaBase64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: opts.temperature ?? 0.1,
          responseMimeType: "application/json",
          responseSchema: opts.schema || WORDS_SCHEMA,
        },
      }),
      signal: combinedSignal,
    });
  } catch (e: any) {
    if (opts.signal?.aborted) throw new GeminiError("cancelled", null, "aborted");
    throw new GeminiError(e?.message || "network error", null, "transient");
  }

  if (!res.ok) {
    let body: any = null;
    try {
      body = await res.json();
    } catch {
      /* ignore */
    }
    throw new GeminiError(body?.error?.message || `HTTP ${res.status}`, res.status, classify(res.status, body));
  }

  const data: any = await res.json();
  const parts: any[] = data?.candidates?.[0]?.content?.parts || [];
  const text = parts.map((p) => p.text || "").join("");
  if (!text) {
    const blocked = data?.promptFeedback?.blockReason;
    if (blocked) throw new GeminiError(`Prompt blocked: ${blocked}`, res.status, "unknown");
    throw new GeminiError("Empty model response", res.status, "transient");
  }
  return text;
}

async function acquireSlot(opts: {
  preferredModel?: string;
  onLog?: (msg: string, level?: string) => void;
  deadline: number;
  signal?: AbortSignal;
}): Promise<{
  slot: KeySlot;
  usage: { model: string; rpmUsed: number; rpmLimit: number; rpdUsed: number; rpdLimit: number; limited: boolean };
} | null> {
  const totalKeys = keyManager.count();
  if (totalKeys === 0) return null;
  if (!keyManager.outlook(opts.deadline - Date.now())) return null;
  let lastLog = 0;
  while (Date.now() < opts.deadline) {
    if (opts.signal?.aborted) throw new GeminiError("cancelled", null, "aborted");
    const picked = keyManager.pickAndReserve({ preferredModel: opts.preferredModel });
    if (picked) return picked;
    if (!keyManager.outlook(opts.deadline - Date.now())) return null;
    const remaining = Math.max(1, Math.round((opts.deadline - Date.now()) / 1000));
    if (Date.now() - lastLog > 10_000) {
      lastLog = Date.now();
      opts.onLog?.(
        `[rotator] all ${keyManager.healthyCount()}/${totalKeys} active keys busy (RPM window) — waiting for next available slot (${remaining}s max)…`,
        "warn"
      );
    }
    await abortSleep(1200, opts.signal);
  }
  return null;
}

async function dispatchRotated<T>(opts: {
  label: string;
  prompt: string;
  mediaBase64: string;
  mimeType: string;
  systemInstruction?: string;
  schema?: Record<string, unknown>;
  temperature?: number;
  preferredModel?: string;
  signal?: AbortSignal;
  onLog?: (msg: string, level?: string) => void;
  parse: (text: string) => T;
  describeResult: (parsed: T) => string;
}): Promise<{ data: T; model: string; keyIndex: number; rotations: number; attempts: number; usedKeys: number[] }> {
  const maxAttempts = 60;
  const overallDeadline = Date.now() + 180_000;
  let transientFailures = 0;
  const usedKeys = new Set<number>();

  for (let attempt = 1; attempt <= maxAttempts && Date.now() < overallDeadline; attempt++) {
    if (opts.signal?.aborted) throw new Error("cancelled");
    const picked = await acquireSlot({
      preferredModel: opts.preferredModel,
      onLog: opts.onLog,
      deadline: Math.min(Date.now() + 120_000, overallDeadline),
      signal: opts.signal,
    });
    if (!picked) {
      throw new GeminiError("All API keys are rate-limited, cooling down, or disabled — no slot available", 429, "rate");
    }
    const slot = picked.slot;
    usedKeys.add(slot.idx);
    opts.onLog?.(
      `[${opts.label}] reserved Key #${slot.idx} · ${slot.model} (RPM ${picked.usage.rpmUsed}/${picked.usage.rpmLimit}, RPD ${picked.usage.rpdUsed}/${picked.usage.rpdLimit})`,
      "api"
    );

    try {
      const text = await callGemini({
        apiKey: slot.apiKey,
        model: slot.model,
        prompt: opts.prompt,
        mediaBase64: opts.mediaBase64,
        mimeType: opts.mimeType,
        systemInstruction: opts.systemInstruction,
        schema: opts.schema,
        temperature: opts.temperature,
        signal: opts.signal,
      });
      const data = opts.parse(text);
      opts.onLog?.(`[${opts.label}] Key #${slot.idx} · ${slot.model} → ${opts.describeResult(data)}`, "model");
      return { data, model: slot.model, keyIndex: slot.idx, rotations: attempt - 1, attempts: attempt, usedKeys: [...usedKeys] };
    } catch (err) {
      keyManager.recordError(slot);
      const ge = err instanceof GeminiError ? err : new GeminiError(String((err as any)?.message || err), null, "unknown");
      if (ge.kind === "aborted" || opts.signal?.aborted) {
        throw new Error("cancelled");
      }
      if (ge.kind === "auth") {
        opts.onLog?.(`[${opts.label}] Key #${slot.idx} access denied (${ge.message.slice(0, 90)}). Disabling key & rotating…`, "warn");
        keyManager.markKeyDisabled(slot, ge.message.slice(0, 140));
        continue;
      }
      if (ge.kind === "model") {
        opts.onLog?.(`[${opts.label}] '${slot.model}' unavailable on Key #${slot.idx}. Isolating model on Key #${slot.idx} & rotating…`, "warn");
        keyManager.markModelDeadOnKey(slot);
        continue;
      }
      if (ge.kind === "rate" || ge.kind === "daily") {
        const daily = ge.kind === "daily";
        opts.onLog?.(
          `[${opts.label}] '${slot.model}' hit ${daily ? "daily RPD" : "minute RPM"} limit on Key #${slot.idx}. Rotating instantly…`,
          "warn"
        );
        keyManager.markModelLimited(slot, daily);
        continue;
      }
      if (ge.kind === "transient") {
        transientFailures += 1;
        if (transientFailures >= 12) {
          throw new Error(`Gemini request failed after ${attempt} attempts: ${ge.message}`);
        }
        keyManager.markModelCooldown(slot, 20_000);
        opts.onLog?.(
          `[${opts.label}] transient ${ge.status ?? "net"} on Key #${slot.idx} · ${slot.model} ("${ge.message.slice(0, 80)}"). Cooling combo 20s, rotating…`,
          "warn"
        );
        continue;
      }
      throw new Error(`Gemini request failed (${ge.status ?? "err"}): ${ge.message}`);
    }
  }
  throw new GeminiError("Exhausted rotation attempts", 429, "rate");
}

export interface TranscribeResult {
  words: RawWord[];
  model: string;
  keyIndex: number;
  rotations: number;
  attempts: number;
  usedKeys: number[];
}

export async function sendModelRequest(opts: {
  prompt: string;
  audioBase64: string;
  mimeType: string;
  preferredModel?: string;
  signal?: AbortSignal;
  onLog?: (msg: string, level?: string) => void;
}): Promise<TranscribeResult> {
  const res = await dispatchRotated({
    label: "rotator",
    prompt: opts.prompt,
    mediaBase64: opts.audioBase64,
    mimeType: opts.mimeType,
    preferredModel: opts.preferredModel,
    signal: opts.signal,
    onLog: opts.onLog,
    parse: parseWordsResponse,
    describeResult: (words) => `${words.length} words`,
  });
  return {
    words: res.data,
    model: res.model,
    keyIndex: res.keyIndex,
    rotations: res.rotations,
    attempts: res.attempts,
    usedKeys: res.usedKeys,
  };
}

export const VIDEO_OBSERVATIONS_SCHEMA = {
  type: "object",
  properties: {
    sectionSummary: {
      type: "string",
      description: "Concise 1-2 sentence overview of what happens visually and audibly across this 30-second section.",
    },
    observations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          slot: { type: "integer", description: "Zero-based five-second slot in this 30-second section." },
          description: { type: "string", description: "Specific, factual description of what visibly happens during this 5-second slot." },
          actions: { type: "array", items: { type: "string" } },
          subjects: { type: "array", items: { type: "string" } },
          visibleText: { type: "array", items: { type: "string" } },
          shot: { type: "string", description: "Shot type, camera movement, transition, or scene change." },
          audioRelation: { type: "string", description: "How the visible action syncs with the exact spoken words, sound effects, or music in this slot." },
          events: {
            type: "array",
            items: {
              type: "object",
              properties: {
                clipSec: { type: "number", description: "Timestamp in seconds from the start of THIS video clip when the visual event occurs." },
                what: { type: "string", description: "Short concrete label for the event (e.g. 'Cut to benchmark chart', 'Presenter holds up laptop')." },
              },
              required: ["clipSec", "what"],
            },
          },
          confidence: { type: "number", description: "Visual confidence from 0 to 1." },
        },
        required: ["slot", "description", "actions", "subjects", "visibleText", "shot", "audioRelation", "events", "confidence"],
      },
    },
  },
  required: ["sectionSummary", "observations"],
} as const;

export const VIDEO_ANALYST_SYSTEM_PROMPT = `You are a precision audiovisual continuity analyst producing frame-synchronized 30-second section summaries and 5-second visual transcripts for video editors.

RULES:
1. Analyze visible evidence, the clip's native audio, the provided acoustic word timestamps, and the exact FFmpeg scene-cut timestamps together. Never invent identities, actions, text, or off-screen events.
2. Return sectionSummary for the full 30-second section plus one observation for EVERY requested 5-second core slot, in chronological slot order.
3. Each 5-second slot includes a 1-second overlap window around its boundary. Use that overlap to track motion and transitions cleanly across cuts, while focusing each slot's description on what happens in its 5-second CORE.
4. Be concrete: name visible objects, gestures, UI/screen activity, graphics, camera motion, cuts, and exact readable on-screen text.
5. In events[], pin specific visual moments (scene cuts, graphic pop-ins, product reveals, gestures) to their exact clipSec timestamp in THIS clip.
6. In audioRelation, explain exact audiovisual synchronization — which spoken phrase, word, sound effect, or musical beat coincides with the visual action.`;

export interface RawVideoObservation {
  slot: number;
  description: string;
  actions: string[];
  subjects: string[];
  visibleText: string[];
  shot: string;
  audioRelation: string;
  events: { clipSec: number; what: string }[];
  confidence: number;
}

export async function sendVideoAnalysisRequest(opts: {
  prompt: string;
  videoBase64: string;
  preferredModel?: string;
  signal?: AbortSignal;
  onLog?: (msg: string, level?: string) => void;
}): Promise<{ sectionSummary: string; observations: RawVideoObservation[]; model: string; keyIndex: number; attempts: number }> {
  const res = await dispatchRotated({
    label: "video rotator",
    prompt: opts.prompt,
    mediaBase64: opts.videoBase64,
    mimeType: "video/mp4",
    systemInstruction: VIDEO_ANALYST_SYSTEM_PROMPT,
    schema: VIDEO_OBSERVATIONS_SCHEMA as unknown as Record<string, unknown>,
    temperature: 0.15,
    preferredModel: opts.preferredModel,
    signal: opts.signal,
    onLog: opts.onLog,
    parse: (text) => {
      const parsed = parseJsonObject(text);
      const sectionSummary = String(parsed?.sectionSummary || "").trim();
      const raw = Array.isArray(parsed?.observations) ? parsed.observations : [];
      const observations: RawVideoObservation[] = raw
        .filter((o: any) => o && Number.isFinite(Number(o.slot)))
        .map((o: any) => ({
          slot: Math.max(0, Math.floor(Number(o.slot))),
          description: String(o.description || "").trim(),
          actions: Array.isArray(o.actions) ? o.actions.map(String).filter(Boolean) : [],
          subjects: Array.isArray(o.subjects) ? o.subjects.map(String).filter(Boolean) : [],
          visibleText: Array.isArray(o.visibleText) ? o.visibleText.map(String).filter(Boolean) : [],
          shot: String(o.shot || "").trim(),
          audioRelation: String(o.audioRelation || "").trim(),
          events: Array.isArray(o.events)
            ? o.events
                .filter((ev: any) => ev && Number.isFinite(Number(ev.clipSec)) && ev.what)
                .map((ev: any) => ({ clipSec: Number(ev.clipSec), what: String(ev.what).trim() }))
            : [],
          confidence: Math.max(0, Math.min(1, Number(o.confidence) || 0)),
        }));
      if (!observations.length) throw new GeminiError("Video model returned no observations", null, "transient");
      return { sectionSummary, observations };
    },
    describeResult: (d) => `${d.observations.length} × 5s observations`,
  });
  return {
    sectionSummary: res.data.sectionSummary,
    observations: res.data.observations,
    model: res.model,
    keyIndex: res.keyIndex,
    attempts: res.attempts,
  };
}
