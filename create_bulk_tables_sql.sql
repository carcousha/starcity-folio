-- ===== إنشاء جداول الإرسال الجماعي =====
-- قم بنسخ هذا الكود ولصقه في Supabase SQL Editor

-- إنشاء جدول الرسائل الجماعية
CREATE TABLE IF NOT EXISTS whatsapp_bulk_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    message_content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'media', 'button', 'poll')),
    media_url TEXT,
    media_type VARCHAR(50),
    button_text VARCHAR(255),
    button_url TEXT,
    poll_options JSONB,
    template_id UUID,
    
    -- إعدادات المستلمين
    recipient_type VARCHAR(50) DEFAULT 'all' CHECK (recipient_type IN ('all', 'by_type', 'by_company', 'by_tags', 'custom')),
    recipient_filters JSONB,
    custom_recipients JSONB,
    
    -- إعدادات الإرسال
    send_type VARCHAR(50) DEFAULT 'immediate' CHECK (send_type IN ('immediate', 'scheduled', 'gradual')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    gradual_settings JSONB,
    
    -- الحالة والتقدم
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'queued', 'sending', 'completed', 'paused', 'cancelled')),
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    
    -- التواريخ
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول مستلمي الرسائل الجماعية
CREATE TABLE IF NOT EXISTS whatsapp_bulk_message_recipients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bulk_message_id UUID REFERENCES whatsapp_bulk_messages(id) ON DELETE CASCADE,
    contact_id UUID,
    phone_number VARCHAR(20) NOT NULL,
    
    -- حالة الإرسال
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'retrying')),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- بيانات الرسالة الفعلية
    message_id UUID,
    personalized_content TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_bulk_messages_status ON whatsapp_bulk_messages(status);
CREATE INDEX IF NOT EXISTS idx_bulk_messages_scheduled_at ON whatsapp_bulk_messages(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_bulk_message_recipients_bulk_id ON whatsapp_bulk_message_recipients(bulk_message_id);
CREATE INDEX IF NOT EXISTS idx_bulk_message_recipients_status ON whatsapp_bulk_message_recipients(status);
CREATE INDEX IF NOT EXISTS idx_bulk_message_recipients_phone ON whatsapp_bulk_message_recipients(phone_number);

-- إنشاء دالة لتحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- إنشاء triggers لتحديث updated_at
DROP TRIGGER IF EXISTS update_whatsapp_bulk_messages_updated_at ON whatsapp_bulk_messages;
CREATE TRIGGER update_whatsapp_bulk_messages_updated_at 
    BEFORE UPDATE ON whatsapp_bulk_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_whatsapp_bulk_message_recipients_updated_at ON whatsapp_bulk_message_recipients;
CREATE TRIGGER update_whatsapp_bulk_message_recipients_updated_at 
    BEFORE UPDATE ON whatsapp_bulk_message_recipients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- إنشاء دالة لحساب نسبة النجاح
CREATE OR REPLACE FUNCTION calculate_bulk_message_success_rate(bulk_msg_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_count INTEGER;
    sent_count INTEGER;
    success_rate DECIMAL(5,2);
BEGIN
    SELECT COUNT(*) INTO total_count
    FROM whatsapp_bulk_message_recipients
    WHERE bulk_message_id = bulk_msg_id;
    
    SELECT COUNT(*) INTO sent_count
    FROM whatsapp_bulk_message_recipients
    WHERE bulk_message_id = bulk_msg_id AND status = 'sent';
    
    IF total_count > 0 THEN
        success_rate = (sent_count::DECIMAL / total_count::DECIMAL) * 100;
    ELSE
        success_rate = 0;
    END IF;
    
    RETURN success_rate;
END;
$$ LANGUAGE plpgsql;

-- إنشاء دالة لتحديث إحصائيات الرسالة الجماعية
CREATE OR REPLACE FUNCTION update_bulk_message_stats(bulk_msg_id UUID)
RETURNS VOID AS $$
DECLARE
    total_recipients INTEGER;
    sent_count INTEGER;
    failed_count INTEGER;
    success_rate DECIMAL(5,2);
BEGIN
    SELECT COUNT(*) INTO total_recipients
    FROM whatsapp_bulk_message_recipients
    WHERE bulk_message_id = bulk_msg_id;
    
    SELECT COUNT(*) INTO sent_count
    FROM whatsapp_bulk_message_recipients
    WHERE bulk_message_id = bulk_msg_id AND status = 'sent';
    
    SELECT COUNT(*) INTO failed_count
    FROM whatsapp_bulk_message_recipients
    WHERE bulk_message_id = bulk_msg_id AND status = 'failed';
    
    success_rate = calculate_bulk_message_success_rate(bulk_msg_id);
    
    UPDATE whatsapp_bulk_messages
    SET 
        total_recipients = total_recipients,
        sent_count = sent_count,
        failed_count = failed_count,
        success_rate = success_rate,
        updated_at = NOW()
    WHERE id = bulk_msg_id;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتحديث الإحصائيات عند تغيير حالة المستلم
CREATE OR REPLACE FUNCTION trigger_update_bulk_message_stats()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_bulk_message_stats(NEW.bulk_message_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_bulk_message_stats_trigger ON whatsapp_bulk_message_recipients;
CREATE TRIGGER update_bulk_message_stats_trigger
    AFTER INSERT OR UPDATE ON whatsapp_bulk_message_recipients
    FOR EACH ROW EXECUTE FUNCTION trigger_update_bulk_message_stats();

-- إعداد RLS (Row Level Security)
ALTER TABLE whatsapp_bulk_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_bulk_message_recipients ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة إذا وجدت
DROP POLICY IF EXISTS "Enable read access for all users" ON whatsapp_bulk_messages;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON whatsapp_bulk_messages;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON whatsapp_bulk_messages;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON whatsapp_bulk_messages;

DROP POLICY IF EXISTS "Enable read access for all users" ON whatsapp_bulk_message_recipients;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON whatsapp_bulk_message_recipients;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON whatsapp_bulk_message_recipients;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON whatsapp_bulk_message_recipients;

-- سياسات RLS للرسائل الجماعية
CREATE POLICY "Enable read access for all users" ON whatsapp_bulk_messages
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON whatsapp_bulk_messages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON whatsapp_bulk_messages
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON whatsapp_bulk_messages
    FOR DELETE USING (true);

-- سياسات RLS لمستلمي الرسائل الجماعية
CREATE POLICY "Enable read access for all users" ON whatsapp_bulk_message_recipients
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON whatsapp_bulk_message_recipients
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON whatsapp_bulk_message_recipients
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON whatsapp_bulk_message_recipients
    FOR DELETE USING (true);

-- رسالة نجاح
SELECT '✅ تم إنشاء جداول الإرسال الجماعي بنجاح!' as result;
