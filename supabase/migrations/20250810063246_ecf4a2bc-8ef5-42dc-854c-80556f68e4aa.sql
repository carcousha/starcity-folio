-- Secure profiles table: enable RLS and add strict policies
-- 1) Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2) Remove any existing permissive policies to prevent public access
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END$$;

-- 3) Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (user_id = auth.uid());

-- 4) Admins and accountants can view all profiles
CREATE POLICY "Admins and accountants can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role IN ('admin','accountant')
      AND p.is_active = true
  )
);

-- 5) Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 6) Admins and accountants can update any profile
CREATE POLICY "Admins and accountants can update profiles"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role IN ('admin','accountant')
      AND p.is_active = true
  )
)
WITH CHECK (true);

-- 7) Only admins can insert profiles (e.g., when seeding or admin-created users)
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role = 'admin'
      AND p.is_active = true
  )
);
