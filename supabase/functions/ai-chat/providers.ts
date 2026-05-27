import { AI_CONFIG } from "./config.ts";
import type { Message } from "./types.ts";

/** Groq — OpenAI-compatible API. */
export async function callGroq(messages: Message[], model: string): Promise<string> {
  const groqKey = Deno.env.get("GROQ_API_KEY");
  if (!groqKey) throw new Error("GROQ_API_KEY not set");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [{ role: "system", content: AI_CONFIG.SYSTEM_PROMPT }, ...messages],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(`Groq error ${res.status}: ${err?.error?.message ?? "unknown"}`);
  }

  const data = await res.json() as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

/** Gemini — Google Generative Language API. */
export async function callGemini(messages: Message[], model: string): Promise<string> {
  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiKey) throw new Error("GEMINI_API_KEY not set");

  // Gemini has no separate system role; prepend system prompt to the first user message.
  const [first, ...rest] = messages;
  const contents = [
    {
      role: "user",
      parts: [{ text: `${AI_CONFIG.SYSTEM_PROMPT}\n\n${first.content}` }],
    },
    ...rest.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
  ];

  // Key passed as header to avoid exposure in server logs and proxy caches.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": geminiKey,
    },
    body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 1024 } }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Gemini error ${res.status}: ${JSON.stringify(err)}`);
  }

  const data = await res.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

/** Anthropic — BYOK (user-supplied API key). */
export async function callAnthropic(
  messages: Message[],
  model: string,
  byokKey: string
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": byokKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: AI_CONFIG.SYSTEM_PROMPT,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(`Anthropic error ${res.status}: ${err?.error?.message ?? "unknown"}`);
  }

  const data = await res.json() as { content?: { text?: string }[] };
  return data.content?.[0]?.text ?? "";
}

/**
 * OpenAI — BYOK (user-supplied API key).
 * Uses the same OpenAI-compatible format as Groq, so the caller is nearly identical.
 * GitHub Copilot Enterprise also exposes an OpenAI-compatible endpoint
 * (api.githubcopilot.com) but requires an OAuth token — out of scope for now.
 */
export async function callOpenAI(
  messages: Message[],
  model: string,
  byokKey: string
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${byokKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [{ role: "system", content: AI_CONFIG.SYSTEM_PROMPT }, ...messages],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(`OpenAI error ${res.status}: ${err?.error?.message ?? "unknown"}`);
  }

  const data = await res.json() as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}
