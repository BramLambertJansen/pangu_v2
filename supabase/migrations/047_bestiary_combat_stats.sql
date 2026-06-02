-- Add full D&D stat block columns to bestiaries
-- Covers resistances, immunities, senses, languages, saving throws, skills
-- and requires_attunement on items

ALTER TABLE public.bestiaries
  ADD COLUMN IF NOT EXISTS alignment          text,
  ADD COLUMN IF NOT EXISTS hit_dice           text,
  ADD COLUMN IF NOT EXISTS proficiency_bonus  integer,
  ADD COLUMN IF NOT EXISTS senses             text,
  ADD COLUMN IF NOT EXISTS languages          text,
  ADD COLUMN IF NOT EXISTS saving_throws      text,
  ADD COLUMN IF NOT EXISTS skills             text,
  ADD COLUMN IF NOT EXISTS damage_immunities      text,
  ADD COLUMN IF NOT EXISTS damage_resistances     text,
  ADD COLUMN IF NOT EXISTS damage_vulnerabilities text,
  ADD COLUMN IF NOT EXISTS condition_immunities   text,
  ADD COLUMN IF NOT EXISTS speed_details      text;

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS requires_attunement boolean NOT NULL DEFAULT false;
