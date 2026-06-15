-- Restrict invite-code lookups and campaign joins to security-definer RPCs.
--
-- "invite_code_lookup" previously let ANY user SELECT entire campaign rows
-- (DM notes, map image, etc.) for every campaign with an invite code set,
-- without proving they hold that campaign's code. "join_via_invite" let any
-- authenticated user insert a campaign_members row for ANY campaign_id,
-- without proving they hold that campaign's invite code.
--
-- Both lookups and joins now go through SECURITY DEFINER functions that
-- resolve the invite code server-side and return only the safe columns the
-- join page needs (id, name, subtitle, status).

drop policy if exists "invite_code_lookup" on public.campaigns;
drop policy if exists "join_via_invite" on public.campaign_members;

create or replace function public.get_campaign_by_invite_code(p_invite_code text)
returns table (id uuid, name text, subtitle text, status text)
language sql
security definer
stable
as $$
  select c.id, c.name, c.subtitle, c.status
  from public.campaigns c
  where c.invite_code = p_invite_code;
$$;

revoke all on function public.get_campaign_by_invite_code(text) from public;
grant execute on function public.get_campaign_by_invite_code(text) to anon, authenticated;

create or replace function public.join_campaign_via_invite(p_invite_code text)
returns table (id uuid, name text, subtitle text, status text)
language plpgsql
security definer
as $$
declare
  v_campaign_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select c.id into v_campaign_id
  from public.campaigns c
  where c.invite_code = p_invite_code;

  if v_campaign_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.campaign_members (campaign_id, user_id)
  values (v_campaign_id, auth.uid())
  on conflict (campaign_id, user_id) do nothing;

  return query
    select c.id, c.name, c.subtitle, c.status
    from public.campaigns c
    where c.id = v_campaign_id;
end;
$$;

revoke all on function public.join_campaign_via_invite(text) from public;
grant execute on function public.join_campaign_via_invite(text) to authenticated;
