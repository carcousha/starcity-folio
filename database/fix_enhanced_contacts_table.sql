-- ===== إصلاح شامل لجدول enhanced_contacts =====
-- قم بتشغيل هذا الكود في Supabase Dashboard > SQL Editor

-- 1. حذف الجدول إذا كان موجوداً (لإعادة إنشائه بشكل صحيح)
DROP TABLE IF EXISTS enhanced_contacts CASCADE;

-- 2. إنشاء جدول enhanced_contacts مع جميع الأعمدة المطلوبة
CREATE TABLE enhanced_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- معلومات أساسية
    name TEXT,
    full_name TEXT,
    first_name TEXT,
    last_name TEXT,
    short_name TEXT,
    
    -- معلومات الاتصال
    phone TEXT,
    email TEXT,
    
    -- معلومات الشركة والعمل
    company TEXT,
    company_name TEXT,
    office TEXT,
    office_name TEXT,
    office_classification TEXT CHECK (office_classification IN ('platinum', 'gold', 'silver', 'bronze')),
    position TEXT,
    job_title TEXT,
    
    -- العنوان والموقع
    address TEXT,
    city TEXT,
    country TEXT,
    nationality TEXT,
    
    -- معلومات إضافية
    bio TEXT,
    notes TEXT,
    source TEXT,
    language TEXT DEFAULT 'ar' CHECK (language IN ('ar', 'en')),
    
    -- الحالة والأولوية
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    follow_up_status TEXT DEFAULT 'new' CHECK (follow_up_status IN ('new', 'contacted', 'interested', 'negotiating', 'closed', 'lost', 'inactive')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- التقييم والعلامات
    rating SMALLINT CHECK (rating >= 1 AND rating <= 5),
    rating_1_5 SMALLINT CHECK (rating_1_5 >= 1 AND rating_1_5 <= 5),
    tags TEXT[] DEFAULT '{}',
    
    -- التواريخ المهمة
    last_contact_date TIMESTAMP WITH TIME ZONE,
    next_contact_date TIMESTAMP WITH TIME ZONE,
    birthday DATE,
    
    -- معلومات الهوية والبنك
    id_type TEXT CHECK (id_type IN ('national_id', 'iqama', 'passport')),
    id_number TEXT,
    id_expiry_date DATE,
    cr_number TEXT,
    cr_expiry_date DATE,
    bank_name TEXT,
    account_number TEXT,
    iban TEXT,
    
    -- إدارة البيانات
    roles TEXT[] DEFAULT '{}',
    is_duplicate BOOLEAN DEFAULT false,
    master_contact_id UUID,
    original_table TEXT,
    original_id UUID,
    
    -- معلومات النظام
    units_count INTEGER DEFAULT 0,
    organization_id UUID,
    preferred_contact_method TEXT DEFAULT 'phone' CHECK (preferred_contact_method IN ('phone', 'whatsapp', 'email', 'sms')),
    metadata JSONB DEFAULT '{}',
    
    -- التتبع والمراجعة
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id)
);

-- 3. إضافة فهارس للأداء
CREATE INDEX idx_enhanced_contacts_name ON enhanced_contacts(name);
CREATE INDEX idx_enhanced_contacts_full_name ON enhanced_contacts(full_name);
CREATE INDEX idx_enhanced_contacts_phone ON enhanced_contacts(phone);
CREATE INDEX idx_enhanced_contacts_email ON enhanced_contacts(email);
CREATE INDEX idx_enhanced_contacts_company ON enhanced_contacts(company);
CREATE INDEX idx_enhanced_contacts_company_name ON enhanced_contacts(company_name);
CREATE INDEX idx_enhanced_contacts_status ON enhanced_contacts(status);
CREATE INDEX idx_enhanced_contacts_follow_up_status ON enhanced_contacts(follow_up_status);
CREATE INDEX idx_enhanced_contacts_priority ON enhanced_contacts(priority);
CREATE INDEX idx_enhanced_contacts_assigned_to ON enhanced_contacts(assigned_to);
CREATE INDEX idx_enhanced_contacts_created_by ON enhanced_contacts(created_by);
CREATE INDEX idx_enhanced_contacts_created_at ON enhanced_contacts(created_at);
CREATE INDEX idx_enhanced_contacts_tags ON enhanced_contacts USING gin(tags);
CREATE INDEX idx_enhanced_contacts_original_table ON enhanced_contacts(original_table);
CREATE INDEX idx_enhanced_contacts_last_contact ON enhanced_contacts(last_contact_date DESC);
CREATE INDEX idx_enhanced_contacts_next_contact ON enhanced_contacts(next_contact_date);
CREATE INDEX idx_enhanced_contacts_nationality ON enhanced_contacts(nationality);
CREATE INDEX idx_enhanced_contacts_id_number ON enhanced_contacts(id_number);
CREATE INDEX idx_enhanced_contacts_organization ON enhanced_contacts(organization_id);

