ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pronouns text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;

-- Drop the insecure permissive UPDATE policy if it was previously applied.
-- The self_update_name policy in 001_profiles.sql already handles user profile
-- updates with proper WITH CHECK constraints (role, email, created_at immutable).
-- A second permissive UPDATE policy without WITH CHECK would be OR'd with the
-- first, effectively bypassing the column restrictions and allowing role escalation.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    DROP POLICY "Users can update own profile" ON profiles;
  END IF;
END
$$;
