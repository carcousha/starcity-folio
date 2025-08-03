-- تبسيط وتوحيد سياسات Row Level Security

-- 1. إنشاء Functions موحدة للتحقق من الأدوار
CREATE OR REPLACE FUNCTION public.is_employee()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'employee'::app_role 
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
    AND role = 'accountant'::app_role 
    AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = ANY(ARRAY['admin'::app_role, 'accountant'::app_role]) 
    AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_financials()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = ANY(ARRAY['admin'::app_role, 'accountant'::app_role]) 
    AND is_active = true
  );
$$;

-- 2. حذف جميع السياسات المكررة والمعقدة

-- حذف سياسات المصروفات
DROP POLICY IF EXISTS "المديرين والمحاسبين يمكنهم إضافة" ON public.expenses;
DROP POLICY IF EXISTS "المديرين والمحاسبين يمكنهم تحديث" ON public.expenses;
DROP POLICY IF EXISTS "المديرين والمحاسبين يمكنهم حذف ال" ON public.expenses;
DROP POLICY IF EXISTS "المديرين والمحاسبين يمكنهم رؤية ج" ON public.expenses;
DROP POLICY IF EXISTS "Accountant can view own expenses" ON public.expenses;

-- حذف سياسات الإيرادات
DROP POLICY IF EXISTS "المديرين والمحاسبين يمكنهم إضافة" ON public.revenues;
DROP POLICY IF EXISTS "المديرين والمحاسبين يمكنهم تحديث" ON public.revenues;
DROP POLICY IF EXISTS "المديرين والمحاسبين يمكنهم حذف ال" ON public.revenues;
DROP POLICY IF EXISTS "المديرين والمحاسبين يمكنهم رؤية ج" ON public.revenues;

-- حذف سياسات العمولات
DROP POLICY IF EXISTS "المديرين والمحاسبين يمكنهم إضافة" ON public.commissions;
DROP POLICY IF EXISTS "المديرين والمحاسبين يمكنهم تحديث" ON public.commissions;
DROP POLICY IF EXISTS "المديرين والمحاسبين يمكنهم حذف ال" ON public.commissions;
DROP POLICY IF EXISTS "المديرين والمحاسبين يمكنهم رؤية ج" ON public.commissions;

-- حذف سياسات الديون
DROP POLICY IF EXISTS "المديرين والمحاسبين يمكنهم إضافة" ON public.debts;
DROP POLICY IF EXISTS "المديرين والمحاسبين يمكنهم تحديث" ON public.debts;
DROP POLICY IF EXISTS "المديرين والمحاسبين يمكنهم حذف ال" ON public.debts;
DROP POLICY IF EXISTS "المديرين والمحاسبين يمكنهم رؤية ج" ON public.debts;

-- حذف سياسات مرفقات المصروفات
DROP POLICY IF EXISTS "المديرين والمحاسبين يمكنهم إضافة" ON public.expense_attachments;
DROP POLICY IF EXISTS "المديرين والمحاسبين يمكنهم تحديث" ON public.expense_attachments;
DROP POLICY IF EXISTS "المديرين والمحاسبين يمكنهم حذف مر" ON public.expense_attachments;
DROP POLICY IF EXISTS "المديرين والمحاسبين يمكنهم رؤية ج" ON public.expense_attachments;

-- 3. إنشاء سياسات موحدة وبسيطة

-- ====== سياسات المصروفات ======
CREATE POLICY "expenses_select" ON public.expenses FOR SELECT
USING (
  public.is_admin() OR 
  public.can_manage_financials()
);

CREATE POLICY "expenses_insert" ON public.expenses FOR INSERT
WITH CHECK (public.can_manage_financials());

CREATE POLICY "expenses_update" ON public.expenses FOR UPDATE
USING (public.can_manage_financials())
WITH CHECK (public.can_manage_financials());

CREATE POLICY "expenses_delete" ON public.expenses FOR DELETE
USING (public.can_manage_financials());

-- ====== سياسات الإيرادات ======
CREATE POLICY "revenues_select" ON public.revenues FOR SELECT
USING (
  public.is_admin() OR 
  public.can_manage_financials()
);

CREATE POLICY "revenues_insert" ON public.revenues FOR INSERT
WITH CHECK (public.can_manage_financials());

CREATE POLICY "revenues_update" ON public.revenues FOR UPDATE
USING (public.can_manage_financials())
WITH CHECK (public.can_manage_financials());

CREATE POLICY "revenues_delete" ON public.revenues FOR DELETE
USING (public.can_manage_financials());

-- ====== سياسات العمولات ======
CREATE POLICY "commissions_select" ON public.commissions FOR SELECT
USING (
  public.is_admin() OR 
  public.can_manage_financials() OR 
  (public.is_employee() AND employee_id = auth.uid())
);

CREATE POLICY "commissions_insert" ON public.commissions FOR INSERT
WITH CHECK (public.can_manage_financials());

CREATE POLICY "commissions_update" ON public.commissions FOR UPDATE
USING (public.can_manage_financials())
WITH CHECK (public.can_manage_financials());

CREATE POLICY "commissions_delete" ON public.commissions FOR DELETE
USING (public.can_manage_financials());

