-- حل مشكلة infinite recursion في profiles
DROP POLICY IF EXISTS "Everyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or admins can update any" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can create profile" ON public.profiles;

-- إنشاء policies بسيطة بدون استدعاء دوال معقدة
CREATE POLICY "Allow profile access for authenticated users"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Allow profile creation"
ON public.profiles FOR INSERT
WITH CHECK (user_id = auth.uid());

-- التأكد من أن المستخدم له دور admin
UPDATE public.profiles 
SET role = 'admin', is_active = true 
WHERE user_id = '8c17d2fc-9166-4541-b21c-21910c9a0921';

-- إضافة policy خاصة للأدمن
CREATE POLICY "Admins can view and manage all profiles"
ON public.profiles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin' 
    AND p.is_active = true
  )
);