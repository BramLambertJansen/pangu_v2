-- Migrate BYOK keys from profiles.openai_api_key / profiles.anthropic_api_key
-- into user_ai_settings.byok_keys (jsonb), then drop the old columns.
--
-- The ai-chat edge function has always read from user_ai_settings.byok_keys
-- (introduced in 021_ai_usage.sql). The SettingsPage was still writing to the
-- old profile columns, so BYOK keys were silently ignored by the edge function.
-- This migration fixes the data gap and removes the dead columns.

-- Step 1: upsert into user_ai_settings for every profile that has at least one key.
-- If a row already exists, merge (existing keys win, migrated keys fill the gaps).
insert into user_ai_settings (user_id, byok_keys)
select
  p.id,
  jsonb_strip_nulls(jsonb_build_object(
    'anthropic', p.anthropic_api_key,
    'openai',    p.openai_api_key
  ))
from profiles p
where p.openai_api_key is not null
   or p.anthropic_api_key is not null
on conflict (user_id) do update
  set byok_keys = user_ai_settings.byok_keys
    || jsonb_strip_nulls(jsonb_build_object(
         'anthropic', excluded.byok_keys->>'anthropic',
         'openai',    excluded.byok_keys->>'openai'
       ));

-- Step 2: drop the now-redundant columns from profiles
alter table profiles drop column if exists openai_api_key;
alter table profiles drop column if exists anthropic_api_key;