-- ====== سياسات الديون ======
CREATE POLICY "debts_select" ON public.debts FOR SELECT
USING (
  public.is_admin() OR 
  public.can_manage_financials() OR 
  (public.is_employee() AND debtor_id = auth.uid())
);

CREATE POLICY "debts_insert" ON public.debts FOR INSERT
WITH CHECK (public.can_manage_financials());

CREATE POLICY "debts_update" ON public.debts FOR UPDATE
USING (public.can_manage_financials())
WITH CHECK (public.can_manage_financials());

CREATE POLICY "debts_delete" ON public.debts FOR DELETE
USING (public.can_manage_financials());

-- ====== سياسات مرفقات المصروفات ======
CREATE POLICY "expense_attachments_select" ON public.expense_attachments FOR SELECT
USING (
  public.is_admin() OR 
  public.can_manage_financials()
);

CREATE POLICY "expense_attachments_insert" ON public.expense_attachments FOR INSERT
WITH CHECK (public.can_manage_financials());

CREATE POLICY "expense_attachments_update" ON public.expense_attachments FOR UPDATE
USING (public.can_manage_financials())
WITH CHECK (public.can_manage_financials());

CREATE POLICY "expense_attachments_delete" ON public.expense_attachments FOR DELETE
USING (public.can_manage_financials());

-- ====== تبسيط سياسات العملاء ======
DROP POLICY IF EXISTS "Everyone can create clients" ON public.clients;
DROP POLICY IF EXISTS "Everyone can view own clients" ON public.clients;
DROP POLICY IF EXISTS "Everyone can update accessible clients" ON public.clients;
DROP POLICY IF EXISTS "Admin can delete any client" ON public.clients;

CREATE POLICY "clients_select" ON public.clients FOR SELECT
USING (
  public.is_admin() OR 
  (public.is_employee() AND (assigned_to = auth.uid() OR created_by = auth.uid()))
);

CREATE POLICY "clients_insert" ON public.clients FOR INSERT
WITH CHECK (
  public.is_admin() OR 
  public.is_employee()
);

CREATE POLICY "clients_update" ON public.clients FOR UPDATE
USING (
  public.is_admin() OR 
  (public.is_employee() AND (assigned_to = auth.uid() OR created_by = auth.uid()))
)
WITH CHECK (
  public.is_admin() OR 
  (public.is_employee() AND (assigned_to = auth.uid() OR created_by = auth.uid()))
);

CREATE POLICY "clients_delete" ON public.clients FOR DELETE
USING (public.is_admin());

-- ====== تبسيط سياسات الليدات ======
DROP POLICY IF EXISTS "Everyone can create leads" ON public.leads;
DROP POLICY IF EXISTS "Everyone can view own leads" ON public.leads;
DROP POLICY IF EXISTS "Everyone can update accessible leads" ON public.leads;
DROP POLICY IF EXISTS "Admin can delete any lead" ON public.leads;

CREATE POLICY "leads_select" ON public.leads FOR SELECT
USING (
  public.is_admin() OR 
  (public.is_employee() AND (assigned_to = auth.uid() OR created_by = auth.uid()))
);

CREATE POLICY "leads_insert" ON public.leads FOR INSERT
WITH CHECK (
  public.is_admin() OR 
  public.is_employee()
);

CREATE POLICY "leads_update" ON public.leads FOR UPDATE
USING (
  public.is_admin() OR 
  (public.is_employee() AND (assigned_to = auth.uid() OR created_by = auth.uid()))
)
WITH CHECK (
  public.is_admin() OR 
  (public.is_employee() AND (assigned_to = auth.uid() OR created_by = auth.uid()))
);

CREATE POLICY "leads_delete" ON public.leads FOR DELETE
USING (public.is_admin());

-- ====== تبسيط سياسات الصفقات ======
DROP POLICY IF EXISTS "Employee can manage own deals" ON public.deals;

CREATE POLICY "deals_select" ON public.deals FOR SELECT
USING (
  public.is_admin() OR 
  (public.is_employee() AND handled_by = auth.uid())
);

CREATE POLICY "deals_insert" ON public.deals FOR INSERT
WITH CHECK (
  public.is_admin() OR 
  (public.is_employee() AND handled_by = auth.uid())
);

CREATE POLICY "deals_update" ON public.deals FOR UPDATE
USING (
  public.is_admin() OR 
  (public.is_employee() AND handled_by = auth.uid())
)
WITH CHECK (
  public.is_admin() OR 
  (public.is_employee() AND handled_by = auth.uid())
);

CREATE POLICY "deals_delete" ON public.deals FOR DELETE
USING (public.is_admin());

-- ====== تنظيف السياسات المتضاربة ======
DROP POLICY IF EXISTS "select_own_commissions" ON public.commissions;
DROP POLICY IF EXISTS "Employee can view own commissions" ON public.commissions;

-- إضافة تعليق للتوضيح
COMMENT ON FUNCTION public.is_employee() IS 'التحقق من أن المستخدم موظف نشط';
COMMENT ON FUNCTION public.is_accountant() IS 'التحقق من أن المستخدم محاسب نشط';
COMMENT ON FUNCTION public.is_manager() IS 'التحقق من أن المستخدم مدير أو محاسب';
COMMENT ON FUNCTION public.can_manage_financials() IS 'التحقق من صلاحية إدارة البيانات المالية';