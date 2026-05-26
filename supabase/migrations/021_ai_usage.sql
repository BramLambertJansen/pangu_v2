-- AI usage tracking: per-user rate limiting + org-level Groq soft cap + BYOK settings.

-- Per-user usage per time window
create table if not exists ai_usage (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  groq_count   int not null default 0,
  gemini_count int not null default 0,
  created_at   timestamptz not null default now(),
  unique (user_id, window_start)
);

-- Org-level Groq counter (one row per calendar day)
create table if not exists ai_org_usage (
  id         uuid primary key default gen_random_uuid(),
  date       date not null unique default current_date,
  groq_total int not null default 0
);

-- Per-user BYOK keys (extensible jsonb map) + model preference
create table if not exists user_ai_settings (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  byok_keys          jsonb not null default '{}',  -- { "anthropic": "sk-ant-...", "openai": "sk-..." }
  preferred_provider text,                          -- "anthropic" | "openai" | null → first available
  preferred_model    text,                          -- model override (provider-specific)
  updated_at         timestamptz not null default now()
);

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table ai_usage         enable row level security;
alter table ai_org_usage     enable row level security;
alter table user_ai_settings enable row level security;

-- Users see only their own usage rows
create policy "own ai_usage" on ai_usage
  for all using (auth.uid() = user_id);

-- Org usage is blocked for clients; edge function uses service_role key
create policy "service only ai_org_usage" on ai_org_usage
  for all using (false);

-- Users manage their own BYOK settings
create policy "own user_ai_settings" on user_ai_settings
  for all using (auth.uid() = user_id);

-- ── Indexes ───────────────────────────────────────────────────────────────────

create index if not exists ai_usage_user_window_idx on ai_usage (user_id, window_start);
create index if not exists ai_org_usage_date_idx    on ai_org_usage (date);

-- ── Atomic RPC functions (security definer — bypasses RLS for internal updates) ──

create or replace function increment_ai_usage(
  p_user_id    uuid,
  p_window_start timestamptz,
  p_field      text
) returns void
language plpgsql
security definer
as $$
begin
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

create or replace function increment_org_groq_usage(p_date date)
returns void
language plpgsql
security definer
as $$
begin
  update ai_org_usage set groq_total = groq_total + 1 where date = p_date;
end;
$$;
