ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS invite_code text UNIQUE;

CREATE INDEX IF NOT EXISTS campaigns_invite_code_idx
  ON public.campaigns (invite_code)
  WHERE invite_code IS NOT NULL;

-- Allow anyone to look up a campaign by its invite code.
-- Only non-private columns are returned by the join page query (id, name, subtitle, status).
-- The existing "own_campaigns" policy continues to cover DM full-row reads.
CREATE POLICY "invite_code_lookup" ON public.campaigns
  FOR SELECT
  USING (invite_code IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.campaign_members (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid        NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, user_id)
);

CREATE INDEX IF NOT EXISTS campaign_members_campaign_id_idx
  ON public.campaign_members (campaign_id);

CREATE INDEX IF NOT EXISTS campaign_members_user_id_idx
  ON public.campaign_members (user_id);

ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_membership" ON public.campaign_members
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "dm_read_members" ON public.campaign_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "join_via_invite" ON public.campaign_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dm_remove_members" ON public.campaign_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND user_id = auth.uid()
    )
  );
