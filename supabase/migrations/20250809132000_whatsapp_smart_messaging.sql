-- WhatsApp Smart Messaging core tables

-- Templates per pipeline stage and language
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage text NOT NULL, -- e.g., 'new','appointment','negotiation','closing','post_sale'
  name text NOT NULL,
  lang text NOT NULL CHECK (lang IN ('ar','en')),
  category text DEFAULT 'default',
  variables jsonb NOT NULL DEFAULT '[]', -- ["client_name","property_type",...]
  body text NOT NULL,
  header text,
  footer text,
  is_default boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wt_stage_lang ON public.whatsapp_templates(stage, lang);

-- Message logs: every opened/sent action through WA
CREATE TABLE IF NOT EXISTS public.whatsapp_message_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid,
  lead_id uuid,
  stage text NOT NULL,
  template_id uuid,
  phone_e164 text NOT NULL,
  lang text NOT NULL CHECK (lang IN ('ar','en')),
  message_text text NOT NULL,
  status text NOT NULL DEFAULT 'opened' CHECK (status IN ('opened','sent','failed','skipped')),
  error text,
  sent_by uuid,
  sent_at timestamptz NOT NULL DEFAULT now(),
  meta jsonb NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_wl_lead_stage ON public.whatsapp_message_logs(lead_id, stage);
CREATE INDEX IF NOT EXISTS idx_wl_sent_at ON public.whatsapp_message_logs(sent_at);

-- Reminders: surface to UI when due
CREATE TABLE IF NOT EXISTS public.whatsapp_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  stage text NOT NULL,
  template_id uuid,
  remind_at timestamptz NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  surfaced boolean NOT NULL DEFAULT false, -- shown in UI
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wr_due ON public.whatsapp_reminders(remind_at, enabled, surfaced);

-- Basic RLS
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_reminders ENABLE ROW LEVEL SECURITY;

-- View templates: all authenticated users
DROP POLICY IF EXISTS "auth can view templates" ON public.whatsapp_templates;
CREATE POLICY "auth can view templates" ON public.whatsapp_templates FOR SELECT USING (auth.uid() IS NOT NULL);

-- Manage templates: admins only (assumes is_admin())
DROP POLICY IF EXISTS "admin manage templates" ON public.whatsapp_templates;
CREATE POLICY "admin manage templates" ON public.whatsapp_templates FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Logs: creator can insert/read own; admins read all
DROP POLICY IF EXISTS "logs insert by auth" ON public.whatsapp_message_logs;
CREATE POLICY "logs insert by auth" ON public.whatsapp_message_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "logs view own or admin" ON public.whatsapp_message_logs;
CREATE POLICY "logs view own or admin" ON public.whatsapp_message_logs FOR SELECT USING (is_admin() OR sent_by = auth.uid());

-- Reminders: creator manage own; admins manage all
DROP POLICY IF EXISTS "reminders manage own or admin" ON public.whatsapp_reminders;
CREATE POLICY "reminders manage own or admin" ON public.whatsapp_reminders FOR ALL USING (is_admin() OR created_by = auth.uid()) WITH CHECK (is_admin() OR created_by = auth.uid());

-- Seed a few default templates (Arabic/English) for appointment stage
INSERT INTO public.whatsapp_templates(stage, name, lang, category, variables, body, is_default)
VALUES
('appointment','confirm_appointment','ar','reminder', '["client_name","property_type","appointment_date","appointment_time","appointment_location"]'::jsonb,
 'مرحبًا {{client_name}} 👋\nنود تذكيرك بموعد مشاهدة {{property_type}} يوم {{appointment_date}} الساعة {{appointment_time}}.\nالعنوان: {{appointment_location}}. لأي استفسار تواصل معنا.', true),
('appointment','confirm_appointment','en','reminder', '["client_name","property_type","appointment_date","appointment_time","appointment_location"]'::jsonb,
 'Hello {{client_name}} 👋\nReminder: Viewing {{property_type}} on {{appointment_date}} at {{appointment_time}}.\nLocation: {{appointment_location}}. Feel free to contact us.', true)
ON CONFLICT DO NOTHING;


