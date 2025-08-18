-- إزالة جميع جداول الواتساب التالفة نهائياً
DROP TABLE IF EXISTS whatsapp_reminders CASCADE;
DROP TABLE IF EXISTS whatsapp_message_logs CASCADE;
DROP TABLE IF EXISTS whatsapp_stats CASCADE;
DROP TABLE IF EXISTS whatsapp_activity_logs CASCADE;
DROP TABLE IF EXISTS whatsapp_messages CASCADE;
DROP TABLE IF EXISTS whatsapp_campaigns CASCADE;
DROP TABLE IF EXISTS whatsapp_templates CASCADE;
DROP TABLE IF EXISTS whatsapp_contacts CASCADE;
DROP TABLE IF EXISTS whatsapp_settings CASCADE;

-- إزالة جميع الدوال المرتبطة
DROP FUNCTION IF EXISTS increment_template_usage(UUID);
DROP FUNCTION IF EXISTS get_whatsapp_stats();

-- إنشاء جداول الواتساب الجديدة بدون RLS
CREATE TABLE whatsapp_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key TEXT NOT NULL DEFAULT 'your_api_key_here',
    sender_number VARCHAR(50) NOT NULL DEFAULT '971501234567',
    default_footer TEXT DEFAULT 'Sent via StarCity Folio',
    daily_limit INTEGER DEFAULT 1000,
    rate_limit_per_minute INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE whatsapp_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    whatsapp_number VARCHAR(50),
    contact_type VARCHAR(50) NOT NULL DEFAULT 'client',
    email VARCHAR(255),
    company VARCHAR(255),
    notes TEXT,
    tags JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    last_contacted TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    template_type VARCHAR(50) DEFAULT 'text',
    category VARCHAR(100) NOT NULL,
    media_url TEXT,
    buttons JSONB DEFAULT '[]',
    poll_options JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE whatsapp_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_id UUID REFERENCES whatsapp_templates(id),
    target_audience JSONB NOT NULL DEFAULT '[]',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'draft',
    total_recipients INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    messages_delivered INTEGER DEFAULT 0,
    messages_failed INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES whatsapp_campaigns(id),
    contact_id UUID REFERENCES whatsapp_contacts(id),
    template_id UUID REFERENCES whatsapp_templates(id),
    phone_number VARCHAR(50) NOT NULL,
    message_type VARCHAR(50) NOT NULL DEFAULT 'text',
    content TEXT NOT NULL,
    media_url TEXT,
    additional_data JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending',
    api_response JSONB DEFAULT '{}',
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء الفهارس للأداء
CREATE INDEX idx_whatsapp_contacts_phone ON whatsapp_contacts(phone);
CREATE INDEX idx_whatsapp_contacts_type ON whatsapp_contacts(contact_type);
CREATE INDEX idx_whatsapp_messages_phone ON whatsapp_messages(phone_number);
CREATE INDEX idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX idx_whatsapp_campaigns_status ON whatsapp_campaigns(status);

-- إنشاء دالة increment_template_usage
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE whatsapp_templates
    SET usage_count = usage_count + 1
    WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

-- إدراج البيانات الافتراضية
INSERT INTO whatsapp_settings (api_key, sender_number) 
VALUES ('your_api_key_here', '971501234567')
ON CONFLICT DO NOTHING;

-- إدراج قوالب افتراضية بسيطة
INSERT INTO whatsapp_templates (name, content, category) VALUES
('عرض عقاري', 'مرحبا! لدينا عرض عقاري مميز قد يهمك.', 'real_estate_offer'),
('تذكير موعد', 'تذكير: لديك موعد معنا غدا.', 'reminder'),
('اعلان عام', 'اعلان مهم. للمزيد من المعلومات اتصل بنا.', 'advertisement')
ON CONFLICT DO NOTHING;

-- إدراج جهات اتصال تجريبية
INSERT INTO whatsapp_contacts (name, phone, contact_type) VALUES
('عميل تجريبي', '971501234567', 'client'),
('مالك تجريبي', '971501234568', 'owner'),
('مسوق تجريبي', '971501234569', 'agent')
ON CONFLICT DO NOTHING;
