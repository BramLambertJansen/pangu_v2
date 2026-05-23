CREATE TABLE IF NOT EXISTS public.bestiaries (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  world_id      uuid        REFERENCES public.worlds(id) ON DELETE CASCADE NOT NULL,
  user_id       uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name          text        NOT NULL DEFAULT 'Nieuw wezen',
  subtitle      text,
  creature_type text,
  threat_level  text,
  habitat       text,
  description   text,
  notes         text,
  status        text        NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'active', 'archived')),
  hp            integer     NOT NULL DEFAULT 10,
  ac            integer     NOT NULL DEFAULT 10,
  speed         integer     NOT NULL DEFAULT 30,
  stat_str      integer     NOT NULL DEFAULT 10,
  stat_dex      integer     NOT NULL DEFAULT 10,
  stat_con      integer     NOT NULL DEFAULT 10,
  stat_int      integer     NOT NULL DEFAULT 10,
  stat_wis      integer     NOT NULL DEFAULT 10,
  stat_cha      integer     NOT NULL DEFAULT 10,
  created_at    timestamptz DEFAULT now() NOT NULL,
  updated_at    timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS bestiaries_world_id_idx
  ON public.bestiaries (world_id, created_at DESC);

ALTER TABLE public.bestiaries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'bestiaries' AND policyname = 'own_bestiaries'
  ) THEN
    CREATE POLICY "own_bestiaries" ON public.bestiaries
      USING (user_id = auth.uid())
      WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.worlds
          WHERE id = world_id AND user_id = auth.uid()
        )
      );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_bestiaries_updated_at()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bestiaries_updated_at ON public.bestiaries;
CREATE TRIGGER bestiaries_updated_at
  BEFORE UPDATE ON public.bestiaries
  FOR EACH ROW EXECUTE FUNCTION update_bestiaries_updated_at();
