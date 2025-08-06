-- إضافة عمود جديد لتمييز نوع المديونية
ALTER TABLE public.debts 
ADD COLUMN debt_category text DEFAULT 'debt';

-- تحديث السلف الموجودة
UPDATE public.debts 
SET debt_category = 'advance'
WHERE auto_deduct_from_commission = true 
  AND debtor_type = 'employee';

-- إضافة تعليق للشرح
COMMENT ON COLUMN public.debts.debt_category IS 'نوع المديونية: advance (سلفة), debt (دين عادي), penalty (مخالفة), salary_deduction (خصم راتب)';

-- إنشاء دالة لتسجيل النشاط المالي للسلف
CREATE OR REPLACE FUNCTION public.log_advance_activity(
  p_operation_type text,
  p_description text,
  p_amount numeric DEFAULT 0,
  p_source_table text DEFAULT 'debts',
  p_source_id uuid DEFAULT NULL,
  p_employee_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  activity_id uuid;
BEGIN
  INSERT INTO public.activity_logs (
    operation_type,
    description,
    amount,
    source_table,
    source_id,
    user_id,
    metadata
  ) VALUES (
    p_operation_type,
    p_description,
    p_amount,
    p_source_table,
    p_source_id,
    COALESCE(p_employee_id, auth.uid()),
    COALESCE(p_metadata, '{}'::jsonb)
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;