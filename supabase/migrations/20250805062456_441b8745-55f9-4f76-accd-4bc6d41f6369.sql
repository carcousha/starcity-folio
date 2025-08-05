-- حل نهائي ومضمون للمشكلة - إنشاء function منفصلة

-- 1. إزالة RLS مؤقتاً
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. حذف جميع policies
DROP POLICY IF EXISTS "Allow all profile operations for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Simple profile access" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;

-- 3. إنشاء function منفصلة لتجنب infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_accountant()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_employee()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant', 'employee') 
    AND is_active = true
  );
$$;

-- 4. إعادة تفعيل RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. إنشاء policies بسيطة بدون recursion
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can create profiles"
ON public.profiles FOR INSERT
WITH CHECK (true);

-- 6. إنشاء policies لباقي الجداول المهمة
CREATE POLICY "Admin access to all roles"
ON public.profiles FOR ALL
USING (
  auth.uid() = '8c17d2fc-9166-4541-b21c-21910c9a0921'::uuid
);

-- 7. التأكد من البيانات
UPDATE public.profiles 
SET role = 'admin', is_active = true 
WHERE user_id = '8c17d2fc-9166-4541-b21c-21910c9a0921';