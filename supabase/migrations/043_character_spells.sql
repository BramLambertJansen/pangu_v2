-- Junction table: spells known/prepared by a character
CREATE TABLE IF NOT EXISTS character_spells (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  spell_id     uuid NOT NULL REFERENCES spells(id) ON DELETE CASCADE,
  prepared     boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (character_id, spell_id)
);

ALTER TABLE character_spells ENABLE ROW LEVEL SECURITY;

-- Character owner can manage their spell list
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
  );

CREATE INDEX IF NOT EXISTS idx_character_spells_character_id
  ON character_spells (character_id);
