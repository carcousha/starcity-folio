-- إضافة "مصاريف سيارات" إلى الفئات المسموحة
ALTER TABLE public.expenses 
DROP CONSTRAINT IF EXISTS expenses_category_check;

-- إنشاء constraint جديد يتضمن جميع الفئات بما فيها "مصاريف سيارات"
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
    'مصاريف سيارات',
    'وقود',
    'استشارات قانونية',
    'استشارات محاسبية',
    'تدريب',
    'ضيافة',
    'عام',
    'أخرى'
  )
);