-- Security Fix - Part 1 (Fixed): Missing RLS Policies and Core Security Functions

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

-- Drop and recreate log_auth_attempt function with proper parameters
DROP FUNCTION IF EXISTS public.log_auth_attempt(text,text,boolean,text,jsonb);

-- Create enhanced auth attempt logging function
CREATE OR REPLACE FUNCTION public.log_auth_attempt(
  attempt_type_param text,
  user_identifier_param text,
  success_param boolean,
  error_message_param text DEFAULT NULL,
  metadata_param jsonb DEFAULT NULL
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
    attempt_type_param,
    user_identifier_param,
    success_param,
    error_message_param,
    metadata_param
  ) RETURNING id INTO attempt_id;
  
  -- Log high-risk failed attempts
  IF NOT success_param AND attempt_type_param IN ('login', 'signup', 'password_reset') THEN
    PERFORM public.log_security_event(
      'failed_authentication',
      'فشل في المصادقة: ' || attempt_type_param || ' للمستخدم: ' || user_identifier_param,
      'MEDIUM',
      NULL,
      jsonb_build_object(
        'attempt_type', attempt_type_param,
        'user_identifier', user_identifier_param,
        'error_message', error_message_param
      )
    );
  END IF;
  
  RETURN attempt_id;
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

-- Create session security validation function
CREATE OR REPLACE FUNCTION public.validate_session_security()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_profile RECORD;
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