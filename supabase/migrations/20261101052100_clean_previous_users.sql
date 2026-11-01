-- Migration: Clean up previous test users and add profile update policy

-- 1. Clean up test user activity logs and game solves
DELETE FROM public.activity_logs 
WHERE user_id NOT IN (SELECT id FROM public.admins);

DELETE FROM public.game_solves 
WHERE user_id NOT IN (SELECT id FROM public.admins);

DELETE FROM public.profiles 
WHERE id NOT IN (SELECT id FROM public.admins);

-- Delete non-admin users from auth.users
DELETE FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.admins);

-- 2. Allow authenticated users to update and insert their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'players update own profile'
  ) THEN
    CREATE POLICY "players update own profile"
      ON public.profiles FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'players insert own profile'
  ) THEN
    CREATE POLICY "players insert own profile"
      ON public.profiles FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;
