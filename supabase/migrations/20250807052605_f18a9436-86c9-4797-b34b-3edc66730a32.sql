-- فحص قيود الفحص الحالية على جدول العمولات
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.commissions'::regclass 
AND contype = 'c';

-- إزالة قيد الفحص القديم إذا كان موجوداً
ALTER TABLE public.commissions DROP CONSTRAINT IF EXISTS commissions_status_check;

-- إضافة قيد فحص محدث للحالة
ALTER TABLE public.commissions 
ADD CONSTRAINT commissions_status_check 
CHECK (status IN ('pending', 'approved', 'paid', 'cancelled'));