-- ===== فحص وتشخيص مشكلة جدول enhanced_contacts =====

-- 1. التحقق من وجود الجدول
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'enhanced_contacts'
) as table_exists;

-- 2. عرض هيكل الجدول إذا كان موجوداً
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'enhanced_contacts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. التحقق من المفاتيح الأساسية والفريدة
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'enhanced_contacts'
AND tc.table_schema = 'public';

-- 4. التحقق من سياسات RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'enhanced_contacts';

-- 5. التحقق من صلاحيات الجدول
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'enhanced_contacts'
AND table_schema = 'public';

-- 6. عرض عينة من البيانات (إذا وجدت)
SELECT COUNT(*) as total_records FROM enhanced_contacts;

-- 7. التحقق من الفهارس
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'enhanced_contacts'
AND schemaname = 'public';

-- 8. التحقق من وجود triggers
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'enhanced_contacts'
AND event_object_schema = 'public';

-- ===== إنشاء الجدول إذا لم يكن موجوداً =====

-- إنشاء جدول enhanced_contacts مع جميع الأعمدة المطلوبة
CREATE TABLE IF NOT EXISTS enhanced_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT,
    phone TEXT,
    email TEXT,
    company TEXT,
    position TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    source TEXT,
    status TEXT DEFAULT 'active',
    priority TEXT DEFAULT 'medium',
    tags TEXT[],
    notes TEXT,
    original_table TEXT,
    original_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- إضافة فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_full_name ON enhanced_contacts(full_name);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_phone ON enhanced_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_email ON enhanced_contacts(email);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_company ON enhanced_contacts(company);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_status ON enhanced_contacts(status);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_original_table ON enhanced_contacts(original_table);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_created_at ON enhanced_contacts(created_at);

-- تفعيل RLS
ALTER TABLE enhanced_contacts ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات RLS
DROP POLICY IF EXISTS "Users can view all enhanced_contacts" ON enhanced_contacts;
CREATE POLICY "Users can view all enhanced_contacts" ON enhanced_contacts
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can insert enhanced_contacts" ON enhanced_contacts;
CREATE POLICY "Users can insert enhanced_contacts" ON enhanced_contacts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update enhanced_contacts" ON enhanced_contacts;
CREATE POLICY "Users can update enhanced_contacts" ON enhanced_contacts
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete enhanced_contacts" ON enhanced_contacts;
CREATE POLICY "Users can delete enhanced_contacts" ON enhanced_contacts
    FOR DELETE USING (auth.role() = 'authenticated');

-- إنشاء trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_enhanced_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_enhanced_contacts_updated_at_trigger ON enhanced_contacts;
CREATE TRIGGER update_enhanced_contacts_updated_at_trigger
    BEFORE UPDATE ON enhanced_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_enhanced_contacts_updated_at();

-- إنشاء trigger لتعيين created_by عند الإدراج
CREATE OR REPLACE FUNCTION set_enhanced_contacts_created_by()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_by = auth.uid();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_enhanced_contacts_created_by_trigger ON enhanced_contacts;
CREATE TRIGGER set_enhanced_contacts_created_by_trigger
    BEFORE INSERT ON enhanced_contacts
    FOR EACH ROW
    EXECUTE FUNCTION set_enhanced_contacts_created_by();

-- منح الصلاحيات
GRANT ALL ON enhanced_contacts TO authenticated;
GRANT ALL ON enhanced_contacts TO service_role;

-- التحقق النهائي من الجدول
SELECT 'enhanced_contacts table created/verified successfully' as status;