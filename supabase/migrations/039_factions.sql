CREATE TABLE IF NOT EXISTS public.factions (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid        REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        text        NOT NULL DEFAULT 'Nieuwe factie',
  subtitle    text,
  type        text        CHECK (type IN ('guild', 'noble_house', 'religious', 'criminal', 'military', 'merchant', 'arcane', 'tribal', 'other')),
  reputation  text        NOT NULL DEFAULT 'neutral'
              CHECK (reputation IN ('hostile', 'unfriendly', 'neutral', 'friendly', 'allied')),
  status      text        NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft', 'active', 'archived')),
  motto       text,
  goals       text,
  description text,
  notes       text,
  committed   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS factions_campaign_id_created_at_idx
  ON public.factions (campaign_id, created_at DESC);

ALTER TABLE public.factions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'factions' AND policyname = 'own_factions'
  ) THEN
    CREATE POLICY "own_factions" ON public.factions
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

CREATE OR REPLACE FUNCTION update_factions_updated_at()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS factions_updated_at ON public.factions;
CREATE TRIGGER factions_updated_at
  BEFORE UPDATE ON public.factions
  FOR EACH ROW EXECUTE FUNCTION update_factions_updated_at();
