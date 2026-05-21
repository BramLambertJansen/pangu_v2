CREATE TABLE IF NOT EXISTS public.campaigns (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  world_id    uuid        REFERENCES public.worlds(id) ON DELETE CASCADE NOT NULL,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        text        NOT NULL DEFAULT 'Nieuwe kroniek',
  subtitle    text,
  description text,
  status      text        NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft', 'active', 'archived', 'completed')),
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS campaigns_world_id_created_at_idx
  ON public.campaigns (world_id, created_at DESC);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_campaigns" ON public.campaigns;
CREATE POLICY "own_campaigns" ON public.campaigns
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.worlds
      WHERE id = world_id
        AND user_id = auth.uid()
    )
  );
