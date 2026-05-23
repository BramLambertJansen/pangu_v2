-- Create the generic updated_at trigger function referenced by 014_characters.sql.
-- That migration failed to apply because this function did not exist, causing the
-- entire transaction to roll back. This migration creates the function and
-- re-applies the characters table setup idempotently.

CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Nieuw karakter',
  subtitle text,
  character_class text,
  character_subclass text,
  character_race text,
  level integer NOT NULL DEFAULT 1,
  xp integer NOT NULL DEFAULT 0,
  xp_next integer NOT NULL DEFAULT 300,
  hp_current integer NOT NULL DEFAULT 10,
  hp_max integer NOT NULL DEFAULT 10,
  armor_class integer NOT NULL DEFAULT 10,
  speed integer NOT NULL DEFAULT 30,
  initiative integer NOT NULL DEFAULT 0,
  proficiency_bonus integer NOT NULL DEFAULT 2,
  stat_str integer NOT NULL DEFAULT 10,
  stat_dex integer NOT NULL DEFAULT 10,
  stat_con integer NOT NULL DEFAULT 10,
  stat_int integer NOT NULL DEFAULT 10,
  stat_wis integer NOT NULL DEFAULT 10,
  stat_cha integer NOT NULL DEFAULT 10,
  gold integer NOT NULL DEFAULT 0,
  silver integer NOT NULL DEFAULT 0,
  copper integer NOT NULL DEFAULT 0,
  description text,
  notes text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'retired', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS characters_user_id_idx
  ON characters (user_id, created_at DESC);

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'characters' AND policyname = 'own_characters'
  ) THEN
    CREATE POLICY own_characters ON characters
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_characters_updated_at ON characters;
CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
