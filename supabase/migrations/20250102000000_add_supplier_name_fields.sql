-- إضافة حقول الأسماء الجديدة لجدول الموردين الخارجيين
-- Add new name fields to external_suppliers table

-- إضافة الحقول الجديدة
ALTER TABLE public.external_suppliers 
ADD COLUMN IF NOT EXISTS first_name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS last_name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS contact_name TEXT DEFAULT '';

-- تحديث البيانات الموجودة لتعبئة الحقول الجديدة
-- Update existing data to populate new fields
UPDATE public.external_suppliers 
SET 
  first_name = COALESCE(SPLIT_PART(name, ' ', 1), ''),
  last_name = COALESCE(SPLIT_PART(name, ' ', 2), ''),
  contact_name = COALESCE(name, '')
WHERE first_name IS NULL OR first_name = '';

-- إضافة تعليق على الجدول والحقول الجديدة
COMMENT ON COLUMN public.external_suppliers.first_name IS 'الاسم الأول للمورد';
COMMENT ON COLUMN public.external_suppliers.last_name IS 'الاسم الأخير للمورد';
COMMENT ON COLUMN public.external_suppliers.contact_name IS 'اسم التواصل (nickname) المستخدم في الرسائل';
