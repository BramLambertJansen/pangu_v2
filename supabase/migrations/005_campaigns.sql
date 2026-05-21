CREATE TABLE public.campaigns (
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

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_campaigns" ON public.campaigns
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
