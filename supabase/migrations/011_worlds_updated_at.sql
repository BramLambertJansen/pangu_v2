-- Missing updated_at trigger for worlds table (sessions had this from migration 007)
CREATE OR REPLACE FUNCTION update_worlds_updated_at()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS worlds_updated_at ON public.worlds;
CREATE TRIGGER worlds_updated_at
  BEFORE UPDATE ON public.worlds
  FOR EACH ROW EXECUTE FUNCTION update_worlds_updated_at();

-- Index for fast per-user listing (SELECT * WHERE user_id = ? ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS worlds_user_id_created_at_idx
  ON public.worlds (user_id, created_at DESC);
