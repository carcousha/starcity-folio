-- Critical Security Fixes - Phase 1: RLS Policies and Database Security

-- Add missing RLS policies for budget_limits table
CREATE POLICY "Only admins can manage budget limits" 
ON public.budget_limits 
FOR ALL 
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

-- Add missing RLS policies for permission_settings table  
CREATE POLICY "Only admins can manage permission settings"
ON public.permission_settings
FOR ALL
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

-- Create settings table with proper RLS (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  key text NOT NULL,
  value text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(category, key)
);

-- Enable RLS on settings table
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for settings table
CREATE POLICY "Only admins can manage settings"
ON public.settings
FOR ALL  
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

-- Enhance secure_role_change function with additional security
CREATE OR REPLACE FUNCTION public.secure_role_change(
  target_user_id uuid,
  new_role app_role,
  reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_role app_role;
  target_user_profile RECORD;
  result jsonb;
BEGIN
  -- Get current user's role
  SELECT role INTO current_user_role 
  FROM public.profiles 
  WHERE user_id = auth.uid() AND is_active = true;
  
  -- Only admins can change roles
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'غير مصرح: فقط المديرين يمكنهم تغيير الأدوار';
  END IF;
  
  -- Get target user profile
  SELECT * INTO target_user_profile
  FROM public.profiles 
  WHERE user_id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'المستخدم المستهدف غير موجود';
  END IF;
  
  -- Prevent self-role change for admins (security measure)
  IF target_user_id = auth.uid() AND current_user_role = 'admin' THEN
    RAISE EXCEPTION 'لا يمكن للمدير تغيير دوره الخاص';
  END IF;
  
  -- Log the role change attempt
  PERFORM public.log_financial_activity(
    'secure_role_change',
    'تغيير دور المستخدم من ' || target_user_profile.role || ' إلى ' || new_role || 
    CASE WHEN reason IS NOT NULL THEN ' - السبب: ' || reason ELSE '' END,
    0,
    'profiles',
    target_user_profile.id,
    'security_events',
    NULL,
    auth.uid(),
    jsonb_build_object(
      'target_user_id', target_user_id,
      'old_role', target_user_profile.role,
      'new_role', new_role,
      'reason', reason,
      'security_level', 'HIGH'
    )
  );
  
  -- Update the role
  UPDATE public.profiles 
  SET 
    role = new_role,
    updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Log successful role change
  PERFORM public.log_security_event(
    'role_change_successful',
    'تم تغيير دور المستخدم بنجاح: ' || target_user_profile.first_name || ' ' || target_user_profile.last_name,
    'HIGH',
    auth.uid(),
    jsonb_build_object(
      'target_user_id', target_user_id,
      'old_role', target_user_profile.role,
      'new_role', new_role,
      'action', 'role_change'
    )
  );
  
  result := jsonb_build_object(
    'success', true,
    'message', 'تم تغيير الدور بنجاح',
    'old_role', target_user_profile.role,
    'new_role', new_role
  );
  
  RETURN result;
END;
$$;

-- Create enhanced input validation function
CREATE OR REPLACE FUNCTION public.validate_input_security(
  input_text text,
  input_type text DEFAULT 'general'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check for null or empty input
  IF input_text IS NULL OR trim(input_text) = '' THEN
    RETURN false;
  END IF;
  
  -- Check for potential XSS patterns
  IF input_text ~* '<script|javascript:|onload=|onerror=|<iframe|<object|<embed' THEN
    PERFORM public.log_security_event(
      'xss_attempt',
      'محاولة XSS مكتشفة في المدخل: ' || left(input_text, 100),
      'HIGH',
      auth.uid(),
      jsonb_build_object('input_type', input_type, 'suspicious_input', left(input_text, 200))
    );
    RETURN false;
  END IF;
  
  -- Check for SQL injection patterns
  IF input_text ~* '(union|select|insert|update|delete|drop|create|alter|exec|execute|\bor\b|\band\b)(\s|$)' THEN
    PERFORM public.log_security_event(
      'sql_injection_attempt',
      'محاولة SQL injection مكتشفة',
      'CRITICAL',
      auth.uid(),
      jsonb_build_object('input_type', input_type, 'suspicious_input', left(input_text, 200))
    );
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Enhanced password strength validation with server-side enforcement
CREATE OR REPLACE FUNCTION public.validate_password_strength_enhanced(password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
  issues text[] := '{}';
  score integer := 0;
  common_passwords text[] := ARRAY[
    '123456', 'password', '123456789', '12345678', '12345', '1234567', 
    '1234567890', 'qwerty', 'abc123', 'Password1', 'password123', 
    'admin', 'letmein', 'welcome', 'monkey', '111111', 'dragon',
    'sunshine', 'princess', 'football', 'iloveyou', 'charlie'
  ];
  blocked_patterns text[] := ARRAY[
    'password', '123456', 'qwerty', 'admin', 'root', 'user'
  ];
  pattern text;
BEGIN
  -- Length check (minimum 12 characters for enhanced security)
  IF length(password) < 12 THEN
    issues := array_append(issues, 'كلمة المرور يجب أن تكون 12 حرف على الأقل');
  ELSE
    score := score + 2;
  END IF;
  
  -- Uppercase letter check
  IF password !~ '[A-Z]' THEN
    issues := array_append(issues, 'يجب أن تحتوي على حرف كبير واحد على الأقل');
  ELSE
    score := score + 1;
  END IF;
  
  -- Lowercase letter check
  IF password !~ '[a-z]' THEN
    issues := array_append(issues, 'يجب أن تحتوي على حرف صغير واحد على الأقل');
  ELSE
    score := score + 1;
  END IF;
  
  -- Number check
  IF password !~ '[0-9]' THEN
    issues := array_append(issues, 'يجب أن تحتوي على رقم واحد على الأقل');
  ELSE
    score := score + 1;
  END IF;
  
  -- Special character check
  IF password !~ '[!@#$%^&*(),.?":{}|<>]' THEN
    issues := array_append(issues, 'يجب أن تحتوي على رمز خاص واحد على الأقل (!@#$%^&*)');
  ELSE
    score := score + 1;
  END IF;
  
  -- Check against common passwords
  IF lower(password) = ANY(common_passwords) THEN
    issues := array_append(issues, 'كلمة المرور ضعيفة جداً - يرجى اختيار كلمة مرور أقوى');
    score := 0;
  END IF;
  
  -- Check for blocked patterns
  FOREACH pattern IN ARRAY blocked_patterns
  LOOP
    IF lower(password) LIKE '%' || pattern || '%' THEN
      issues := array_append(issues, 'كلمة المرور تحتوي على نمط غير مسموح: ' || pattern);
      score := score - 1;
    END IF;
  END LOOP;
  
  -- Ensure score is not negative
  IF score < 0 THEN
    score := 0;
  END IF;
  
  result := jsonb_build_object(
    'is_valid', array_length(issues, 1) IS NULL AND score >= 5,
    'score', score,
    'max_score', 6,
    'strength', CASE 
      WHEN score >= 6 THEN 'قوية جداً'
      WHEN score >= 5 THEN 'قوية'
      WHEN score >= 4 THEN 'متوسطة'
      WHEN score >= 2 THEN 'ضعيفة'
      ELSE 'ضعيفة جداً'
    END,
    'issues', to_jsonb(issues)
  );
  
  RETURN result;
END;
$$;

-- Create session security function
CREATE OR REPLACE FUNCTION public.validate_session_security()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_profile RECORD;
  last_activity_check interval;
BEGIN
  -- Get current user profile
  SELECT * INTO user_profile
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if user is active
  IF NOT user_profile.is_active THEN
    PERFORM public.log_security_event(
      'inactive_user_access_attempt',
      'محاولة وصول من مستخدم غير نشط',
      'HIGH',
      auth.uid(),
      jsonb_build_object('user_profile', to_jsonb(user_profile))
    );
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Update all financial functions to use proper search_path
CREATE OR REPLACE FUNCTION public.log_auth_attempt(
  p_attempt_type text,
  p_user_identifier text,
  p_success boolean,
  p_error_message text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  attempt_id uuid;
BEGIN
  INSERT INTO public.auth_attempts (
    attempt_type,
    user_identifier,
    success,
    error_message,
    metadata
  ) VALUES (
    p_attempt_type,
    p_user_identifier,
    p_success,
    p_error_message,
    p_metadata
  ) RETURNING id INTO attempt_id;
  
  -- Log high-risk failed attempts
  IF NOT p_success AND p_attempt_type IN ('login', 'signup', 'password_reset') THEN
    PERFORM public.log_security_event(
      'failed_authentication',
      'فشل في المصادقة: ' || p_attempt_type || ' للمستخدم: ' || p_user_identifier,
      'MEDIUM',
      NULL,
      jsonb_build_object(
        'attempt_type', p_attempt_type,
        'user_identifier', p_user_identifier,
        'error_message', p_error_message
      )
    );
  END IF;
  
  RETURN attempt_id;
END;
$$;