-- Items table: campaign-scoped items that the DM creates and can assign to characters
CREATE TABLE items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  character_id uuid REFERENCES characters(id) ON DELETE SET NULL,
  name         text NOT NULL DEFAULT 'Nieuw item',
  description  text,
  item_type    text NOT NULL DEFAULT 'misc'
    CHECK (item_type IN ('weapon','armor','potion','ring','rod','scroll','staff','wand','wondrous','misc')),
  rarity       text NOT NULL DEFAULT 'common'
    CHECK (rarity IN ('common','uncommon','rare','very_rare','legendary','artifact')),
  is_magical   boolean NOT NULL DEFAULT false,
  quantity     integer NOT NULL DEFAULT 1,
  weight       numeric,
  properties   jsonb NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX items_campaign_id_idx  ON items(campaign_id, created_at DESC);
CREATE INDEX items_character_id_idx ON items(character_id);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Campaign owner (DM) has full CRUD access
CREATE POLICY dm_items ON items
  USING (campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid()))
  WITH CHECK (campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid()));

-- Character owner can read items that are assigned to their character
CREATE POLICY player_items ON items FOR SELECT
  USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
