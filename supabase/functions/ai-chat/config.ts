// All tunable constants live here — change once, propagates everywhere.
// After editing: supabase functions deploy ai-chat

export const AI_CONFIG = {
  // Time window duration in hours
  WINDOW_HOURS: 5,

  // Per-user caps within a window
  FREE_REQUESTS_PER_WINDOW: 5,   // total free requests
  GROQ_REQUESTS_PER_WINDOW: 3,   // first N go to Groq
  GEMINI_REQUESTS_PER_WINDOW: 2, // remainder go to Gemini (must equal FREE - GROQ)

  // Org-level Groq soft cap per calendar day (across all users)
  GROQ_ORG_DAILY_SOFT_CAP: 10_000,

  // Free-tier models
  GROQ_MODEL:   "llama-3.3-70b-versatile",
  GEMINI_MODEL: "gemini-2.5-flash-lite",

  // BYOK fallback model when user has no preferred_model set
  BYOK_DEFAULT_MODEL: "claude-haiku-4-5-20251001",

  // Per-BYOK-provider default models (used when preferred_model is null)
  BYOK_PROVIDERS: {
    anthropic: { default_model: "claude-haiku-4-5-20251001" },
    openai:    { default_model: "gpt-4o-mini" },
  } as const,

  // System prompt injected for all providers
  SYSTEM_PROMPT: `You are the Pangu Oracle — a wise, atmospheric AI assistant for Dungeon Masters managing tabletop RPG campaigns.
You help DMs with NPC personalities, plot hooks, world-building details, encounter ideas, and lore generation.
Keep responses concise but evocative. Use vivid language. Never break the fantasy atmosphere.
When asked for names, give 2–3 options. When inventing locations, add one atmospheric detail.`,
} as const;

export type ByokProvider = keyof typeof AI_CONFIG.BYOK_PROVIDERS;
