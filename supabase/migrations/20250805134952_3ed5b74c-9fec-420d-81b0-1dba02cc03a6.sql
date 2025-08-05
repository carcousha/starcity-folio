-- Security Fix - Part 2: Fix remaining database function security issues

-- Fix all remaining functions to have proper search_path
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only allow role changes through secure_role_change function
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'غير مصرح: يجب استخدام وظيفة secure_role_change لتغيير الأدوار';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_recorded_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.recorded_by IS NULL THEN
    NEW.recorded_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fix_revenue_source()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- تصحيح المصدر تلقائياً
  IF NEW.source IN ('عمولة صفقة', 'عمولة', 'commission') THEN
    NEW.source := 'عمولات';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_update_employee_targets()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.status = 'closed' AND (OLD.status IS NULL OR OLD.status != 'closed') THEN
    PERFORM public.update_employee_targets_progress(NEW.handled_by);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_commission_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  PERFORM public.send_commission_notification(
    NEW.employee_id,
    NEW.commission_id,
    NEW.calculated_share
  );
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_automated_tasks_for_contract()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    accountant_id UUID;
    admin_id UUID;
BEGIN
    -- البحث عن محاسب
    SELECT user_id INTO accountant_id 
    FROM public.profiles 
    WHERE role = 'accountant' AND is_active = true 
    LIMIT 1;
    
    -- البحث عن مدير
    SELECT user_id INTO admin_id 
    FROM public.profiles 
    WHERE role = 'admin' AND is_active = true 
    LIMIT 1;
    
    -- إنشاء مهمة تحصيل الشيكات للمحاسب
    IF accountant_id IS NOT NULL THEN
        INSERT INTO public.tasks (
            title,
            description,
            priority,
            due_date,
            contract_id,
            created_by,
            is_automated,
            automation_trigger
        ) VALUES (
            'تحصيل شيكات العقد رقم ' || NEW.contract_number,
            'تحصيل شيكات الإيجار من المستأجر: ' || NEW.tenant_name,
            'high',
            CURRENT_DATE + INTERVAL '3 days',
            NEW.id,
            COALESCE(admin_id, NEW.created_by),
            true,
            'contract_created'
        );
        
        -- تعيين المهمة للمحاسب
        INSERT INTO public.task_assignments (task_id, assigned_to, assigned_by)
        SELECT id, accountant_id, COALESCE(admin_id, NEW.created_by)
        FROM public.tasks 
        WHERE contract_id = NEW.id AND title LIKE 'تحصيل شيكات العقد%'
        ORDER BY created_at DESC LIMIT 1;
    END IF;
    
    -- إنشاء مهمة تصديق العقد
    INSERT INTO public.tasks (
        title,
        description,
        priority,
        due_date,
        contract_id,
        created_by,
        is_automated,
        automation_trigger
    ) VALUES (
        'تصديق العقد رقم ' || NEW.contract_number,
        'تصديق العقد من الجهات المختصة للمستأجر: ' || NEW.tenant_name,
        'normal',
        CURRENT_DATE + INTERVAL '7 days',
        NEW.id,
        NEW.created_by,
        true,
        'contract_created'
    );
    
    -- تعيين مهمة التصديق لمنشئ العقد
    INSERT INTO public.task_assignments (task_id, assigned_to, assigned_by)
    SELECT id, NEW.created_by, NEW.created_by
    FROM public.tasks 
    WHERE contract_id = NEW.id AND title LIKE 'تصديق العقد%'
    ORDER BY created_at DESC LIMIT 1;
    
    -- إنشاء مهمة طلب الخدمات الحكومية
    INSERT INTO public.tasks (
        title,
        description,
        priority,
        due_date,
        contract_id,
        created_by,
        is_automated,
        automation_trigger
    ) VALUES (
        'طلب خدمات الكهرباء والماء للعقد رقم ' || NEW.contract_number,
        'تقديم طلبات الكهرباء والماء والصرف الصحي للوحدة: ' || NEW.unit_number,
        'normal',
        CURRENT_DATE + INTERVAL '5 days',
        NEW.id,
        NEW.created_by,
        true,
        'contract_created'
    );
    
    -- تعيين مهمة الخدمات الحكومية لمنشئ العقد
    INSERT INTO public.task_assignments (task_id, assigned_to, assigned_by)
    SELECT id, NEW.created_by, NEW.created_by
    FROM public.tasks 
    WHERE contract_id = NEW.id AND title LIKE 'طلب خدمات الكهرباء%'
    ORDER BY created_at DESC LIMIT 1;
    
    RETURN NEW;
END;
$$;

-- Enhanced secure role change function
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
  -- Validate session security first
  IF NOT public.validate_session_security() THEN
    RAISE EXCEPTION 'جلسة غير آمنة - يرجى تسجيل الدخول مرة أخرى';
  END IF;
  
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

-- Add missing RLS policies for tables that have RLS enabled but no policies
CREATE POLICY "Only authenticated users can view file uploads"
ON public.file_uploads
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can manage file uploads"
ON public.file_uploads
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create audit trigger for sensitive operations
CREATE OR REPLACE FUNCTION public.audit_sensitive_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log any changes to user profiles
  IF TG_TABLE_NAME = 'profiles' THEN
    PERFORM public.log_security_event(
      'profile_change',
      'تم تعديل ملف المستخدم',
      'MEDIUM',
      auth.uid(),
      jsonb_build_object(
        'table_name', TG_TABLE_NAME,
        'operation', TG_OP,
        'old_values', CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
        'new_values', CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add audit trigger to profiles table
DROP TRIGGER IF EXISTS audit_profiles_changes ON public.profiles;
CREATE TRIGGER audit_profiles_changes
  AFTER INSERT OR UPDATE OR DELETE
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_sensitive_changes();