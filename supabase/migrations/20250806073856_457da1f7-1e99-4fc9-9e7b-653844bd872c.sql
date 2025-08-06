-- حذف القيد المُشكِل نهائياً 
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS personal_expense_requires_employee;

-- إنشاء قيد جديد صحيح يسمح بالمديونيات
ALTER TABLE public.expenses 
ADD CONSTRAINT personal_expense_requires_employee 
CHECK (
  (expense_type IS NULL) OR
  (expense_type = 'company') OR 
  (expense_type = 'debt') OR
  (expense_type = 'personal' AND recorded_by IS NOT NULL)
);

-- التأكد من أن النوع الافتراضي للمصروفات هو 'company'
ALTER TABLE public.expenses 
ALTER COLUMN expense_type SET DEFAULT 'company';