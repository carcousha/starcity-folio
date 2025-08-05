-- حذف جميع policies الموجودة للـ profiles
DROP POLICY IF EXISTS "Allow profile access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view and manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Everyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or admins can update any" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can create profile" ON public.profiles;

-- إنشاء policy واحدة بسيطة للجميع
CREATE POLICY "Simple profile access"
ON public.profiles FOR ALL
USING (true)
WITH CHECK (user_id = auth.uid());

-- تحديث دور المستخدم إلى admin
UPDATE public.profiles 
SET role = 'admin', is_active = true 
WHERE user_id = '8c17d2fc-9166-4541-b21c-21910c9a0921';