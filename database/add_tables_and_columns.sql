-- ===== إضافة جداول وأعمدة جديدة =====
-- قم بنسخ هذا الكود ولصقه في Supabase SQL Editor
-- تأكد من تعديل الأسماء والأنواع حسب احتياجاتك

-- ===== 1. إضافة أعمدة جديدة لجداول موجودة =====

-- إضافة عمود جديد لجدول المستخدمين
-- ALTER TABLE profiles 
-- ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
-- ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
-- ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'ar';

-- إضافة عمود جديد لجدول جهات الاتصال
-- ALTER TABLE enhanced_contacts 
-- ADD COLUMN IF NOT EXISTS social_media_links JSONB DEFAULT '{}',
-- ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
-- ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);

-- إضافة عمود جديد لجدول الوسطاء
-- ALTER TABLE land_brokers 
-- ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 2.5,
-- ADD COLUMN IF NOT EXISTS specialization TEXT[] DEFAULT '{}',
-- ADD COLUMN IF NOT EXISTS years_of_experience INTEGER DEFAULT 0;

-- ===== 2. إنشاء جداول جديدة =====

-- جدول إعدادات النظام المتقدمة
CREATE TABLE IF NOT EXISTS system_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_name VARCHAR(100) NOT NULL,
    config_key VARCHAR(100) NOT NULL,
    config_value JSONB,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(module_name, config_key)
);

-- جدول سجل الأنشطة (Activity Log)
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action_type VARCHAR(50) NOT NULL, -- create, update, delete, login, etc.
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول الإشعارات
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- info, warning, error, success
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- جدول المرفقات العامة
CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(100) NOT NULL, -- contact, property, contract, etc.
    entity_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    description TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول التعليقات والملاحظات
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    comment_text TEXT NOT NULL,
    is_private BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول المهام والتذكيرات
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, cancelled
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    entity_type VARCHAR(100), -- للربط بكيانات أخرى
    entity_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول العملات وأسعار الصرف
CREATE TABLE IF NOT EXISTS currencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(3) NOT NULL UNIQUE, -- AED, USD, EUR, etc.
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10),
    exchange_rate_to_aed DECIMAL(10,4) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ===== 3. إنشاء الفهارس لتحسين الأداء =====

-- فهارس للجداول الجديدة
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_table_record ON activity_logs(table_name, record_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON attachments(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_by ON comments(created_by);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_entity ON tasks(entity_type, entity_id);

-- ===== 4. إضافة سياسات الأمان RLS =====

-- تفعيل RLS للجداول الجديدة
ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

-- سياسات للإشعارات (المستخدم يرى إشعاراته فقط)
CREATE POLICY "Users can view their own notifications" ON notifications
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- سياسات للمهام
CREATE POLICY "Users can view assigned tasks" ON tasks
FOR SELECT TO authenticated
USING (auth.uid() = assigned_to OR auth.uid() = created_by);

CREATE POLICY "Users can create tasks" ON tasks
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their tasks" ON tasks
FOR UPDATE TO authenticated
USING (auth.uid() = assigned_to OR auth.uid() = created_by);

-- سياسات للمرفقات (حسب نوع الكيان)
CREATE POLICY "Users can view attachments" ON attachments
FOR SELECT TO authenticated
USING (true); -- يمكن تخصيصها حسب نوع الكيان

CREATE POLICY "Users can upload attachments" ON attachments
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = uploaded_by);

-- سياسات للتعليقات
CREATE POLICY "Users can view public comments" ON comments
FOR SELECT TO authenticated
USING (NOT is_private OR auth.uid() = created_by);

CREATE POLICY "Users can create comments" ON comments
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

-- سياسات للعملات (قراءة عامة)
CREATE POLICY "Anyone can view active currencies" ON currencies
FOR SELECT TO authenticated
USING (is_active = true);

-- ===== 5. إدراج بيانات أولية =====

-- إدراج العملات الأساسية
INSERT INTO currencies (code, name, symbol, exchange_rate_to_aed, is_active) VALUES
('AED', 'درهم إماراتي', 'د.إ', 1.0000, true),
('USD', 'دولار أمريكي', '$', 3.6725, true),
('EUR', 'يورو', '€', 4.0000, true),
('GBP', 'جنيه إسترليني', '£', 4.5000, true),
('SAR', 'ريال سعودي', 'ر.س', 0.9793, true)
ON CONFLICT (code) DO NOTHING;

-- إدراج إعدادات النظام الأساسية
INSERT INTO system_configurations (module_name, config_key, config_value, description) VALUES
('general', 'maintenance_mode', 'false', 'وضع الصيانة'),
('general', 'max_file_upload_size', '10485760', 'الحد الأقصى لحجم الملف (بايت)'),
('notifications', 'email_enabled', 'true', 'تفعيل الإشعارات عبر البريد الإلكتروني'),
('notifications', 'sms_enabled', 'false', 'تفعيل الإشعارات عبر الرسائل النصية'),
('security', 'session_timeout', '3600', 'انتهاء صلاحية الجلسة (ثانية)'),
('backup', 'auto_backup_enabled', 'true', 'تفعيل النسخ الاحتياطي التلقائي')
ON CONFLICT (module_name, config_key) DO NOTHING;

-- ===== 6. إنشاء دوال مساعدة =====

-- دالة لتسجيل الأنشطة
CREATE OR REPLACE FUNCTION log_activity(
    p_action_type VARCHAR(50),
    p_table_name VARCHAR(100),
    p_record_id UUID,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO activity_logs (
        user_id, action_type, table_name, record_id, 
        old_values, new_values, ip_address
    ) VALUES (
        auth.uid(), p_action_type, p_table_name, p_record_id,
        p_old_values, p_new_values, inet_client_addr()
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة لإنشاء إشعار
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_title VARCHAR(255),
    p_message TEXT,
    p_type VARCHAR(50) DEFAULT 'info',
    p_action_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id, title, message, type, action_url
    ) VALUES (
        p_user_id, p_title, p_message, p_type, p_action_url
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== ملاحظات مهمة =====
-- 1. تأكد من مراجعة السياسات قبل التطبيق
-- 2. قم بعمل نسخة احتياطية قبل تطبيق التغييرات
-- 3. اختبر الجداول الجديدة في بيئة التطوير أولاً
-- 4. يمكنك تعديل أنواع البيانات والقيود حسب احتياجاتك

-- لحذف جدول (استخدم بحذر):
-- DROP TABLE IF EXISTS table_name CASCADE;

-- لحذف عمود (استخدم بحذر):
-- ALTER TABLE table_name DROP COLUMN IF EXISTS column_name;