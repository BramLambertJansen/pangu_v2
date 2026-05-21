ALTER TABLE worlds
  ADD COLUMN IF NOT EXISTS header_image_position text NOT NULL DEFAULT '50% 50%';
