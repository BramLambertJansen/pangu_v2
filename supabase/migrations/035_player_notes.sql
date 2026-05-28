CREATE TABLE IF NOT EXISTS public.player_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id uuid REFERENCES public.characters(id) ON DELETE SET NULL,
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS player_notes_session_user_idx
  ON public.player_notes(session_id, user_id);

CREATE INDEX IF NOT EXISTS player_notes_session_idx
  ON public.player_notes(session_id);

ALTER TABLE public.player_notes ENABLE ROW LEVEL SECURITY;

-- Players can create, read, and update their own notes
CREATE POLICY own_player_notes ON public.player_notes
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DM can read all notes for sessions belonging to their campaigns
CREATE POLICY dm_read_player_notes ON public.player_notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      JOIN public.campaigns c ON c.id = s.campaign_id
      WHERE s.id = session_id
        AND c.user_id = auth.uid()
    )
  );
