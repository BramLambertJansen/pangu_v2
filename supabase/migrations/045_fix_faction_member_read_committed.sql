-- Fix: restrict the member_read_factions policy to committed rows only.
-- Without this guard, campaign members could query draft factions (committed = false)
-- via the Supabase API directly, exposing DM notes before the faction is published.
-- The DM's own "own_factions" policy is unaffected (no committed restriction for owners).

DROP POLICY IF EXISTS "member_read_factions" ON public.factions;

CREATE POLICY "member_read_factions" ON public.factions
  FOR SELECT
  USING (
    committed = true
    AND EXISTS (
      SELECT 1 FROM public.campaign_members
      WHERE campaign_id = factions.campaign_id
        AND user_id = auth.uid()
    )
  );
