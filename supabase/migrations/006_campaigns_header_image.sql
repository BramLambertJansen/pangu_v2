ALTER TABLE public.campaigns
  ADD COLUMN header_image          text,
  ADD COLUMN header_image_position text NOT NULL DEFAULT 'center';
