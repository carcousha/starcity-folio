-- Security fixes: Add search path protection to existing functions
-- This migration adds proper search path to critical functions

-- Update the existing has_role function to add search path protection
CREATE OR REPLACE FUNCTION public.has_role(user_id_param uuid, role_param app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_role app_role;
BEGIN
    -- Input validation
    IF user_id_param IS NULL OR role_param IS NULL THEN
        RETURN false;
    END IF;
    
    -- Get user role
    SELECT role INTO user_role 
    FROM public.profiles 
    WHERE user_id = user_id_param AND is_active = true;
    
    -- Admin role has access to everything
    RETURN user_role = role_param OR user_role = 'admin';
END;
$$;

-- Create a secure function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_role app_role;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RETURN null;
    END IF;
    
    -- Get user role securely
    SELECT role INTO user_role 
    FROM public.profiles 
    WHERE user_id = auth.uid() AND is_active = true;
    
    RETURN user_role;
END;
$$;

-- Update the secure_role_change function with enhanced security
CREATE OR REPLACE FUNCTION public.secure_role_change(target_user_id uuid, new_role app_role)
RETURNS boolean 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_role app_role;
    old_role app_role;
    activity_id UUID;
BEGIN
    -- Input validation
    IF target_user_id IS NULL OR new_role IS NULL THEN
        RAISE EXCEPTION 'معاملات غير صحيحة: معرف المستخدم والدور مطلوبان';
    END IF;
    
    -- Check authentication
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'غير مصرح: يجب تسجيل الدخول';
    END IF;
    
    -- Check if current user is admin using the secure function
    current_user_role := public.get_current_user_role();
    
    IF current_user_role != 'admin' THEN
        -- Log the unauthorized attempt
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
    
    -- Prevent self-demotion from admin
    IF target_user_id = auth.uid() AND current_user_role = 'admin' AND new_role != 'admin' THEN
        RAISE EXCEPTION 'لا يمكن للمدير تنزيل رتبته الخاصة';
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
$$;