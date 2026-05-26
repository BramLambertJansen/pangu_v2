import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { AIResponse, ErrorResponse, Message, Provider } from "@/types/ai";

export interface AIResult {
  reply: string;
  provider: Provider;
  model: string;
  windowRemaining: number;
}

interface UseAIReturn {
  ask: (messages: Message[]) => Promise<AIResult>;
  loading: boolean;
  /** Remaining free-tier requests this window. null = not yet fetched. -1 = BYOK (no cap). */
  windowRemaining: number | null;
  /** ISO timestamp when the rate-limit window resets. null = not yet reached. */
  windowResetsAt: string | null;
  /** Provider used for the last successful request. null = not yet used. */
  lastProvider: Provider | null;
  /** Model used for the last successful request. null = not yet used. */
  lastModel: string | null;
}

export function useAI(): UseAIReturn {
  const [loading, setLoading]           = useState(false);
  const [windowRemaining, setRemaining] = useState<number | null>(null);
  const [windowResetsAt, setResetsAt]   = useState<string | null>(null);
  const [lastProvider, setLastProvider] = useState<Provider | null>(null);
  const [lastModel, setLastModel]       = useState<string | null>(null);

  const ask = useCallback(async (messages: Message[]): Promise<AIResult> => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ messages }),
        }
      );

      const data: AIResponse | ErrorResponse = await res.json();

      if (!res.ok) {
        const err = data as ErrorResponse;
        if (err.code === "free_limit_reached") {
          setResetsAt(err.window_resets_at ?? null);
        }
        throw new Error(err.error);
      }

      const ok = data as AIResponse;
      // Update state for consumers that read hook values between renders
      setRemaining(ok.window_remaining);
      setLastProvider(ok.provider);
      setLastModel(ok.model);

      // Return fresh metadata directly — callers must not rely on state
      // which may not have flushed yet (async React batching).
      return {
        reply:           ok.reply,
        provider:        ok.provider,
        model:           ok.model,
        windowRemaining: ok.window_remaining,
      };

    } finally {
      setLoading(false);
    }
  }, []);

  return { ask, loading, windowRemaining, windowResetsAt, lastProvider, lastModel };
}
