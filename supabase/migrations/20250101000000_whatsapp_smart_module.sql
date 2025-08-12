-- WhatsApp Smart Module Migration
-- إنشاء جداول وحدة الذكي في الواتساب

-- جدول الموردين الخارجيين
CREATE TABLE IF NOT EXISTS public.external_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- البيانات الأساسية
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  company_name TEXT,
  category TEXT NOT NULL CHECK (category IN ('broker', 'land_owner', 'developer')),
  
  -- معلومات التواصل
  last_contact_date TIMESTAMP WITH TIME ZONE,
  last_contact_type TEXT CHECK (last_contact_type IN ('call', 'whatsapp', 'email')),
  
  -- ملاحظات وأولويات
  notes TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  
  -- معلومات إدارية
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول المهام اليومية
CREATE TABLE IF NOT EXISTS public.daily_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- تفاصيل المهمة
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('whatsapp_message', 'follow_up', 'meeting', 'other')),
  
  -- المستهدفين
  target_suppliers JSONB DEFAULT '[]', -- مصفوفة من معرفات الموردين
  target_count INTEGER DEFAULT 0,
  
  -- حالة التنفيذ
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  
  -- الجدولة
  scheduled_date DATE NOT NULL,
  reminder_time TIME,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- معلومات إدارية
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول سجل الرسائل المرسلة
CREATE TABLE IF NOT EXISTS public.whatsapp_smart_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- تفاصيل الرسالة
  supplier_id UUID REFERENCES public.external_suppliers(id),
  task_id UUID REFERENCES public.daily_tasks(id),
  
  -- محتوى الرسالة
  message_template TEXT NOT NULL,
  message_sent TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  
  -- حالة الإرسال
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  
  -- معلومات تقنية
  whatsapp_message_id TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- معلومات إدارية
  sent_by UUID REFERENCES auth.users(id) NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول إعدادات الوحدة الذكية
CREATE TABLE IF NOT EXISTS public.whatsapp_smart_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- إعدادات الرسائل
  daily_message_limit INTEGER NOT NULL DEFAULT 50,
  message_cooldown_hours INTEGER NOT NULL DEFAULT 24, -- الفترة الزمنية بين الرسائل لنفس المورد
  
  -- إعدادات الفلترة
  target_categories JSONB DEFAULT '["broker", "land_owner", "developer"]',
  
  -- إعدادات التذكير
  daily_reminder_time TIME DEFAULT '09:00:00',
  auto_send_enabled BOOLEAN DEFAULT false,
  
  -- قالب الرسالة
  message_template_ar TEXT NOT NULL DEFAULT 'مرحباً {supplier_name}، نود التواصل معكم بخصوص الفرص المتاحة في السوق العقاري.',
  message_template_en TEXT NOT NULL DEFAULT 'Hello {supplier_name}, we would like to connect regarding available opportunities in the real estate market.',
  
  -- معلومات إدارية
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_external_suppliers_category ON public.external_suppliers(category);
CREATE INDEX IF NOT EXISTS idx_external_suppliers_priority ON public.external_suppliers(priority);
CREATE INDEX IF NOT EXISTS idx_external_suppliers_last_contact ON public.external_suppliers(last_contact_date);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_scheduled_date ON public.daily_tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_status ON public.daily_tasks(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_smart_logs_supplier_id ON public.whatsapp_smart_logs(supplier_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_smart_logs_sent_at ON public.whatsapp_smart_logs(sent_at);

-- تفعيل RLS
ALTER TABLE public.external_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_smart_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_smart_settings ENABLE ROW LEVEL SECURITY;

-- إنشاء السياسات الأمنية
CREATE POLICY "Users can view their own suppliers" ON public.external_suppliers
  FOR SELECT USING (created_by = auth.uid() OR assigned_to = auth.uid());

CREATE POLICY "Users can manage their own suppliers" ON public.external_suppliers
  FOR ALL USING (created_by = auth.uid());

CREATE POLICY "Users can view their own tasks" ON public.daily_tasks
  FOR SELECT USING (created_by = auth.uid() OR assigned_to = auth.uid());

CREATE POLICY "Users can manage their own tasks" ON public.daily_tasks
  FOR ALL USING (created_by = auth.uid());

CREATE POLICY "Users can view their own logs" ON public.whatsapp_smart_logs
  FOR SELECT USING (sent_by = auth.uid());

CREATE POLICY "Users can manage their own settings" ON public.whatsapp_smart_settings
  FOR ALL USING (user_id = auth.uid());

-- إنشاء دالة لتحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- إنشاء triggers لتحديث updated_at
CREATE TRIGGER update_external_suppliers_updated_at 
  BEFORE UPDATE ON public.external_suppliers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_tasks_updated_at 
  BEFORE UPDATE ON public.daily_tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_smart_settings_updated_at 
  BEFORE UPDATE ON public.whatsapp_smart_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
