-- إصلاح مشكلة on_conflict في جدول enhanced_contacts
-- تشغيل هذا الملف في Supabase SQL Editor

-- 1. التحقق من وجود الأعمدة المطلوبة
DO $$
BEGIN
  -- التحقق من وجود عمود original_table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'original_table'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN original_table TEXT;
    RAISE NOTICE 'تم إضافة عمود original_table';
  END IF;
  
  -- التحقق من وجود عمود original_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'original_id'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN original_id TEXT;
    RAISE NOTICE 'تم إضافة عمود original_id';
  END IF;
  
  -- التحقق من وجود الأعمدة المطلوبة في الطلب
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'full_name'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN full_name TEXT;
    RAISE NOTICE 'تم إضافة عمود full_name';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'short_name'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN short_name TEXT;
    RAISE NOTICE 'تم إضافة عمود short_name';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN email TEXT;
    RAISE NOTICE 'تم إضافة عمود email';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'address'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN address TEXT;
    RAISE NOTICE 'تم إضافة عمود address';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'nationality'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN nationality TEXT;
    RAISE NOTICE 'تم إضافة عمود nationality';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'roles'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN roles TEXT[] DEFAULT '{}';
    RAISE NOTICE 'تم إضافة عمود roles';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN status TEXT DEFAULT 'active';
    RAISE NOTICE 'تم إضافة عمود status';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'source'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN source TEXT;
    RAISE NOTICE 'تم إضافة عمود source';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'priority'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN priority TEXT DEFAULT 'medium';
    RAISE NOTICE 'تم إضافة عمود priority';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'rating'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN rating INTEGER;
    RAISE NOTICE 'تم إضافة عمود rating';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'tags'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN tags TEXT[] DEFAULT '{}';
    RAISE NOTICE 'تم إضافة عمود tags';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'notes'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN notes TEXT;
    RAISE NOTICE 'تم إضافة عمود notes';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'language'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN language TEXT DEFAULT 'ar';
    RAISE NOTICE 'تم إضافة عمود language';
  END IF;
END $$;

-- 2. إزالة القيود الموجودة التي قد تسبب مشاكل
DO $$
BEGIN
  -- إزالة قيد chk_status إذا كان موجودًا
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'enhanced_contacts' 
    AND constraint_name = 'chk_status'
  ) THEN
    ALTER TABLE enhanced_contacts DROP CONSTRAINT chk_status;
    RAISE NOTICE 'تم إزالة قيد chk_status';
  END IF;
  
  -- إعادة إنشاء قيد chk_status بقيم صحيحة تشمل جميع القيم المستخدمة في التطبيق
  ALTER TABLE enhanced_contacts ADD CONSTRAINT chk_status 
    CHECK (status IS NULL OR status IN ('active', 'inactive', 'archived', 'blocked', 'new', 'interested', 'negotiating', 'agreed', 'contracted', 'not_interested'));
  RAISE NOTICE 'تم إعادة إنشاء قيد chk_status بقيم صحيحة';
  
  -- إزالة قيد chk_language إذا كان موجودًا
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'enhanced_contacts' 
    AND constraint_name = 'chk_language'
  ) THEN
    ALTER TABLE enhanced_contacts DROP CONSTRAINT chk_language;
    RAISE NOTICE 'تم إزالة قيد chk_language';
  END IF;
  
  -- إعادة إنشاء قيد chk_language بقيم صحيحة
  ALTER TABLE enhanced_contacts ADD CONSTRAINT chk_language 
    CHECK (language IS NULL OR language IN ('ar', 'en'));
  RAISE NOTICE 'تم إعادة إنشاء قيد chk_language بقيم صحيحة';
  
  -- إزالة قيد chk_priority إذا كان موجودًا
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'enhanced_contacts' 
    AND constraint_name = 'chk_priority'
  ) THEN
    ALTER TABLE enhanced_contacts DROP CONSTRAINT chk_priority;
    RAISE NOTICE 'تم إزالة قيد chk_priority';
  END IF;
  
  -- إعادة إنشاء قيد chk_priority بقيم صحيحة
  ALTER TABLE enhanced_contacts ADD CONSTRAINT chk_priority 
    CHECK (priority IS NULL OR priority IN ('low', 'medium', 'high', 'urgent'));
  RAISE NOTICE 'تم إعادة إنشاء قيد chk_priority بقيم صحيحة';
END $$;

-- 3. إنشاء القيد المركب للتعامل مع on_conflict
DO $$
BEGIN
  -- حذف القيد المركب إذا كان موجودًا
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'enhanced_contacts' 
    AND constraint_name = 'unique_original_table_id'
  ) THEN
    ALTER TABLE enhanced_contacts DROP CONSTRAINT unique_original_table_id;
    RAISE NOTICE 'تم إزالة القيد المركب unique_original_table_id';
  END IF;
  
  -- إنشاء القيد المركب الجديد
  ALTER TABLE enhanced_contacts 
  ADD CONSTRAINT unique_original_table_id 
  UNIQUE (original_table, original_id);
  RAISE NOTICE 'تم إنشاء القيد المركب unique_original_table_id';
  
  -- إنشاء فهارس لتحسين الأداء
  CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_original_table ON enhanced_contacts(original_table);
  CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_original_id ON enhanced_contacts(original_id);
  RAISE NOTICE 'تم إنشاء فهارس على أعمدة original_table و original_id';
END $$;

-- 4. تحديث القيم الفارغة
UPDATE enhanced_contacts SET status = 'active' WHERE status IS NULL;
UPDATE enhanced_contacts SET language = 'ar' WHERE language IS NULL;
UPDATE enhanced_contacts SET priority = 'medium' WHERE priority IS NULL;
UPDATE enhanced_contacts SET roles = '{}' WHERE roles IS NULL;
UPDATE enhanced_contacts SET tags = '{}' WHERE tags IS NULL;

-- 5. التحقق من نجاح العملية
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'enhanced_contacts'
AND tc.constraint_type = 'UNIQUE'
AND tc.table_schema = 'public';