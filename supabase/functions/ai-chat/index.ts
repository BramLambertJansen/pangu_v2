import { createClient } from "npm:@supabase/supabase-js@2";
import { AI_CONFIG } from "./config.ts";
import type { ByokProvider } from "./config.ts";
import type { Message, AIResponse, ErrorResponse, Provider, UserAISettings } from "./types.ts";
import {
  getWindowStart,
  getWindowEnd,
  getUserUsage,
  getOrgUsage,
  routeRequest,
  incrementUsage,
} from "./ratelimit.ts";
import { callGroq, callGemini, callAnthropic, callOpenAI } from "./providers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey    = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    // ── 1. Auth ───────────────────────────────────────────────────────────────

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return errorResponse("unauthorized", "Missing Authorization header", 401);
    }

    // User client: RLS enforced via JWT — protects ai_usage + user_ai_settings
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service client: bypasses RLS — used only for ai_org_usage (no user context)
    const supabaseService = createClient(supabaseUrl, serviceKey);

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return errorResponse("unauthorized", "Invalid or expired token", 401);
    }

    // ── 2. Validate request body ──────────────────────────────────────────────

    const body = await req.json().catch(() => null);
    const messages: Message[] = body?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return errorResponse("invalid_request", "messages array is required and must not be empty", 400);
    }

    // ── 3. BYOK check ─────────────────────────────────────────────────────────

    const { data: settings } = await supabaseUser
      .from("user_ai_settings")
      .select("byok_keys, preferred_provider, preferred_model")
      .eq("user_id", user.id)
      .maybeSingle();

    const byokKeys: Record<string, string> = (settings as UserAISettings | null)?.byok_keys ?? {};
    const preferredProvider = (settings as UserAISettings | null)?.preferred_provider ?? null;

    // Resolve active BYOK provider: prefer explicit setting, fall back to first key available.
    const activeProvider: string | null =
      preferredProvider && byokKeys[preferredProvider]
        ? preferredProvider
        : Object.keys(byokKeys)[0] ?? null;

    const byokKey = activeProvider ? (byokKeys[activeProvider] ?? null) : null;

    if (byokKey && activeProvider) {
      const providerConfig =
        AI_CONFIG.BYOK_PROVIDERS[activeProvider as ByokProvider] ?? null;
      const model =
        (settings as UserAISettings | null)?.preferred_model ??
        providerConfig?.default_model ??
        AI_CONFIG.BYOK_DEFAULT_MODEL;

      let reply: string;
      if (activeProvider === "anthropic") {
        reply = await callAnthropic(messages, model, byokKey);
      } else if (activeProvider === "openai") {
        reply = await callOpenAI(messages, model, byokKey);
      } else {
        return errorResponse(
          "invalid_request",
          `Unsupported BYOK provider: ${activeProvider}`,
          400
        );
      }

      // window_remaining -1 signals "BYOK — no cap applies"
      return jsonResponse<AIResponse>({
        reply,
        provider: activeProvider as Provider,
        model,
        window_remaining: -1,
      });
    }

    // ── 4. Free tier: rate limiting ───────────────────────────────────────────

    const windowStart = getWindowStart();
    const [usage, orgUsage] = await Promise.all([
      getUserUsage(supabaseUser, user.id, windowStart),
      getOrgUsage(supabaseService),
    ]);

    const route = routeRequest(usage, orgUsage);

    if (!route) {
      const windowEnd = getWindowEnd(windowStart);
      return errorResponse(
        "free_limit_reached",
        `Limiet van ${AI_CONFIG.FREE_REQUESTS_PER_WINDOW} requests per ${AI_CONFIG.WINDOW_HOURS}u bereikt.`,
        429,
        { window_resets_at: windowEnd.toISOString() }
      );
    }

    // ── 5. Call provider ──────────────────────────────────────────────────────

    let reply: string;
    if (route.provider === "groq") {
      reply = await callGroq(messages, route.model);
    } else {
      reply = await callGemini(messages, route.model);
    }

    // ── 6. Increment usage counters (after successful call) ───────────────────

    await incrementUsage(supabaseUser, user.id, windowStart, route.provider);

    const totalAfter = usage.groq_count + usage.gemini_count + 1;
    const remaining  = AI_CONFIG.FREE_REQUESTS_PER_WINDOW - totalAfter;

    return jsonResponse<AIResponse>({
      reply,
      provider: route.provider,
      model: route.model,
      window_remaining: remaining,
    });

  } catch (err) {
    console.error("ai-chat error:", err);
    return errorResponse(
      "provider_error",
      err instanceof Error ? err.message : "Unknown error",
      500
    );
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function jsonResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(
  code: ErrorResponse["code"],
  message: string,
  status: number,
  extra?: Partial<Omit<ErrorResponse, "error" | "code">>
): Response {
  const body: ErrorResponse = { error: message, code, ...extra };
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
