-- حل نهائي شامل لجميع مشاكل الصلاحيات وقاعدة البيانات

-- أولاً: إنشاء الوظائف الأساسية مع إصلاح المشاكل

-- حذف الوظائف القديمة وإعادة إنشائها
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_accountant_or_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;

-- إنشاء وظيفة للحصول على دور المستخدم الحالي
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = 'public'
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() AND is_active = true;
$$;

-- إنشاء وظيفة للتحقق من كون المستخدم مدير
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  );
$$;

-- إنشاء وظيفة للتحقق من كون المستخدم محاسب أو مدير
CREATE OR REPLACE FUNCTION public.is_accountant_or_admin()
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  );
$$;

-- إنشاء وظيفة للتحقق من صلاحية CRM للموظفين
CREATE OR REPLACE FUNCTION public.has_crm_access()
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant', 'employee') 
    AND is_active = true
  );
$$;

-- ثانياً: حذف جميع السياسات القديمة وإنشاء سياسات جديدة واضحة

-- جدول العملاء (clients)
DROP POLICY IF EXISTS "Employee can view assigned clients" ON public.clients;
DROP POLICY IF EXISTS "Employee can create clients" ON public.clients;
DROP POLICY IF EXISTS "Employee can update own clients" ON public.clients;
DROP POLICY IF EXISTS "Employee can delete own clients" ON public.clients;
DROP POLICY IF EXISTS "Admin full access clients" ON public.clients;

-- سياسات جديدة للعملاء
CREATE POLICY "Everyone can view own clients" 
ON public.clients 
FOR SELECT 
USING (
  public.is_admin() OR 
  public.is_accountant_or_admin() OR 
  assigned_to = auth.uid() OR 
  created_by = auth.uid()
);

CREATE POLICY "Everyone can create clients" 
ON public.clients 
FOR INSERT 
WITH CHECK (public.has_crm_access());

CREATE POLICY "Everyone can update accessible clients" 
ON public.clients 
FOR UPDATE 
USING (
  public.is_admin() OR 
  assigned_to = auth.uid() OR 
  created_by = auth.uid()
)
WITH CHECK (
  public.is_admin() OR 
  assigned_to = auth.uid() OR 
  created_by = auth.uid()
);

CREATE POLICY "Admin can delete any client" 
ON public.clients 
FOR DELETE 
USING (public.is_admin());

-- جدول الليدز (leads)
DROP POLICY IF EXISTS "Employee can view assigned leads" ON public.leads;
DROP POLICY IF EXISTS "Employee can create leads" ON public.leads;
DROP POLICY IF EXISTS "Employee can update assigned leads" ON public.leads;
DROP POLICY IF EXISTS "Employee can delete own leads" ON public.leads;
DROP POLICY IF EXISTS "Admin full access leads" ON public.leads;

-- سياسات جديدة للليدز
CREATE POLICY "Everyone can view own leads" 
ON public.leads 
FOR SELECT 
USING (
  public.is_admin() OR 
  public.is_accountant_or_admin() OR 
  assigned_to = auth.uid() OR 
  created_by = auth.uid()
);

CREATE POLICY "Everyone can create leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (public.has_crm_access());

CREATE POLICY "Everyone can update accessible leads" 
ON public.leads 
FOR UPDATE 
USING (
  public.is_admin() OR 
  assigned_to = auth.uid() OR 
  created_by = auth.uid()
)
WITH CHECK (
  public.is_admin() OR 
  assigned_to = auth.uid() OR 
  created_by = auth.uid()
);

CREATE POLICY "Admin can delete any lead" 
ON public.leads 
FOR DELETE 
USING (public.is_admin());

-- جدول العقارات (properties)
DROP POLICY IF EXISTS "Employee can view own properties" ON public.properties;
DROP POLICY IF EXISTS "Employee can create properties" ON public.properties;
DROP POLICY IF EXISTS "Employee can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Employee can delete own properties" ON public.properties;
DROP POLICY IF EXISTS "Admin full access properties" ON public.properties;

-- سياسات جديدة للعقارات
CREATE POLICY "Everyone can view own properties" 
ON public.properties 
FOR SELECT 
USING (
  public.is_admin() OR 
  public.is_accountant_or_admin() OR 
  listed_by = auth.uid()
);

