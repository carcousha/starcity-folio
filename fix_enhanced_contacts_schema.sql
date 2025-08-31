-- إضافة الأعمدة المفقودة إلى جدول enhanced_contacts
-- تشغيل هذا الملف في Supabase SQL Editor

-- إضافة عمود bio (النبذة الشخصية)
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- إضافة عمود full_name (الاسم الكامل)
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- إضافة عمود language (اللغة)
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'ar';

-- إضافة عمود rating_1_5 (التقييم من 1-5)
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS rating_1_5 INTEGER CHECK (rating_1_5 >= 1 AND rating_1_5 <= 5);

-- إضافة عمود status (الحالة)
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- إضافة عمود follow_up_status (حالة المتابعة)
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS follow_up_status TEXT DEFAULT 'new';

-- إضافة عمود priority (الأولوية)
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';

-- إضافة عمود preferred_contact_method (طريقة الاتصال المفضلة)
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT;

-- إضافة عمود office_classification (تصنيف المكتب)
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS office_classification TEXT;

-- إضافة عمود job_title (المسمى الوظيفي)
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS job_title TEXT;

-- إضافة عمود units_count (عدد الوحدات)
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS units_count INTEGER;

-- إضافة عمود cr_number (رقم السجل التجاري)
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS cr_number TEXT;

-- إضافة عمود cr_expiry_date (تاريخ انتهاء السجل التجاري)
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS cr_expiry_date DATE;

-- إضافة عمود nationality (الجنسية)
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS nationality TEXT;

-- إضافة عمود id_type (نوع الهوية)
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS id_type TEXT;

-- إضافة عمود id_number (رقم الهوية)
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS id_number TEXT;

-- إضافة عمود id_expiry_date (تاريخ انتهاء الهوية)
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS id_expiry_date DATE;

-- إضافة عمود bank_name (اسم البنك)
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS bank_name TEXT;

-- إضافة عمود account_number (رقم الحساب)
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS account_number TEXT;

-- إضافة عمود iban (رقم الآيبان)
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS iban TEXT;

-- تحديث البيانات الموجودة
-- نسخ البيانات من الأعمدة الموجودة إلى الأعمدة الجديدة
UPDATE enhanced_contacts 
SET 
  full_name = COALESCE(full_name, name),
  bio = COALESCE(bio, about),
  rating_1_5 = CASE 
    WHEN rating IS NOT NULL AND rating >= 1 AND rating <= 5 THEN rating::INTEGER
    ELSE NULL 
  END
WHERE full_name IS NULL OR bio IS NULL OR rating_1_5 IS NULL;

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_full_name ON enhanced_contacts(full_name);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_status ON enhanced_contacts(status);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_follow_up_status ON enhanced_contacts(follow_up_status);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_priority ON enhanced_contacts(priority);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_rating_1_5 ON enhanced_contacts(rating_1_5);

-- إضافة تعليقات للأعمدة الجديدة
COMMENT ON COLUMN enhanced_contacts.bio IS 'النبذة الشخصية لجهة الاتصال';
COMMENT ON COLUMN enhanced_contacts.full_name IS 'الاسم الكامل لجهة الاتصال';
COMMENT ON COLUMN enhanced_contacts.language IS 'لغة التواصل المفضلة';
COMMENT ON COLUMN enhanced_contacts.rating_1_5 IS 'تقييم جهة الاتصال من 1 إلى 5';
COMMENT ON COLUMN enhanced_contacts.status IS 'حالة جهة الاتصال (active, inactive, blocked)';
COMMENT ON COLUMN enhanced_contacts.follow_up_status IS 'حالة المتابعة (new, contacted, interested, not_interested)';
COMMENT ON COLUMN enhanced_contacts.priority IS 'أولوية جهة الاتصال (high, medium, low)';
COMMENT ON COLUMN enhanced_contacts.preferred_contact_method IS 'طريقة الاتصال المفضلة';
COMMENT ON COLUMN enhanced_contacts.office_classification IS 'تصنيف المكتب';
COMMENT ON COLUMN enhanced_contacts.job_title IS 'المسمى الوظيفي';
COMMENT ON COLUMN enhanced_contacts.units_count IS 'عدد الوحدات المملوكة أو المدارة';
COMMENT ON COLUMN enhanced_contacts.cr_number IS 'رقم السجل التجاري';
COMMENT ON COLUMN enhanced_contacts.cr_expiry_date IS 'تاريخ انتهاء السجل التجاري';
COMMENT ON COLUMN enhanced_contacts.nationality IS 'الجنسية';
COMMENT ON COLUMN enhanced_contacts.id_type IS 'نوع الهوية (passport, national_id, residence)';
COMMENT ON COLUMN enhanced_contacts.id_number IS 'رقم الهوية';
COMMENT ON COLUMN enhanced_contacts.id_expiry_date IS 'تاريخ انتهاء الهوية';
COMMENT ON COLUMN enhanced_contacts.bank_name IS 'اسم البنك';
COMMENT ON COLUMN enhanced_contacts.account_number IS 'رقم الحساب البنكي';
COMMENT ON COLUMN enhanced_contacts.iban IS 'رقم الآيبان الدولي';

-- إضافة قيود للتحقق من صحة البيانات
-- حذف القيود إذا كانت موجودة ثم إضافتها مرة أخرى
ALTER TABLE enhanced_contacts DROP CONSTRAINT IF EXISTS chk_status;
ALTER TABLE enhanced_contacts 
ADD CONSTRAINT chk_status 
CHECK (status IN ('active', 'inactive', 'blocked'));

ALTER TABLE enhanced_contacts DROP CONSTRAINT IF EXISTS chk_follow_up_status;
ALTER TABLE enhanced_contacts 
ADD CONSTRAINT chk_follow_up_status 
CHECK (follow_up_status IN ('new', 'contacted', 'interested', 'not_interested', 'converted'));

ALTER TABLE enhanced_contacts DROP CONSTRAINT IF EXISTS chk_priority;
ALTER TABLE enhanced_contacts 
ADD CONSTRAINT chk_priority 
CHECK (priority IN ('high', 'medium', 'low'));

ALTER TABLE enhanced_contacts DROP CONSTRAINT IF EXISTS chk_language;
ALTER TABLE enhanced_contacts 
ADD CONSTRAINT chk_language 
CHECK (language IN ('ar', 'en'));

ALTER TABLE enhanced_contacts DROP CONSTRAINT IF EXISTS chk_id_type;
ALTER TABLE enhanced_contacts 
ADD CONSTRAINT chk_id_type 
CHECK (id_type IN ('passport', 'national_id', 'residence', 'other'));

-- تحديث search_vector لتشمل الحقول الجديدة
CREATE OR REPLACE FUNCTION update_enhanced_contacts_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('arabic', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.full_name, '')), 'A') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.short_name, '')), 'B') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.phone, '')), 'B') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.email, '')), 'B') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.bio, '')), 'C') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.notes, '')), 'C') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.office_name, '')), 'C') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.job_title, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتحديث search_vector تلقائياً
DROP TRIGGER IF EXISTS enhanced_contacts_search_vector_update ON enhanced_contacts;
CREATE TRIGGER enhanced_contacts_search_vector_update
  BEFORE INSERT OR UPDATE ON enhanced_contacts
  FOR EACH ROW EXECUTE FUNCTION update_enhanced_contacts_search_vector();

-- تحديث search_vector للسجلات الموجودة
UPDATE enhanced_contacts SET updated_at = updated_at;

SELECT 'تم إضافة جميع الأعمدة المفقودة بنجاح إلى جدول enhanced_contacts' AS result;