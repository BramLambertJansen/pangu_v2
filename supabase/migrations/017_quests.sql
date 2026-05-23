-- Quests table: campaign-scoped quest tracking
create table if not exists public.quests (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null default 'Nieuwe quest',
  subtitle    text,
  description text,
  notes       text,
  status      text not null default 'draft'
                check (status in ('draft', 'active', 'completed', 'failed', 'archived')),
  quest_type  text,
  difficulty  text,
  reward      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- RLS
alter table public.quests enable row level security;

create policy "Users can manage their own quests"
  on public.quests
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for campaign-scoped queries
create index if not exists quests_campaign_id_created_at_idx
  on public.quests(campaign_id, created_at desc);

-- Auto-update trigger
create or replace function update_quests_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger quests_updated_at
  before update on public.quests
  for each row execute function update_quests_updated_at();
