-- تعديل جدول الوسطاء لاستبدال العمولة بالمكتب العقاري وإضافة موقع المكتب
ALTER TABLE public.land_brokers 
DROP COLUMN IF EXISTS commission_percentage,
ADD COLUMN IF NOT EXISTS office_name TEXT,
ADD COLUMN IF NOT EXISTS office_location TEXT;