-- 4. تفعيل Row Level Security
ALTER TABLE enhanced_contacts ENABLE ROW LEVEL SECURITY;

-- 5. إنشاء سياسات RLS
CREATE POLICY "المستخدمون المصرح لهم يمكنهم عرض جهات الاتصال" ON enhanced_contacts
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            created_by = auth.uid() OR 
            assigned_to = auth.uid() OR 
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE user_id = auth.uid() 
                AND role IN ('admin', 'manager', 'accountant') 
                AND is_active = true
            )
        )
    );

CREATE POLICY "المستخدمون المصرح لهم يمكنهم إدراج جهات الاتصال" ON enhanced_contacts
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        auth.uid() IS NOT NULL
    );

CREATE POLICY "المستخدمون المصرح لهم يمكنهم تحديث جهات الاتصال" ON enhanced_contacts
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            created_by = auth.uid() OR 
            assigned_to = auth.uid() OR 
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE user_id = auth.uid() 
                AND role IN ('admin', 'manager', 'accountant') 
                AND is_active = true
            )
        )
    );

CREATE POLICY "المستخدمون المصرح لهم يمكنهم حذف جهات الاتصال" ON enhanced_contacts
    FOR DELETE USING (
        auth.role() = 'authenticated' AND (
            created_by = auth.uid() OR 
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE user_id = auth.uid() 
                AND role IN ('admin', 'manager') 
                AND is_active = true
            )
        )
    );

-- 6. إنشاء دالة لتحديث updated_at
CREATE OR REPLACE FUNCTION update_enhanced_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. إنشاء trigger لتحديث updated_at
CREATE TRIGGER update_enhanced_contacts_updated_at_trigger
    BEFORE UPDATE ON enhanced_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_enhanced_contacts_updated_at();

-- 8. إنشاء دالة لتعيين created_by
CREATE OR REPLACE FUNCTION set_enhanced_contacts_created_by()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_by = auth.uid();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. إنشاء trigger لتعيين created_by
CREATE TRIGGER set_enhanced_contacts_created_by_trigger
    BEFORE INSERT ON enhanced_contacts
    FOR EACH ROW
    EXECUTE FUNCTION set_enhanced_contacts_created_by();

-- 10. منح الصلاحيات
GRANT ALL ON enhanced_contacts TO authenticated;
GRANT ALL ON enhanced_contacts TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- 11. إدراج بيانات تجريبية للاختبار
INSERT INTO enhanced_contacts (
    name, 
    full_name, 
    phone, 
    email, 
    company, 
    status, 
    priority
) VALUES (
    'اختبار النظام',
    'اختبار النظام الكامل',
    '+966501234567',
    'test@starcity.com',
    'شركة ستار سيتي',
    'active',
    'medium'
);

-- 12. التحقق من نجاح العملية
SELECT 
    'enhanced_contacts table created successfully!' as status,
    COUNT(*) as total_records
FROM enhanced_contacts;

-- 13. عرض هيكل الجدول للتأكد
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'enhanced_contacts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 14. عرض السياسات المُطبقة
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'enhanced_contacts';