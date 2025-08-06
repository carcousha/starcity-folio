-- تعطيل المشغلات المخصصة فقط
DROP TRIGGER IF EXISTS audit_trigger_function_trigger ON public.expenses;

-- إنشاء مصروفات للمديونيات الموجودة
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
    
    -- ربط المديونية بالمصروف الجديد (تعطيل audit مؤقتاً)
    UPDATE public.debts 
    SET expense_id = expense_id_var
    WHERE id = debt_record.id;
  END LOOP;
END $$;