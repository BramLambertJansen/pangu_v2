-- Add provenance columns to bestiaries and items for SRD import tracking.
-- source: 'srd' for Open5e SRD imports, null for handcrafted content.
-- source_slug: the Open5e V2 slug of the imported entity (e.g. 'owlbear').
-- Partial unique indexes prevent duplicate SRD imports per scope.

ALTER TABLE bestiaries
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS source_slug text;

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS source_slug text;

-- One SRD slug per world in the bestiary
CREATE UNIQUE INDEX IF NOT EXISTS bestiaries_srd_source_slug_world_idx
  ON bestiaries (world_id, source_slug)
  WHERE source_slug IS NOT NULL;

-- One SRD slug per campaign in items
CREATE UNIQUE INDEX IF NOT EXISTS items_srd_source_slug_campaign_idx
  ON items (campaign_id, source_slug)
  WHERE source_slug IS NOT NULL;
