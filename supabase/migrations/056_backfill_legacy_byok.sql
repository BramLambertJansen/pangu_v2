-- profiles.openai_api_key / anthropic_api_key (023_profile_ai_keys.sql) were
-- superseded by user_ai_settings.byok_keys (024_ai_usage.sql), but nothing ever
-- backfilled existing values — any BYOK key a user set before 024 was silently
-- ignored by ai-chat's routing (which only reads user_ai_settings). Backfill
-- into byok_keys, then drop the now-unused legacy columns.

insert into user_ai_settings (user_id, byok_keys)
select id,
  jsonb_strip_nulls(jsonb_build_object('openai', openai_api_key, 'anthropic', anthropic_api_key))
from profiles
where openai_api_key is not null or anthropic_api_key is not null
on conflict (user_id) do update
  set byok_keys = user_ai_settings.byok_keys || excluded.byok_keys;

alter table profiles drop column if exists openai_api_key;
alter table profiles drop column if exists anthropic_api_key;
