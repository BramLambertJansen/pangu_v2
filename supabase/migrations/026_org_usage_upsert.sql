-- Fix increment_org_groq_usage: use UPSERT instead of bare UPDATE.
--
-- The original UPDATE silently succeeds with 0 rows if the date row doesn't
-- exist yet (e.g. race where two edge functions call this before getOrgUsage
-- creates the row, or on future code paths that skip the read-then-write).
-- An INSERT ... ON CONFLICT DO UPDATE ensures the row is always created and
-- the counter is always incremented.

create or replace function increment_org_groq_usage(p_date date)
returns void
language plpgsql
security definer
as $$
begin
  insert into ai_org_usage (date, groq_total)
  values (p_date, 1)
  on conflict (date) do update
    set groq_total = ai_org_usage.groq_total + 1;
end;
$$;
