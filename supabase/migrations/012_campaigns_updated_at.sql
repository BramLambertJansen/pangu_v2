-- Missing updated_at trigger for campaigns table
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS campaigns_updated_at ON public.campaigns;
CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION update_campaigns_updated_at();

-- Index for fast per-user listing
CREATE INDEX IF NOT EXISTS campaigns_user_id_created_at_idx
  ON public.campaigns (user_id, created_at DESC);
