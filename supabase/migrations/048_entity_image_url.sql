-- Add image_url to bestiaries and items for custom monster/item artwork
ALTER TABLE bestiaries ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS image_url text;
