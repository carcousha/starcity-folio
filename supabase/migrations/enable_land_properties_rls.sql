-- تفعيل RLS على جدول الأراضي إذا لم يكن مفعلاً
ALTER TABLE public.land_properties ENABLE ROW LEVEL SECURITY;

-- حذف السياسة القديمة إن وجدت لتجنب التعارض
DROP POLICY IF EXISTS "Allow authenticated users to view land properties" ON public.land_properties;

-- إنشاء سياسة جديدة تسمح للمستخدمين المسجلين بعرض جميع الأراضي
CREATE POLICY "Allow authenticated users to view land properties"
ON public.land_properties
FOR SELECT
TO authenticated
USING (true);

-- سياسة للسماح للمستخدمين بإضافة أراضٍ جديدة
DROP POLICY IF EXISTS "Allow authenticated users to insert land properties" ON public.land_properties;
CREATE POLICY "Allow authenticated users to insert land properties"
ON public.land_properties
FOR INSERT
TO authenticated
WITH CHECK (true);

-- سياسة للسماح للمستخدمين بتحديث الأراضي
DROP POLICY IF EXISTS "Allow authenticated users to update land properties" ON public.land_properties;
CREATE POLICY "Allow authenticated users to update land properties"
ON public.land_properties
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- سياسة للسماح للمستخدمين بحذف الأراضي
DROP POLICY IF EXISTS "Allow authenticated users to delete land properties" ON public.land_properties;
CREATE POLICY "Allow authenticated users to delete land properties"
ON public.land_properties
FOR DELETE
TO authenticated
USING (true);
