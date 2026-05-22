CREATE TABLE IF NOT EXISTS public.locations (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id   uuid        REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id       uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name          text        NOT NULL DEFAULT 'Nieuwe locatie',
  subtitle      text,
  description   text,
  notes         text,
  status        text        NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'active', 'discovered', 'archived')),
  location_type text,
  created_at    timestamptz DEFAULT now() NOT NULL,
  updated_at    timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS locations_campaign_id_idx
  ON public.locations (campaign_id, created_at DESC);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'locations' AND policyname = 'own_locations'
  ) THEN
    CREATE POLICY "own_locations" ON public.locations
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

CREATE OR REPLACE FUNCTION update_locations_updated_at()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS locations_updated_at ON public.locations;
CREATE TRIGGER locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION update_locations_updated_at();
