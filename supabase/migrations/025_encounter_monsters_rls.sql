-- Fix encounter_monsters RLS: verify encounter ownership, not just user_id.
--
-- The previous policy only checked user_id = auth.uid(), allowing User B to
-- insert monsters into an encounter owned by User A by supplying their own
-- user_id. The fix adds a subquery that confirms the target encounter belongs
-- to the authenticated user.

drop policy if exists "Users can manage their own encounter monsters" on public.encounter_monsters;

create policy "Users can manage their own encounter monsters"
  on public.encounter_monsters
  for all
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.encounters
      where encounters.id = encounter_monsters.encounter_id
        and encounters.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.encounters
      where encounters.id = encounter_monsters.encounter_id
        and encounters.user_id = auth.uid()
    )
  );
