-- إضافة عمود الاسم المختصر لجدول الوسطاء
-- Add short_name column to land_brokers table

ALTER TABLE public.land_brokers
ADD COLUMN IF NOT EXISTS short_name TEXT;

-- إضافة تعليق على العمود
COMMENT ON COLUMN public.land_brokers.short_name IS 'الاسم المختصر للوسيط - Short name for the broker';
