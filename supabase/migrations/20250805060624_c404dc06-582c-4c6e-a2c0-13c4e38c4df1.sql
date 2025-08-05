-- إنشاء policies للـ profiles أولاً
DROP POLICY IF EXISTS "Everyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or admins can update any" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can create profile" ON public.profiles;

CREATE POLICY "Everyone can view profiles"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile or admins can update any"
ON public.profiles FOR UPDATE
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Anyone can create profile"
ON public.profiles FOR INSERT
WITH CHECK (user_id = auth.uid());

-- إضافة policies للجداول التي تفتقر إليها
-- Activity Logs
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "System can insert activity logs" ON public.activity_logs;

CREATE POLICY "Admins can view all activity logs"
ON public.activity_logs FOR SELECT
USING (public.is_admin());

CREATE POLICY "System can insert activity logs"
ON public.activity_logs FOR INSERT
WITH CHECK (true);

-- Debt Installments
DROP POLICY IF EXISTS "Accountants can manage debt installments" ON public.debt_installments;

CREATE POLICY "Accountants can manage debt installments"
ON public.debt_installments FOR ALL
USING (public.is_accountant());

-- تحديث policies المصروفات
DROP POLICY IF EXISTS "expenses_select" ON public.expenses;
DROP POLICY IF EXISTS "expenses_insert" ON public.expenses;
DROP POLICY IF EXISTS "expenses_update" ON public.expenses;
DROP POLICY IF EXISTS "expenses_delete" ON public.expenses;
DROP POLICY IF EXISTS "Accountants can manage expenses" ON public.expenses;

CREATE POLICY "Accountants can manage expenses"
ON public.expenses FOR ALL
USING (public.is_accountant());

-- تحديث policies الإيرادات
DROP POLICY IF EXISTS "revenues_select" ON public.revenues;
DROP POLICY IF EXISTS "revenues_insert" ON public.revenues;
DROP POLICY IF EXISTS "revenues_update" ON public.revenues;
DROP POLICY IF EXISTS "revenues_delete" ON public.revenues;
DROP POLICY IF EXISTS "Accountants can manage revenues" ON public.revenues;

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