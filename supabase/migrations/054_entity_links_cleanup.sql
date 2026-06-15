-- entity_links.from_id/to_id are polymorphic (no FK), so deleting an npc,
-- location, etc. left orphaned entity_links rows pointing at a non-existent
-- entity. Add an AFTER DELETE trigger on each linkable table that removes
-- any entity_links rows referencing the deleted row, on either side.

CREATE OR REPLACE FUNCTION public.cleanup_entity_links()
  RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_type text := TG_ARGV[0];
BEGIN
  DELETE FROM public.entity_links
  WHERE (from_type = v_type AND from_id = OLD.id)
     OR (to_type = v_type AND to_id = OLD.id);
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS cleanup_entity_links ON public.locations;
CREATE TRIGGER cleanup_entity_links
  AFTER DELETE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_entity_links('location');

DROP TRIGGER IF EXISTS cleanup_entity_links ON public.npcs;
CREATE TRIGGER cleanup_entity_links
  AFTER DELETE ON public.npcs
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_entity_links('npc');

DROP TRIGGER IF EXISTS cleanup_entity_links ON public.lore;
CREATE TRIGGER cleanup_entity_links
  AFTER DELETE ON public.lore
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_entity_links('lore');

DROP TRIGGER IF EXISTS cleanup_entity_links ON public.quests;
CREATE TRIGGER cleanup_entity_links
  AFTER DELETE ON public.quests
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_entity_links('quest');

DROP TRIGGER IF EXISTS cleanup_entity_links ON public.sessions;
CREATE TRIGGER cleanup_entity_links
  AFTER DELETE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_entity_links('session');

DROP TRIGGER IF EXISTS cleanup_entity_links ON public.items;
CREATE TRIGGER cleanup_entity_links
  AFTER DELETE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_entity_links('item');

DROP TRIGGER IF EXISTS cleanup_entity_links ON public.encounters;
CREATE TRIGGER cleanup_entity_links
  AFTER DELETE ON public.encounters
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_entity_links('encounter');

DROP TRIGGER IF EXISTS cleanup_entity_links ON public.characters;
CREATE TRIGGER cleanup_entity_links
  AFTER DELETE ON public.characters
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_entity_links('character');

DROP TRIGGER IF EXISTS cleanup_entity_links ON public.factions;
CREATE TRIGGER cleanup_entity_links
  AFTER DELETE ON public.factions
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_entity_links('faction');
