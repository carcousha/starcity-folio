-- تطبيق نظام الصلاحيات الجديد حسب المتطلبات المحددة

-- إزالة جميع السياسات الحالية وإعادة إنشائها حسب النظام الجديد

-- 1. سياسات العملاء (Clients) - الموظف يرى عملاءه فقط
DROP POLICY IF EXISTS "admin_full_access_clients" ON public.clients;
DROP POLICY IF EXISTS "delete_own_clients" ON public.clients;
DROP POLICY IF EXISTS "insert_clients" ON public.clients;
DROP POLICY IF EXISTS "select_own_clients" ON public.clients;
DROP POLICY IF EXISTS "update_own_clients" ON public.clients;

CREATE POLICY "Employee can manage own clients"
ON public.clients FOR ALL
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admin can manage all clients"
ON public.clients FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 2. سياسات العقارات (Properties) - الموظف يرى عقاراته فقط
DROP POLICY IF EXISTS "admin_full_access_properties" ON public.properties;

CREATE POLICY "Employee can manage own properties"
ON public.properties FOR ALL
USING (listed_by = auth.uid())
WITH CHECK (listed_by = auth.uid());

CREATE POLICY "Admin can manage all properties"
ON public.properties FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 3. سياسات الصفقات (Deals) - الموظف يرى صفقاته فقط
DROP POLICY IF EXISTS "insert_deals" ON public.deals;
DROP POLICY IF EXISTS "select_own_deals" ON public.deals;
DROP POLICY IF EXISTS "update_own_deals" ON public.deals;

CREATE POLICY "Employee can manage own deals"
ON public.deals FOR ALL
USING (handled_by = auth.uid())
WITH CHECK (handled_by = auth.uid());

CREATE POLICY "Admin can manage all deals"
ON public.deals FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. سياسات الإيرادات (Revenues) - المحاسب والمدير فقط
DROP POLICY IF EXISTS "Admin and accountant can select revenues" ON public.revenues;
DROP POLICY IF EXISTS "Admin and accountant can insert revenues" ON public.revenues;
DROP POLICY IF EXISTS "Admin and accountant can update revenues" ON public.revenues;
DROP POLICY IF EXISTS "Admin and accountant can delete revenues" ON public.revenues;

CREATE POLICY "Accountant and admin can manage revenues"
ON public.revenues FOR ALL
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

-- 5. سياسات المصروفات (Expenses) - المحاسب والمدير فقط (الموظف لا يراها نهائياً)
DROP POLICY IF EXISTS "Admin and accountant can select all expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can select own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admin and accountant can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admin and accountant can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admin and accountant can delete expenses" ON public.expenses;

CREATE POLICY "Accountant and admin can manage all expenses"
ON public.expenses FOR ALL
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

-- 6. سياسات العمولات - الموظف يرى عمولاته فقط، المحاسب والمدير يرون الكل
DROP POLICY IF EXISTS "Admin and accountant can select all commissions" ON public.commissions;
DROP POLICY IF EXISTS "Employees can select own commissions" ON public.commissions;
DROP POLICY IF EXISTS "Admin and accountant can insert commissions" ON public.commissions;
DROP POLICY IF EXISTS "Admin and accountant can update commissions" ON public.commissions;
DROP POLICY IF EXISTS "Admin and accountant can delete commissions" ON public.commissions;

CREATE POLICY "Employee can view own commissions"
ON public.commissions FOR SELECT
USING (employee_id = auth.uid());

CREATE POLICY "Accountant and admin can manage all commissions"
ON public.commissions FOR ALL
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

-- 7. سياسات تفاصيل العمولات للموظفين
DROP POLICY IF EXISTS "Admin and accountant can select commission employees" ON public.commission_employees;
DROP POLICY IF EXISTS "Employees can select own commission details" ON public.commission_employees;
DROP POLICY IF EXISTS "Admin and accountant can insert commission employees" ON public.commission_employees;
DROP POLICY IF EXISTS "Admin and accountant can update commission employees" ON public.commission_employees;
DROP POLICY IF EXISTS "Admin and accountant can delete commission employees" ON public.commission_employees;

CREATE POLICY "Employee can view own commission details"
ON public.commission_employees FOR SELECT
USING (employee_id = auth.uid());

CREATE POLICY "Accountant and admin can manage commission employees"
ON public.commission_employees FOR ALL
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

-- 8. سياسات عمولات الصفقات
DROP POLICY IF EXISTS "Admin and accountant can select all deal commissions" ON public.deal_commissions;
DROP POLICY IF EXISTS "Employees can select own deal commissions" ON public.deal_commissions;
DROP POLICY IF EXISTS "Admin and accountant can insert deal commissions" ON public.deal_commissions;
DROP POLICY IF EXISTS "Admin and accountant can update deal commissions" ON public.deal_commissions;
DROP POLICY IF EXISTS "Admin and accountant can delete deal commissions" ON public.deal_commissions;

