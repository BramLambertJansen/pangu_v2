-- Per-user lookup indexes missing from locations, lore, npcs, and sessions.
-- The campaign_id compound indexes exist; these add user_id for direct
-- user-scoped queries (e.g. admin tooling, cross-campaign dashboards).

CREATE INDEX IF NOT EXISTS sessions_user_id_idx
  ON public.sessions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS locations_user_id_idx
  ON public.locations (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS lore_user_id_idx
  ON public.lore (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS npcs_user_id_idx
  ON public.npcs (user_id, created_at DESC);
