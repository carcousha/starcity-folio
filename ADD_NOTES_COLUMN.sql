-- إضافة عمود الملاحظات لجدول الوسطاء
-- Add notes column to land_brokers table
-- يجب تنفيذ هذا الـ SQL في Supabase Dashboard

-- 1. إضافة العمود
ALTER TABLE public.land_brokers
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. إضافة تعليق توضيحي
COMMENT ON COLUMN public.land_brokers.notes IS 'ملاحظات إضافية حول الوسيط - Additional notes about the broker';

-- 3. التحقق من إضافة العمود
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'land_brokers' 
AND column_name = 'notes';

-- 4. عرض هيكل الجدول الكامل بعد الإضافة
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'land_brokers' 
ORDER BY ordinal_position;
