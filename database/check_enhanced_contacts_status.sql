-- التحقق من حالة جدول enhanced_contacts

-- 1. التحقق من وجود الجدول
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'enhanced_contacts'
) as table_exists;

-- 2. عرض هيكل الجدول
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'enhanced_contacts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. التحقق من سياسات RLS
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'enhanced_contacts';

-- 4. عدد السجلات الحالية
SELECT COUNT(*) as total_records FROM enhanced_contacts;

-- 5. اختبار إدراج بسيط
INSERT INTO enhanced_contacts (full_name, phone, email) 
VALUES ('اختبار', '123456789', 'test@example.com')
RETURNING id, full_name, created_at;