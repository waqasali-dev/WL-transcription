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

export const TRANSCRIBER_SYSTEM_PROMPT = `You are a precision verbatim speech transcriber producing word-level timestamps for waveform-accurate subtitle alignment.

BOUNDARY RULES (a downstream matcher measures the real audio waveform, so boundaries must describe the sound, not guessed gaps):
1. s = the instant the FIRST audible sound of the word begins (the consonant attack or vowel onset), not the silence before it.
2. e = the instant the word STOPS sounding. Do NOT stretch e across a pause, breath or silence to reach the next word.
3. Words are contiguous in speech: e may be close to the next word's s, but never cover a pause longer than 150 ms.
4. Use 10 ms resolution (two decimals), never whole seconds and never a uniform spacing pattern.
5. If the clip starts mid-sentence, transcribe exactly what is audible — no invented words, no context from outside the clip.

VERBATIM ACCURACY:
- Transcribe EVERY spoken word from the first sound to the last. Never summarise, skip or paraphrase.
- Keep punctuation attached to words ("line," "blockchain.") so sentence boundaries are recoverable.
- Include filler words and false starts verbatim.
- Timestamps are seconds measured from the start of the clip you are given.`;

export class GeminiError extends Error {
  status: number | null;
  kind: "auth" | "rate" | "daily" | "transient" | "model" | "unknown";
  constructor(message: string, status: number | null, kind: GeminiError["kind"]) {
    super(message);
    this.status = status;
    this.kind = kind;
  }
}

function classify(status: number | null, body: any): GeminiError["kind"] {
  const msg = String(body?.error?.message || "");
  if (status === 403) return "auth";
  if (status === 400 && /API key not valid|API_KEY_INVALID|API key format/i.test(msg)) return "auth";
  if (status === 429) return /daily|RESOURCE_EXHAUSTED.*daily|quota/i.test(msg) ? "daily" : "rate";
  if (status === 404 || /NOT_FOUND|model.*not.*found/i.test(msg)) return "model";
  if (status === 400 || status === 424) return "model";
  if ((status !== null && status >= 500) || status === null) return "transient";
  return "unknown";
}

export interface RawWord {
  word: string;
  start: number;
  end: number;
}

export function parseWordsResponse(text: string): RawWord[] {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  const parsed = JSON.parse(t);
  const arr = Array.isArray(parsed) ? parsed : parsed.words;
  if (!Array.isArray(arr)) throw new GeminiError("Model response did not contain a words array", null, "unknown");
  return arr
    .filter((w: any) => w && typeof w.w === "string" && typeof w.s === "number" && typeof w.e === "number")
    .map((w: any) => ({ word: String(w.w).trim(), start: w.s, end: w.e }));
}

