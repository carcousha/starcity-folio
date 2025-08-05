-- تعديل جدول المصروفات لدعم المصروفات الشخصية ومصروفات الشركة

-- إضافة عمود نوع المصروف
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS expense_type TEXT DEFAULT 'company';

-- إضافة قيد للتأكد من نوع المصروف
ALTER TABLE public.expenses 
ADD CONSTRAINT expense_type_check 
CHECK (expense_type IN ('personal', 'company'));

-- جعل عمود recorded_by اختياري (للمصروفات الشخصية فقط)
ALTER TABLE public.expenses 
ALTER COLUMN recorded_by DROP NOT NULL;

-- إضافة قيد منطقي: إذا كان نوع المصروف شخصي، يجب أن يكون مرتبط بموظف
ALTER TABLE public.expenses 
ADD CONSTRAINT personal_expense_requires_employee 
CHECK (
  (expense_type = 'personal' AND recorded_by IS NOT NULL) OR 
  (expense_type = 'company')
);

-- تحديث المصروفات الموجودة لتكون مصروفات شركة
UPDATE public.expenses 
SET expense_type = 'company' 
WHERE expense_type IS NULL;