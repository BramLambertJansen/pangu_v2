-- Extend characters table with remaining D&D 5.5e (2024 PHB) fields:
-- temp HP, spellcasting, spell slots, concentration, feats, conditions,
-- class resources, extra currency, alternative speeds, senses, physical appearance,
-- weapon masteries.

-- ── Combat extensions ─────────────────────────────────────────────────────────
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS temp_hp integer NOT NULL DEFAULT 0
    CHECK (temp_hp >= 0);

-- ── Spellcasting ──────────────────────────────────────────────────────────────
-- spellcasting_ability stores the ability abbreviation used for spells
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS spellcasting_ability text
    CHECK (spellcasting_ability IN ('int', 'wis', 'cha')),
  -- spell_slots: {"1":{"current":2,"max":4},"2":{"current":1,"max":3},...}
  -- Only levels with max > 0 need to be stored.
  ADD COLUMN IF NOT EXISTS spell_slots jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS concentrating boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS concentration_spell text;

-- ── Feats & special features ──────────────────────────────────────────────────
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS feats text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS weapon_masteries text[] NOT NULL DEFAULT '{}';

-- ── Active conditions (combat state) ─────────────────────────────────────────
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS active_conditions text[] NOT NULL DEFAULT '{}';

-- ── Class-specific resources ──────────────────────────────────────────────────
-- Flexible JSONB: {"Ki-punten":{"current":3,"max":5},"Woede":{"current":2,"max":3}}
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS class_resources jsonb NOT NULL DEFAULT '{}';

-- ── Extended currency ────────────────────────────────────────────────────────
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS platinum integer NOT NULL DEFAULT 0
    CHECK (platinum >= 0),
  ADD COLUMN IF NOT EXISTS electrum integer NOT NULL DEFAULT 0
    CHECK (electrum >= 0);

-- ── Alternative movement speeds ───────────────────────────────────────────────
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS fly_speed   integer NOT NULL DEFAULT 0 CHECK (fly_speed   >= 0),
  ADD COLUMN IF NOT EXISTS swim_speed  integer NOT NULL DEFAULT 0 CHECK (swim_speed  >= 0),
  ADD COLUMN IF NOT EXISTS climb_speed integer NOT NULL DEFAULT 0 CHECK (climb_speed >= 0),
  ADD COLUMN IF NOT EXISTS burrow_speed integer NOT NULL DEFAULT 0 CHECK (burrow_speed >= 0);

-- ── Senses ────────────────────────────────────────────────────────────────────
-- darkvision in feet; 0 = none
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS darkvision integer NOT NULL DEFAULT 0 CHECK (darkvision >= 0),
  ADD COLUMN IF NOT EXISTS special_senses text;  -- free text for truesight, tremorsense, etc.

-- ── Physical appearance ───────────────────────────────────────────────────────
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS age     text,
  ADD COLUMN IF NOT EXISTS height  text,
  ADD COLUMN IF NOT EXISTS weight  text,
  ADD COLUMN IF NOT EXISTS appearance text;  -- hair, eyes, skin, distinguishing features