async function callGemini(opts: {
  apiKey: string;
  model: string;
  prompt: string;
  audioBase64: string;
  mimeType: string;
}): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:generateContent`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "x-goog-api-key": opts.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: TRANSCRIBER_SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [
              { text: opts.prompt },
              { inlineData: { mimeType: opts.mimeType, data: opts.audioBase64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: WORDS_SCHEMA,
        },
      }),
      signal: AbortSignal.timeout(180_000),
    });
  } catch (e: any) {
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

export interface TranscribeResult {
  words: RawWord[];
  model: string;
  keyIndex: number;
  rotations: number;
  attempts: number;
  usedKeys: number[];
}

/**
 * Acquire a slot from the rotation pool. When every key is momentarily
 * RPM-saturated (not exhausted), wait for a slot instead of failing —
 * RPM windows roll over within seconds. Throttled progress is logged so
 * the UI shows the pool is healthy and merely busy.
 */
async function acquireSlot(opts: {
  preferredModel?: string;
  onLog?: (msg: string, level?: string) => void;
  deadline: number;
}): Promise<{ slot: KeySlot; usage: { model: string; rpmUsed: number; rpmLimit: number; rpdUsed: number; rpdLimit: number; limited: boolean } } | null> {
  const totalKeys = keyManager.count();
  if (totalKeys === 0) return null;
  // Fail fast when waiting can never help (every key disabled or RPD-spent).
  if (!keyManager.outlook(opts.deadline - Date.now())) return null;
  let lastLog = 0;
  while (Date.now() < opts.deadline) {
    const picked = keyManager.pickAndReserve({ preferredModel: opts.preferredModel });
    if (picked) return picked;
    if (!keyManager.outlook(opts.deadline - Date.now())) return null;
    const remaining = Math.max(1, Math.round((opts.deadline - Date.now()) / 1000));
    if (Date.now() - lastLog > 12_000) {
      lastLog = Date.now();
      opts.onLog?.(
        `[rotator] all ${totalKeys} key${totalKeys === 1 ? "" : "s"} at capacity (RPM) — pool healthy, waiting for a slot (up to ${remaining}s)…`,
        "warn"
      );
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return null;
}

export async function sendModelRequest(opts: {
  prompt: string;
  audioBase64: string;
  mimeType: string;
  preferredModel?: string;
  onLog?: (msg: string, level?: string) => void;
}): Promise<TranscribeResult> {
  const { onLog } = opts;
  const maxAttempts = 60;
  const overallDeadline = Date.now() + 150_000;
  let transientFailures = 0;
  const usedKeys = new Set<number>();

  for (let attempt = 1; attempt <= maxAttempts && Date.now() < overallDeadline; attempt++) {
    const picked = await acquireSlot({
      preferredModel: opts.preferredModel,
      onLog,
      deadline: Math.min(Date.now() + 120_000, overallDeadline),
    });
    if (!picked) {
      throw new GeminiError("All API keys are rate-limited, cooling down, or disabled — no slot became available", 429, "rate");
    }
    const slot: KeySlot = picked.slot;
    usedKeys.add(slot.idx);
    onLog?.(`[rotator] reserved Key #${slot.idx} · ${slot.model} (RPM ${picked.usage.rpmUsed}/${picked.usage.rpmLimit}, RPD ${picked.usage.rpdUsed}/${picked.usage.rpdLimit})`, "api");
    try {
      const text = await callGemini({
        apiKey: slot.apiKey,
        model: slot.model,
        prompt: opts.prompt,
        audioBase64: opts.audioBase64,
        mimeType: opts.mimeType,
      });
      const words = parseWordsResponse(text);
      onLog?.(`[rotator] Key #${slot.idx} · ${slot.model} → ${words.length} words`, "model");
      return { words, model: slot.model, keyIndex: slot.idx, rotations: attempt - 1, attempts: attempt, usedKeys: [...usedKeys] };
    } catch (err) {
      keyManager.recordError(slot);
      const ge = err instanceof GeminiError ? err : new GeminiError(String((err as any)?.message || err), null, "unknown");

      if (ge.kind === "auth") {
        onLog?.(`[rotator] Key #${slot.idx} access denied (${ge.message}). Disabling key and rotating…`, "warn");
        keyManager.markKeyDisabled(slot, ge.message.slice(0, 140));
        continue;
      }
      if (ge.kind === "model") {
        onLog?.(`[rotator] '${slot.model}' unavailable on Key #${slot.idx}. Marking model dead, rotating…`, "warn");
        keyManager.markModelDead(slot.model);
        continue;
      }
      if (ge.kind === "rate" || ge.kind === "daily") {
        const daily = ge.kind === "daily";
        onLog?.(`[rotator] '${slot.model}' rate-limited on Key #${slot.idx} (${daily ? "daily RPD" : "minute RPM"}). Rotating…`, "warn");
        keyManager.markModelLimited(slot, daily);
        continue;
      }
      if (ge.kind === "transient") {
        transientFailures += 1;
        if (transientFailures >= 10) {
          throw new Error(`Gemini request failed after ${attempt} attempts: ${ge.message}`);
        }
        // Cool this key/model combo briefly and rotate — don't hammer a
        // model that just reported overload; other combos go first.
        keyManager.markModelCooldown(slot, 25_000);
        onLog?.(
          `[rotator] transient ${ge.status ?? "5xx"} on Key #${slot.idx} · ${slot.model} ("${ge.message.slice(0, 90)}"). Cooling this combo 25s, rotating to next key/model…`,
          "warn"
        );
        continue;
      }
      throw new Error(`Gemini request failed after ${attempt} attempts: ${ge.message}`);
    }
  }
  throw new GeminiError("Exhausted rotation attempts", 429, "rate");
}
