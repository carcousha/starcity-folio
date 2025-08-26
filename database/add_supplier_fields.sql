-- إضافة حقول الأسماء الجديدة لجدول الموردين الخارجيين
-- يمكنك تشغيل هذا السكريبت مباشرة في Supabase Dashboard > SQL Editor

-- إضافة الحقول الجديدة
ALTER TABLE public.external_suppliers 
ADD COLUMN IF NOT EXISTS first_name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS last_name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS contact_name TEXT DEFAULT '';

-- تحديث البيانات الموجودة لتعبئة الحقول الجديدة
UPDATE public.external_suppliers 
SET 
  first_name = COALESCE(SPLIT_PART(name, ' ', 1), ''),
  last_name = COALESCE(SPLIT_PART(name, ' ', 2), ''),
  contact_name = COALESCE(name, '')
WHERE first_name IS NULL OR first_name = '' OR contact_name IS NULL OR contact_name = '';

-- التحقق من النتائج
SELECT id, name, first_name, last_name, contact_name 
FROM public.external_suppliers 
LIMIT 5;
