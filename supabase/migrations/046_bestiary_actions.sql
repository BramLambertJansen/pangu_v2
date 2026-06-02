-- Add structured combat data columns to bestiaries
-- special_abilities, actions, bonus_actions, reactions, legendary_actions, lair_actions
-- stored as jsonb arrays of { name: text, desc: text }
-- legendary_desc stores the intro text for legendary action usage

ALTER TABLE public.bestiaries
  ADD COLUMN IF NOT EXISTS special_abilities  jsonb,
  ADD COLUMN IF NOT EXISTS actions            jsonb,
  ADD COLUMN IF NOT EXISTS bonus_actions      jsonb,
  ADD COLUMN IF NOT EXISTS reactions          jsonb,
  ADD COLUMN IF NOT EXISTS legendary_desc     text,
  ADD COLUMN IF NOT EXISTS legendary_actions  jsonb,
  ADD COLUMN IF NOT EXISTS lair_actions       jsonb;
