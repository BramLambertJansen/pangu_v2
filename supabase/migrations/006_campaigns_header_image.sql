ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS header_image          text,
  ADD COLUMN IF NOT EXISTS header_image_position text NOT NULL DEFAULT 'center';
