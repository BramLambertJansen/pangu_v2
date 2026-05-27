import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { AI_CONFIG } from "./config.ts";
import type { RouteDecision, UserUsage, OrgUsage } from "./types.ts";

/** Round current UTC time down to the start of the current WINDOW_HOURS block. */
export function getWindowStart(): Date {
  const now = new Date();
  const windowHour =
    Math.floor(now.getUTCHours() / AI_CONFIG.WINDOW_HOURS) * AI_CONFIG.WINDOW_HOURS;
  const windowStart = new Date(now);
  windowStart.setUTCHours(windowHour, 0, 0, 0);
  return windowStart;
}

/** Return the timestamp when the current window expires. */
export function getWindowEnd(windowStart: Date): Date {
  const end = new Date(windowStart);
  end.setUTCHours(end.getUTCHours() + AI_CONFIG.WINDOW_HOURS);
  return end;
}

/**
 * Fetch the current usage row for a user in the given window.
 * Creates the row if it doesn't exist yet (insert-then-select avoids the
 * ON CONFLICT DO NOTHING RETURNING empty-set issue with upsert + single()).
 */
export async function getUserUsage(
  supabase: SupabaseClient,
  userId: string,
  windowStart: Date
): Promise<UserUsage> {
  const windowStartISO = windowStart.toISOString();

  // Try to insert a fresh row; ignore 23505 (unique_violation) if it already exists.
  const { error: insertError } = await supabase.from("ai_usage").insert({
    user_id: userId,
    window_start: windowStartISO,
    groq_count: 0,
    gemini_count: 0,
  });

  if (insertError && insertError.code !== "23505") {
    throw new Error(`Usage insert failed: ${insertError.message}`);
  }

  // Always fetch the authoritative row (whether just inserted or pre-existing).
  const { data, error } = await supabase
    .from("ai_usage")
    .select()
    .eq("user_id", userId)
    .eq("window_start", windowStartISO)
    .single();

  if (error) throw new Error(`Usage fetch failed: ${error.message}`);
  return data as UserUsage;
}

/**
 * Fetch today's org-level Groq usage.
 * Same insert-then-select pattern as getUserUsage.
 */
export async function getOrgUsage(supabase: SupabaseClient): Promise<OrgUsage> {
  const today = new Date().toISOString().slice(0, 10);

  const { error: insertError } = await supabase
    .from("ai_org_usage")
    .insert({ date: today, groq_total: 0 });

  if (insertError && insertError.code !== "23505") {
    throw new Error(`Org usage insert failed: ${insertError.message}`);
  }

  const { data, error } = await supabase
    .from("ai_org_usage")
    .select()
    .eq("date", today)
    .single();

  if (error) throw new Error(`Org usage fetch failed: ${error.message}`);
  return data as OrgUsage;
}

/**
 * Decide which provider/model to use based on current usage.
 * Returns null when the user has exhausted their free-tier window limit.
 *
 * If GROQ_API_KEY is absent, the full window quota is served by Gemini alone.
 */
export function routeRequest(
  usage: UserUsage,
  orgUsage: OrgUsage
): RouteDecision | null {
  const totalUsed = usage.groq_count + usage.gemini_count;

  if (totalUsed >= AI_CONFIG.FREE_REQUESTS_PER_WINDOW) return null;

  const groqAvailable = !!Deno.env.get("GROQ_API_KEY");
  const groqOrgExhausted = orgUsage.groq_total >= AI_CONFIG.GROQ_ORG_DAILY_SOFT_CAP;

  if (groqAvailable && !groqOrgExhausted && usage.groq_count < AI_CONFIG.GROQ_REQUESTS_PER_WINDOW) {
    return { provider: "groq", model: AI_CONFIG.GROQ_MODEL };
  }

  // When Groq is unavailable, allow the full window quota on Gemini.
  const geminiLimit = groqAvailable
    ? AI_CONFIG.GEMINI_REQUESTS_PER_WINDOW
    : AI_CONFIG.FREE_REQUESTS_PER_WINDOW;

  if (usage.gemini_count < geminiLimit) {
    return { provider: "gemini", model: AI_CONFIG.GEMINI_MODEL };
  }

  return null;
}

/**
 * Atomically claim one AI request slot for the user.
 *
 * The check (total < limit) and increment happen in a single conditional
 * UPDATE, preventing concurrent requests from bypassing the limit.
 *
 * Returns true  → slot claimed; caller may proceed.
 * Returns false → limit already reached at the DB level; return 429.
 *
 * Call this BEFORE the provider API call so the slot is reserved up front.
 * If the provider call fails, the slot is still consumed — this prevents
 * users from gaming the limit by repeatedly triggering failures.
 */
export async function claimAiRequest(
  supabase: SupabaseClient,
  userId: string,
  windowStart: Date,
  provider: "groq" | "gemini",
  maxTotal: number,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("claim_ai_request", {
    p_user_id: userId,
    p_window_start: windowStart.toISOString(),
    p_provider: provider,
    p_max_total: maxTotal,
  });

  if (error) throw new Error(`claim_ai_request failed: ${error.message}`);
  return data === true;
}

/** Increment the org-level Groq soft-cap counter after a successful Groq call. */
export async function incrementOrgGroqUsage(supabase: SupabaseClient): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  await supabase.rpc("increment_org_groq_usage", { p_date: today });
}

/**
 * @deprecated Use claimAiRequest instead — this function is non-atomic.
 * Kept for reference; no longer called from index.ts.
 */
export async function incrementUsage(
  supabase: SupabaseClient,
  userId: string,
  windowStart: Date,
  provider: "groq" | "gemini"
): Promise<void> {
  const windowStartISO = windowStart.toISOString();
  const field = provider === "groq" ? "groq_count" : "gemini_count";

  await supabase.rpc("increment_ai_usage", {
    p_user_id: userId,
    p_window_start: windowStartISO,
    p_field: field,
  });

  if (provider === "groq") {
    const today = new Date().toISOString().slice(0, 10);
    await supabase.rpc("increment_org_groq_usage", { p_date: today });
  }
}
