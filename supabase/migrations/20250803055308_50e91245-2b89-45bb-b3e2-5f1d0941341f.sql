-- قفل الجداول المالية ومنع الوصول المباشر للموظفين

-- 1. قفل جدول الخزينة والحسابات البنكية
-- إضافة سياسات صارمة لجدول treasury_accounts
CREATE POLICY "treasury_accounts_admin_only_select" ON public.treasury_accounts FOR SELECT
USING (public.is_admin());

CREATE POLICY "treasury_accounts_admin_only_insert" ON public.treasury_accounts FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "treasury_accounts_admin_only_update" ON public.treasury_accounts FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "treasury_accounts_admin_only_delete" ON public.treasury_accounts FOR DELETE
USING (public.is_admin());

-- 2. قفل جدول معاملات الخزينة
-- إضافة سياسات صارمة لجدول treasury_transactions
CREATE POLICY "treasury_transactions_admin_only_select" ON public.treasury_transactions FOR SELECT
USING (public.is_admin());

CREATE POLICY "treasury_transactions_admin_only_insert" ON public.treasury_transactions FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "treasury_transactions_admin_only_update" ON public.treasury_transactions FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "treasury_transactions_admin_only_delete" ON public.treasury_transactions FOR DELETE
USING (public.is_admin());

-- 3. تشديد قفل المصروفات - إزالة الوصول للموظفين
DROP POLICY IF EXISTS "expenses_select" ON public.expenses;

CREATE POLICY "expenses_managers_only_select" ON public.expenses FOR SELECT
USING (public.can_manage_financials());

-- 4. قفل جدول حدود الميزانية
CREATE POLICY "budget_limits_admin_only_select" ON public.budget_limits FOR SELECT
USING (public.is_admin());

CREATE POLICY "budget_limits_admin_only_insert" ON public.budget_limits FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "budget_limits_admin_only_update" ON public.budget_limits FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "budget_limits_admin_only_delete" ON public.budget_limits FOR DELETE
USING (public.is_admin());

-- 5. تشديد قفل الإيرادات - إزالة الوصول للموظفين
DROP POLICY IF EXISTS "revenues_select" ON public.revenues;

CREATE POLICY "revenues_managers_only_select" ON public.revenues FOR SELECT
USING (public.can_manage_financials());

-- 6. إضافة سياسات للجداول المالية الأخرى

-- قفل جدول سجل النشاطات المالية
CREATE POLICY "activity_logs_managers_only_select" ON public.activity_logs FOR SELECT
USING (
  public.can_manage_financials() OR 
  (public.is_employee() AND user_id = auth.uid())
);

CREATE POLICY "activity_logs_system_insert" ON public.activity_logs FOR INSERT
WITH CHECK (true); -- النظام يمكنه إدراج السجلات

-- 7. قفل جداول محاسبة العمولات للموظفين
-- الموظف يرى عمولاته فقط من خلال views معينة
DROP POLICY IF EXISTS "commissions_select" ON public.commissions;

CREATE POLICY "commissions_restricted_select" ON public.commissions FOR SELECT
USING (
  public.can_manage_financials() OR 
  (public.is_employee() AND employee_id = auth.uid())
);

-- 8. قفل جدول أقساط الديون
CREATE POLICY "debt_installments_managers_only_select" ON public.debt_installments FOR SELECT
USING (public.can_manage_financials());

CREATE POLICY "debt_installments_managers_only_insert" ON public.debt_installments FOR INSERT
WITH CHECK (public.can_manage_financials());

CREATE POLICY "debt_installments_managers_only_update" ON public.debt_installments FOR UPDATE
USING (public.can_manage_financials())
WITH CHECK (public.can_manage_financials());

CREATE POLICY "debt_installments_managers_only_delete" ON public.debt_installments FOR DELETE
USING (public.can_manage_financials());

-- 9. قفل جدول رسوم الخدمات الحكومية
CREATE POLICY "government_service_fees_managers_only_select" ON public.government_service_fees FOR SELECT
USING (public.can_manage_financials());

CREATE POLICY "government_service_fees_managers_only_insert" ON public.government_service_fees FOR INSERT
WITH CHECK (public.can_manage_financials());

CREATE POLICY "government_service_fees_managers_only_update" ON public.government_service_fees FOR UPDATE
USING (public.can_manage_financials())
WITH CHECK (public.can_manage_financials());

