-- Add equipped_slot column to items table.
-- This allows characters to equip items into specific D&D/RPG equipment slots.
-- The properties JSONB column already exists and is used to store stat bonuses.

ALTER TABLE items
  ADD COLUMN equipped_slot text
  CHECK (equipped_slot IN (
    'head', 'neck', 'chest', 'cloak', 'gloves',
    'ring1', 'ring2', 'boots', 'main_hand', 'off_hand'
  ));

-- Enforce that each character can only have one item per equipment slot.
-- Partial index excludes NULLs so unequipped items are never counted.
CREATE UNIQUE INDEX items_character_equipped_slot_unique
  ON items (character_id, equipped_slot)
  WHERE equipped_slot IS NOT NULL AND character_id IS NOT NULL;
