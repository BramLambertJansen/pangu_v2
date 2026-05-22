CREATE TABLE IF NOT EXISTS public.npcs (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id   uuid        REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id       uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name          text        NOT NULL DEFAULT 'Nieuwe NPC',
  subtitle      text,
  description   text,
  notes         text,
  status        text        NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'active', 'retired', 'archived')),
  npc_role      text,
  created_at    timestamptz DEFAULT now() NOT NULL,
  updated_at    timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS npcs_campaign_id_idx
  ON public.npcs (campaign_id, created_at DESC);

ALTER TABLE public.npcs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'npcs' AND policyname = 'own_npcs'
  ) THEN
    CREATE POLICY "own_npcs" ON public.npcs
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

CREATE OR REPLACE FUNCTION update_npcs_updated_at()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS npcs_updated_at ON public.npcs;
CREATE TRIGGER npcs_updated_at
  BEFORE UPDATE ON public.npcs
  FOR EACH ROW EXECUTE FUNCTION update_npcs_updated_at();
