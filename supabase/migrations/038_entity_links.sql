CREATE TABLE public.entity_links (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  from_type   text NOT NULL,
  from_id     uuid NOT NULL,
  to_type     text NOT NULL,
  to_id       uuid NOT NULL,
  relation    text NOT NULL DEFAULT 'related_to',
  created_at  timestamptz DEFAULT now(),
  CONSTRAINT no_self_link CHECK (NOT (from_type = to_type AND from_id = to_id)),
  CONSTRAINT unique_directed_link UNIQUE (campaign_id, from_type, from_id, to_type, to_id, relation)
);

CREATE INDEX ON public.entity_links (campaign_id);
CREATE INDEX ON public.entity_links (from_type, from_id);
CREATE INDEX ON public.entity_links (to_type, to_id);

ALTER TABLE public.entity_links ENABLE ROW LEVEL SECURITY;

-- RLS scoped to campaign ownership — same subquery pattern as 005_campaigns.sql
CREATE POLICY "own_entity_links" ON public.entity_links
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = entity_links.campaign_id
        AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = entity_links.campaign_id
        AND user_id = auth.uid()
    )
  );
