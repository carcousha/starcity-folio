-- حذف الموظفين الذين بدون user_id صالح (البيانات الخاطئة)
DELETE FROM public.profiles 
WHERE user_id IS NULL;

-- إضافة قيد NOT NULL على user_id في جدول profiles لمنع إنشاء موظفين بدون user_id في المستقبل
ALTER TABLE public.profiles 
ALTER COLUMN user_id SET NOT NULL;