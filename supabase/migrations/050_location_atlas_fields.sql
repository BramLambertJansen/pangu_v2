-- Atlas fields on locations: map coordinates + geographic metadata
ALTER TABLE locations
  ADD COLUMN map_x float4 DEFAULT NULL,
  ADD COLUMN map_y float4 DEFAULT NULL,
  ADD COLUMN region text DEFAULT NULL,
  ADD COLUMN climate text DEFAULT NULL;
