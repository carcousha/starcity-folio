-- CRITICAL SECURITY FIXES

-- 1. Fix Security Definer functions with proper search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = _user_id AND role = _role AND is_active = true
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE user_id = user_uuid AND is_active = true LIMIT 1),
    'employee'::app_role
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND role = 'admin'::app_role AND is_active = true
  );
$function$;

-- 2. Fix overly permissive RLS policies on critical tables

-- Secure commissions table - remove public access
DROP POLICY IF EXISTS "Public can view commissions" ON public.commissions;
DROP POLICY IF EXISTS "Users can manage commissions" ON public.commissions;

CREATE POLICY "Admins and accountants can view commissions" 
ON public.commissions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Admins and accountants can manage commissions" 
ON public.commissions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- Secure expenses table - remove overly permissive policies
DROP POLICY IF EXISTS "Public can view expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can manage expenses" ON public.expenses;

CREATE POLICY "Admins and accountants can view expenses" 
ON public.expenses 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Admins and accountants can manage expenses" 
ON public.expenses 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- Secure debts table - remove overly permissive policies
DROP POLICY IF EXISTS "Public can view debts" ON public.debts;
DROP POLICY IF EXISTS "Users can manage debts" ON public.debts;

CREATE POLICY "Admins and accountants can view debts" 
ON public.debts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Admins and accountants can manage debts" 
ON public.debts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Users can view their own debts" 
ON public.debts 
FOR SELECT 
USING (debtor_id = auth.uid());

-- Secure profile role updates - only admins can change roles
CREATE OR REPLACE FUNCTION public.validate_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  WHERE user_id = auth.uid() AND is_active = true;
  
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
$function$;

-- Apply the trigger to profiles table
DROP TRIGGER IF EXISTS validate_role_change_trigger ON public.profiles;
CREATE TRIGGER validate_role_change_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_change();

-- 3. Fix other Security Definer functions with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.commission_amount = NEW.amount * (NEW.commission_rate / 100);
    RETURN NEW;
END;
$function$;

-- 4. Add input validation for critical operations
CREATE OR REPLACE FUNCTION public.secure_role_change(target_user_id uuid, new_role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_role app_role;
  old_role app_role;
  activity_id UUID;
BEGIN
  -- Input validation
  IF target_user_id IS NULL OR new_role IS NULL THEN
    RAISE EXCEPTION 'معاملات غير صحيحة: معرف المستخدم والدور مطلوبان';
  END IF;
  
  -- Check if current user is admin
  SELECT role INTO current_user_role 
  FROM public.profiles 
  WHERE user_id = auth.uid() AND is_active = true;
  
  IF current_user_role != 'admin' THEN
    -- Log the unauthorized attempt with more details
    PERFORM public.log_financial_activity(
      'unauthorized_role_change_attempt',
      'محاولة غير مصرح بها لتغيير دور المستخدم: ' || target_user_id || ' إلى ' || new_role,
      0,
      'profiles',
      target_user_id,
      'security_events',
      NULL,
      auth.uid(),
      jsonb_build_object(
        'target_user_id', target_user_id,
        'attempted_new_role', new_role,
        'current_user_role', current_user_role,
        'security_event', 'unauthorized_role_change',
        'severity', 'CRITICAL'
      )
    );
    
    RAISE EXCEPTION 'غير مصرح: فقط المدير يمكنه تغيير الأدوار';
  END IF;
  
  -- Get old role for logging
  SELECT role INTO old_role 
  FROM public.profiles 
  WHERE user_id = target_user_id;
  
  -- Check if target user exists
  IF old_role IS NULL THEN
    RAISE EXCEPTION 'المستخدم غير موجود';
  END IF;
  
  -- Update the role
  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Log the successful role change
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
      'security_event', 'role_change_authorized'
    )
  );
  
  RETURN TRUE;
END;
$function$;