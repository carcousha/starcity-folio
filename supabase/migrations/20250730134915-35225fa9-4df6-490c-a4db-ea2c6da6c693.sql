-- حل نهائي لمشكلة إدارة الموظفين - الجزء الثاني
-- تحديث باقي السياسات والدوال

-- 4. تحديث سياسات التحديث
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

-- 5. إضافة trigger لمعالجة المستخدمين الجدد
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