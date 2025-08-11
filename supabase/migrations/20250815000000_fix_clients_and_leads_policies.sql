-- إصلاح فوري لسياسات RLS للعملاء والليدز
-- تبسيط السياسات لضمان عمل إضافة العملاء والليدز

-- إزالة جميع السياسات المتضاربة للعملاء
DROP POLICY IF EXISTS "Employees can view and manage their assigned clients" ON public.clients;
DROP POLICY IF EXISTS "Employees can create clients" ON public.clients;
DROP POLICY IF EXISTS "Employees can update their assigned clients" ON public.clients;
DROP POLICY IF EXISTS "Only admins can delete clients" ON public.clients;
DROP POLICY IF EXISTS "clients_select" ON public.clients;
DROP POLICY IF EXISTS "clients_insert" ON public.clients;
DROP POLICY IF EXISTS "clients_update" ON public.clients;
DROP POLICY IF EXISTS "clients_delete" ON public.clients;

-- إنشاء سياسات بسيطة للعملاء
CREATE POLICY "Allow authenticated users to view clients"
ON public.clients FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to create clients"
ON public.clients FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Allow users to update their clients"
ON public.clients FOR UPDATE
USING (auth.uid() IS NOT NULL AND (created_by = auth.uid() OR assigned_to = auth.uid()));

CREATE POLICY "Allow users to delete their clients"
ON public.clients FOR DELETE
USING (auth.uid() IS NOT NULL AND (created_by = auth.uid() OR assigned_to = auth.uid()));

-- إزالة جميع السياسات المتضاربة للليدز
DROP POLICY IF EXISTS "Everyone can view own leads" ON public.leads;
DROP POLICY IF EXISTS "Everyone can create leads" ON public.leads;
DROP POLICY IF EXISTS "leads_select" ON public.leads;
DROP POLICY IF EXISTS "leads_insert" ON public.leads;
DROP POLICY IF EXISTS "leads_update" ON public.leads;
DROP POLICY IF EXISTS "leads_delete" ON public.leads;

-- إنشاء سياسات بسيطة للليدز
CREATE POLICY "Allow authenticated users to view leads"
ON public.leads FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to create leads"
ON public.leads FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Allow users to update their leads"
ON public.leads FOR UPDATE
USING (auth.uid() IS NOT NULL AND (created_by = auth.uid() OR assigned_to = auth.uid()));

CREATE POLICY "Allow users to delete their leads"
ON public.leads FOR DELETE
USING (auth.uid() IS NOT NULL AND (created_by = auth.uid() OR assigned_to = auth.uid()));

-- تأكد من تفعيل RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- تأكد من أن profiles يمكن الوصول إليها
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Allow authenticated users to view profiles"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL);
