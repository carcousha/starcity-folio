-- أولاً: فحص constraint الموجود في جدول expenses
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.expenses'::regclass 
AND conname LIKE '%category%';

-- إضافة "مواصلات" للـ categories المسموحة في جدول expenses
ALTER TABLE public.expenses 
DROP CONSTRAINT IF EXISTS expenses_category_check;

-- إنشاء constraint جديد يتضمن "مواصلات"
ALTER TABLE public.expenses 
ADD CONSTRAINT expenses_category_check 
CHECK (category IN (
  'إيجار مكتب',
  'كهرباء وماء',
  'اتصالات وإنترنت',
  'مواد مكتبية',
  'صيانة وإصلاحات',
  'رواتب',
  'تأمينات',
  'ضرائب ورسوم',
  'تسويق وإعلان',
  'مواصلات',
  'وقود',
  'استشارات قانونية',
  'استشارات محاسبية',
  'تدريب',
  'ضيافة',
  'عام',
  'أخرى'
));