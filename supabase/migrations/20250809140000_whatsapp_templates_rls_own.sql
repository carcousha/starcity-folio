-- Relax RLS on whatsapp_templates to allow creators to manage their own templates
-- while keeping admins full control.

ALTER TABLE IF EXISTS public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- Drop strict admin-only policy if exists
DROP POLICY IF EXISTS "admin manage templates" ON public.whatsapp_templates;
DROP POLICY IF EXISTS "auth can view templates" ON public.whatsapp_templates;

-- View: any authenticated user can read
CREATE POLICY "auth can view templates" ON public.whatsapp_templates
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Insert: creator can insert own, admin can insert any
CREATE POLICY "insert own or admin" ON public.whatsapp_templates
FOR INSERT
WITH CHECK (is_admin() OR created_by = auth.uid());

-- Update: creator can update own, admin can update any
CREATE POLICY "update own or admin" ON public.whatsapp_templates
FOR UPDATE
USING (is_admin() OR created_by = auth.uid())
WITH CHECK (is_admin() OR created_by = auth.uid());

-- Delete: admin only for safety (adjust as needed)
CREATE POLICY "delete admin only" ON public.whatsapp_templates
FOR DELETE
USING (is_admin());


