-- إضافة عمود الملاحظات لجدول الوسطاء
-- Add notes column to land_brokers table

ALTER TABLE public.land_brokers
ADD COLUMN IF NOT EXISTS notes TEXT;

-- إضافة تعليق على العمود
COMMENT ON COLUMN public.land_brokers.notes IS 'ملاحظات إضافية حول الوسيط - Additional notes about the broker';
