-- Tracks whether an entity has been explicitly saved at least once.
-- Uncommitted entities (committed = false) are draft placeholders created
-- by the Forge pattern and should not appear in list views until saved.

ALTER TABLE worlds     ADD COLUMN IF NOT EXISTS committed boolean NOT NULL DEFAULT false;
ALTER TABLE campaigns  ADD COLUMN IF NOT EXISTS committed boolean NOT NULL DEFAULT false;
ALTER TABLE sessions   ADD COLUMN IF NOT EXISTS committed boolean NOT NULL DEFAULT false;
ALTER TABLE locations  ADD COLUMN IF NOT EXISTS committed boolean NOT NULL DEFAULT false;
ALTER TABLE lore       ADD COLUMN IF NOT EXISTS committed boolean NOT NULL DEFAULT false;
ALTER TABLE npcs       ADD COLUMN IF NOT EXISTS committed boolean NOT NULL DEFAULT false;
ALTER TABLE bestiaries ADD COLUMN IF NOT EXISTS committed boolean NOT NULL DEFAULT false;
ALTER TABLE quests     ADD COLUMN IF NOT EXISTS committed boolean NOT NULL DEFAULT false;
ALTER TABLE encounters ADD COLUMN IF NOT EXISTS committed boolean NOT NULL DEFAULT false;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS committed boolean NOT NULL DEFAULT false;
ALTER TABLE items      ADD COLUMN IF NOT EXISTS committed boolean NOT NULL DEFAULT false;

-- All pre-existing rows are already committed (they were saved before this migration)
UPDATE worlds     SET committed = true WHERE committed = false;
UPDATE campaigns  SET committed = true WHERE committed = false;
UPDATE sessions   SET committed = true WHERE committed = false;
UPDATE locations  SET committed = true WHERE committed = false;
UPDATE lore       SET committed = true WHERE committed = false;
UPDATE npcs       SET committed = true WHERE committed = false;
UPDATE bestiaries SET committed = true WHERE committed = false;
UPDATE quests     SET committed = true WHERE committed = false;
UPDATE encounters SET committed = true WHERE committed = false;
UPDATE characters SET committed = true WHERE committed = false;
UPDATE items      SET committed = true WHERE committed = false;
