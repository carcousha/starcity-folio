-- فحص جميع القيود على جدول expenses
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_schema = 'public' 
AND table_name = 'expenses';

-- إزالة القيد الذي يمنع إضافة المديونيات
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS personal_expense_requires_employee;

-- إضافة قيد جديد يأخذ في الاعتبار المديونيات
ALTER TABLE public.expenses 
ADD CONSTRAINT personal_expense_requires_employee 
CHECK (
  (expense_type != 'personal') OR 
  (expense_type = 'personal' AND recorded_by IS NOT NULL) OR
  (expense_type = 'debt')
);