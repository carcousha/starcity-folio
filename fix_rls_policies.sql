-- حل مشكلة Row Level Security لجدول land_brokers
-- Fix RLS policies for land_brokers table

-- 1. تفعيل RLS على الجدول
ALTER TABLE public.land_brokers ENABLE ROW LEVEL SECURITY;

-- 2. إنشاء سياسة للقراءة (SELECT) - يمكن للجميع قراءة البيانات
CREATE POLICY "Enable read access for all users" ON public.land_brokers
FOR SELECT USING (true);

-- 3. إنشاء سياسة للإضافة (INSERT) - يمكن للمستخدمين المسجلين إضافة وسطاء
CREATE POLICY "Enable insert for authenticated users" ON public.land_brokers
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 4. إنشاء سياسة للتحديث (UPDATE) - يمكن للمستخدمين المسجلين تحديث البيانات
CREATE POLICY "Enable update for authenticated users" ON public.land_brokers
FOR UPDATE USING (auth.role() = 'authenticated');

-- 5. إنشاء سياسة للحذف (DELETE) - يمكن للمستخدمين المسجلين حذف البيانات
CREATE POLICY "Enable delete for authenticated users" ON public.land_brokers
FOR DELETE USING (auth.role() = 'authenticated');

-- 6. التحقق من السياسات
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'land_brokers';
