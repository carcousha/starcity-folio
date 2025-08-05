-- حذف قيد الفحص الذي يمنع إضافة فئات جديدة
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_category_check;

-- إضافة قيد بسيط يتأكد فقط من أن الفئة ليست فارغة
ALTER TABLE public.expenses ADD CONSTRAINT expenses_category_not_empty 
CHECK (category IS NOT NULL AND TRIM(category) != '');

-- التأكد من أن العمود category يمكن أن يحتوي على أي نص
ALTER TABLE public.expenses ALTER COLUMN category TYPE TEXT;