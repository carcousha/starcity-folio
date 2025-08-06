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
    is_debt_related,
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
    TRUE,
    NEW.recorded_by,
    NEW.recorded_by
  ) RETURNING id INTO expense_id_var;
  
  -- ربط المديونية بالمصروف
  NEW.expense_id := expense_id_var;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- إنشاء المشغلات
DROP TRIGGER IF EXISTS debt_create_expense_trigger ON public.debts;
CREATE TRIGGER debt_create_expense_trigger
  BEFORE INSERT ON public.debts
  FOR EACH ROW
  EXECUTE FUNCTION public.create_expense_for_debt();

DROP TRIGGER IF EXISTS debt_update_expense_trigger ON public.debts;
CREATE TRIGGER debt_update_expense_trigger
  AFTER UPDATE ON public.debts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_expense_for_debt();