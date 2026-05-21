CREATE TABLE IF NOT EXISTS public.sessions (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id    uuid        REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id        uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name           text        NOT NULL DEFAULT 'Nieuwe sessie',
  subtitle       text,
  description    text,
  notes          text,
  status         text        NOT NULL DEFAULT 'planned'
                 CHECK (status IN ('planned', 'active', 'completed', 'archived')),
  session_date   date,
  session_number integer,
  created_at     timestamptz DEFAULT now() NOT NULL,
  updated_at     timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_campaign_id_idx
  ON public.sessions (campaign_id, created_at DESC);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sessions' AND policyname = 'own_sessions'
  ) THEN
    CREATE POLICY "own_sessions" ON public.sessions
      USING (user_id = auth.uid())
      WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.campaigns
          WHERE id = campaign_id AND user_id = auth.uid()
        )
      );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_sessions_updated_at()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sessions_updated_at ON public.sessions;
CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION update_sessions_updated_at();
