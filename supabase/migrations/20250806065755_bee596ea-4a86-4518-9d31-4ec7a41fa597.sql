-- إضافة حقل expense_id إلى جدول المديونيات
ALTER TABLE public.debts 
ADD COLUMN expense_id UUID REFERENCES public.expenses(id);

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX idx_debts_expense_id ON public.debts(expense_id);

-- دالة لإنشاء مصروف تلقائي عند إضافة مديونية
CREATE OR REPLACE FUNCTION public.create_expense_for_debt()
RETURNS TRIGGER AS $$
DECLARE
  expense_id_var UUID;
BEGIN
  -- إنشاء مصروف تلقائي للمديونية
  INSERT INTO public.expenses (
    title,
    description,
    amount,
    category,
    expense_date,
    expense_type,
    budget_category,
    recorded_by,
    created_by
  ) VALUES (
    'مديونية: ' || NEW.debtor_name,
    COALESCE(NEW.description, 'مديونية من ') || NEW.debtor_name,
    NEW.amount,
    'مديونيات',
    COALESCE(NEW.due_date, CURRENT_DATE),
    'debt',
    'مديونيات',
    NEW.recorded_by,
    NEW.recorded_by
  ) RETURNING id INTO expense_id_var;
  
  -- ربط المديونية بالمصروف
  NEW.expense_id := expense_id_var;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة لتحديث المصروف عند تعديل المديونية
CREATE OR REPLACE FUNCTION public.update_expense_for_debt()
RETURNS TRIGGER AS $$
BEGIN
  -- تحديث المصروف المرتبط
  IF NEW.expense_id IS NOT NULL THEN
    UPDATE public.expenses 
    SET 
      title = 'مديونية: ' || NEW.debtor_name ||
        CASE 
          WHEN NEW.status = 'paid' THEN ' (مسددة)'
          WHEN NEW.status = 'partially_paid' THEN ' (مسددة جزئياً)'
          ELSE ''
        END,
      description = COALESCE(NEW.description, 'مديونية من ') || NEW.debtor_name ||
        CASE 
          WHEN NEW.status = 'paid' THEN ' - تم السداد في ' || COALESCE(NEW.paid_at::date::text, 'غير محدد')
          WHEN NEW.status = 'partially_paid' THEN ' - سداد جزئي'
          ELSE ''
        END,
      amount = NEW.amount,
      expense_date = COALESCE(NEW.due_date, OLD.due_date, CURRENT_DATE),
      updated_at = now()
    WHERE id = NEW.expense_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء المشغلات
CREATE TRIGGER debt_create_expense_trigger
  BEFORE INSERT ON public.debts
  FOR EACH ROW
  EXECUTE FUNCTION public.create_expense_for_debt();

CREATE TRIGGER debt_update_expense_trigger
  AFTER UPDATE ON public.debts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_expense_for_debt();

-- إضافة عمود لتمييز المصروفات المرتبطة بمديونيات
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS is_debt_related BOOLEAN DEFAULT FALSE;

-- تحديث المصروفات الموجودة لتمييز المرتبطة بمديونيات
UPDATE public.expenses 
SET is_debt_related = TRUE 
WHERE expense_type = 'debt' OR category = 'مديونيات';

-- إنشاء مصروفات للمديونيات الموجودة التي لا تملك مصروف مرتبط
DO $$
DECLARE
  debt_record RECORD;
  expense_id_var UUID;
BEGIN
  FOR debt_record IN 
    SELECT * FROM public.debts 
    WHERE expense_id IS NULL
  LOOP
    -- إنشاء مصروف للمديونية الموجودة
    INSERT INTO public.expenses (
      title,
      description,
      amount,
      category,
      expense_date,
      expense_type,
      budget_category,
      is_debt_related,
      recorded_by,
      created_by
    ) VALUES (
      'مديونية: ' || debt_record.debtor_name ||
        CASE 
          WHEN debt_record.status = 'paid' THEN ' (مسددة)'
          WHEN debt_record.status = 'partially_paid' THEN ' (مسددة جزئياً)'
          ELSE ''
        END,
      COALESCE(debt_record.description, 'مديونية من ') || debt_record.debtor_name ||
        CASE 
          WHEN debt_record.status = 'paid' THEN ' - تم السداد في ' || COALESCE(debt_record.paid_at::date::text, 'غير محدد')
          WHEN debt_record.status = 'partially_paid' THEN ' - سداد جزئي'
          ELSE ''
        END,
      debt_record.amount,
      'مديونيات',
      COALESCE(debt_record.due_date, debt_record.created_at::date),
      'debt',
      'مديونيات',
      TRUE,
      debt_record.recorded_by,
      debt_record.recorded_by
    ) RETURNING id INTO expense_id_var;
    
    -- ربط المديونية بالمصروف الجديد
    UPDATE public.debts 
    SET expense_id = expense_id_var
    WHERE id = debt_record.id;
  END LOOP;
END $$;