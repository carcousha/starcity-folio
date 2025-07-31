-- Final Security Fixes - Fix remaining security issues

-- Check and fix any remaining functions missing search_path
-- First, let's identify which functions still need fixing by checking the pg_proc table
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Update any remaining functions that don't have search_path set
    FOR func_record IN 
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.prosecdef = true  -- Security definer functions
        AND NOT EXISTS (
            SELECT 1 FROM pg_proc_config pc 
            WHERE pc.oid = p.oid 
            AND pc.setting[1] = 'search_path'
        )
    LOOP
        RAISE NOTICE 'Function needs search_path fix: %.%(%) ', 
            func_record.schema_name, 
            func_record.function_name, 
            func_record.args;
    END LOOP;
END $$;

-- Fix update_treasury_balance function
CREATE OR REPLACE FUNCTION public.update_treasury_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- For deposits (money coming in)
  IF NEW.transaction_type IN ('deposit', 'revenue', 'commission', 'debt_payment', 'rental_payment') THEN
    UPDATE public.treasury_accounts 
    SET current_balance = current_balance + NEW.amount,
        updated_at = now()
    WHERE id = NEW.to_account_id;
  END IF;

  -- For withdrawals (money going out)
  IF NEW.transaction_type IN ('withdrawal', 'expense') THEN
    UPDATE public.treasury_accounts 
    SET current_balance = current_balance - NEW.amount,
        updated_at = now()
    WHERE id = NEW.from_account_id;
  END IF;

  -- For transfers (money moving between accounts)
  IF NEW.transaction_type = 'transfer' THEN
    -- Deduct from source account
    UPDATE public.treasury_accounts 
    SET current_balance = current_balance - NEW.amount,
        updated_at = now()
    WHERE id = NEW.from_account_id;
    
    -- Add to destination account
    UPDATE public.treasury_accounts 
    SET current_balance = current_balance + NEW.amount,
        updated_at = now()
    WHERE id = NEW.to_account_id;
  END IF;

  RETURN NEW;
END;
$function$;

-- Fix update_commission_employee_calculations function
CREATE OR REPLACE FUNCTION public.update_commission_employee_calculations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    commission_record RECORD;
    employee_debt NUMERIC := 0;
BEGIN
    -- Get commission details
    SELECT remaining_for_employees INTO commission_record
    FROM public.commissions 
    WHERE id = NEW.commission_id;
    
    -- Calculate employee's share based on percentage
    NEW.calculated_share = (commission_record.remaining_for_employees * NEW.percentage) / 100;
    
    -- Get employee's debt amount
    SELECT COALESCE(SUM(amount), 0) INTO employee_debt
    FROM public.debts 
    WHERE debtor_id = NEW.employee_id 
    AND status = 'pending';
    
    -- Calculate deducted debt (min of debt and calculated share)
    NEW.deducted_debt = LEAST(employee_debt, NEW.calculated_share);
    
    -- Calculate net share
    NEW.net_share = NEW.calculated_share - NEW.deducted_debt;
    
    -- Update debt status if fully deducted
    IF NEW.deducted_debt > 0 THEN
        UPDATE public.debts 
        SET status = 'paid', paid_at = now()
        WHERE debtor_id = NEW.employee_id 
        AND status = 'pending'
        AND amount <= NEW.deducted_debt;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Fix process_commission_debt_deduction function  
CREATE OR REPLACE FUNCTION public.process_commission_debt_deduction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  pending_debts NUMERIC := 0;
  debt_record RECORD;
  remaining_amount NUMERIC;
  deduction_amount NUMERIC;
  total_deducted NUMERIC := 0;
BEGIN
  -- حساب إجمالي الديون المعلقة للموظف مع التفضيل للخصم التلقائي
  SELECT COALESCE(SUM(amount), 0) INTO pending_debts
  FROM public.debts 
  WHERE debtor_id = NEW.employee_id 
  AND status = 'pending'
  AND auto_deduct_from_commission = true;
  
  IF pending_debts > 0 AND NEW.calculated_share > 0 THEN
    remaining_amount := NEW.calculated_share;
    
    -- معالجة كل دين على حدة (حسب الأولوية)
    FOR debt_record IN 
      SELECT * FROM public.debts 
      WHERE debtor_id = NEW.employee_id 
      AND status = 'pending'
      AND auto_deduct_from_commission = true
      ORDER BY priority_level DESC, created_at ASC
    LOOP
      IF remaining_amount <= 0 THEN
        EXIT;
      END IF;
      
      -- حساب مبلغ الخصم
      deduction_amount := LEAST(debt_record.amount, remaining_amount);
      total_deducted := total_deducted + deduction_amount;
      remaining_amount := remaining_amount - deduction_amount;
      
      -- تحديث الدين
      IF deduction_amount >= debt_record.amount THEN
        -- سداد كامل
        UPDATE public.debts 
        SET 
          status = 'paid',
          paid_at = now(),
          description = COALESCE(description, '') || ' (تم السداد من العمولة)'
        WHERE id = debt_record.id;
      ELSE
        -- سداد جزئي
        UPDATE public.debts 
        SET 
          amount = amount - deduction_amount,
          description = COALESCE(description, '') || ' (خصم جزئي من العمولة: ' || deduction_amount || ' د.إ)'
        WHERE id = debt_record.id;
      END IF;
      
      -- تسجيل عملية الخصم في السجل
      PERFORM public.log_financial_activity(
        'debt_deduction_from_commission',
        'خصم دين من العمولة: ' || deduction_amount || ' د.إ لـ' || debt_record.debtor_name,
        deduction_amount,
        'commission_employees',
        NEW.id,
        'debts',
        debt_record.id,
        auth.uid(),
        jsonb_build_object(
          'debt_id', debt_record.id,
          'commission_id', NEW.commission_id,
          'employee_id', NEW.employee_id,
          'deduction_amount', deduction_amount,
          'debt_description', debt_record.description
        )
      );
    END LOOP;
  END IF;
  
  -- تحديث المبالغ المحسوبة
  NEW.deducted_debt = total_deducted;
  NEW.net_share = NEW.calculated_share - total_deducted;
  
  RETURN NEW;
END;
$function$;