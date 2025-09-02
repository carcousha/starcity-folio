-- إصلاح شامل لقيود التحقق في جدول enhanced_contacts

-- 1. عرض القيم الفريدة الموجودة في عمود status
SELECT status, COUNT(*) as count
FROM enhanced_contacts
GROUP BY status
ORDER BY status;

-- 2. إصلاح قيود التحقق بطريقة أكثر شمولاً
DO $$
DECLARE
    status_values TEXT[];
    language_values TEXT[];
    all_status_values TEXT;
    all_language_values TEXT;
BEGIN
    -- جمع جميع القيم الفريدة الموجودة في عمود status
    SELECT array_agg(DISTINCT status) INTO status_values FROM enhanced_contacts WHERE status IS NOT NULL AND status != '';
    
    -- جمع جميع القيم الفريدة الموجودة في عمود language
    SELECT array_agg(DISTINCT language) INTO language_values FROM enhanced_contacts WHERE language IS NOT NULL AND language != '';
    
    -- تحديث القيم الفارغة أو NULL
    UPDATE enhanced_contacts SET status = 'active' WHERE status IS NULL OR status = '';
    UPDATE enhanced_contacts SET language = 'ar' WHERE language IS NULL OR language = '';
    
    -- تحويل المصفوفات إلى نص للاستخدام في قيود التحقق
    -- إضافة القيم الافتراضية إلى المصفوفات
    status_values := array_cat(status_values, ARRAY['active', 'inactive', 'lead', 'prospect', 'customer', 'archived', 'deleted']);
    language_values := array_cat(language_values, ARRAY['ar', 'en', 'fr', 'other']);
    
    -- إزالة التكرار
    SELECT array_to_string(ARRAY(SELECT DISTINCT unnest FROM unnest(status_values)), ''', ''') INTO all_status_values;
    SELECT array_to_string(ARRAY(SELECT DISTINCT unnest FROM unnest(language_values)), ''', ''') INTO all_language_values;
    
    -- عرض القيم التي سيتم استخدامها في قيود التحقق
    RAISE NOTICE 'القيم التي سيتم استخدامها في قيد التحقق status: %', all_status_values;
    RAISE NOTICE 'القيم التي سيتم استخدامها في قيد التحقق language: %', all_language_values;
    
    -- حذف قيود التحقق الموجودة
    ALTER TABLE enhanced_contacts DROP CONSTRAINT IF EXISTS chk_status;
    ALTER TABLE enhanced_contacts DROP CONSTRAINT IF EXISTS chk_language;
    
    -- إنشاء قيود التحقق الجديدة باستخدام جميع القيم الموجودة
    EXECUTE 'ALTER TABLE enhanced_contacts ADD CONSTRAINT chk_status CHECK (status IN (''' || all_status_values || '''))';
    EXECUTE 'ALTER TABLE enhanced_contacts ADD CONSTRAINT chk_language CHECK (language IN (''' || all_language_values || '''))';
    
    RAISE NOTICE 'تم إنشاء قيود التحقق بنجاح';
END $$;

-- 3. التحقق من نجاح العملية
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