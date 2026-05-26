// Frontend mirror of supabase/functions/ai-chat/types.ts
// Keep in sync when adding new BYOK providers or response fields.

export type Provider = "groq" | "gemini" | "anthropic" | "openai";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface UserAISettings {
  user_id: string;
  byok_keys: Record<string, string>; // provider → API key
  preferred_provider: string | null;
  preferred_model: string | null;
}

export interface AIResponse {
  reply: string;
  provider: Provider;
  model: string;
  /** Remaining free-tier requests in the current window. -1 = BYOK (no cap). */
  window_remaining: number;
}

export interface ErrorResponse {
  error: string;
  code: "unauthorized" | "free_limit_reached" | "provider_error" | "invalid_request";
  /** ISO timestamp when the rate-limit window resets. Only present for free_limit_reached. */
  window_resets_at?: string;
}
