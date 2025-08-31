-- ===== إضافة عمود full_name بشكل سريع =====
-- قم بتشغيل هذا الكود في Supabase Dashboard > SQL Editor

-- 1. إضافة عمود full_name إذا لم يكن موجوداً
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 2. إضافة عمود name إذا لم يكن موجوداً (للتوافق)
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS name TEXT;

-- 3. إضافة عمود first_name إذا لم يكن موجوداً
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS first_name TEXT;

-- 4. إضافة عمود last_name إذا لم يكن موجوداً
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- 5. إضافة عمود phone إذا لم يكن موجوداً
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 6. إضافة عمود email إذا لم يكن موجوداً
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 7. إضافة عمود company إذا لم يكن موجوداً
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS company TEXT;

-- 8. إضافة فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_full_name ON enhanced_contacts(full_name);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_name ON enhanced_contacts(name);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_phone ON enhanced_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_email ON enhanced_contacts(email);

-- 9. تحديث البيانات الموجودة - دمج name في full_name إذا كان فارغاً
UPDATE enhanced_contacts 
SET full_name = COALESCE(full_name, name, 'غير محدد')
WHERE full_name IS NULL OR full_name = '';

-- 10. تحديث name من full_name إذا كان فارغاً
UPDATE enhanced_contacts 
SET name = COALESCE(name, full_name, 'غير محدد')
WHERE name IS NULL OR name = '';

-- 11. تقسيم full_name إلى first_name و last_name إذا كانا فارغين
UPDATE enhanced_contacts 
SET 
    first_name = COALESCE(first_name, SPLIT_PART(full_name, ' ', 1)),
    last_name = COALESCE(last_name, 
        CASE 
            WHEN ARRAY_LENGTH(STRING_TO_ARRAY(full_name, ' '), 1) > 1 
            THEN TRIM(SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1))
            ELSE ''
        END
    )
WHERE (first_name IS NULL OR first_name = '') 
   OR (last_name IS NULL OR last_name = '');

-- 12. التحقق من نجاح العملية
SELECT 
    'full_name column added successfully!' as message,
    COUNT(*) as total_records,
    COUNT(CASE WHEN full_name IS NOT NULL AND full_name != '' THEN 1 END) as records_with_full_name,
    COUNT(CASE WHEN name IS NOT NULL AND name != '' THEN 1 END) as records_with_name
FROM enhanced_contacts;

-- 13. عرض عينة من البيانات للتأكد
SELECT 
    id,
    name,
    full_name,
    first_name,
    last_name,
    phone,
    email,
    created_at
FROM enhanced_contacts 
LIMIT 5;

-- 14. عرض هيكل الجدول المحدث
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'enhanced_contacts' 
AND table_schema = 'public'
AND column_name IN ('name', 'full_name', 'first_name', 'last_name', 'phone', 'email')
ORDER BY ordinal_position;

-- 15. رسالة تأكيد نهائية
SELECT 'تم إضافة عمود full_name والأعمدة المطلوبة بنجاح! يمكنك الآن استخدام النظام.' as final_message;