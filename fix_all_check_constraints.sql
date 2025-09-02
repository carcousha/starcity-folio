-- إصلاح شامل لجميع قيود التحقق في جدول enhanced_contacts

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

-- 3. إصلاح قيد التحقق chk_priority (إذا كان موجودًا)
DO $$
BEGIN
  -- التحقق من وجود قيد chk_priority
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'enhanced_contacts' 
    AND constraint_name = 'chk_priority'
  ) THEN
    -- حذف قيد التحقق الموجود
    ALTER TABLE enhanced_contacts DROP CONSTRAINT IF EXISTS chk_priority;
    RAISE NOTICE 'تم حذف قيد التحقق chk_priority';
  END IF;
  
  -- تحديث جميع القيم الفارغة أو NULL في عمود priority
  UPDATE enhanced_contacts SET priority = 'medium' WHERE priority IS NULL OR priority = '';
  
  -- إضافة قيد تحقق جديد يسمح بالقيم المستخدمة في التطبيق
  ALTER TABLE enhanced_contacts ADD CONSTRAINT chk_priority 
    CHECK (priority IN ('high', 'medium', 'low'));
  
  RAISE NOTICE 'تم إضافة قيد التحقق chk_priority الجديد';
END $$;

-- 4. إصلاح قيد التحقق satisfaction_rating (إذا كان موجودًا)
DO $$
BEGIN
  -- التحقق من وجود قيد satisfaction_rating_check
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'enhanced_contacts' 
    AND constraint_name LIKE '%satisfaction_rating%'
  ) THEN
    -- حذف قيد التحقق الموجود
    ALTER TABLE enhanced_contacts DROP CONSTRAINT IF EXISTS satisfaction_rating_check;
    RAISE NOTICE 'تم حذف قيد التحقق satisfaction_rating_check';
  END IF;
  
  -- تحديث جميع القيم غير الصالحة في عمود satisfaction_rating
  UPDATE enhanced_contacts SET satisfaction_rating = NULL WHERE satisfaction_rating < 1 OR satisfaction_rating > 5;
  
  -- إضافة قيد تحقق جديد
  ALTER TABLE enhanced_contacts ADD CONSTRAINT satisfaction_rating_check 
    CHECK (satisfaction_rating IS NULL OR (satisfaction_rating >= 1 AND satisfaction_rating <= 5));
  
  RAISE NOTICE 'تم إضافة قيد التحقق satisfaction_rating_check الجديد';
END $$;

-- 5. التحقق من نجاح العملية
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