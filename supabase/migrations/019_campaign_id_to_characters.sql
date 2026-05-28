-- Add campaign_id to characters so a character can be enrolled in one campaign (nullable)
ALTER TABLE characters
  ADD COLUMN campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL;

CREATE INDEX characters_campaign_id_idx ON characters(campaign_id, created_at DESC);

-- Replace the single combined policy with separate per-operation policies
DROP POLICY own_characters ON characters;

-- SELECT: own characters OR characters enrolled in campaigns you own (DM view)
CREATE POLICY select_characters ON characters FOR SELECT
  USING (
    auth.uid() = user_id
    OR campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
  );

CREATE POLICY insert_characters ON characters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY update_characters ON characters FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY delete_characters ON characters FOR DELETE
  USING (auth.uid() = user_id);
