-- Security Fix Migration: Part 2
-- Fix specific issues without recreating existing tables

-- 1. Create user_permissions table with proper RLS (only if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_permissions') THEN
    CREATE TABLE public.user_permissions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL,
      permission_name text NOT NULL,
      granted_by uuid NOT NULL,
      granted_at timestamp with time zone NOT NULL DEFAULT now(),
      expires_at timestamp with time zone,
      is_active boolean NOT NULL DEFAULT true,
      UNIQUE(user_id, permission_name)
    );

    ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

    -- RLS policies for user_permissions (admin only)
    CREATE POLICY "Only admins can manage user permissions"
    ON public.user_permissions
    FOR ALL
    TO authenticated
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
  END IF;
END $$;

-- 2. Fix remaining functions with search path security
CREATE OR REPLACE FUNCTION public.sync_user_role_from_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Clear previous roles for this user
  DELETE FROM public.user_roles WHERE user_id = NEW.user_id;
  -- Set the new role if present
  IF NEW.role IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, NEW.role::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_recorded_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.recorded_by IS NULL THEN
    NEW.recorded_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_crm_properties_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 3. Add validation trigger for external suppliers
CREATE OR REPLACE FUNCTION public.validate_supplier_phone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Validate phone number format
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    -- Clean phone number
    NEW.phone := regexp_replace(NEW.phone, '[^0-9+]', '', 'g');
    
    -- Validate UAE phone format
    IF NOT (NEW.phone ~ '^(\+?971[0-9]{9}|05[0-9]{8})$') THEN
      RAISE EXCEPTION 'رقم الهاتف غير صحيح. يجب أن يكون بصيغة إماراتية صحيحة';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create validation trigger for suppliers
DROP TRIGGER IF EXISTS validate_supplier_phone_trigger ON public.external_suppliers;
CREATE TRIGGER validate_supplier_phone_trigger
  BEFORE INSERT OR UPDATE ON public.external_suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_supplier_phone();