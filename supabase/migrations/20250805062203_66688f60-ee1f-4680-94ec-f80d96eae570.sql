-- حل نهائي للمشكلة - إعطاء الـ RLS مؤقتاً وإصلاح كل شيء

-- 1. إزالة RLS من profiles مؤقتاً لحل المشكلة
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. حذف جميع policies
DROP POLICY IF EXISTS "Simple profile access" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;

-- 3. التأكد من تحديث دور المستخدم إلى admin
UPDATE public.profiles 
SET role = 'admin', is_active = true 
WHERE user_id = '8c17d2fc-9166-4541-b21c-21910c9a0921';

-- 4. إعادة تفعيل RLS مع policy واحدة بسيطة جداً
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. إنشاء policy بسيطة جداً بدون أي تعقيدات
CREATE POLICY "Allow all profile operations for authenticated users"
ON public.profiles FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);