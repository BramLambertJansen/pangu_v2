-- Add BYOK (Bring Your Own Key) columns to profiles.
-- Users can supply their own OpenAI / Anthropic API keys for Lore Forge features.
-- The existing self_update_name and self_read RLS policies cover these columns.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS openai_api_key text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS anthropic_api_key text;
