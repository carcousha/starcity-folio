-- إصلاح مشكلة البيانات المفقودة في جدول profiles
-- حذف الملفات الشخصية التي لا تحتوي على user_id
DELETE FROM public.profiles WHERE user_id IS NULL;

-- تأكد من أن عمود user_id مطلوب
ALTER TABLE public.profiles ALTER COLUMN user_id SET NOT NULL;

-- إنشاء دالة trigger محدثة للمستخدمين الجدد
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, first_name, last_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'مستخدم'),
        COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'جديد'),
        NEW.email,
        'employee'
    );
    
    -- إضافة دور افتراضي في جدول user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'employee')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- إنشاء trigger إذا لم يكن موجود
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- تحديث سياسات expenses للسماح بالإدراج
DROP POLICY IF EXISTS "Admins and accountants can manage expenses" ON public.expenses;

CREATE POLICY "Authenticated users can insert expenses" ON public.expenses
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = recorded_by);

CREATE POLICY "Admins and accountants can manage expenses" ON public.expenses
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));