-- البحث عن جميع الـ triggers التي تستدعي log_financial_activity وإصلاحها
-- أولاً، دعنا نحدث جميع الـ triggers لتجنب استدعاء log_financial_activity إذا لم يكن هناك user_id

-- إصلاح trigger الخاص بتحديث الأدوار
CREATE OR REPLACE FUNCTION public.validate_role_change_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_role app_role;
  activity_user_id UUID;
BEGIN
  -- Only allow role changes by admins
  SELECT role INTO current_user_role 
  FROM public.profiles 
  WHERE user_id = auth.uid() AND is_active = true;
  
  IF current_user_role != 'admin' AND OLD.role != NEW.role THEN
    RAISE EXCEPTION 'غير مصرح: فقط المدير يمكنه تغيير الأدوار';
  END IF;
  
  -- تحديد user_id للـ activity log بشكل صحيح
  activity_user_id := COALESCE(auth.uid(), NEW.user_id);
  
  -- Log the role change attempt only if we have a valid user_id
  IF activity_user_id IS NOT NULL THEN
    PERFORM public.log_financial_activity(
      CASE WHEN OLD.role = NEW.role THEN 'profile_updated' ELSE 'role_change_attempted' END,
      'محاولة تغيير دور من ' || OLD.role || ' إلى ' || NEW.role,
      0,
      'profiles',
      NEW.id,
      'user_roles',
      NULL,
      activity_user_id, -- استخدام user_id صحيح
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'target_user_id', NEW.user_id,
        'security_event', 'role_change'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- إصلاح trigger الخاص بتعيين recorded_by
CREATE OR REPLACE FUNCTION public.set_recorded_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.recorded_by IS NULL THEN
    NEW.recorded_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$function$;

-- إصلاح trigger الخاص بتعيين created_by
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$function$;

-- جعل activity_logs.user_id nullable مؤقتاً لحل المشكلة
ALTER TABLE public.activity_logs ALTER COLUMN user_id DROP NOT NULL;