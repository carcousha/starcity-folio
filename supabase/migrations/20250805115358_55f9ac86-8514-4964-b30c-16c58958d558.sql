-- إضافة جميع categories الموجودة والجديدة
ALTER TABLE public.expenses 
DROP CONSTRAINT IF EXISTS expenses_category_check;

-- إنشاء constraint جديد يتضمن جميع categories الموجودة والمطلوبة
ALTER TABLE public.expenses 
ADD CONSTRAINT expenses_category_check 
CHECK (category IN (
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
));