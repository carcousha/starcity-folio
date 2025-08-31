-- إضافة الأعمدة المفقودة إلى جدول enhanced_contacts
-- هذا الملف يحل مشكلة الأعمدة المفقودة دون حذف البيانات الموجودة

-- إضافة عمود full_name إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'enhanced_contacts' AND column_name = 'full_name') THEN
        ALTER TABLE enhanced_contacts ADD COLUMN full_name TEXT;
    END IF;
END $$;

-- إضافة عمود name إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'enhanced_contacts' AND column_name = 'name') THEN
        ALTER TABLE enhanced_contacts ADD COLUMN name TEXT;
    END IF;
END $$;

-- إضافة عمود first_name إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'enhanced_contacts' AND column_name = 'first_name') THEN
        ALTER TABLE enhanced_contacts ADD COLUMN first_name TEXT;
    END IF;
END $$;

-- إضافة عمود last_name إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'enhanced_contacts' AND column_name = 'last_name') THEN
        ALTER TABLE enhanced_contacts ADD COLUMN last_name TEXT;
    END IF;
END $$;

-- إضافة عمود phone إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'enhanced_contacts' AND column_name = 'phone') THEN
        ALTER TABLE enhanced_contacts ADD COLUMN phone TEXT;
    END IF;
END $$;

-- إضافة عمود email إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'enhanced_contacts' AND column_name = 'email') THEN
        ALTER TABLE enhanced_contacts ADD COLUMN email TEXT;
    END IF;
END $$;

-- إضافة عمود company إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'enhanced_contacts' AND column_name = 'company') THEN
        ALTER TABLE enhanced_contacts ADD COLUMN company TEXT;
    END IF;
END $$;

-- إضافة عمود nationality إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'enhanced_contacts' AND column_name = 'nationality') THEN
        ALTER TABLE enhanced_contacts ADD COLUMN nationality TEXT;
    END IF;
END $$;

-- إضافة عمود status إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'enhanced_contacts' AND column_name = 'status') THEN
        ALTER TABLE enhanced_contacts ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- تحديث البيانات الموجودة
-- تحديث full_name من short_name إذا كان فارغاً
UPDATE enhanced_contacts 
SET full_name = short_name 
WHERE full_name IS NULL AND short_name IS NOT NULL;

-- تحديث name من full_name إذا كان فارغاً
UPDATE enhanced_contacts 
SET name = full_name 
WHERE name IS NULL AND full_name IS NOT NULL;

-- تحديث first_name من الجزء الأول من full_name
UPDATE enhanced_contacts 
SET first_name = TRIM(SPLIT_PART(full_name, ' ', 1))
WHERE first_name IS NULL AND full_name IS NOT NULL AND full_name != '';

-- تحديث last_name من باقي الاسم
UPDATE enhanced_contacts 
SET last_name = TRIM(SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1))
WHERE last_name IS NULL AND full_name IS NOT NULL AND POSITION(' ' IN full_name) > 0;

-- تحديث status للسجلات التي لا تحتوي على قيمة
UPDATE enhanced_contacts 
SET status = 'active' 
WHERE status IS NULL;

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_full_name ON enhanced_contacts(full_name);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_name ON enhanced_contacts(name);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_phone ON enhanced_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_email ON enhanced_contacts(email);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_status ON enhanced_contacts(status);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_nationality ON enhanced_contacts(nationality);

-- رسالة تأكيد
DO $$
BEGIN
    RAISE NOTICE 'تم تطبيق الحل السريع بنجاح! تم إضافة جميع الأعمدة المفقودة وتحديث البيانات.';
END $$;