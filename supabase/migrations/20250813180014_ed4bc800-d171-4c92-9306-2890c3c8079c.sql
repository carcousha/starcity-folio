-- Security Fix Migration: Critical Issues
-- Fix missing RLS policies, function security, and input validation

-- 1. Fix missing RLS policies for incentive_rules table
CREATE TABLE IF NOT EXISTS public.incentive_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name text NOT NULL,
  target_type text NOT NULL,
  achievement_percentage numeric NOT NULL DEFAULT 100,
  incentive_type text NOT NULL DEFAULT 'percentage',
  incentive_value numeric NOT NULL DEFAULT 0,
  max_incentive_amount numeric,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.incentive_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies for incentive_rules (admin only)
CREATE POLICY "Only admins can manage incentive rules"
ON public.incentive_rules
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  )
);

-- 2. Create user_permissions table with proper RLS
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  permission_name text NOT NULL,
  granted_by uuid NOT NULL,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE(user_id, permission_name)
);

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_permissions (admin only)
CREATE POLICY "Only admins can manage user permissions"
ON public.user_permissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  )
);

-- 3. Fix search path security for all functions
-- Update existing functions to have secure search path

-- Fix has_role function
CREATE OR REPLACE FUNCTION public.has_role(_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = _role
  );
$function$;

-- Fix is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$function$;

-- Fix is_employee function
CREATE OR REPLACE FUNCTION public.is_employee()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'accountant', 'employee')
  );
$function$;

-- 4. Enhanced input validation function
CREATE OR REPLACE FUNCTION public.validate_phone_number(phone_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Remove all non-digit characters
  phone_input := regexp_replace(phone_input, '[^0-9]', '', 'g');
  
  -- Check if phone number is valid (UAE format)
  -- UAE numbers: +971XXXXXXXXX or 971XXXXXXXXX or 05XXXXXXXX
  IF phone_input ~ '^(971[0-9]{9}|05[0-9]{8})$' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$function$;

-- 5. Enhanced rate limiting with fail-secure approach
CREATE OR REPLACE FUNCTION public.check_rate_limit_secure(user_email text, max_attempts integer DEFAULT 5, time_window_minutes integer DEFAULT 15)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  attempt_count integer;
  window_start timestamp;
BEGIN
  window_start := now() - (time_window_minutes || ' minutes')::interval;
  
  -- Count failed attempts in time window
  SELECT COUNT(*) INTO attempt_count
  FROM public.auth_attempts
  WHERE user_identifier = user_email
  AND created_at >= window_start
  AND success = false;
  
  -- Fail secure: if we can't determine attempt count, deny access
  IF attempt_count IS NULL THEN
    PERFORM public.log_security_event(
      'rate_limit_check_failed',
      'Failed to check rate limit for user: ' || user_email,
      'HIGH',
      NULL,
      jsonb_build_object('user_email', user_email, 'reason', 'null_attempt_count')
    );
    RETURN false;
  END IF;
  
  -- Check if rate limit exceeded
  IF attempt_count >= max_attempts THEN
    PERFORM public.log_security_event(
      'rate_limit_exceeded',
      'Rate limit exceeded for user: ' || user_email || ' (' || attempt_count || ' attempts)',
      'HIGH',
      NULL,
      jsonb_build_object(
        'user_email', user_email,
        'attempts_count', attempt_count,
        'time_window_minutes', time_window_minutes
      )
    );
    RETURN false;
  END IF;
  
  RETURN true;
END;
$function$;

-- 6. Function to prevent admin self-deactivation
CREATE OR REPLACE FUNCTION public.validate_admin_deactivation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  admin_count integer;
BEGIN
  -- Check if this is an admin being deactivated
  IF OLD.role = 'admin' AND OLD.is_active = true AND NEW.is_active = false THEN
    -- Count remaining active admins (excluding this one)
    SELECT COUNT(*) INTO admin_count
    FROM public.profiles
    WHERE role = 'admin' 
    AND is_active = true 
    AND user_id != NEW.user_id;
    
    -- Prevent deactivation if this is the last admin
    IF admin_count = 0 THEN
      RAISE EXCEPTION 'Cannot deactivate the last admin user. System must have at least one active admin.';
    END IF;
    
    -- Prevent self-deactivation
    IF NEW.user_id = auth.uid() THEN
      RAISE EXCEPTION 'Admins cannot deactivate themselves. Another admin must perform this action.';
    END IF;
    
    -- Log security event
    PERFORM public.log_security_event(
      'admin_deactivation',
      'Admin user deactivated: ' || OLD.first_name || ' ' || OLD.last_name,
      'HIGH',
      auth.uid(),
      jsonb_build_object(
        'deactivated_user_id', NEW.user_id,
        'deactivated_by', auth.uid(),
        'remaining_admins', admin_count
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for admin deactivation validation
DROP TRIGGER IF EXISTS validate_admin_deactivation_trigger ON public.profiles;
CREATE TRIGGER validate_admin_deactivation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_admin_deactivation();

-- 7. Enhanced audit logging for role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Log role changes
  IF OLD.role != NEW.role THEN
    PERFORM public.log_security_event(
      'role_change',
      'User role changed from ' || OLD.role || ' to ' || NEW.role,
      'HIGH',
      auth.uid(),
      jsonb_build_object(
        'target_user_id', NEW.user_id,
        'old_role', OLD.role,
        'new_role', NEW.role,
        'changed_by', auth.uid(),
        'target_user_name', NEW.first_name || ' ' || NEW.last_name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for role change logging
DROP TRIGGER IF EXISTS log_role_change_trigger ON public.profiles;
CREATE TRIGGER log_role_change_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION public.log_role_change();