-- Fix: allow campaign members to read entity_links and factions.
-- entity_links (038) and factions (039) were restricted to campaign/faction owners only,
-- which broke RelatedEntities name resolution for players viewing shared pages (sessions, etc.).

-- entity_links: add a SELECT-only policy for campaign members
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'entity_links' AND policyname = 'member_read_entity_links'
  ) THEN
    CREATE POLICY "member_read_entity_links" ON public.entity_links
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.campaign_members
          WHERE campaign_id = entity_links.campaign_id
            AND user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- factions: add a SELECT-only policy for campaign members
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'factions' AND policyname = 'member_read_factions'
  ) THEN
    CREATE POLICY "member_read_factions" ON public.factions
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.campaign_members
          WHERE campaign_id = factions.campaign_id
            AND user_id = auth.uid()
        )
      );
  END IF;
END $$;
