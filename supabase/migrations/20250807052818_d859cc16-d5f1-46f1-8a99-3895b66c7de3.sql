-- إزالة قيد الفحص على نوع العملية نهائياً لتجنب التعارضات
ALTER TABLE public.activity_logs DROP CONSTRAINT IF EXISTS activity_logs_operation_type_check;

-- فحص أن القيد تم حذفه
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.activity_logs'::regclass 
AND contype = 'c';