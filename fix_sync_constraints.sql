-- إصلاح أخطاء المزامنة في جدول enhanced_contacts
-- تشغيل هذا الملف في Supabase SQL Editor

-- إصلاح قيد NOT NULL في عمود name للسماح بالقيم الفارغة أثناء المزامنة
ALTER TABLE enhanced_contacts 
ALTER COLUMN name DROP NOT NULL;

-- إضافة الحقول المطلوبة للمزامنة إذا لم تكن موجودة
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS original_table TEXT;

ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS original_id TEXT;

-- إضافة الحقول المفقودة الأخرى
ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS area_max DECIMAL(10,2);

ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS area_min DECIMAL(10,2);

ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS budget_max DECIMAL(15,2);

ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS budget_min DECIMAL(15,2);

ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS investment_type TEXT;

ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS property_type TEXT;

ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS location_preference TEXT;

ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;

ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS emergency_contact_relation TEXT;

ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS total_sales_count INTEGER DEFAULT 0;

ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS total_sales_value DECIMAL(15,2) DEFAULT 0;

ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS last_sale_date DATE;

ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS average_deal_size DECIMAL(15,2) DEFAULT 0;

ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS conversion_rate DECIMAL(5,2) DEFAULT 0;

ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS lead_source TEXT;

ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS lead_status TEXT DEFAULT 'new';

ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS assigned_agent TEXT;

ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS next_follow_up_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS communication_preferences TEXT[];

ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS social_media_profiles JSONB;

ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS custom_fields JSONB;

ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS areas_specialization TEXT[];

ALTER TABLE enhanced_contacts 
ADD COLUMN IF NOT EXISTS channels TEXT[];

-- حذف القيد المركب إذا كان موجوداً
ALTER TABLE enhanced_contacts DROP CONSTRAINT IF EXISTS unique_original_table_id;

-- إنشاء القيد المركب الفريد للمزامنة
ALTER TABLE enhanced_contacts 
ADD CONSTRAINT unique_original_table_id 
UNIQUE (original_table, original_id);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_original_table ON enhanced_contacts(original_table);

-- إصلاح قيود التحقق التي تسبب أخطاء المزامنة
DO $$
BEGIN
  -- حذف قيود التحقق الموجودة
  ALTER TABLE enhanced_contacts DROP CONSTRAINT IF EXISTS chk_status;
  ALTER TABLE enhanced_contacts DROP CONSTRAINT IF EXISTS chk_language;
  
  -- تحديث القيم الفارغة أو NULL
  UPDATE enhanced_contacts SET status = 'active' WHERE status IS NULL OR status = '';
  UPDATE enhanced_contacts SET language = 'ar' WHERE language IS NULL OR language = '';
  
  -- إضافة قيد تحقق جديد لعمود status يشمل جميع القيم المحتملة
  -- تم توسيع القائمة لتشمل قيمًا إضافية قد تكون مستخدمة في عمليات المزامنة
  ALTER TABLE enhanced_contacts ADD CONSTRAINT chk_status 
    CHECK (status IN (
      'active', 'inactive', 'lead', 'prospect', 'customer', 'archived', 'deleted',
      'blocked', 'new', 'interested', 'negotiating', 'agreed', 'contracted', 'not_interested',
      'pending', 'converted', 'qualified', 'unqualified', 'contacted', 'follow_up'
    ));
  
  -- إضافة قيد تحقق جديد لعمود language يشمل جميع القيم المحتملة
  -- تم توسيع القائمة لتشمل قيمًا إضافية قد تكون مستخدمة في عمليات المزامنة
  ALTER TABLE enhanced_contacts ADD CONSTRAINT chk_language 
    CHECK (language IN ('ar', 'en', 'fr', 'other', 'es', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'nl', 'tr', 'pl'));
  
  RAISE NOTICE 'تم إضافة قيود التحقق الجديدة بنجاح';
END $$;

-- التحقق من نجاح العملية
SELECT
    tc.constraint_name,
    tc.table_name,
    tc.constraint_type,
    cc.check_clause
FROM
    information_schema.table_constraints tc
JOIN
    information_schema.check_constraints cc
ON
    tc.constraint_name = cc.constraint_name
