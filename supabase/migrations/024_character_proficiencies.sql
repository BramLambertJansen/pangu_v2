-- Add D&D 5.5e (2024 PHB) character features missing from the initial character sheet.
-- Groups: saving throw proficiencies, expertise, proficiency arrays,
--         combat state, character identity, and roleplay traits.

-- ── Proficiency arrays ─────────────────────────────────────────────────────
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS saving_throw_proficiencies text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS expertise_skills           text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS languages                  text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tool_proficiencies         text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS weapon_proficiencies       text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS armor_proficiencies        text[] NOT NULL DEFAULT '{}';

-- ── Combat state ───────────────────────────────────────────────────────────
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS inspiration          boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hit_die              text    NOT NULL DEFAULT 'd8'
    CHECK (hit_die IN ('d6', 'd8', 'd10', 'd12')),
  ADD COLUMN IF NOT EXISTS hit_dice_current     integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS death_save_successes integer NOT NULL DEFAULT 0
    CHECK (death_save_successes BETWEEN 0 AND 3),
  ADD COLUMN IF NOT EXISTS death_save_failures  integer NOT NULL DEFAULT 0
    CHECK (death_save_failures BETWEEN 0 AND 3),
  ADD COLUMN IF NOT EXISTS exhaustion           integer NOT NULL DEFAULT 0
    CHECK (exhaustion BETWEEN 0 AND 10);

-- ── Character identity ─────────────────────────────────────────────────────
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS alignment text;

-- ── Roleplay traits ────────────────────────────────────────────────────────
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS personality_traits text,
  ADD COLUMN IF NOT EXISTS ideals             text,
  ADD COLUMN IF NOT EXISTS bonds              text,
  ADD COLUMN IF NOT EXISTS flaws              text;
