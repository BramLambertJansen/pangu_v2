export type Provider = "groq" | "gemini" | "anthropic" | "openai";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface RouteDecision {
  provider: Provider;
  model: string;
}

export interface UserUsage {
  user_id: string;
  window_start: string; // ISO timestamp, rounded to WINDOW_HOURS block
  groq_count: number;
  gemini_count: number;
}

export interface OrgUsage {
  date: string;       // YYYY-MM-DD
  groq_total: number;
}

export interface UserAISettings {
  user_id: string;
  byok_keys: Record<string, string>; // provider → API key
  preferred_provider: string | null; // which BYOK provider to use; null → first available
  preferred_model: string | null;    // model override; null → provider default
}

export interface AIResponse {
  reply: string;
  provider: Provider;
  model: string;
  window_remaining: number; // -1 = BYOK (no limit); ≥0 = free tier requests left this window
}

export interface ErrorResponse {
  error: string;
  code: "unauthorized" | "free_limit_reached" | "provider_error" | "invalid_request";
  window_resets_at?: string; // ISO timestamp when the window resets (only for free_limit_reached)
}
