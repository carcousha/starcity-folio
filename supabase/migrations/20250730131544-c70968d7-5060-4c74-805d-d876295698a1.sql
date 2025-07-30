-- CRITICAL SECURITY FIXES - CORRECTED VERSION

-- 1. Fix Privilege Escalation Vulnerability: Remove role updates from user-editable policies
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create secure policy that excludes role field from user updates
CREATE POLICY "Users can update their own profile (non-role fields)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admin-only policy for role updates
CREATE POLICY "Admins can update any profile including roles" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Create secure role change function with proper validation
CREATE OR REPLACE FUNCTION public.secure_role_change(
  target_user_id UUID,
  new_role app_role
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_role app_role;
  old_role app_role;
  activity_id UUID;
BEGIN
  -- Check if current user is admin
  SELECT role INTO current_user_role 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'غير مصرح: فقط المدير يمكنه تغيير الأدوار';
  END IF;
  
  -- Get old role for logging
  SELECT role INTO old_role 
  FROM public.profiles 
  WHERE user_id = target_user_id;
  
  -- Update the role
  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Log the role change for security audit
  activity_id := public.log_financial_activity(
    'role_changed',
    'تم تغيير دور المستخدم من ' || old_role || ' إلى ' || new_role,
    0,
    'profiles',
    target_user_id,
    'user_roles',
    NULL,
    auth.uid(),
    jsonb_build_object(
      'old_role', old_role, 
      'new_role', new_role,
      'target_user_id', target_user_id,
      'security_event', 'role_change'
    )
  );
  
  RETURN TRUE;
END;
$$;

-- 3. Create trigger to prevent unauthorized role updates
CREATE OR REPLACE FUNCTION public.validate_role_change()
RETURNS TRIGGER AS $$
DECLARE
  current_user_role app_role;
BEGIN
  -- Allow if role hasn't changed
  IF OLD.role = NEW.role THEN
    RETURN NEW;
  END IF;
  
  -- Check if current user is admin
  SELECT role INTO current_user_role 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  IF current_user_role != 'admin' THEN
    -- Log the unauthorized attempt
    PERFORM public.log_financial_activity(
      'unauthorized_role_change_attempt',
      'محاولة غير مصرح بها لتغيير دور من ' || OLD.role || ' إلى ' || NEW.role,
      0,
      'profiles',
      NEW.user_id,
      NULL,
      NULL,
      auth.uid(),
      jsonb_build_object(
        'old_role', OLD.role, 
        'new_role', NEW.role,
        'security_event', 'unauthorized_role_change',
        'warning', 'CRITICAL: Unauthorized role change attempt blocked'
      )
    );
    
    RAISE EXCEPTION 'غير مصرح: فقط المدير يمكنه تغيير الأدوار';
  END IF;
  
  -- Log authorized role changes
  PERFORM public.log_financial_activity(
    'role_change_authorized',
    'تغيير دور مصرح به من ' || OLD.role || ' إلى ' || NEW.role,
    0,
    'profiles',
    NEW.user_id,
    NULL,
    NULL,
    auth.uid(),
    jsonb_build_object(
      'old_role', OLD.role, 
      'new_role', NEW.role,
      'security_event', 'authorized_role_change'
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS validate_role_change_trigger ON public.profiles;
CREATE TRIGGER validate_role_change_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_change();

-- 4. Create function to get user role securely (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1),
    'employee'::app_role
  );
$$;