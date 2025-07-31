-- Final security fixes: Add search path to remaining functions

-- Add search path to validate_role_change_trigger
CREATE OR REPLACE FUNCTION public.validate_role_change_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Add search path to check_rate_limit function  
CREATE OR REPLACE FUNCTION public.check_rate_limit(identifier text, max_attempts integer DEFAULT 5, window_minutes integer DEFAULT 15)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;