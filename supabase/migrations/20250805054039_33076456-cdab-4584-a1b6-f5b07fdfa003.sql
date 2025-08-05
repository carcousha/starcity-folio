-- تبسيط نظام الصلاحيات وإضافة RLS policies المفقودة

-- إنشاء وظائف مساعدة للأدوار
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_employee()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant', 'employee') 
    AND is_active = true
  );
END;
$$;

-- إضافة RLS policies للجداول المفقودة

-- جدول profiles - السماح لجميع المستخدمين برؤية ملفاتهم الشخصية والمديرين برؤية الجميع
DROP POLICY IF EXISTS "All users can view all profiles" ON public.profiles;
CREATE POLICY "All users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- جدول permission_settings - المديرين فقط
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.permission_settings;
CREATE POLICY "Admins can manage permissions" 
ON public.permission_settings 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

-- جدول notification_logs - السماح للنظام بالإدراج
CREATE POLICY "System can insert notifications" 
ON public.notification_logs 
FOR INSERT 
WITH CHECK (true);

-- جدول treasury_transactions - المديرين والمحاسبين
CREATE POLICY "Admins and accountants can manage treasury" 
ON public.treasury_transactions 
FOR ALL 
USING (is_admin() OR (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'accountant') 
  AND is_active = true
))) 
WITH CHECK (is_admin() OR (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'accountant') 
  AND is_active = true
)));

-- جدول treasury_accounts - المديرين والمحاسبين
CREATE POLICY "Admins and accountants can view treasury accounts" 
ON public.treasury_accounts 
FOR SELECT 
USING (is_admin() OR (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'accountant') 
  AND is_active = true
)));

CREATE POLICY "Admins can manage treasury accounts" 
ON public.treasury_accounts 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

-- جدول staff - المديرين والمحاسبين
CREATE POLICY "Admins and accountants can view staff" 
ON public.staff 
FOR SELECT 
USING (is_admin() OR (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'accountant') 
  AND is_active = true
)));

CREATE POLICY "Admins can manage staff" 
ON public.staff 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

-- جدول vehicles - المديرين والمحاسبين
CREATE POLICY "Admins and accountants can view vehicles" 
ON public.vehicles 
FOR SELECT 
USING (is_admin() OR (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'accountant') 
  AND is_active = true
)));

CREATE POLICY "Admins can manage vehicles" 
ON public.vehicles 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

-- جدول tasks - جميع المستخدمين يمكنهم رؤية المهام المعينة لهم
CREATE POLICY "Users can view assigned tasks" 
ON public.tasks 
FOR SELECT 
USING (
  is_admin() OR 
  created_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.task_assignments 
    WHERE task_id = tasks.id AND assigned_to = auth.uid()
  )
);

CREATE POLICY "Users can create tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own tasks" 
ON public.tasks 
FOR UPDATE 
USING (
  is_admin() OR 
  created_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.task_assignments 
    WHERE task_id = tasks.id AND assigned_to = auth.uid()
  )
);

-- جدول task_assignments
CREATE POLICY "Users can view task assignments" 
ON public.task_assignments 
FOR SELECT 
USING (
  is_admin() OR 
  assigned_to = auth.uid() OR 
  assigned_by = auth.uid()
);

CREATE POLICY "Users can create task assignments" 
ON public.task_assignments 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- جدول rental_contracts - المديرين والمحاسبين والموظفين
CREATE POLICY "All authenticated users can view contracts" 
ON public.rental_contracts 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create contracts" 
ON public.rental_contracts 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Contract creators and admins can update" 
ON public.rental_contracts 
FOR UPDATE 
USING (is_admin() OR created_by = auth.uid());

-- جدول activity_logs - جميع المستخدمين يمكنهم رؤية سجلاتهم
CREATE POLICY "Users can view own activity logs" 
ON public.activity_logs 
FOR SELECT 
USING (is_admin() OR user_id = auth.uid());

CREATE POLICY "System can insert activity logs" 
ON public.activity_logs 
FOR INSERT 
WITH CHECK (true);

-- إنشاء صلاحيات افتراضية أساسية
INSERT INTO public.permission_settings (module_name, action_type, allowed_roles, is_active, created_by) VALUES
('dashboard', 'access', ARRAY['admin', 'accountant', 'employee'], true, '8c17d2fc-9166-4541-b21c-21910c9a0921'),
('clients', 'view', ARRAY['admin', 'accountant', 'employee'], true, '8c17d2fc-9166-4541-b21c-21910c9a0921'),
('clients', 'manage', ARRAY['admin', 'accountant'], true, '8c17d2fc-9166-4541-b21c-21910c9a0921'),
('properties', 'view', ARRAY['admin', 'accountant', 'employee'], true, '8c17d2fc-9166-4541-b21c-21910c9a0921'),
('properties', 'manage', ARRAY['admin', 'accountant'], true, '8c17d2fc-9166-4541-b21c-21910c9a0921'),
('deals', 'view', ARRAY['admin', 'accountant', 'employee'], true, '8c17d2fc-9166-4541-b21c-21910c9a0921'),
('deals', 'manage', ARRAY['admin', 'accountant'], true, '8c17d2fc-9166-4541-b21c-21910c9a0921'),
('financials', 'view', ARRAY['admin', 'accountant'], true, '8c17d2fc-9166-4541-b21c-21910c9a0921'),
('expenses', 'manage', ARRAY['admin', 'accountant'], true, '8c17d2fc-9166-4541-b21c-21910c9a0921'),
('revenues', 'manage', ARRAY['admin', 'accountant'], true, '8c17d2fc-9166-4541-b21c-21910c9a0921'),
('commissions', 'view', ARRAY['admin', 'accountant', 'employee'], true, '8c17d2fc-9166-4541-b21c-21910c9a0921'),
('commissions', 'manage', ARRAY['admin', 'accountant'], true, '8c17d2fc-9166-4541-b21c-21910c9a0921'),
('reports', 'view', ARRAY['admin', 'accountant'], true, '8c17d2fc-9166-4541-b21c-21910c9a0921'),
('tasks', 'view', ARRAY['admin', 'accountant', 'employee'], true, '8c17d2fc-9166-4541-b21c-21910c9a0921'),
('tasks', 'manage', ARRAY['admin', 'accountant'], true, '8c17d2fc-9166-4541-b21c-21910c9a0921')
ON CONFLICT (module_name, action_type) DO NOTHING;