CREATE POLICY "Employee can view own deal commissions"
ON public.deal_commissions FOR SELECT
USING (handled_by = auth.uid());

CREATE POLICY "Accountant and admin can manage deal commissions"
ON public.deal_commissions FOR ALL
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

-- 9. سياسات الديون - المحاسب والمدير فقط (الموظف يرى ديونه الشخصية فقط)
DROP POLICY IF EXISTS "Admin and accountant can select all debts" ON public.debts;
DROP POLICY IF EXISTS "Employees can select own debts" ON public.debts;
DROP POLICY IF EXISTS "Admin and accountant can insert debts" ON public.debts;
DROP POLICY IF EXISTS "Admin and accountant can update debts" ON public.debts;
DROP POLICY IF EXISTS "Admin and accountant can delete debts" ON public.debts;

CREATE POLICY "Employee can view own debts only"
ON public.debts FOR SELECT
USING (debtor_id = auth.uid());

CREATE POLICY "Accountant and admin can manage all debts"
ON public.debts FOR ALL
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

-- 10. سياسات سجل الأنشطة - المحاسب والمدير فقط
DROP POLICY IF EXISTS "Admin and accountant can view activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Admin and accountant can insert activity logs" ON public.activity_logs;

CREATE POLICY "Accountant and admin can manage activity logs"
ON public.activity_logs FOR ALL
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

-- 11. سياسات الميزانية - المحاسب والمدير فقط
DROP POLICY IF EXISTS "Admin and accountant can select budget limits" ON public.budget_limits;
DROP POLICY IF EXISTS "Admin and accountant can insert budget limits" ON public.budget_limits;
DROP POLICY IF EXISTS "Admin and accountant can update budget limits" ON public.budget_limits;
DROP POLICY IF EXISTS "Admin and accountant can delete budget limits" ON public.budget_limits;

CREATE POLICY "Accountant and admin can manage budget limits"
ON public.budget_limits FOR ALL
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

-- 12. سياسات أهداف الموظفين - الموظف يرى أهدافه فقط
DROP POLICY IF EXISTS "Admin can select employee targets" ON public.employee_targets;
DROP POLICY IF EXISTS "Employees can select own targets" ON public.employee_targets;
DROP POLICY IF EXISTS "Admin can insert employee targets" ON public.employee_targets;
DROP POLICY IF EXISTS "Admin can update employee targets" ON public.employee_targets;
DROP POLICY IF EXISTS "Admin can delete employee targets" ON public.employee_targets;

CREATE POLICY "Employee can view own targets"
ON public.employee_targets FOR SELECT
USING (employee_id = auth.uid());

CREATE POLICY "Admin can manage employee targets"
ON public.employee_targets FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 13. سياسات التحفيزات المطبقة - الموظف يرى تحفيزاته فقط
DROP POLICY IF EXISTS "Admin can select applied incentives" ON public.applied_incentives;
DROP POLICY IF EXISTS "Employees can select own incentives" ON public.applied_incentives;
DROP POLICY IF EXISTS "Admin can insert applied incentives" ON public.applied_incentives;
DROP POLICY IF EXISTS "Admin can update applied incentives" ON public.applied_incentives;
DROP POLICY IF EXISTS "Admin can delete applied incentives" ON public.applied_incentives;

CREATE POLICY "Employee can view own incentives"
ON public.applied_incentives FOR SELECT
USING (employee_id = auth.uid());

CREATE POLICY "Admin can manage applied incentives"
ON public.applied_incentives FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 14. سياسات الإشعارات - كل موظف يرى إشعاراته فقط
DROP POLICY IF EXISTS "Users can select own notification logs" ON public.notification_logs;
DROP POLICY IF EXISTS "Admin can insert notification logs" ON public.notification_logs;
DROP POLICY IF EXISTS "Admin can update notification logs" ON public.notification_logs;
DROP POLICY IF EXISTS "Admin can delete notification logs" ON public.notification_logs;

CREATE POLICY "Employee can view own notifications"
ON public.notification_logs FOR SELECT
USING (employee_id = auth.uid());

CREATE POLICY "Admin can manage all notifications"
ON public.notification_logs FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 15. سياسات تفضيلات الإشعارات
DROP POLICY IF EXISTS "Users can select own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can delete own notification preferences" ON public.notification_preferences;

CREATE POLICY "Employee can manage own notification preferences"
ON public.notification_preferences FOR ALL
USING (employee_id = auth.uid())
WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Admin can manage all notification preferences"
ON public.notification_preferences FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());