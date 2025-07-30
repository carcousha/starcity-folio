-- إصلاح جميع الدوال الموجودة بإضافة search_path

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    NEW.commission_amount = NEW.amount * (NEW.commission_rate / 100);
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_commission_distribution()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Calculate office share (50% of total commission)
    NEW.office_share = NEW.total_commission * 0.5;
    
    -- Calculate remaining for employees (50% of total commission)
    NEW.remaining_for_employees = NEW.total_commission * 0.5;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_commission_employee_calculations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.update_treasury_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- For deposits (money coming in)
  IF NEW.transaction_type IN ('deposit', 'revenue', 'commission', 'debt_payment') THEN
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
$$;