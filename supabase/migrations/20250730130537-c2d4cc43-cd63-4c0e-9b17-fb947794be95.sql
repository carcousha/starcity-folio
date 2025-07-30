-- إصلاح مشاكل الأمان المكتشفة

-- إصلاح View للأمان: إزالة SECURITY DEFINER وجعلها عادية
DROP VIEW IF EXISTS public.user_roles_view;
CREATE VIEW public.user_roles_view AS
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

-- إصلاح search_path للدوال الموجودة
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
        'employee'::app_role,
        true
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- إصلاح باقي الدوال
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  ) OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = user_uuid LIMIT 1),
    (SELECT role FROM public.profiles WHERE user_id = user_uuid LIMIT 1),
    'employee'::app_role
  );
$$;

-- إنشاء function جديدة للتحقق من صلاحيات المديرين فقط
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND role = 'admin'::app_role AND is_active = true
  );
$$;