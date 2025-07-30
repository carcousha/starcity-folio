-- Fix remaining Security Definer Views and Functions

-- Find and drop any remaining Security Definer Views
DO $$
DECLARE
    view_name text;
BEGIN
    -- Get all security definer views
    FOR view_name IN 
        SELECT schemaname||'.'||viewname 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND definition ILIKE '%security definer%'
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS ' || view_name || ' CASCADE';
    END LOOP;
END $$;

-- Fix search path for existing functions
ALTER FUNCTION public.secure_role_change(UUID, app_role) SET search_path = 'public';
ALTER FUNCTION public.validate_role_change() SET search_path = 'public';
ALTER FUNCTION public.get_current_user_role() SET search_path = 'public';