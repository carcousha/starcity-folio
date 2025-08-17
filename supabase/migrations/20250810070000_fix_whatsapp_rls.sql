-- Fix RLS policies for WhatsApp module to check profiles.user_id instead of profiles.id

-- Contacts
DROP POLICY IF EXISTS "Admin can manage WhatsApp contacts" ON public.whatsapp_contacts;
CREATE POLICY "Admin can manage WhatsApp contacts" ON public.whatsapp_contacts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
        AND p.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
        AND p.is_active = true
    )
  );

-- Templates
DROP POLICY IF EXISTS "Admin can manage WhatsApp templates" ON public.whatsapp_templates;
CREATE POLICY "Admin can manage WhatsApp templates" ON public.whatsapp_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
        AND p.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
        AND p.is_active = true
    )
  );

-- Campaigns
DROP POLICY IF EXISTS "Admin can manage WhatsApp campaigns" ON public.whatsapp_campaigns;
CREATE POLICY "Admin can manage WhatsApp campaigns" ON public.whatsapp_campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
        AND p.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
        AND p.is_active = true
    )
  );

-- Messages (view only)
DROP POLICY IF EXISTS "Admin can view WhatsApp messages" ON public.whatsapp_messages;
CREATE POLICY "Admin can view WhatsApp messages" ON public.whatsapp_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
        AND p.is_active = true
    )
  );

-- Settings
DROP POLICY IF EXISTS "Admin can manage WhatsApp settings" ON public.whatsapp_settings;
CREATE POLICY "Admin can manage WhatsApp settings" ON public.whatsapp_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
        AND p.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
        AND p.is_active = true
    )
  );

-- Optional: allow service role to bypass RLS implicitly (handled by Supabase)


