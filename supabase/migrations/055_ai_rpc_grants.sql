-- Tighten grants on the AI rate-limit RPCs.
--
-- New PostgreSQL functions are EXECUTE-able by PUBLIC by default, which
-- PostgREST exposes as `/rest/v1/rpc/<fn>` to the anon and authenticated
-- roles. claim_ai_request / increment_ai_usage take an arbitrary p_user_id
-- with no ownership check, so any caller could increment — and therefore
-- exhaust — another user's rate-limit counters. Add an auth.uid() check and
-- restrict EXECUTE to authenticated; increment_org_groq_usage is only ever
-- called via the service-role client, so restrict it to service_role.

create or replace function claim_ai_request(
  p_user_id      uuid,
  p_window_start timestamptz,
  p_provider     text,
  p_max_total    int
) returns boolean
language plpgsql
security definer
as $$
declare
  v_updated int;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'p_user_id must match the authenticated user';
  end if;

  if p_provider = 'groq' then
    update ai_usage
    set groq_count = groq_count + 1
    where user_id      = p_user_id
      and window_start = p_window_start
      and groq_count + gemini_count < p_max_total;
  else
    update ai_usage
    set gemini_count = gemini_count + 1
    where user_id      = p_user_id
      and window_start = p_window_start
      and groq_count + gemini_count < p_max_total;
  end if;

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

create or replace function increment_ai_usage(
  p_user_id    uuid,
  p_window_start timestamptz,
  p_field      text
) returns void
language plpgsql
security definer
as $$
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'p_user_id must match the authenticated user';
  end if;

  if p_field = 'groq_count' then
    update ai_usage
    set groq_count = groq_count + 1
    where user_id = p_user_id and window_start = p_window_start;
  elsif p_field = 'gemini_count' then
    update ai_usage
    set gemini_count = gemini_count + 1
    where user_id = p_user_id and window_start = p_window_start;
  end if;
end;
$$;

revoke all on function claim_ai_request(uuid, timestamptz, text, int) from public;
revoke all on function increment_ai_usage(uuid, timestamptz, text) from public;
revoke all on function increment_org_groq_usage(date) from public;

grant execute on function claim_ai_request(uuid, timestamptz, text, int) to authenticated;
grant execute on function increment_ai_usage(uuid, timestamptz, text) to authenticated;
grant execute on function increment_org_groq_usage(date) to service_role;
