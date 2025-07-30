-- إصلاح سياسات الأمان لجدول activity_logs
-- إضافة سياسة للقراءة للجميع المصرح لهم
CREATE POLICY "Users can view activity logs" ON public.activity_logs
FOR SELECT TO authenticated
USING (true);

-- إضافة سياسة الإدراج للجميع المصرح لهم  
CREATE POLICY "System can insert activity logs" ON public.activity_logs
FOR INSERT TO authenticated
WITH CHECK (true);

-- تحديث سياسة user_roles لتسمح بالقراءة للجميع
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view roles" ON public.user_roles
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- إضافة سياسة للسماح بالقراءة من user_permissions
CREATE POLICY "Users can view permissions" ON public.user_permissions
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- تحديث سياسة profiles للسماح بالإدراج التلقائي
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can insert profiles" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));