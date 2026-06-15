-- Ensure an npc's faction belongs to the same campaign as the npc itself.
-- The faction_id FK alone (040_npc_faction.sql) allows linking to a faction
-- from a different campaign; this trigger rejects that at write time.

CREATE OR REPLACE FUNCTION public.check_npc_faction_campaign()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.faction_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.factions
      WHERE id = NEW.faction_id AND campaign_id = NEW.campaign_id
    ) THEN
      RAISE EXCEPTION 'faction_id must belong to the same campaign as the npc';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS npcs_faction_campaign_check ON public.npcs;
CREATE TRIGGER npcs_faction_campaign_check
  BEFORE INSERT OR UPDATE OF faction_id, campaign_id ON public.npcs
  FOR EACH ROW EXECUTE FUNCTION public.check_npc_faction_campaign();
