-- Atomic rate-limit claim for AI requests.
--
-- Replaces the non-atomic read → check → increment pattern that allowed
-- concurrent requests to bypass the per-user window limit. PostgreSQL's
-- conditional UPDATE is atomic: the WHERE clause and the increment happen
-- in one statement with implicit row-level locking.
--
-- Returns true  → slot claimed; caller may proceed to call the AI provider.
-- Returns false → limit already reached; caller should return 429.
--
-- Provider-specific counter (groq_count / gemini_count) is incremented while
-- the total (groq_count + gemini_count) is checked against p_max_total.

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
