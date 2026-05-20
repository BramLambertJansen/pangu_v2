CREATE TABLE public.worlds (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name         text        NOT NULL DEFAULT 'Nieuwe wereld',
  subtitle     text,
  quote        text,
  description  text,
  header_image text,
  status       text        NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft', 'active', 'archived')),
  created_at   timestamptz DEFAULT now() NOT NULL,
  updated_at   timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.worlds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_worlds" ON public.worlds
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