CREATE POLICY "Everyone can create properties" 
ON public.properties 
FOR INSERT 
WITH CHECK (public.has_crm_access());

CREATE POLICY "Everyone can update own properties" 
ON public.properties 
FOR UPDATE 
USING (
  public.is_admin() OR 
  listed_by = auth.uid()
)
WITH CHECK (
  public.is_admin() OR 
  listed_by = auth.uid()
);

CREATE POLICY "Admin can delete any property" 
ON public.properties 
FOR DELETE 
USING (public.is_admin());

-- ثالثاً: إنشاء التريجرز المطلوبة للحقول التلقائية

-- تريجر تلقائي لـ created_by في العملاء
DROP TRIGGER IF EXISTS trigger_set_created_by_clients ON public.clients;
CREATE TRIGGER trigger_set_created_by_clients
  BEFORE INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

-- تريجر تلقائي لـ assigned_to في العملاء (يتم تعيين المُنشئ تلقائياً)
CREATE OR REPLACE FUNCTION public.set_assigned_to_creator()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.assigned_to IS NULL THEN
    NEW.assigned_to := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_assigned_to_clients ON public.clients;
CREATE TRIGGER trigger_set_assigned_to_clients
  BEFORE INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_assigned_to_creator();

-- تريجر تلقائي لـ created_by في الليدز
DROP TRIGGER IF EXISTS trigger_set_created_by_leads ON public.leads;
CREATE TRIGGER trigger_set_created_by_leads
  BEFORE INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

-- تريجر تلقائي لـ assigned_to في الليدز
DROP TRIGGER IF EXISTS trigger_set_assigned_to_leads ON public.leads;
CREATE TRIGGER trigger_set_assigned_to_leads
  BEFORE INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_assigned_to_creator();

-- تريجر تلقائي لـ listed_by في العقارات
DROP TRIGGER IF EXISTS trigger_set_listed_by_properties ON public.properties;
CREATE TRIGGER trigger_set_listed_by_properties
  BEFORE INSERT ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.set_listed_by();

-- رابعاً: إضافة سياسات للجداول الحسابية للمحاسبين
-- سياسة للمصروفات - المحاسب يرى مصروفاته فقط
DROP POLICY IF EXISTS "employee_select_own_expenses" ON public.expenses;
CREATE POLICY "Accountant can view own expenses" 
ON public.expenses 
FOR SELECT 
USING (
  public.is_admin() OR 
  (public.get_current_user_role() = 'accountant' AND recorded_by = auth.uid()) OR
  (public.get_current_user_role() = 'employee' AND created_by = auth.uid())
);

-- سياسة للإيرادات - المحاسب يرى إيراداته فقط
CREATE POLICY "Accountant can view accessible revenues" 
ON public.revenues 
FOR SELECT 
USING (
  public.is_admin() OR 
  (public.get_current_user_role() = 'accountant' AND recorded_by = auth.uid())
);

-- سياسة للعمولات - الموظف يرى عمولاته فقط
DROP POLICY IF EXISTS "Employee can view own commissions" ON public.commissions;
CREATE POLICY "Employee can view own commissions" 
ON public.commissions 
FOR SELECT 
USING (
  public.is_admin() OR 
  public.is_accountant_or_admin() OR
  employee_id = auth.uid()
);

-- خامساً: إنشاء دالة للتحقق من البيانات وإصلاح أي مشاكل
CREATE OR REPLACE FUNCTION public.fix_data_integrity()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- تحديث العملاء بدون assigned_to
  UPDATE public.clients 
  SET assigned_to = created_by 
  WHERE assigned_to IS NULL AND created_by IS NOT NULL;
  
  -- تحديث الليدز بدون assigned_to
  UPDATE public.leads 
  SET assigned_to = created_by 
  WHERE assigned_to IS NULL AND created_by IS NOT NULL;
  
  -- تحديث العقارات بدون listed_by
  UPDATE public.properties 
  SET listed_by = created_by 
  WHERE listed_by IS NULL AND created_by IS NOT NULL;
  
  RETURN 'تم إصلاح البيانات بنجاح';
END;
$$;

-- تنفيذ إصلاح البيانات
SELECT public.fix_data_integrity();