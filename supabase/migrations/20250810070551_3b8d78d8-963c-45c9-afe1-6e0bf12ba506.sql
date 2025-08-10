-- Secure "profiles" access without recursive policies and fix login loop
-- 1) Create roles enum if missing
DO $$
BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','accountant','employee');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END$$;

-- 2) Create user_roles table (single source of truth for policies)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles and lock it down (no broad public access)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies on user_roles to avoid conflicts
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='user_roles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', pol.policyname);
  END LOOP;
END$$;

-- 3) Security definer function to check current user's role (bypasses RLS safely)
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = _role
  );
$$;

-- Optional minimal RLS on user_roles (not used by app directly)
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role('admin'));

-- 4) Backfill roles from existing profiles so policies work immediately
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, p.role::public.app_role
FROM public.profiles p
WHERE p.role IN ('admin','accountant','employee')
ON CONFLICT (user_id, role) DO NOTHING;

-- 5) Trigger to keep user_roles in sync when profiles.role changes
CREATE OR REPLACE FUNCTION public.sync_user_role_from_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Clear previous roles for this user
  DELETE FROM public.user_roles WHERE user_id = NEW.user_id;
  -- Set the new role if present
  IF NEW.role IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, NEW.role::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_sync_role_aiud ON public.profiles;
CREATE TRIGGER profiles_sync_role_aiud
AFTER INSERT OR UPDATE OF role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_role_from_profile();

-- 6) Rebuild RLS on profiles without recursion
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies to stop the recursive error
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END$$;

-- Allow users to read their own profile; admins/accountants can read all
CREATE POLICY "Profiles: own or elevated can select"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR public.has_role('admin') OR public.has_role('accountant')
);

-- Allow users to update their own profile
CREATE POLICY "Profiles: own can update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins/accountants can update any profile
CREATE POLICY "Profiles: elevated can update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role('admin') OR public.has_role('accountant'))
WITH CHECK (true);

-- Only admins can insert/delete profiles
CREATE POLICY "Profiles: admin can insert"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role('admin'));

CREATE POLICY "Profiles: admin can delete"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.has_role('admin'));
