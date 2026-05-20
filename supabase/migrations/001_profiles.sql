-- Profiles table: one row per auth user, stores display name and role
CREATE TABLE public.profiles (
  id           uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text        NOT NULL,
  display_name text,
  role         text        NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Restrict UPDATE to display_name only for regular authenticated users
-- (service_role bypasses this and is used by the admin API)
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name) ON public.profiles TO authenticated;

-- Users may read their own profile
CREATE POLICY "self_read"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users may update only their own display_name (column-level grant above
-- already prevents touching role/email/created_at)
CREATE POLICY "self_update_name"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user is created.
-- Role is always 'user'; elevation only happens through the admin API.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'user'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill profile rows for any auth users that exist before this migration ran
INSERT INTO public.profiles (id, email, display_name, role)
SELECT
  id,
  COALESCE(email, ''),
  COALESCE(raw_user_meta_data->>'display_name', split_part(COALESCE(email, ''), '@', 1)),
  'user'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
