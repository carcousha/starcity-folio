-- Security Fix Phase 1: Critical Database Security Issues
-- Fix 1: Add RLS policies to publicly exposed tables

-- Enable RLS on government_service_workflow table
ALTER TABLE public.government_service_workflow ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for government_service_workflow
CREATE POLICY "Authenticated users can view government service workflow" 
ON public.government_service_workflow 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage government service workflow" 
ON public.government_service_workflow 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role = 'admin' 
  AND is_active = true
)) 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role = 'admin' 
  AND is_active = true
));

-- Enable RLS on pdf_templates table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pdf_templates') THEN
    ALTER TABLE public.pdf_templates ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Authenticated users can view PDF templates" 
    ON public.pdf_templates 
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);
    
    CREATE POLICY "Admins can manage PDF templates" 
    ON public.pdf_templates 
    FOR ALL 
    USING (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND is_active = true
    )) 
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND is_active = true
    ));
  END IF;
END $$;

-- Enable RLS on themes table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'themes') THEN
    ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Authenticated users can view themes" 
    ON public.themes 
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);
    
    CREATE POLICY "Admins can manage themes" 
    ON public.themes 
    FOR ALL 
    USING (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND is_active = true
    )) 
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND is_active = true
    ));
  END IF;
END $$;

-- Fix 2: Add search_path security to database functions
-- Update existing functions to include SET search_path = 'public'

CREATE OR REPLACE FUNCTION public.log_financial_activity(
  operation_type_param text,
  description_param text,
  amount_param numeric,
  source_table_param text,
  source_id_param uuid,
  related_table_param text DEFAULT NULL,
  related_id_param uuid DEFAULT NULL,
  user_id_param uuid DEFAULT auth.uid(),
  metadata_param jsonb DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  activity_id uuid;
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
    operation_type_param,
    description_param,
    amount_param,
    source_table_param,
    source_id_param,
    related_table_param,
    related_id_param,
    user_id_param,
    metadata_param
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_auth_attempt(
  attempt_type_param text,
  user_identifier_param text,
  success_param boolean,
  error_message_param text DEFAULT NULL,
  metadata_param jsonb DEFAULT NULL
) RETURNS uuid
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
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    attempt_type_param,
    user_identifier_param,
    success_param,
    error_message_param,
    metadata_param,
    COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', 'unknown'),
    COALESCE(current_setting('request.headers', true)::json->>'user-agent', 'unknown')
  ) RETURNING id INTO attempt_id;
  
  RETURN attempt_id;
END;
$$;

-- Update can_manage_financials function with search_path
CREATE OR REPLACE FUNCTION public.can_manage_financials()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  );
$$;

-- Fix 3: Enhanced input validation functions
CREATE OR REPLACE FUNCTION public.validate_email(email_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Basic email format validation
  IF email_input IS NULL OR email_input = '' THEN
    RETURN false;
  END IF;
  
  -- Check for basic email pattern
  IF email_input !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RETURN false;
  END IF;
  
  -- Check for dangerous patterns
  IF email_input ~* '(script|javascript|vbscript|onload|onerror|onclick)' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Enhanced phone validation with better security
CREATE OR REPLACE FUNCTION public.validate_phone_number_enhanced(phone_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Null/empty check
  IF phone_input IS NULL OR phone_input = '' THEN
    RETURN false;
  END IF;
  
  -- Remove all non-digit characters
  phone_input := regexp_replace(phone_input, '[^0-9]', '', 'g');
  
  -- Check length constraints
  IF length(phone_input) < 8 OR length(phone_input) > 15 THEN
    RETURN false;
  END IF;
  
  -- UAE specific validation
  IF phone_input ~ '^(971[0-9]{9}|05[0-9]{8}|[0-9]{7,10})$' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Enhanced rate limiting with progressive delays
CREATE OR REPLACE FUNCTION public.check_rate_limit_progressive(
  user_email text, 
  max_attempts integer DEFAULT 5, 
  time_window_minutes integer DEFAULT 15,
  progressive_delay_minutes integer DEFAULT 5
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  attempt_count integer;
  window_start timestamp;
  delay_until timestamp;
BEGIN
  window_start := now() - (time_window_minutes || ' minutes')::interval;
  
  -- Count failed attempts in the time window
  SELECT COUNT(*) INTO attempt_count
  FROM public.auth_attempts
  WHERE user_identifier = user_email
  AND created_at >= window_start
  AND success = false;
  
  -- Calculate progressive delay
  IF attempt_count >= max_attempts THEN
    delay_until := now() + (progressive_delay_minutes * (attempt_count - max_attempts + 1) || ' minutes')::interval;
    
    -- Log the rate limit event
    PERFORM public.log_auth_attempt(
      'rate_limit_exceeded_progressive',
      user_email,
      false,
      'Progressive rate limit exceeded: ' || attempt_count || ' failed attempts. Delayed until: ' || delay_until,
      jsonb_build_object(
        'attempts_count', attempt_count,
        'delay_until', delay_until,
        'security_level', 'HIGH'
      )
    );
    
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Function to sanitize text input
CREATE OR REPLACE FUNCTION public.sanitize_text_input(input_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Remove dangerous patterns
  input_text := regexp_replace(input_text, '<[^>]*>', '', 'g'); -- Remove HTML tags
  input_text := regexp_replace(input_text, '(script|javascript|vbscript|onload|onerror|onclick)', '', 'gi'); -- Remove script patterns
  input_text := regexp_replace(input_text, '[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]', '', 'g'); -- Remove control characters
  
  -- Trim whitespace
  input_text := trim(input_text);
  
  RETURN input_text;
END;
$$;

-- Enhanced audit logging for security events
CREATE OR REPLACE FUNCTION public.log_security_audit(
  event_type text,
  description text,
  severity text DEFAULT 'MEDIUM',
  user_id_param uuid DEFAULT auth.uid(),
  ip_address text DEFAULT NULL,
  user_agent text DEFAULT NULL,
  metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
    'security_audit',
    '[' || severity || '] ' || event_type || ': ' || description,
    user_id_param,
    'security_events',
    gen_random_uuid(),
    jsonb_build_object(
      'event_type', event_type,
      'severity', severity,
      'timestamp', now(),
      'ip_address', COALESCE(ip_address, 'unknown'),
      'user_agent', COALESCE(user_agent, 'unknown'),
      'additional_data', metadata
    )
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;