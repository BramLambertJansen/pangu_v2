CREATE TABLE IF NOT EXISTS public.lore (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id   uuid        REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id       uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name          text        NOT NULL DEFAULT 'Nieuwe lore',
  subtitle      text,
  description   text,
  notes         text,
  status        text        NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'active', 'archived')),
  lore_category text,
  created_at    timestamptz DEFAULT now() NOT NULL,
  updated_at    timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS lore_campaign_id_idx
  ON public.lore (campaign_id, created_at DESC);

ALTER TABLE public.lore ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'lore' AND policyname = 'own_lore'
  ) THEN
    CREATE POLICY "own_lore" ON public.lore
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

CREATE OR REPLACE FUNCTION update_lore_updated_at()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lore_updated_at ON public.lore;
CREATE TRIGGER lore_updated_at
  BEFORE UPDATE ON public.lore
  FOR EACH ROW EXECUTE FUNCTION update_lore_updated_at();
