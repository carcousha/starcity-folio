-- Complete RLS Policy Coverage for Security Fixes

-- Properties table policies
CREATE POLICY "Employee can manage own properties" 
ON public.properties 
FOR ALL 
USING (listed_by = auth.uid())
WITH CHECK (listed_by = auth.uid());

CREATE POLICY "Admin can manage all properties" 
ON public.properties 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Treasury transactions policies  
CREATE POLICY "Accountant and admin can manage treasury transactions" 
ON public.treasury_transactions 
FOR ALL 
USING (is_accountant_or_admin())
WITH CHECK (is_accountant_or_admin());

-- Fix function search paths for security
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'غير مصرح: يجب استخدام وظيفة secure_role_change لتغيير الأدوار';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_recorded_by()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.recorded_by IS NULL THEN
    NEW.recorded_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_rate_limit_enhanced(user_email text, max_attempts integer DEFAULT 5, time_window_minutes integer DEFAULT 15)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  attempt_count integer;
  window_start timestamp;
BEGIN
  window_start := now() - (time_window_minutes || ' minutes')::interval;
  
  SELECT COUNT(*) INTO attempt_count
  FROM public.auth_attempts
  WHERE user_identifier = user_email
  AND created_at >= window_start
  AND success = false;
  
  IF attempt_count >= max_attempts THEN
    PERFORM public.log_auth_attempt(
      'rate_limit_exceeded',
      user_email,
      false,
      'Rate limit exceeded: ' || attempt_count || ' failed attempts in ' || time_window_minutes || ' minutes',
      jsonb_build_object(
        'attempts_count', attempt_count,
        'time_window_minutes', time_window_minutes,
        'security_level', 'HIGH'
      )
    );
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
  issues text[] := '{}';
  score integer := 0;
  common_passwords text[] := ARRAY['123456', 'password', '123456789', '12345678', '12345', '1234567', '1234567890', 'qwerty', 'abc123', 'Password1', 'password123', 'admin', 'letmein', 'welcome', 'monkey'];
BEGIN
  IF length(password) < 8 THEN
    issues := array_append(issues, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل');
  ELSE
    score := score + 1;
  END IF;
  
  IF password !~ '[A-Z]' THEN
    issues := array_append(issues, 'يجب أن تحتوي على حرف كبير واحد على الأقل');
  ELSE
    score := score + 1;
  END IF;
  
  IF password !~ '[a-z]' THEN
    issues := array_append(issues, 'يجب أن تحتوي على حرف صغير واحد على الأقل');
  ELSE
    score := score + 1;
  END IF;
  
  IF password !~ '[0-9]' THEN
    issues := array_append(issues, 'يجب أن تحتوي على رقم واحد على الأقل');
  ELSE
    score := score + 1;
  END IF;
  
  IF password !~ '[!@#$%^&*(),.?":{}|<>]' THEN
    issues := array_append(issues, 'يجب أن تحتوي على رمز خاص واحد على الأقل (!@#$%^&*)');
  ELSE
    score := score + 1;
  END IF;
  
  IF password = ANY(common_passwords) THEN
    issues := array_append(issues, 'كلمة المرور ضعيفة جداً - يرجى اختيار كلمة مرور أقوى');
    score := 0;
  END IF;
  
  result := jsonb_build_object(
    'is_valid', array_length(issues, 1) IS NULL,
    'score', score,
    'max_score', 5,
    'strength', CASE 
      WHEN score >= 5 THEN 'قوية جداً'
      WHEN score >= 4 THEN 'قوية'
      WHEN score >= 3 THEN 'متوسطة'
      WHEN score >= 2 THEN 'ضعيفة'
      ELSE 'ضعيفة جداً'
    END,
    'issues', to_jsonb(issues)
  );
  
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  description text,
  severity text DEFAULT 'MEDIUM',
  user_id_param uuid DEFAULT auth.uid(),
  metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  event_id uuid;
BEGIN
  INSERT INTO public.activity_logs (
    operation_type,
    description,
    user_id,
    source_table,
    source_id,
    metadata
  ) VALUES (
    'security_event',
    '[' || severity || '] ' || event_type || ': ' || description,
    user_id_param,
    'security_events',
    gen_random_uuid(),
    jsonb_build_object(
      'event_type', event_type,
      'severity', severity,
      'timestamp', now(),
      'user_id', user_id_param,
      'additional_data', metadata
    )
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.security_audit_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
  failed_logins integer;
  privilege_escalations integer;
  suspicious_activities integer;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'غير مصرح: هذه الوظيفة متاحة للمديرين فقط';
  END IF;
  
  SELECT COUNT(*) INTO failed_logins
  FROM public.auth_attempts
  WHERE success = false
  AND created_at >= now() - interval '24 hours';
  
  SELECT COUNT(*) INTO privilege_escalations
  FROM public.activity_logs
  WHERE operation_type = 'unauthorized_role_change_attempt'
  AND created_at >= now() - interval '24 hours';
  
  SELECT COUNT(*) INTO suspicious_activities
  FROM public.activity_logs
  WHERE operation_type = 'security_event'
  AND metadata->>'severity' IN ('HIGH', 'CRITICAL')
  AND created_at >= now() - interval '24 hours';
  
  result := jsonb_build_object(
    'period', '24 hours',
    'failed_logins', failed_logins,
    'privilege_escalation_attempts', privilege_escalations,
    'suspicious_activities', suspicious_activities,
    'overall_risk_level', CASE
      WHEN (failed_logins > 50 OR privilege_escalations > 0 OR suspicious_activities > 10) THEN 'HIGH'
      WHEN (failed_logins > 20 OR suspicious_activities > 5) THEN 'MEDIUM'
      ELSE 'LOW'
    END,
    'generated_at', now()
  );
  
  RETURN result;
END;
$$;