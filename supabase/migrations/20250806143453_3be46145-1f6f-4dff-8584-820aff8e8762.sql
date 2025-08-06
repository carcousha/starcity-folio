-- حذف الـ constraint الحالي وإعادة إنشاؤه مع CASCADE
ALTER TABLE public.debts 
DROP CONSTRAINT IF EXISTS debts_expense_id_fkey;

-- إعادة إنشاء الـ foreign key مع ON DELETE CASCADE
ALTER TABLE public.debts 
ADD CONSTRAINT debts_expense_id_fkey 
FOREIGN KEY (expense_id) 
REFERENCES public.expenses(id) 
ON DELETE CASCADE;

-- إنشاء دالة لحذف آمن للمصروفات المرتبطة بالديون
CREATE OR REPLACE FUNCTION public.safe_delete_expense(expense_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  expense_record RECORD;
  linked_debt_count INTEGER;
BEGIN
  -- التحقق من صلاحية المستخدم
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'accountant') 
      AND is_active = true
    )
  ) THEN
    RAISE EXCEPTION 'غير مصرح: لا تملك صلاحية حذف المصروفات';
  END IF;

  -- جلب بيانات المصروف
  SELECT * INTO expense_record 
  FROM public.expenses 
  WHERE id = expense_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'المصروف غير موجود';
  END IF;

  -- فحص وجود ديون مرتبطة
  SELECT COUNT(*) INTO linked_debt_count
  FROM public.debts 
  WHERE expense_id = expense_id_param;

  -- حذف الديون المرتبطة أولاً (إن وجدت)
  IF linked_debt_count > 0 THEN
    DELETE FROM public.debts WHERE expense_id = expense_id_param;
  END IF;

  -- حذف المصروف
  DELETE FROM public.expenses WHERE id = expense_id_param;

  -- تسجيل العملية
  PERFORM public.log_financial_activity(
    'expense_deleted_with_debts',
    'تم حذف مصروف مع الديون المرتبطة: ' || expense_record.title,
    expense_record.amount,
    'expenses',
    expense_id_param,
    NULL,
    NULL,
    auth.uid(),
    jsonb_build_object(
      'expense_title', expense_record.title,
      'linked_debts_count', linked_debt_count,
      'amount', expense_record.amount
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'تم حذف المصروف بنجاح',
    'deleted_linked_debts', linked_debt_count
  );
END;
$$;