CREATE POLICY "government_service_fees_managers_only_delete" ON public.government_service_fees FOR DELETE
USING (public.can_manage_financials());

-- 10. قفل جدول قواعد التحفيز
CREATE POLICY "incentive_rules_admin_only_select" ON public.incentive_rules FOR SELECT
USING (public.is_admin());

CREATE POLICY "incentive_rules_admin_only_insert" ON public.incentive_rules FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "incentive_rules_admin_only_update" ON public.incentive_rules FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "incentive_rules_admin_only_delete" ON public.incentive_rules FOR DELETE
USING (public.is_admin());

-- 11. إنشاء View للموظفين لرؤية تقاريرهم الشخصية فقط
CREATE OR REPLACE VIEW public.employee_financial_summary AS
SELECT 
  p.user_id,
  p.first_name || ' ' || p.last_name as employee_name,
  
  -- إجمالي العمولات المستحقة
  COALESCE(SUM(ce.calculated_share), 0) as total_commissions,
  
  -- إجمالي الديون
  COALESCE((SELECT SUM(d.amount) FROM public.debts d WHERE d.debtor_id = p.user_id AND d.status = 'pending'), 0) as total_debts,
  
  -- صافي المستحقات
  COALESCE(SUM(ce.net_share), 0) as net_earnings,
  
  -- عدد الصفقات المنجزة
  COALESCE((SELECT COUNT(*) FROM public.deals WHERE handled_by = p.user_id AND status = 'closed'), 0) as completed_deals,
  
  -- آخر نشاط
  COALESCE((SELECT MAX(created_at) FROM public.activity_logs WHERE user_id = p.user_id), p.created_at) as last_activity

FROM public.profiles p
LEFT JOIN public.commission_employees ce ON ce.employee_id = p.user_id
WHERE p.role = 'employee' AND p.is_active = true
GROUP BY p.user_id, p.first_name, p.last_name, p.created_at;

-- إضافة سياسة للـ View
CREATE POLICY "employee_summary_own_only" ON public.employee_financial_summary FOR SELECT
USING (
  public.is_admin() OR 
  public.can_manage_financials() OR 
  (public.is_employee() AND user_id = auth.uid())
);

-- 12. إنشاء Function للموظفين للحصول على ملخصهم المالي فقط
CREATE OR REPLACE FUNCTION public.get_employee_financial_summary()
RETURNS TABLE (
  total_commissions NUMERIC,
  total_debts NUMERIC,
  net_earnings NUMERIC,
  completed_deals BIGINT,
  last_activity TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(SUM(ce.calculated_share), 0) as total_commissions,
    COALESCE((SELECT SUM(d.amount) FROM public.debts d WHERE d.debtor_id = auth.uid() AND d.status = 'pending'), 0) as total_debts,
    COALESCE(SUM(ce.net_share), 0) as net_earnings,
    COALESCE((SELECT COUNT(*) FROM public.deals WHERE handled_by = auth.uid() AND status = 'closed'), 0) as completed_deals,
    COALESCE((SELECT MAX(created_at) FROM public.activity_logs WHERE user_id = auth.uid()), now()) as last_activity
  FROM public.commission_employees ce
  WHERE ce.employee_id = auth.uid();
$$;

-- إضافة تعليقات للتوضيح
COMMENT ON POLICY "treasury_accounts_admin_only_select" ON public.treasury_accounts IS 'المديرين فقط يمكنهم رؤية حسابات الخزينة';
COMMENT ON POLICY "expenses_managers_only_select" ON public.expenses IS 'المديرين والمحاسبين فقط يمكنهم رؤية المصروفات';
COMMENT ON POLICY "revenues_managers_only_select" ON public.revenues IS 'المديرين والمحاسبين فقط يمكنهم رؤية الإيرادات';
COMMENT ON POLICY "budget_limits_admin_only_select" ON public.budget_limits IS 'المديرين فقط يمكنهم رؤية حدود الميزانية';
COMMENT ON FUNCTION public.get_employee_financial_summary() IS 'وظيفة للموظفين للحصول على ملخصهم المالي الشخصي فقط';
COMMENT ON VIEW public.employee_financial_summary IS 'عرض محدود للموظفين لرؤية بياناتهم المالية الشخصية فقط';