-- إنشاء حساب مدير تجريبي للاختبار
-- أولاً تحقق من وجود المستخدم
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- محاولة العثور على المستخدم
    SELECT user_id INTO test_user_id 
    FROM public.profiles 
    WHERE email = 'admin@test.com'
    LIMIT 1;
    
    -- إذا لم يوجد، أنشئ واحد
    IF test_user_id IS NULL THEN
        -- إنشاء UUID للمستخدم التجريبي
        test_user_id := gen_random_uuid();
        
        -- إدراج في جدول profiles
        INSERT INTO public.profiles (user_id, first_name, last_name, email, role)
        VALUES (test_user_id, 'مدير', 'النظام', 'admin@test.com', 'admin');
        
        -- إدراج في جدول user_roles
        INSERT INTO public.user_roles (user_id, role)
        VALUES (test_user_id, 'admin');
        
        RAISE NOTICE 'تم إنشاء مستخدم تجريبي: %', test_user_id;
    ELSE
        RAISE NOTICE 'المستخدم التجريبي موجود: %', test_user_id;
    END IF;
END $$;

-- تحديث سياسة لضمان عمل المصروفات
DROP POLICY IF EXISTS "Authenticated users can insert expenses" ON public.expenses;

CREATE POLICY "All authenticated users can insert expenses" ON public.expenses
FOR INSERT TO authenticated
WITH CHECK (true);