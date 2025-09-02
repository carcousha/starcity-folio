-- إصلاح قيود التحقق في جدول enhanced_contacts

-- 1. إصلاح قيد التحقق chk_status
DO $$
BEGIN
  -- التحقق من وجود قيد chk_status
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'enhanced_contacts' 
    AND constraint_name = 'chk_status'
  ) THEN
    -- حذف قيد التحقق الموجود
    ALTER TABLE enhanced_contacts DROP CONSTRAINT IF EXISTS chk_status;
    RAISE NOTICE 'تم حذف قيد التحقق chk_status';
  END IF;
  
  -- تحديث جميع القيم الفارغة أو NULL في عمود status
  UPDATE enhanced_contacts SET status = 'active' WHERE status IS NULL OR status = '';
  
  -- إضافة قيد تحقق جديد يسمح بالقيم المستخدمة في التطبيق
  ALTER TABLE enhanced_contacts ADD CONSTRAINT chk_status 
    CHECK (status IN ('active', 'inactive', 'lead', 'prospect', 'customer', 'archived', 'deleted'));
  
  RAISE NOTICE 'تم إضافة قيد التحقق chk_status الجديد';
END $$;

-- 2. إصلاح قيد التحقق chk_language
DO $$
BEGIN
  -- التحقق من وجود قيد chk_language
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'enhanced_contacts' 
    AND constraint_name = 'chk_language'
  ) THEN
    -- حذف قيد التحقق الموجود
    ALTER TABLE enhanced_contacts DROP CONSTRAINT IF EXISTS chk_language;
    RAISE NOTICE 'تم حذف قيد التحقق chk_language';
  END IF;
  
  -- تحديث جميع القيم الفارغة أو NULL في عمود language
  UPDATE enhanced_contacts SET language = 'ar' WHERE language IS NULL OR language = '';
  
  -- إضافة قيد تحقق جديد يسمح بالقيم المستخدمة في التطبيق
  ALTER TABLE enhanced_contacts ADD CONSTRAINT chk_language 
    CHECK (language IN ('ar', 'en', 'fr', 'other'));
  
  RAISE NOTICE 'تم إضافة قيد التحقق chk_language الجديد';
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