-- D&D 5e background (Acolyte, Soldier, ...) chosen in the character wizard
ALTER TABLE characters ADD COLUMN IF NOT EXISTS background text;
