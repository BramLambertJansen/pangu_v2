-- Tighten character_spells INSERT: the WITH CHECK now also verifies that
-- the linked spell belongs to the inserting user, preventing cross-user
-- spell references via guessed or leaked UUIDs.

DROP POLICY IF EXISTS "character_spells: owner full access" ON character_spells;

CREATE POLICY "character_spells: owner full access"
  ON character_spells
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM characters c
      WHERE c.id = character_spells.character_id
        AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM characters c
      WHERE c.id = character_spells.character_id
        AND c.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM spells s
      WHERE s.id = character_spells.spell_id
        AND s.user_id = auth.uid()
    )
  );
