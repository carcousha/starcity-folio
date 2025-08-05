-- حذف الدوال الموجودة مع CASCADE لضمان حذف جميع التبعيات
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.is_profile_owner(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_accountant() CASCADE;
DROP FUNCTION IF EXISTS public.is_employee() CASCADE;
DROP FUNCTION IF EXISTS public.can_manage_financials() CASCADE;

-- إنشاء الدوال الجديدة
CREATE OR REPLACE FUNCTION public.get_user_role(user_id_param uuid DEFAULT auth.uid())
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE user_id = user_id_param AND is_active = true
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id_param uuid DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_id_param 
    AND role = 'admin' 
    AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_accountant(user_id_param uuid DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_id_param 
    AND role IN ('admin', 'accountant')
    AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_employee(user_id_param uuid DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_id_param 
    AND role IN ('admin', 'accountant', 'employee')
    AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.can_manage_financials()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.is_accountant()
$$;