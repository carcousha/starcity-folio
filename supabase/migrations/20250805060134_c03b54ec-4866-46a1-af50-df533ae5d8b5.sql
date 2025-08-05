-- الحل الجذري لمشاكل الصلاحيات - المرحلة الأولى: تنظيف قاعدة البيانات

-- 1. حذف جميع الدوال المتعلقة بالصلاحيات القديمة
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.is_profile_owner(uuid) CASCADE;

-- 2. إنشاء دوال أمنية محسنة ومبسطة
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

-- 3. حذف جميع policies للـ profiles وإعادة إنشاؤها بشكل صحيح
DROP POLICY IF EXISTS "Users can view their own profile or admins can view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- إنشاء policies بسيطة للـ profiles
CREATE POLICY "Everyone can view profiles"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile or admins can update any"
ON public.profiles FOR UPDATE
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Anyone can create profile"
ON public.profiles FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 4. إضافة policies للجداول التي تفتقر إليها
-- Activity Logs
CREATE POLICY "Admins can view all activity logs"
ON public.activity_logs FOR SELECT
USING (public.is_admin());

CREATE POLICY "System can insert activity logs"
ON public.activity_logs FOR INSERT
WITH CHECK (true);

-- Debt Installments
CREATE POLICY "Accountants can manage debt installments"
ON public.debt_installments FOR ALL
USING (public.is_accountant());

-- 5. تبسيط policies الجداول الموجودة وجعلها تعتمد على الدوال الجديدة
-- تحديث policies المصروفات
DROP POLICY IF EXISTS "expenses_select" ON public.expenses;
DROP POLICY IF EXISTS "expenses_insert" ON public.expenses;
DROP POLICY IF EXISTS "expenses_update" ON public.expenses;
DROP POLICY IF EXISTS "expenses_delete" ON public.expenses;

CREATE POLICY "Accountants can manage expenses"
ON public.expenses FOR ALL
USING (public.is_accountant());

-- تحديث policies الإيرادات
DROP POLICY IF EXISTS "revenues_select" ON public.revenues;
DROP POLICY IF EXISTS "revenues_insert" ON public.revenues;
DROP POLICY IF EXISTS "revenues_update" ON public.revenues;
DROP POLICY IF EXISTS "revenues_delete" ON public.revenues;

CREATE POLICY "Accountants can manage revenues"
ON public.revenues FOR ALL
USING (public.is_accountant());

-- تحديث policies العملاء
DROP POLICY IF EXISTS "clients_select" ON public.clients;
DROP POLICY IF EXISTS "clients_insert" ON public.clients;
DROP POLICY IF EXISTS "clients_update" ON public.clients;
DROP POLICY IF EXISTS "clients_delete" ON public.clients;

CREATE POLICY "Employees can view and manage their assigned clients"
ON public.clients FOR SELECT
USING (public.is_employee() AND (assigned_to = auth.uid() OR created_by = auth.uid() OR public.is_admin()));

CREATE POLICY "Employees can create clients"
ON public.clients FOR INSERT
WITH CHECK (public.is_employee());

CREATE POLICY "Employees can update their assigned clients"
ON public.clients FOR UPDATE
USING (public.is_employee() AND (assigned_to = auth.uid() OR created_by = auth.uid() OR public.is_admin()));

CREATE POLICY "Only admins can delete clients"
ON public.clients FOR DELETE
USING (public.is_admin());

-- تحديث policies الصفقات
DROP POLICY IF EXISTS "deals_select" ON public.deals;
DROP POLICY IF EXISTS "deals_insert" ON public.deals;
DROP POLICY IF EXISTS "deals_update" ON public.deals;
DROP POLICY IF EXISTS "deals_delete" ON public.deals;

CREATE POLICY "Employees can view their deals"
ON public.deals FOR SELECT
USING (public.is_employee() AND (handled_by = auth.uid() OR public.is_admin()));

CREATE POLICY "Employees can create deals"
ON public.deals FOR INSERT
WITH CHECK (public.is_employee() AND handled_by = auth.uid());

CREATE POLICY "Employees can update their deals"
ON public.deals FOR UPDATE
USING (public.is_employee() AND (handled_by = auth.uid() OR public.is_admin()));

CREATE POLICY "Only admins can delete deals"
ON public.deals FOR DELETE
USING (public.is_admin());

-- 6. تحديث بعض الدوال لتستخدم search_path الصحيح
CREATE OR REPLACE FUNCTION public.can_manage_financials()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $$
BEGIN
  RETURN public.is_accountant();
END;
$$;