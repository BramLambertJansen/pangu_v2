ALTER TABLE public.worlds    ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS notes text;
