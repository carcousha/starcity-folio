-- حل نهائي لمشكلة إدارة الموظفين
-- المشكلة: التعارض بين النظام الحالي ومتطلبات إضافة موظفين بدون حسابات مصادقة

-- 1. أولاً: تعديل جدول profiles ليسمح بـ user_id كـ null للموظفين بدون حسابات
ALTER TABLE public.profiles 
ALTER COLUMN user_id DROP NOT NULL;

-- 2. إضافة constraint للتأكد من وجود user_id أو email فريد
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_unique_identifier 
CHECK (
  (user_id IS NOT NULL) OR 
  (user_id IS NULL AND email IS NOT NULL)
);

-- 3. إضافة فهرس فريد للإيميل
CREATE UNIQUE INDEX profiles_email_unique 
ON public.profiles(email) 
WHERE user_id IS NULL;

-- 4. تحديث سياسة RLS للسماح للمدراء بإضافة موظفين بدون user_id
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

-- سياسة جديدة لإدراج الملفات الشخصية
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() -- المستخدمون يمكنهم إدراج ملفاتهم الشخصية
);

CREATE POLICY "Admins can insert any profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  -- المدراء يمكنهم إدراج أي ملف شخصي (مع أو بدون user_id)
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'accountant'::app_role)
);

-- 5. تحديث سياسة التحديث
DROP POLICY IF EXISTS "Users can update their own profile (non-role fields)" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile including roles" ON public.profiles;

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'accountant'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'accountant'::app_role)
);

-- 6. إضافة trigger لمعالجة المستخدمين الجدد
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    -- فحص إذا كان يوجد ملف شخصي بنفس الإيميل بدون user_id
    UPDATE public.profiles 
    SET user_id = NEW.id
    WHERE email = NEW.email AND user_id IS NULL;
    
    -- إذا لم يوجد ملف شخصي، أنشئ واحد جديد
    IF NOT FOUND THEN
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
    END IF;
    
    RETURN NEW;
END;
$function$;

-- إنشاء trigger جديد
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. إضافة دالة للبحث عن user_id من خلال الإيميل
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(user_email text)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
    SELECT user_id FROM public.profiles WHERE email = user_email LIMIT 1;
$function$;

-- 8. إضافة view لعرض الموظفين مع بياناتهم الكاملة
CREATE OR REPLACE VIEW public.staff_view AS
SELECT 
    p.id,
    p.user_id,
    p.first_name,
    p.last_name,
    p.email,
    p.phone,
    p.role,
    p.is_active,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    CASE 
        WHEN p.user_id IS NOT NULL THEN 'has_auth'
        ELSE 'no_auth'
    END as account_status
FROM public.profiles p
ORDER BY p.created_at DESC;

-- RLS للview
ALTER VIEW public.staff_view OWNER TO postgres;

-- إعطاء صلاحيات للview
GRANT SELECT ON public.staff_view TO authenticated;
GRANT SELECT ON public.staff_view TO anon;