WHERE
    tc.table_name = 'enhanced_contacts'
    AND tc.constraint_type = 'CHECK';
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_original_id ON enhanced_contacts(original_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_lead_status ON enhanced_contacts(lead_status);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_lead_source ON enhanced_contacts(lead_source);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_assigned_agent ON enhanced_contacts(assigned_agent);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_last_contact_date ON enhanced_contacts(last_contact_date);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_next_follow_up_date ON enhanced_contacts(next_follow_up_date);

-- إضافة قيود للتحقق من صحة البيانات
ALTER TABLE enhanced_contacts DROP CONSTRAINT IF EXISTS chk_lead_status;
ALTER TABLE enhanced_contacts 
ADD CONSTRAINT chk_lead_status 
CHECK (lead_status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost', 'on_hold'));

ALTER TABLE enhanced_contacts DROP CONSTRAINT IF EXISTS chk_investment_type;
ALTER TABLE enhanced_contacts 
ADD CONSTRAINT chk_investment_type 
CHECK (investment_type IN ('residential', 'commercial', 'industrial', 'land', 'mixed_use', 'other'));

ALTER TABLE enhanced_contacts DROP CONSTRAINT IF EXISTS chk_property_type;
ALTER TABLE enhanced_contacts 
ADD CONSTRAINT chk_property_type 
CHECK (property_type IN ('apartment', 'villa', 'townhouse', 'office', 'retail', 'warehouse', 'land', 'other'));

-- إضافة تعليقات للحقول الجديدة
COMMENT ON COLUMN enhanced_contacts.original_table IS 'الجدول الأصلي الذي تم المزامنة منه';
COMMENT ON COLUMN enhanced_contacts.original_id IS 'المعرف الأصلي في الجدول المصدر';
COMMENT ON COLUMN enhanced_contacts.area_max IS 'الحد الأقصى للمساحة المطلوبة';
COMMENT ON COLUMN enhanced_contacts.area_min IS 'الحد الأدنى للمساحة المطلوبة';
COMMENT ON COLUMN enhanced_contacts.budget_max IS 'الحد الأقصى للميزانية';
COMMENT ON COLUMN enhanced_contacts.budget_min IS 'الحد الأدنى للميزانية';
COMMENT ON COLUMN enhanced_contacts.investment_type IS 'نوع الاستثمار المطلوب';
COMMENT ON COLUMN enhanced_contacts.property_type IS 'نوع العقار المطلوب';
COMMENT ON COLUMN enhanced_contacts.location_preference IS 'المنطقة المفضلة';
COMMENT ON COLUMN enhanced_contacts.emergency_contact_name IS 'اسم جهة الاتصال في حالات الطوارئ';
COMMENT ON COLUMN enhanced_contacts.emergency_contact_phone IS 'هاتف جهة الاتصال في حالات الطوارئ';
COMMENT ON COLUMN enhanced_contacts.emergency_contact_relation IS 'صلة القرابة لجهة الاتصال في حالات الطوارئ';
COMMENT ON COLUMN enhanced_contacts.total_sales_count IS 'إجمالي عدد المبيعات';
COMMENT ON COLUMN enhanced_contacts.total_sales_value IS 'إجمالي قيمة المبيعات';
COMMENT ON COLUMN enhanced_contacts.last_sale_date IS 'تاريخ آخر عملية بيع';
COMMENT ON COLUMN enhanced_contacts.average_deal_size IS 'متوسط حجم الصفقة';
COMMENT ON COLUMN enhanced_contacts.conversion_rate IS 'معدل التحويل';
COMMENT ON COLUMN enhanced_contacts.lead_source IS 'مصدر العميل المحتمل';
COMMENT ON COLUMN enhanced_contacts.lead_status IS 'حالة العميل المحتمل';
COMMENT ON COLUMN enhanced_contacts.assigned_agent IS 'الوكيل المسؤول';
COMMENT ON COLUMN enhanced_contacts.last_contact_date IS 'تاريخ آخر اتصال';
COMMENT ON COLUMN enhanced_contacts.next_follow_up_date IS 'تاريخ المتابعة التالية';
COMMENT ON COLUMN enhanced_contacts.communication_preferences IS 'تفضيلات التواصل';
COMMENT ON COLUMN enhanced_contacts.social_media_profiles IS 'ملفات وسائل التواصل الاجتماعي';
COMMENT ON COLUMN enhanced_contacts.custom_fields IS 'حقول مخصصة إضافية';
COMMENT ON COLUMN enhanced_contacts.areas_specialization IS 'مناطق التخصص أو الاهتمام';
COMMENT ON COLUMN enhanced_contacts.channels IS 'قنوات التواصل المفضلة';
COMMENT ON COLUMN enhanced_contacts.name IS 'اسم جهة الاتصال - يمكن أن يكون فارغاً أثناء المزامنة';

-- تحديث دالة البحث لتشمل الحقول الجديدة
CREATE OR REPLACE FUNCTION update_enhanced_contacts_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('arabic', COALESCE(NEW.name, COALESCE(NEW.full_name, 'غير محدد'))), 'A') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.full_name, '')), 'A') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.short_name, '')), 'B') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.phone, '')), 'B') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.phone_primary, '')), 'B') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.phone_secondary, '')), 'B') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.email, '')), 'B') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.bio, '')), 'C') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.notes, '')), 'C') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.office_name, '')), 'C') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.job_title, '')), 'C') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.location_preference, '')), 'C') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.assigned_agent, '')), 'C') ||
    setweight(to_tsvector('arabic', COALESCE(array_to_string(NEW.areas_specialization, ' '), '')), 'C') ||
    setweight(to_tsvector('arabic', COALESCE(array_to_string(NEW.channels, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتحديث search_vector تلقائياً
DROP TRIGGER IF EXISTS enhanced_contacts_search_vector_update ON enhanced_contacts;
CREATE TRIGGER enhanced_contacts_search_vector_update
  BEFORE INSERT OR UPDATE ON enhanced_contacts
  FOR EACH ROW EXECUTE FUNCTION update_enhanced_contacts_search_vector();

-- تحديث السجلات التي تحتوي على قيم فارغة في عمود name
UPDATE enhanced_contacts 
SET name = COALESCE(full_name, short_name, 'غير محدد')
WHERE name IS NULL OR name = '';

-- تحديث search_vector للسجلات الموجودة
UPDATE enhanced_contacts SET updated_at = updated_at WHERE search_vector IS NULL;

SELECT 'تم إصلاح جدول enhanced_contacts وإضافة القيد المركب للمزامنة بنجاح' AS result;