-- فحص وإصلاح سياسات الجداول الأساسية للموظف

-- حذف السياسات القديمة المتضاربة وإنشاء سياسات جديدة واضحة

-- جدول العملاء (clients)
DROP POLICY IF EXISTS "Employee can manage own clients" ON public.clients;
DROP POLICY IF EXISTS "Admin can manage all clients" ON public.clients;
DROP POLICY IF EXISTS "admin_full_access_all" ON public.clients;

-- سياسات جديدة للعملاء
CREATE POLICY "Employee can view assigned clients" 
ON public.clients 
FOR SELECT 
USING (assigned_to = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Employee can create clients" 
ON public.clients 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Employee can update own clients" 
ON public.clients 
FOR UPDATE 
USING (assigned_to = auth.uid() OR created_by = auth.uid())
WITH CHECK (assigned_to = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Employee can delete own clients" 
ON public.clients 
FOR DELETE 
USING (created_by = auth.uid());

CREATE POLICY "Admin full access clients" 
ON public.clients 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- جدول العقارات (properties) - إصلاح السياسات
DROP POLICY IF EXISTS "Employee can manage own properties" ON public.properties;
DROP POLICY IF EXISTS "Admin can manage all properties" ON public.properties;

CREATE POLICY "Employee can view own properties" 
ON public.properties 
FOR SELECT 
USING (listed_by = auth.uid());

CREATE POLICY "Employee can create properties" 
ON public.properties 
FOR INSERT 
WITH CHECK (listed_by = auth.uid());

CREATE POLICY "Employee can update own properties" 
ON public.properties 
FOR UPDATE 
USING (listed_by = auth.uid())
WITH CHECK (listed_by = auth.uid());

CREATE POLICY "Employee can delete own properties" 
ON public.properties 
FOR DELETE 
USING (listed_by = auth.uid());

CREATE POLICY "Admin full access properties" 
ON public.properties 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- جدول الليدز (leads) - إصلاح السياسات
DROP POLICY IF EXISTS "Users can delete own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can select own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update own leads" ON public.leads;

CREATE POLICY "Employee can view assigned leads" 
ON public.leads 
FOR SELECT 
USING (assigned_to = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Employee can create leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Employee can update assigned leads" 
ON public.leads 
FOR UPDATE 
USING (assigned_to = auth.uid() OR created_by = auth.uid())
WITH CHECK (assigned_to = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Employee can delete own leads" 
ON public.leads 
FOR DELETE 
USING (created_by = auth.uid());

CREATE POLICY "Admin full access leads" 
ON public.leads 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- التأكد من وجود التريجرز للحقول التلقائية
-- تريجر للعملاء
DROP TRIGGER IF EXISTS trigger_set_created_by_clients ON public.clients;
CREATE TRIGGER trigger_set_created_by_clients
  BEFORE INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

-- تريجر للعقارات (إذا لم يكن موجود)
CREATE OR REPLACE FUNCTION public.set_listed_by()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.listed_by IS NULL THEN
    NEW.listed_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_listed_by_properties ON public.properties;
CREATE TRIGGER trigger_set_listed_by_properties
  BEFORE INSERT ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.set_listed_by();

-- تريجر للليدز
DROP TRIGGER IF EXISTS trigger_set_created_by_leads ON public.leads;
CREATE TRIGGER trigger_set_created_by_leads
  BEFORE INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();