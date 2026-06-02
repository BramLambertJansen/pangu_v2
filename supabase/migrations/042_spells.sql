-- User-scoped spell library for the SRD compendium.
-- Spells are global to the user (mirroring the characters scope).
-- source_slug unique per user prevents duplicate SRD imports.

CREATE TABLE IF NOT EXISTS spells (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text        NOT NULL DEFAULT 'Nieuwe spreuk',
  level           integer     NOT NULL DEFAULT 0 CHECK (level >= 0 AND level <= 9),
  school          text        NOT NULL DEFAULT 'evocation',
  casting_time    text        NOT NULL DEFAULT '1 action',
  range           text        NOT NULL DEFAULT '',
  components      text        NOT NULL DEFAULT '',
  duration        text        NOT NULL DEFAULT '',
  concentration   boolean     NOT NULL DEFAULT false,
  ritual          boolean     NOT NULL DEFAULT false,
  description     text,
  higher_level    text,
  classes         text[]      NOT NULL DEFAULT '{}',
  source          text,
  source_slug     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE spells ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spells_owner_all"
  ON spells FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Prevent duplicate SRD imports per user
CREATE UNIQUE INDEX IF NOT EXISTS spells_user_source_slug_idx
  ON spells (user_id, source_slug)
  WHERE source_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS spells_user_id_idx
  ON spells (user_id, level, name);
