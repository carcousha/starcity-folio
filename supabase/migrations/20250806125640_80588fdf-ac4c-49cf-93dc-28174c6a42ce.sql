-- إضافة عمود جديد لتمييز نوع المديونية مع التعامل مع مشكلة audit trigger
ALTER TABLE public.debts 
ADD COLUMN IF NOT EXISTS debt_category text DEFAULT 'debt';

-- تحديث السلف الموجودة بشكل آمن
UPDATE public.debts 
SET debt_category = 'advance'
WHERE auto_deduct_from_commission = true 
  AND debtor_type = 'employee'
  AND debt_category IS NULL;

-- إضافة تعليق للشرح
COMMENT ON COLUMN public.debts.debt_category IS 'نوع المديونية: advance (سلفة), debt (دين عادي), penalty (مخالفة), salary_deduction (خصم راتب)';

-- تحديث trigger الـ audit ليتعامل مع auth.uid() الفارغ
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      table_name,
      record_id,
      action,
      old_values,
      user_id
    ) VALUES (
      TG_TABLE_NAME,
      OLD.id,
      'DELETE',
      to_jsonb(OLD),
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      table_name,
      record_id,
      action,
      old_values,
      new_values,
      user_id
    ) VALUES (
      TG_TABLE_NAME,
      NEW.id,
      'UPDATE',
      to_jsonb(OLD),
      to_jsonb(NEW),
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      table_name,
      record_id,
      action,
      new_values,
      user_id
    ) VALUES (
      TG_TABLE_NAME,
      NEW.id,
      'INSERT',
      to_jsonb(NEW),
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
    );
    RETURN NEW;
  END IF;
END;
$function$;