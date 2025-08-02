-- Fix search paths for existing security functions

-- Treasury transactions policies (if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'treasury_transactions' 
    AND policyname = 'Accountant and admin can manage treasury transactions'
  ) THEN
    CREATE POLICY "Accountant and admin can manage treasury transactions" 
    ON public.treasury_transactions 
    FOR ALL 
    USING (is_accountant_or_admin())
    WITH CHECK (is_accountant_or_admin());
  END IF;
END $$;

-- Fix all functions with missing search paths
CREATE OR REPLACE FUNCTION public.update_tasks_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_task_assignment()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $function$
DECLARE
    task_title TEXT;
    assigner_name TEXT;
BEGIN
    SELECT title INTO task_title 
    FROM public.tasks 
    WHERE id = NEW.task_id;
    
    SELECT first_name || ' ' || last_name INTO assigner_name 
    FROM public.profiles 
    WHERE user_id = NEW.assigned_by;
    
    PERFORM public.create_task_notification(
        NEW.task_id,
        NEW.assigned_to,
        'assigned',
        'مهمة جديدة',
        'تم تعيين مهمة جديدة لك: ' || task_title || ' بواسطة ' || COALESCE(assigner_name, 'المدير')
    );
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_budget_limit()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $function$
DECLARE
  monthly_total NUMERIC := 0;
  yearly_total NUMERIC := 0;
  budget_limit RECORD;
  current_month_start DATE;
  current_year_start DATE;
BEGIN
  current_month_start := DATE_TRUNC('month', NEW.expense_date);
  current_year_start := DATE_TRUNC('year', NEW.expense_date);
  
  SELECT * INTO budget_limit 
  FROM public.budget_limits 
  WHERE category = NEW.category 
  AND is_active = true 
  LIMIT 1;
  
  IF budget_limit.id IS NOT NULL THEN
    SELECT COALESCE(SUM(amount), 0) INTO monthly_total
    FROM public.expenses 
    WHERE category = NEW.category 
    AND expense_date >= current_month_start 
    AND expense_date < current_month_start + INTERVAL '1 month'
    AND id != NEW.id;
    
    SELECT COALESCE(SUM(amount), 0) INTO yearly_total
    FROM public.expenses 
    WHERE category = NEW.category 
    AND expense_date >= current_year_start 
    AND expense_date < current_year_start + INTERVAL '1 year'
    AND id != NEW.id;
    
    monthly_total := monthly_total + NEW.amount;
    yearly_total := yearly_total + NEW.amount;
    
    IF budget_limit.monthly_limit > 0 AND monthly_total > (budget_limit.monthly_limit * budget_limit.alert_threshold / 100) THEN
      PERFORM public.log_financial_activity(
        'budget_alert',
        'تحذير: تم تجاوز ' || budget_limit.alert_threshold || '% من الحد الشهري لفئة ' || NEW.category || '. المصروف: ' || monthly_total || ' من أصل ' || budget_limit.monthly_limit,
        monthly_total,
        'expenses',
        NEW.id,
        'budget_limits',
        budget_limit.id,
        NEW.recorded_by,
        jsonb_build_object(
          'alert_type', 'monthly_threshold',
          'category', NEW.category,
          'current_amount', monthly_total,
          'limit_amount', budget_limit.monthly_limit,
          'percentage', (monthly_total / budget_limit.monthly_limit * 100)
        )
      );
    END IF;
    
    IF budget_limit.yearly_limit > 0 AND yearly_total > (budget_limit.yearly_limit * budget_limit.alert_threshold / 100) THEN
      PERFORM public.log_financial_activity(
        'budget_alert',
        'تحذير: تم تجاوز ' || budget_limit.alert_threshold || '% من الحد السنوي لفئة ' || NEW.category || '. المصروف: ' || yearly_total || ' من أصل ' || budget_limit.yearly_limit,
        yearly_total,
        'expenses',
        NEW.id,
        'budget_limits',
        budget_limit.id,
        NEW.recorded_by,
        jsonb_build_object(
          'alert_type', 'yearly_threshold',
          'category', NEW.category,
          'current_amount', yearly_total,
          'limit_amount', budget_limit.yearly_limit,
          'percentage', (yearly_total / budget_limit.yearly_limit * 100)
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_monthly_budget_report(target_month date DEFAULT CURRENT_DATE)
RETURNS TABLE(category text, monthly_limit numeric, actual_spent numeric, remaining_budget numeric, percentage_used numeric, status text, transaction_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  month_start DATE;
  month_end DATE;
BEGIN
  month_start := DATE_TRUNC('month', target_month);
  month_end := month_start + INTERVAL '1 month';
  
  RETURN QUERY
  SELECT 
    bl.category,
    bl.monthly_limit,
    COALESCE(SUM(e.amount), 0) as actual_spent,
    GREATEST(bl.monthly_limit - COALESCE(SUM(e.amount), 0), 0) as remaining_budget,
    CASE 
      WHEN bl.monthly_limit > 0 THEN (COALESCE(SUM(e.amount), 0) / bl.monthly_limit * 100)
      ELSE 0 
    END as percentage_used,
    CASE 
      WHEN bl.monthly_limit = 0 THEN 'بدون حد'
      WHEN COALESCE(SUM(e.amount), 0) >= bl.monthly_limit THEN 'تجاوز الحد'
      WHEN COALESCE(SUM(e.amount), 0) >= (bl.monthly_limit * bl.alert_threshold / 100) THEN 'اقتراب من الحد'
      ELSE 'ضمن الحد'
    END as status,
    COUNT(e.id)::INTEGER as transaction_count
  FROM public.budget_limits bl
  LEFT JOIN public.expenses e ON bl.category = e.category 
    AND e.expense_date >= month_start 
    AND e.expense_date < month_end
  WHERE bl.is_active = true
  GROUP BY bl.category, bl.monthly_limit, bl.alert_threshold
  ORDER BY percentage_used DESC;
END;
$function$;