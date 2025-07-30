-- إصلاح باقي الدوال بإضافة search_path

CREATE OR REPLACE FUNCTION public.log_financial_operation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (table_name, record_id, action, old_values, new_values, user_id)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END,
    auth.uid()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_log_expense_to_treasury()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  default_account_id UUID;
BEGIN
  -- Get the default cash account (first active cash account)
  SELECT id INTO default_account_id 
  FROM public.treasury_accounts 
  WHERE account_type = 'cash' AND is_active = true 
  ORDER BY created_at ASC 
  LIMIT 1;

  -- If we have a default account, log the expense
  IF default_account_id IS NOT NULL THEN
    INSERT INTO public.treasury_transactions (
      transaction_type,
      amount,
      from_account_id,
      reference_type,
      reference_id,
      description,
      processed_by,
      transaction_date
    ) VALUES (
      'expense',
      NEW.amount,
      default_account_id,
      'expense',
      NEW.id,
      'مصروف: ' || NEW.title,
      NEW.recorded_by,
      NEW.expense_date
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_log_revenue_to_treasury()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  default_account_id UUID;
BEGIN
  -- Get the default cash account
  SELECT id INTO default_account_id 
  FROM public.treasury_accounts 
  WHERE account_type = 'cash' AND is_active = true 
  ORDER BY created_at ASC 
  LIMIT 1;

  -- If we have a default account, log the revenue
  IF default_account_id IS NOT NULL THEN
    INSERT INTO public.treasury_transactions (
      transaction_type,
      amount,
      to_account_id,
      reference_type,
      reference_id,
      description,
      processed_by,
      transaction_date
    ) VALUES (
      'revenue',
      NEW.amount,
      default_account_id,
      'revenue',
      NEW.id,
      'إيراد: ' || NEW.title,
      NEW.recorded_by,
      NEW.revenue_date
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_financial_activity(p_operation_type text, p_description text, p_amount numeric, p_source_table text, p_source_id uuid, p_related_table text DEFAULT NULL::text, p_related_id uuid DEFAULT NULL::uuid, p_user_id uuid DEFAULT NULL::uuid, p_metadata jsonb DEFAULT NULL::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.activity_logs (
    operation_type,
    description,
    amount,
    source_table,
    source_id,
    related_table,
    related_id,
    user_id,
    metadata
  ) VALUES (
    p_operation_type,
    p_description,
    p_amount,
    p_source_table,
    p_source_id,
    p_related_table,
    p_related_id,
    COALESCE(p_user_id, auth.uid()),
    p_metadata
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;