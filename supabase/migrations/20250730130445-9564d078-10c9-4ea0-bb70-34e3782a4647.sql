-- إنشاء نظام الصلاحيات وتعيين المدير الرئيسي
-- (مع إزالة السياسات الموجودة أولاً)

-- تحديث المستخدم carcousha@gmail.com ليكون مدير
UPDATE public.profiles 
SET role = 'admin'::app_role, 
    is_active = true,
    updated_at = now()
WHERE email = 'carcousha@gmail.com';

-- إذا لم يكن المستخدم موجود، سنضيفه (في حالة التسجيل الجديد)
INSERT INTO public.profiles (
    user_id, 
    first_name, 
    last_name, 
    email, 
    role, 
    is_active
) 
SELECT 
    auth.users.id,
    COALESCE(auth.users.raw_user_meta_data ->> 'first_name', 'مدير'),
    COALESCE(auth.users.raw_user_meta_data ->> 'last_name', 'النظام'),
    'carcousha@gmail.com',
    'admin'::app_role,
    true
FROM auth.users 
WHERE auth.users.email = 'carcousha@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE email = 'carcousha@gmail.com'
);

-- إزالة السياسات الموجودة من جدول user_permissions
DROP POLICY IF EXISTS "Admins can manage user permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Users can view permissions" ON public.user_permissions;

-- إنشاء السياسات الجديدة
CREATE POLICY "Admins can manage user permissions" ON public.user_permissions
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view permissions" ON public.user_permissions
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- إضافة الصلاحيات الكاملة للمدير الرئيسي
INSERT INTO public.user_permissions (user_id, module_name, permission_type, granted_by)
SELECT 
    p.user_id,
    module,
    'admin',
    p.user_id
FROM public.profiles p,
UNNEST(ARRAY[
    'clients', 'deals', 'properties', 'expenses', 'revenues', 
    'commissions', 'debts', 'treasury', 'vehicles', 'reports', 
    'staff', 'settings', 'activity_logs'
]) AS module
WHERE p.email = 'carcousha@gmail.com' AND p.role = 'admin'::app_role
ON CONFLICT DO NOTHING;

-- تحديث trigger handle_new_user لإعطاء دور افتراضي
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        user_id, 
        first_name, 
        last_name, 
        email, 
        role,
        is_active
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'مستخدم'),
        COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'جديد'),
        NEW.email,
        'employee'::app_role,  -- الدور الافتراضي
        true
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء view لعرض معلومات المستخدمين مع أدوارهم
CREATE OR REPLACE VIEW public.user_roles_view AS
SELECT 
    p.id,
    p.user_id,
    p.first_name,
    p.last_name,
    p.email,
    p.role,
    p.is_active,
    p.created_at,
    p.updated_at,
    CASE 
        WHEN p.role = 'admin' THEN 'مدير النظام'
        WHEN p.role = 'accountant' THEN 'محاسب'
        WHEN p.role = 'employee' THEN 'موظف'
    END as role_name_ar
FROM public.profiles p;

-- إزالة وإعادة إنشاء سياسة عرض المستخدمين
DROP POLICY IF EXISTS "Users can view user roles based on permission" ON public.profiles;
CREATE POLICY "Users can view user roles based on permission" ON public.profiles
FOR SELECT TO authenticated
USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    user_id = auth.uid()
);