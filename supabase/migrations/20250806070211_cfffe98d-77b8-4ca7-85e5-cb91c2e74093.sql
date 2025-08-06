-- الخطوة 1: إضافة العمود والقيود
ALTER TABLE public.debts 
ADD COLUMN IF NOT EXISTS expense_id UUID REFERENCES public.expenses(id);

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_debts_expense_id ON public.debts(expense_id);

-- تحديث قيود expense_type
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expense_type_check;
ALTER TABLE public.expenses 
ADD CONSTRAINT expense_type_check 
CHECK (expense_type IN ('company', 'personal', 'debt'));

-- إضافة عمود لتمييز المصروفات المرتبطة بمديونيات
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS is_debt_related BOOLEAN DEFAULT FALSE;

-- تحديث المصروفات الموجودة لتمييز المرتبطة بمديونيات
UPDATE public.expenses 
SET is_debt_related = TRUE 
WHERE expense_type = 'debt' OR category = 'مديونيات';