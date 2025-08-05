-- فحص البيانات الموجودة التي قد تسبب مشكلة
SELECT id, category, length(category) as cat_length, 
       CASE WHEN category IS NULL THEN 'NULL' 
            WHEN category = '' THEN 'EMPTY' 
            ELSE 'OK' 
       END as category_status
FROM public.expenses 
WHERE category IS NULL 
   OR category = '' 
   OR category NOT IN (
     'إيجار مكتب',
     'كهرباء وماء',
     'اتصالات وإنترنت',
     'مواد مكتبية',
     'صيانة وإصلاحات',
     'صيانة',
     'رواتب',
     'تأمينات',
     'ضرائب ورسوم',
     'رسوم حكومية',
     'تسويق وإعلان',
     'تسويق',
     'مواصلات',
     'وقود',
     'استشارات قانونية',
     'استشارات محاسبية',
     'تدريب',
     'ضيافة',
     'عام',
     'أخرى'
   );

-- تطبيق constraint جديد آمن يتعامل مع المشاكل المحتملة
ALTER TABLE public.expenses 
DROP CONSTRAINT IF EXISTS expenses_category_check;

-- constraint محدث مع معالجة أفضل
ALTER TABLE public.expenses 
ADD CONSTRAINT expenses_category_check 
CHECK (
  category IS NOT NULL 
  AND trim(category) != '' 
  AND category IN (
    'إيجار مكتب',
    'كهرباء وماء',
    'اتصالات وإنترنت',
    'مواد مكتبية',
    'صيانة وإصلاحات',
    'صيانة',
    'رواتب',
    'تأمينات',
    'ضرائب ورسوم',
    'رسوم حكومية',
    'تسويق وإعلان',
    'تسويق',
    'مواصلات',
    'وقود',
    'استشارات قانونية',
    'استشارات محاسبية',
    'تدريب',
    'ضيافة',
    'عام',
    'أخرى'
  )
);