-- Critical Security Fixes Part 2: Database Functions and Views

-- Fix Security Definer View issue by recreating employee_commission_statement as a regular view
DROP VIEW IF EXISTS public.employee_commission_statement;

CREATE VIEW public.employee_commission_statement AS
SELECT 
  p.user_id as employee_id,
  (p.first_name || ' ' || p.last_name) as employee_name,
  p.email as employee_email,
  COUNT(ce.id) as total_commissions_count,
  COALESCE(SUM(ce.calculated_share), 0) as total_calculated_commissions,
  COALESCE(SUM(ce.deducted_debt), 0) as total_deducted_debts,
  COALESCE(SUM(ce.net_share), 0) as total_net_commissions,
  COALESCE(SUM(CASE WHEN c.status = 'paid' THEN ce.net_share ELSE 0 END), 0) as total_paid_commissions,
  COALESCE(SUM(CASE WHEN c.status = 'pending' THEN ce.net_share ELSE 0 END), 0) as total_pending_commissions,
  COALESCE((SELECT SUM(amount) FROM public.debts WHERE debtor_id = p.user_id AND status = 'pending'), 0) as current_total_debts,
  COALESCE((SELECT SUM(calculated_amount) FROM public.applied_incentives WHERE employee_id = p.user_id), 0) as total_incentives
FROM public.profiles p
LEFT JOIN public.commission_employees ce ON p.user_id = ce.employee_id
LEFT JOIN public.commissions c ON ce.commission_id = c.id
GROUP BY p.user_id, p.first_name, p.last_name, p.email;

-- Fix remaining functions missing search_path
CREATE OR REPLACE FUNCTION public.auto_log_expense_to_treasury()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.auto_log_revenue_to_treasury()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

-- Add server-side role validation function
CREATE OR REPLACE FUNCTION public.validate_role_access(required_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = required_role 
    AND is_active = true
  );
$function$;

-- Create secure logging function for authentication attempts
CREATE OR REPLACE FUNCTION public.log_auth_attempt(
  attempt_type text,
  user_identifier text,
  success boolean,
  error_message text DEFAULT NULL,
  metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  log_id uuid;
BEGIN
  -- Input validation
  IF attempt_type IS NULL OR user_identifier IS NULL THEN
    RAISE EXCEPTION 'نوع المحاولة ومعرف المستخدم مطلوبان';
  END IF;

  INSERT INTO public.auth_attempts (
    attempt_type,
    user_identifier,
    success,
    error_message,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    attempt_type,
    user_identifier,
    success,
    error_message,
    metadata,
    COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', 'unknown'),
    COALESCE(current_setting('request.headers', true)::json->>'user-agent', 'unknown')
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$function$;

-- Enhanced rate limiting function with proper validation
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  identifier text,
  max_attempts integer DEFAULT 5,
  window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  attempt_count integer;
  window_start timestamp;
BEGIN
  -- Input validation
  IF identifier IS NULL OR max_attempts <= 0 OR window_minutes <= 0 THEN
    RETURN false;
  END IF;

  window_start := now() - interval '1 minute' * window_minutes;
  
  SELECT COUNT(*) INTO attempt_count
  FROM public.auth_attempts
  WHERE user_identifier = identifier
    AND created_at >= window_start
    AND success = false;
  
  RETURN attempt_count < max_attempts;
END;
$function$;

-- Create trigger to validate role changes
CREATE OR REPLACE FUNCTION public.validate_role_change_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  current_user_role app_role;
BEGIN
  -- Only allow role changes by admins
  SELECT role INTO current_user_role 
  FROM public.profiles 
  WHERE user_id = auth.uid() AND is_active = true;
  
  IF current_user_role != 'admin' AND OLD.role != NEW.role THEN
    RAISE EXCEPTION 'غير مصرح: فقط المدير يمكنه تغيير الأدوار';
  END IF;
  
  -- Log the role change attempt
  PERFORM public.log_financial_activity(
    CASE WHEN OLD.role = NEW.role THEN 'profile_updated' ELSE 'role_change_attempted' END,
    'محاولة تغيير دور من ' || OLD.role || ' إلى ' || NEW.role,
    0,
    'profiles',
    NEW.id,
    'user_roles',
    NULL,
    auth.uid(),
    jsonb_build_object(
      'old_role', OLD.role,
      'new_role', NEW.role,
      'target_user_id', NEW.user_id,
      'security_event', 'role_change'
    )
  );
  
  RETURN NEW;
END;
$function$;

-- Create trigger for role validation
DROP TRIGGER IF EXISTS validate_role_changes ON public.profiles;
CREATE TRIGGER validate_role_changes
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_change_trigger();