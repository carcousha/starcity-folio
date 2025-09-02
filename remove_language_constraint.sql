-- إزالة قيد التحقق chk_language من جدول enhanced_contacts
-- استخدم هذا الملف إذا استمرت مشكلة المزامنة بعد تطبيق fix_sync_errors.sql

-- 1. عرض القيم الفريدة الموجودة في عمود language قبل الإزالة
SELECT language, COUNT(*) as count
FROM enhanced_contacts
GROUP BY language
ORDER BY language;

-- 2. إزالة قيد التحقق chk_language
DO $$
BEGIN
  -- حذف قيد التحقق الموجود
  ALTER TABLE enhanced_contacts DROP CONSTRAINT IF EXISTS chk_language;
  
  -- تحديث القيم الفارغة أو NULL
  UPDATE enhanced_contacts SET language = 'ar' WHERE language IS NULL OR language = '';
  
  RAISE NOTICE 'تم إزالة قيد التحقق chk_language بنجاح';
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

-- 4. عرض القيم الفريدة بعد الإزالة
SELECT language, COUNT(*) as count
FROM enhanced_contacts
GROUP BY language
ORDER BY language;