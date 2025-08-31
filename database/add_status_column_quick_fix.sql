-- ===== إضافة عمود status بشكل سريع =====
-- قم بتشغيل هذا الكود في Supabase Dashboard > SQL Editor

-- 1. إضافة عمود status إذا لم يكن موجوداً
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
CHECK (status IN ('active', 'inactive', 'archived'));

-- 2. إضافة عمود priority إذا لم يكن موجوداً
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- 3. إضافة عمود follow_up_status إذا لم يكن موجوداً
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS follow_up_status TEXT DEFAULT 'new' 
CHECK (follow_up_status IN ('new', 'contacted', 'interested', 'negotiating', 'closed', 'lost', 'inactive'));

-- 4. إضافة فهرس لعمود status
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_status ON enhanced_contacts(status);

-- 5. إضافة فهرس لعمود priority
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_priority ON enhanced_contacts(priority);

-- 6. إضافة فهرس لعمود follow_up_status
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_follow_up_status ON enhanced_contacts(follow_up_status);

-- 7. تحديث البيانات الموجودة لتعيين قيم افتراضية
UPDATE enhanced_contacts 
SET status = 'active' 
WHERE status IS NULL;

UPDATE enhanced_contacts 
SET priority = 'medium' 
WHERE priority IS NULL;

UPDATE enhanced_contacts 
SET follow_up_status = 'new' 
WHERE follow_up_status IS NULL;

-- 8. التحقق من نجاح العملية
SELECT 
    'status column added successfully!' as message,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status IS NOT NULL THEN 1 END) as records_with_status
FROM enhanced_contacts;

-- 9. عرض عينة من البيانات للتأكد
SELECT 
    id,
    full_name,
    status,
    priority,
    follow_up_status,
    created_at
FROM enhanced_contacts 
LIMIT 5;