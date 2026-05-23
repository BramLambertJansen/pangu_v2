-- Encounters table: campaign-scoped encounter/combat tracking
create table if not exists public.encounters (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  session_id  uuid references public.sessions(id) on delete set null,
  name        text not null default 'Nieuw gevecht',
  subtitle    text,
  description text,
  notes       text,
  status      text not null default 'draft'
                check (status in ('draft', 'ready', 'active', 'completed', 'archived')),
  environment text,
  difficulty  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- RLS
alter table public.encounters enable row level security;

create policy "Users can manage their own encounters"
  on public.encounters
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for campaign-scoped queries
create index if not exists encounters_campaign_id_created_at_idx
  on public.encounters(campaign_id, created_at desc);

-- Auto-update trigger
create or replace function update_encounters_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger encounters_updated_at
  before update on public.encounters
  for each row execute function update_encounters_updated_at();

-- Encounter monsters junction table
create table if not exists public.encounter_monsters (
  id           uuid primary key default gen_random_uuid(),
  encounter_id uuid not null references public.encounters(id) on delete cascade,
  bestiary_id  uuid not null references public.bestiaries(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  count        int not null default 1 check (count >= 1),
  created_at   timestamptz not null default now()
);

-- RLS
alter table public.encounter_monsters enable row level security;

create policy "Users can manage their own encounter monsters"
  on public.encounter_monsters
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for encounter-scoped queries
create index if not exists encounter_monsters_encounter_id_idx
  on public.encounter_monsters(encounter_id);
