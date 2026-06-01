ALTER TABLE public.npcs
  ADD COLUMN IF NOT EXISTS faction_id uuid REFERENCES public.factions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS npcs_faction_id_idx
  ON public.npcs (faction_id)
  WHERE faction_id IS NOT NULL;
