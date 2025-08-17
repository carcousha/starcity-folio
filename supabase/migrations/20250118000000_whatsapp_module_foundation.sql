-- WhatsApp Module Foundation Migration
-- Creates the foundational database structure for WhatsApp messaging module

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create WhatsApp contacts table
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    whatsapp_number VARCHAR(50), -- يمكن أن يكون مختلف عن رقم الهاتف العادي
    contact_type VARCHAR(50) NOT NULL DEFAULT 'client', -- 'owner', 'marketer', 'client'
    email VARCHAR(255),
    company VARCHAR(255),
    notes TEXT,
    tags JSONB DEFAULT '[]', -- للتصنيفات الإضافية مستقبلاً
    is_active BOOLEAN DEFAULT true,
    last_contacted TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create WhatsApp templates table
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    template_type VARCHAR(50) DEFAULT 'text', -- 'text', 'media', 'button', 'poll', 'sticker', 'product'
    category VARCHAR(100) NOT NULL, -- 'real_estate_offer', 'advertisement', 'reminder', 'other'
    media_url TEXT, -- للقوالب التي تحتاج وسائط
    buttons JSONB DEFAULT '[]', -- للأزرار إذا كان النوع button
    poll_options JSONB DEFAULT '[]', -- لخيارات الاستطلاع
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create WhatsApp campaigns table
CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_id UUID REFERENCES whatsapp_templates(id),
    target_audience JSONB NOT NULL DEFAULT '[]', -- معايير الاستهداف
    scheduled_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'running', 'completed', 'paused', 'cancelled'
    total_recipients INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    messages_delivered INTEGER DEFAULT 0,
    messages_failed INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create WhatsApp messages log table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES whatsapp_campaigns(id), -- NULL للرسائل المنفردة
    contact_id UUID REFERENCES whatsapp_contacts(id),
    template_id UUID REFERENCES whatsapp_templates(id),
    phone_number VARCHAR(50) NOT NULL,
    message_type VARCHAR(50) NOT NULL, -- 'text', 'media', 'button', 'poll', 'sticker', 'product'
    content TEXT NOT NULL,
    media_url TEXT,
    additional_data JSONB DEFAULT '{}', -- للبيانات الإضافية حسب نوع الرسالة
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
    api_response JSONB DEFAULT '{}', -- رد API للتتبع
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create WhatsApp settings table
CREATE TABLE IF NOT EXISTS whatsapp_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_key TEXT NOT NULL,
    sender_number VARCHAR(50) NOT NULL,
    default_footer TEXT DEFAULT 'Sent via StarCity Folio',
    daily_limit INTEGER DEFAULT 1000,
    rate_limit_per_minute INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_type ON whatsapp_contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_active ON whatsapp_contacts(is_active);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_phone ON whatsapp_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_status ON whatsapp_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_scheduled ON whatsapp_campaigns(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_campaign ON whatsapp_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_contact ON whatsapp_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created ON whatsapp_messages(created_at);

-- Enable Row Level Security
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access only
CREATE POLICY "Admin can manage WhatsApp contacts" ON whatsapp_contacts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
            AND profiles.is_active = true
        )
    );

CREATE POLICY "Admin can manage WhatsApp templates" ON whatsapp_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
            AND profiles.is_active = true
        )
    );

CREATE POLICY "Admin can manage WhatsApp campaigns" ON whatsapp_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
            AND profiles.is_active = true
        )
    );

CREATE POLICY "Admin can view WhatsApp messages" ON whatsapp_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
            AND profiles.is_active = true
        )
    );

CREATE POLICY "Admin can manage WhatsApp settings" ON whatsapp_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
            AND profiles.is_active = true
        )
    );

-- Create functions for automatic updates
CREATE OR REPLACE FUNCTION update_whatsapp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_whatsapp_contacts_updated_at
    BEFORE UPDATE ON whatsapp_contacts
    FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER trigger_whatsapp_templates_updated_at
    BEFORE UPDATE ON whatsapp_templates
    FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER trigger_whatsapp_campaigns_updated_at
    BEFORE UPDATE ON whatsapp_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER trigger_whatsapp_settings_updated_at
    BEFORE UPDATE ON whatsapp_settings
    FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

-- Insert default templates
INSERT INTO whatsapp_templates (name, content, category, created_by) VALUES
('عرض عقاري عام', 'مرحباً {name}! لدينا عرض عقاري مميز قد يهمك. تفاصيل أكثر: {details}', 'real_estate_offer', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('تذكير موعد', 'تذكير: لديك موعد معنا غداً في تمام الساعة {time}. نتطلع لرؤيتك!', 'reminder', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
('إعلان عام', 'إعلان مهم: {announcement}. للمزيد من المعلومات اتصل بنا.', 'advertisement', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1));

-- Create function to increment template usage
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE whatsapp_templates 
    SET usage_count = usage_count + 1 
    WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

-- Insert default settings (will need to be updated with real API key)
INSERT INTO whatsapp_settings (api_key, sender_number, created_by) VALUES
('your_api_key_here', '971501234567', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1));
