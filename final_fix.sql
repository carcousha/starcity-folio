-- الحل النهائي لإصلاح قيود التحقق في جدول enhanced_contacts

-- 1. عرض القيم الفريدة الموجودة في عمود status
SELECT status, COUNT(*) as count
FROM enhanced_contacts
GROUP BY status
ORDER BY status;

-- 2. إصلاح قيود التحقق بطريقة شاملة
DO $$
BEGIN
  -- حذف قيود التحقق الموجودة
  ALTER TABLE enhanced_contacts DROP CONSTRAINT IF EXISTS chk_status;
  ALTER TABLE enhanced_contacts DROP CONSTRAINT IF EXISTS chk_language;
  
  -- تحديث القيم الفارغة أو NULL
  UPDATE enhanced_contacts SET status = 'active' WHERE status IS NULL OR status = '';
  UPDATE enhanced_contacts SET language = 'ar' WHERE language IS NULL OR language = '';
  
  -- إضافة قيد تحقق جديد لعمود status يشمل جميع القيم المحتملة
  ALTER TABLE enhanced_contacts ADD CONSTRAINT chk_status 
    CHECK (status IN (
      'active', 'inactive', 'lead', 'prospect', 'customer', 'archived', 'deleted',
      'blocked', 'new', 'interested', 'negotiating', 'agreed', 'contracted', 'not_interested'
    ));
  
  -- إضافة قيد تحقق جديد لعمود language يشمل جميع القيم المحتملة
  ALTER TABLE enhanced_contacts ADD CONSTRAINT chk_language 
    CHECK (language IN ('ar', 'en', 'fr', 'other', 'es', 'de', 'it', 'pt', 'ru', 'zh', 'ja'));
  
  RAISE NOTICE 'تم إضافة قيود التحقق الجديدة بنجاح';
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

-- 4. عرض القيم الفريدة بعد الإصلاح
SELECT status, COUNT(*) as count
FROM enhanced_contacts
GROUP BY status
ORDER BY status;

SELECT language, COUNT(*) as count
FROM enhanced_contacts
GROUP BY language
ORDER BY language;