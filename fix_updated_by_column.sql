-- إضافة حقل updated_by لجدول land_brokers
-- Add updated_by column to land_brokers table

-- إضافة حقل updated_by
ALTER TABLE public.land_brokers
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- إضافة تعليق للحقل الجديد
COMMENT ON COLUMN public.land_brokers.updated_by IS 'المستخدم الذي قام بالتحديث الأخير - User who last updated the record';

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_land_brokers_updated_by ON public.land_brokers(updated_by);

-- إضافة سياسة RLS لحقل updated_by
DROP POLICY IF EXISTS "Users can update brokers with updated_by" ON public.land_brokers;
CREATE POLICY "Users can update brokers with updated_by" ON public.land_brokers
FOR UPDATE USING (true);

-- عرض رسالة نجاح
SELECT 'تم إضافة حقل updated_by بنجاح' as message;
