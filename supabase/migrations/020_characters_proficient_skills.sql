-- Add skill proficiency tracking to characters.
-- proficient_skills stores an array of D&D 5e skill names the character is proficient in.
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS proficient_skills text[] DEFAULT '{}' NOT NULL;
