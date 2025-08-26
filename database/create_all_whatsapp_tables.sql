-- =====================================================
-- إنشاء جميع جداول وحدة الواتساب
-- =====================================================

-- 1. جدول إعدادات الواتساب
CREATE TABLE IF NOT EXISTS whatsapp_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    api_key TEXT,
    phone_number TEXT,
    default_footer TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. جدول جهات الاتصال
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    type TEXT DEFAULT 'client',
    company TEXT,
    email TEXT,
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. جدول قوالب الرسائل
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. جدول الحملات
CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    template_id UUID REFERENCES whatsapp_templates(id),
    status TEXT DEFAULT 'draft',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. جدول الرسائل
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES whatsapp_campaigns(id),
    contact_id UUID REFERENCES whatsapp_contacts(id),
    phone_number TEXT NOT NULL,
    message_content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    status TEXT DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. جدول الرسائل الجماعية
CREATE TABLE IF NOT EXISTS whatsapp_bulk_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    message_content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    media_url TEXT,
    media_type TEXT,
    button_text TEXT,
    button_url TEXT,
    recipient_type TEXT DEFAULT 'all',
    recipient_filters JSONB,
    custom_recipients TEXT[],
    send_type TEXT DEFAULT 'immediate',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    gradual_settings JSONB,
    personalization_settings JSONB,
    advanced_settings JSONB,
    status TEXT DEFAULT 'draft',
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. جدول مستلمي الرسائل الجماعية
CREATE TABLE IF NOT EXISTS whatsapp_bulk_message_recipients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bulk_message_id UUID REFERENCES whatsapp_bulk_messages(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES whatsapp_contacts(id),
    phone_number TEXT NOT NULL,
    personalized_content TEXT,
    status TEXT DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- إنشاء الفهارس (Indexes)
-- =====================================================

-- فهارس جهات الاتصال
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_phone ON whatsapp_contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_type ON whatsapp_contacts(type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_company ON whatsapp_contacts(company);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_active ON whatsapp_contacts(is_active);

-- فهارس الرسائل
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_campaign ON whatsapp_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_contact ON whatsapp_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_sent_at ON whatsapp_messages(sent_at);

-- فهارس الرسائل الجماعية
CREATE INDEX IF NOT EXISTS idx_whatsapp_bulk_messages_status ON whatsapp_bulk_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_bulk_messages_created_at ON whatsapp_bulk_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_bulk_messages_scheduled_at ON whatsapp_bulk_messages(scheduled_at);

-- فهارس مستلمي الرسائل الجماعية
CREATE INDEX IF NOT EXISTS idx_whatsapp_bulk_recipients_bulk_message ON whatsapp_bulk_message_recipients(bulk_message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_bulk_recipients_status ON whatsapp_bulk_message_recipients(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_bulk_recipients_phone ON whatsapp_bulk_message_recipients(phone_number);

-- =====================================================
-- إنشاء الدوال (Functions)
-- =====================================================

-- دالة تحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- إنشاء Triggers
-- =====================================================

-- triggers لتحديث updated_at
CREATE TRIGGER update_whatsapp_settings_updated_at BEFORE UPDATE ON whatsapp_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_contacts_updated_at BEFORE UPDATE ON whatsapp_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE ON whatsapp_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_campaigns_updated_at BEFORE UPDATE ON whatsapp_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_messages_updated_at BEFORE UPDATE ON whatsapp_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_bulk_messages_updated_at BEFORE UPDATE ON whatsapp_bulk_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_bulk_recipients_updated_at BEFORE UPDATE ON whatsapp_bulk_message_recipients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- إنشاء RLS Policies
-- =====================================================

-- تفعيل RLS لجميع الجداول
ALTER TABLE whatsapp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_bulk_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_bulk_message_recipients ENABLE ROW LEVEL SECURITY;

-- سياسات للقراءة والكتابة (يمكن تعديلها حسب احتياجاتك)
CREATE POLICY "Enable read access for all users" ON whatsapp_settings FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_settings FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON whatsapp_contacts FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_contacts FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON whatsapp_templates FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_templates FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON whatsapp_campaigns FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_campaigns FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON whatsapp_messages FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_messages FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON whatsapp_bulk_messages FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_bulk_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_bulk_messages FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON whatsapp_bulk_message_recipients FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_bulk_message_recipients FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_bulk_message_recipients FOR UPDATE USING (true);

-- =====================================================
-- إدخال بيانات تجريبية
-- =====================================================

-- إدخال إعدادات افتراضية
INSERT INTO whatsapp_settings (api_key, phone_number, default_footer, is_active) 
VALUES ('your-api-key-here', '+201234567890', '', true)
ON CONFLICT DO NOTHING;

-- إدخال جهات اتصال تجريبية
INSERT INTO whatsapp_contacts (name, phone_number, type, company, email, tags) VALUES
('أحمد محمد', '+201234567891', 'client', 'شركة ABC', 'ahmed@abc.com', ARRAY['vip', 'active']),
('فاطمة علي', '+201234567892', 'owner', 'شركة XYZ', 'fatima@xyz.com', ARRAY['owner']),
('محمد حسن', '+201234567893', 'marketer', 'شركة DEF', 'mohamed@def.com', ARRAY['marketer']),
('سارة أحمد', '+201234567894', 'client', 'شركة GHI', 'sara@ghi.com', ARRAY['new']),
('علي محمود', '+201234567895', 'client', 'شركة JKL', 'ali@jkl.com', ARRAY['vip'])
ON CONFLICT DO NOTHING;

-- إدخال قوالب تجريبية
INSERT INTO whatsapp_templates (name, content, type, is_active) VALUES
('ترحيب', 'مرحباً {name}، نود الترحيب بك في {company}!', 'text', true),
('عرض خاص', 'عزيزي {name}، لديك عرض خاص: خصم 20% على جميع المنتجات', 'text', true),
('تذكير', 'مرحباً {name}، هذا تذكير بموعدك غداً الساعة 10 صباحاً', 'text', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- رسالة نجاح
-- =====================================================

-- يمكنك تشغيل هذا الاستعلام للتحقق من إنشاء الجداول
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'whatsapp_%';
