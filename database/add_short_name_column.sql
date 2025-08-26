-- إضافة عمود الاسم المختصر لجدول الوسطاء
-- يمكنك تشغيل هذا الكود مباشرة في Supabase SQL Editor

ALTER TABLE public.land_brokers
ADD COLUMN IF NOT EXISTS short_name TEXT;

-- إضافة تعليق على العمود
COMMENT ON COLUMN public.land_brokers.short_name IS 'الاسم المختصر للوسيط';

-- التحقق من أن العمود تم إضافته
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'land_brokers' 
AND table_schema = 'public'
ORDER BY ordinal_position;
