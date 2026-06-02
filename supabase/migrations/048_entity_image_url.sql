-- Add image_url to bestiaries and items for custom monster/item artwork
ALTER TABLE bestiaries ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS image_url text;

-- Create the entity-images storage bucket (public read, authenticated write)
INSERT INTO storage.buckets (id, name, public)
VALUES ('entity-images', 'entity-images', true)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users may upload/replace their own entity images
CREATE POLICY "entity_images_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'entity-images');

-- Anyone may read entity images (bucket is public)
CREATE POLICY "entity_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'entity-images');

-- Owners may update their own objects (path contains their user-id at segment 2)
CREATE POLICY "entity_images_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'entity-images' AND auth.uid()::text = (storage.foldername(name))[2]);

-- Owners may delete their own objects
CREATE POLICY "entity_images_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'entity-images' AND auth.uid()::text = (storage.foldername(name))[2]);
