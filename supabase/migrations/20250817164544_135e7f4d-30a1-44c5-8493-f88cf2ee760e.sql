-- إنشاء جدول جهات الاتصال الموحد
CREATE TABLE public.whatsapp_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  address TEXT,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('owner', 'agent', 'client', 'tenant', 'supplier', 'other')),
  tags JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_contact_date TIMESTAMP WITH TIME ZONE,
  whatsapp_verified BOOLEAN DEFAULT false
);

-- إنشاء جدول الحملات
CREATE TABLE public.whatsapp_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_id UUID REFERENCES public.whatsapp_templates(id),
  target_contacts JSONB NOT NULL, -- IDs جهات الاتصال المستهدفة
  target_filters JSONB, -- فلاتر الاستهداف
  message_content JSONB NOT NULL,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('immediate', 'scheduled')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'completed', 'cancelled', 'failed')),
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- إنشاء جدول الرسائل الفردية والجماعية
CREATE TABLE public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.whatsapp_campaigns(id),
  contact_id UUID REFERENCES public.whatsapp_contacts(id),
  phone TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'media', 'button', 'list', 'poll', 'sticker')),
  content JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  external_id TEXT, -- ID من API الخارجي
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء جدول الإحصائيات اليومية
CREATE TABLE public.whatsapp_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_date DATE NOT NULL,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_read INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  campaigns_count INTEGER DEFAULT 0,
  contacts_added INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(stat_date)
);

-- إنشاء جدول سجل الأنشطة
CREATE TABLE public.whatsapp_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('contact_added', 'contact_updated', 'campaign_created', 'campaign_sent', 'message_sent', 'template_created')),
  description TEXT NOT NULL,
  user_id UUID NOT NULL,
  related_table TEXT,
  related_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- تحديث جدول القوالب الموجود
ALTER TABLE public.whatsapp_templates 
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- تمكين RLS على الجداول الجديدة
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_activity_logs ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان
-- جهات الاتصال
CREATE POLICY "Users can manage own contacts" ON public.whatsapp_contacts
  FOR ALL USING (created_by = auth.uid());

-- الحملات
CREATE POLICY "Users can manage own campaigns" ON public.whatsapp_campaigns
  FOR ALL USING (created_by = auth.uid());

-- الرسائل
CREATE POLICY "Users can manage own messages" ON public.whatsapp_messages
  FOR ALL USING (created_by = auth.uid());

-- الإحصائيات - قراءة فقط للجميع
CREATE POLICY "Users can view stats" ON public.whatsapp_stats
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- سجل الأنشطة - قراءة فقط للمستخدم
CREATE POLICY "Users can view own activity logs" ON public.whatsapp_activity_logs
  FOR SELECT USING (user_id = auth.uid());

-- إنشاء الفهارس للأداء
CREATE INDEX idx_whatsapp_contacts_phone ON public.whatsapp_contacts(phone);
CREATE INDEX idx_whatsapp_contacts_type ON public.whatsapp_contacts(contact_type);
CREATE INDEX idx_whatsapp_contacts_created_by ON public.whatsapp_contacts(created_by);
CREATE INDEX idx_whatsapp_messages_campaign_id ON public.whatsapp_messages(campaign_id);
CREATE INDEX idx_whatsapp_messages_status ON public.whatsapp_messages(status);
CREATE INDEX idx_whatsapp_messages_created_at ON public.whatsapp_messages(created_at);
CREATE INDEX idx_whatsapp_campaigns_status ON public.whatsapp_campaigns(status);
CREATE INDEX idx_whatsapp_campaigns_created_by ON public.whatsapp_campaigns(created_by);