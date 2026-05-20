ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pronouns text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;

-- Allow users to update their own profile row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON profiles FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END
$$;
