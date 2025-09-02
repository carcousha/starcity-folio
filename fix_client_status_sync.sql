-- إصلاح مشكلة عمود client_status في جدول enhanced_contacts وإضافة القيد المركب للتعامل مع on_conflict

-- 1. التأكد من وجود عمود client_status
DO $$
BEGIN
  -- التحقق من وجود عمود client_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'client_status'
  ) THEN
    -- إضافة عمود client_status
    ALTER TABLE enhanced_contacts ADD COLUMN client_status TEXT;
    RAISE NOTICE 'تم إضافة عمود client_status';
  ELSE
    RAISE NOTICE 'عمود client_status موجود بالفعل';
  END IF;

  -- إنشاء قيد للتحقق من قيم client_status
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'enhanced_contacts' 
    AND constraint_name = 'chk_client_status'
  ) THEN
    -- إزالة القيد الموجود
    ALTER TABLE enhanced_contacts DROP CONSTRAINT chk_client_status;
    RAISE NOTICE 'تم إزالة قيد chk_client_status الموجود';
  END IF;

  -- إنشاء قيد جديد بقيم محدثة
  ALTER TABLE enhanced_contacts ADD CONSTRAINT chk_client_status 
    CHECK (client_status IS NULL OR client_status IN (
      'new', 'contacted', 'negotiating', 'deal_closed', 'deal_lost',
      'lead', 'prospect', 'active', 'closed', 'inactive',
      'hot', 'cold', 'potential', 'archived', 'blocked', 'interested', 'agreed', 'contracted', 'not_interested'
    ));
  RAISE NOTICE 'تم إنشاء قيد chk_client_status بقيم محدثة';

END $$;

-- 2. التأكد من وجود الأعمدة المطلوبة في طلب API
DO $$
BEGIN
  -- التحقق من وجود عمود language
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'language'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN language TEXT DEFAULT 'ar';
    RAISE NOTICE 'تم إضافة عمود language';
  END IF;
  
  -- التحقق من وجود عمود roles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'roles'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN roles TEXT[] DEFAULT '{}';
    RAISE NOTICE 'تم إضافة عمود roles';
  END IF;
  
  -- التحقق من وجود عمود tags
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'tags'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN tags TEXT[] DEFAULT '{}';
    RAISE NOTICE 'تم إضافة عمود tags';
  END IF;
  
  -- التحقق من وجود عمود notes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'notes'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN notes TEXT;
    RAISE NOTICE 'تم إضافة عمود notes';
  END IF;
  
  -- التحقق من وجود عمود rating
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'rating'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN rating INTEGER;
    RAISE NOTICE 'تم إضافة عمود rating';
  END IF;
  
  -- التحقق من وجود عمود full_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'full_name'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN full_name TEXT;
    RAISE NOTICE 'تم إضافة عمود full_name';
  END IF;
  
  -- التحقق من وجود عمود short_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'short_name'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN short_name TEXT;
    RAISE NOTICE 'تم إضافة عمود short_name';
  END IF;
  
  -- التحقق من وجود عمود email
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN email TEXT;
    RAISE NOTICE 'تم إضافة عمود email';
  END IF;
  
  -- التحقق من وجود عمود nationality
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'nationality'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN nationality TEXT;
    RAISE NOTICE 'تم إضافة عمود nationality';
  END IF;
END $$;

-- 3. تحديث قيم client_status من جدول clients إذا كان موجودًا
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'clients'
  ) THEN
    -- تحديث قيم client_status من جدول clients
    UPDATE enhanced_contacts ec
    SET client_status = c.client_status
    FROM clients c
    WHERE ec.original_table = 'clients' AND ec.original_id::text = c.id::text AND c.client_status IS NOT NULL;
    
    RAISE NOTICE 'تم تحديث قيم client_status من جدول clients';
  ELSE
    RAISE NOTICE 'جدول clients غير موجود';
  END IF;
END $$;

-- 4. تعيين قيمة افتراضية للسجلات التي لا تحتوي على قيمة
UPDATE enhanced_contacts 
SET client_status = 'active' 
WHERE client_status IS NULL;

-- 5. إنشاء القيد المركب للتعامل مع on_conflict
DO $$
BEGIN
  -- التحقق من وجود أعمدة original_table و original_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'original_table'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN original_table TEXT;
    RAISE NOTICE 'تم إضافة عمود original_table';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'original_id'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN original_id TEXT;
    RAISE NOTICE 'تم إضافة عمود original_id';
  END IF;
  
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

-- 6. التحقق من نجاح العملية
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

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'enhanced_contacts' 
AND column_name IN ('client_status', 'original_table', 'original_id', 'language', 'roles', 'tags', 'notes', 'rating', 'full_name', 'short_name', 'email', 'nationality');

-- إضافة إشعار بإكمال العملية
DO $$
BEGIN
  RAISE NOTICE 'تم إكمال إصلاح عمود client_status وإضافة القيد المركب بنجاح';
END $$;