-- حل نهائي لمشكلة إدارة الموظفين - الجزء الأول
-- تعديل جدول profiles ليسمح بـ user_id كـ null

-- 1. تعديل جدول profiles ليسمح بـ user_id كـ null للموظفين بدون حسابات
ALTER TABLE public.profiles 
ALTER COLUMN user_id DROP NOT NULL;

-- 2. إضافة constraint للتأكد من وجود user_id أو email فريد
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_unique_identifier 
CHECK (
  (user_id IS NOT NULL) OR 
  (user_id IS NULL AND email IS NOT NULL)
);

-- 3. تحديث سياسة RLS للسماح للمدراء بإضافة موظفين بدون user_id
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