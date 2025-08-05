-- إصلاح RLS policy لجدول profiles

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "All users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- إنشاء سياسة جديدة واضحة للقراءة
CREATE POLICY "Users can view own profile and admins can view all" 
ON public.profiles 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile 
    WHERE admin_profile.user_id = auth.uid() 
    AND admin_profile.role = 'admin' 
    AND admin_profile.is_active = true
  )
);

-- تحديث سياسة الإدراج
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "System can insert new profiles" ON public.profiles;

CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- تحديث سياسة التعديل
DROP POLICY IF EXISTS "Users can update own profile data only" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());