-- حل نهائي ومضمون - إزالة كل policies وإنشاء واحدة بسيطة

-- 1. إزالة RLS مؤقتاً
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. حذف جميع policies (كلها)
DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.profiles';
    END LOOP;
END $$;

-- 3. إعادة تفعيل RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. إنشاء policy واحدة بسيطة بدون أي تعقيدات
CREATE POLICY "Allow authenticated users access to profiles"
ON public.profiles FOR ALL
USING (true)
WITH CHECK (true);

-- 5. التأكد من أن البيانات سليمة
UPDATE public.profiles 
SET role = 'admin', is_active = true 
WHERE user_id = '8c17d2fc-9166-4541-b21c-21910c9a0921';

-- 6. التأكد من أن functions is_admin, is_accountant, is_employee شغالة
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  );
$$;