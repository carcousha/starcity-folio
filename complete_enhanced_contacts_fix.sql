-- إصلاح شامل لجدول enhanced_contacts
-- هذا الملف يجمع جميع الإصلاحات المطلوبة لجدول enhanced_contacts

-- 1. إضافة عمود deals_count المفقود
DO $$
BEGIN
  -- التحقق من وجود عمود deals_count
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'deals_count'
  ) THEN
    -- إضافة عمود deals_count
    ALTER TABLE public.enhanced_contacts 
    ADD COLUMN IF NOT EXISTS deals_count INTEGER DEFAULT 0;
    
    RAISE NOTICE 'تم إضافة عمود deals_count إلى جدول enhanced_contacts';
  ELSE
    RAISE NOTICE 'عمود deals_count موجود بالفعل في جدول enhanced_contacts';
  END IF;
  
  -- إضافة تعليق للعمود الجديد
  COMMENT ON COLUMN enhanced_contacts.deals_count IS 'عدد الصفقات المرتبطة بجهة الاتصال';
END $$;

-- 2. إضافة حقول العقارات والاستثمار المطلوبة
DO $$
BEGIN
  -- إضافة حقول العقارات والاستثمار
  ALTER TABLE public.enhanced_contacts 
  ADD COLUMN IF NOT EXISTS property_type_interest TEXT,
  ADD COLUMN IF NOT EXISTS purchase_purpose TEXT,
  ADD COLUMN IF NOT EXISTS budget_min NUMERIC,
  ADD COLUMN IF NOT EXISTS budget_max NUMERIC,
  ADD COLUMN IF NOT EXISTS area_min NUMERIC,
  ADD COLUMN IF NOT EXISTS area_max NUMERIC,
  ADD COLUMN IF NOT EXISTS preferred_location TEXT,
  ADD COLUMN IF NOT EXISTS preferred_locations JSONB,
  ADD COLUMN IF NOT EXISTS areas_specialization TEXT[],
  ADD COLUMN IF NOT EXISTS planned_purchase_date DATE,
  ADD COLUMN IF NOT EXISTS preferred_payment_method TEXT;
  
  RAISE NOTICE 'تم إضافة حقول العقارات والاستثمار';
END $$;

-- 3. إضافة حقول جهة اتصال الطوارئ
DO $$
BEGIN
  ALTER TABLE public.enhanced_contacts 
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;
  
  RAISE NOTICE 'تم إضافة حقول جهة اتصال الطوارئ';
END $$;

-- 4. إضافة حقول الإحصائيات
DO $$
BEGIN
  ALTER TABLE public.enhanced_contacts 
  ADD COLUMN IF NOT EXISTS total_interactions INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS successful_deals INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_revenue NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS average_deal_value NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_interaction_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS next_follow_up_date TIMESTAMP WITH TIME ZONE;
  
  RAISE NOTICE 'تم إضافة حقول الإحصائيات';
END $$;

-- 5. إضافة حقول الحالات والمصادر
DO $$
BEGIN
  ALTER TABLE public.enhanced_contacts 
  ADD COLUMN IF NOT EXISTS lead_source TEXT,
  ADD COLUMN IF NOT EXISTS conversion_status TEXT,
  ADD COLUMN IF NOT EXISTS client_stage TEXT,
  ADD COLUMN IF NOT EXISTS satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5);
  
  RAISE NOTICE 'تم إضافة حقول الحالات والمصادر';
END $$;

-- 6. إضافة حقول التواريخ الإضافية
DO $$
BEGIN
  ALTER TABLE public.enhanced_contacts 
  ADD COLUMN IF NOT EXISTS first_contact_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id);
  
  RAISE NOTICE 'تم إضافة حقول التواريخ الإضافية';
END $$;

-- 7. إضافة حقول الملاحظات الإضافية
DO $$
BEGIN
  ALTER TABLE public.enhanced_contacts 
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,
  ADD COLUMN IF NOT EXISTS public_notes TEXT,
  ADD COLUMN IF NOT EXISTS custom_fields JSONB;
  
  -- التأكد من وجود عمود tags
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'tags'
  ) THEN
    ALTER TABLE public.enhanced_contacts ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;
  
  RAISE NOTICE 'تم إضافة حقول الملاحظات الإضافية';
END $$;

-- 8. إضافة حقول النظام
DO $$
BEGIN
  ALTER TABLE public.enhanced_contacts 
  ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced',
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
  
  RAISE NOTICE 'تم إضافة حقول النظام';
END $$;

-- 9. إضافة حقول الهواتف الإضافية
DO $$
BEGIN
  -- إضافة عمود phone_primary إذا لم يكن موجودًا
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'phone_primary'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN phone_primary TEXT DEFAULT '';
    RAISE NOTICE 'تم إضافة عمود phone_primary';
  END IF;
  
  -- إضافة عمود phone_secondary إذا لم يكن موجودًا
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'phone_secondary'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN phone_secondary TEXT DEFAULT '';
    RAISE NOTICE 'تم إضافة عمود phone_secondary';
  END IF;
END $$;

-- 10. إضافة فهارس للأداء
DO $$
BEGIN
  -- إنشاء فهارس للحقول الجديدة
  CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_area_max ON public.enhanced_contacts(area_max);
  CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_area_min ON public.enhanced_contacts(area_min);
  CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_budget_max ON public.enhanced_contacts(budget_max);
  CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_budget_min ON public.enhanced_contacts(budget_min);
  CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_property_type ON public.enhanced_contacts(property_type_interest);
  CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_preferred_location ON public.enhanced_contacts(preferred_location);
  CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_lead_source ON public.enhanced_contacts(lead_source);
  CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_client_stage ON public.enhanced_contacts(client_stage);
  CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_tags ON public.enhanced_contacts USING GIN(tags);
  CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_custom_fields ON public.enhanced_contacts USING GIN(custom_fields);
  CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_next_follow_up ON public.enhanced_contacts(next_follow_up_date);
  CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_last_interaction ON public.enhanced_contacts(last_interaction_date);
  
  RAISE NOTICE 'تم إنشاء فهارس للحقول الجديدة';
END $$;

-- 11. تحديث دالة البحث لتشمل الحقول الجديدة
DO $$
BEGIN
  -- التحقق من وجود عمود search_vector
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'search_vector'
  ) THEN
    -- إضافة عمود search_vector
    ALTER TABLE enhanced_contacts ADD COLUMN search_vector tsvector;
    RAISE NOTICE 'تم إضافة عمود search_vector';
  END IF;
  
  -- تحديث دالة البحث
  CREATE OR REPLACE FUNCTION update_enhanced_contacts_search_vector()
  RETURNS TRIGGER AS $func$
  BEGIN
    NEW.search_vector := 
      setweight(to_tsvector('arabic', COALESCE(NEW.name, '')), 'A') ||
      setweight(to_tsvector('arabic', COALESCE(NEW.full_name, '')), 'A') ||
      setweight(to_tsvector('arabic', COALESCE(NEW.short_name, '')), 'B') ||
      setweight(to_tsvector('arabic', COALESCE(NEW.phone, '')), 'B') ||
      setweight(to_tsvector('arabic', COALESCE(NEW.email, '')), 'B') ||
      setweight(to_tsvector('arabic', COALESCE(NEW.notes, '')), 'C') ||
      setweight(to_tsvector('arabic', COALESCE(NEW.job_title, '')), 'C') ||
      setweight(to_tsvector('arabic', COALESCE(NEW.office_name, '')), 'C') ||
      setweight(to_tsvector('arabic', COALESCE(NEW.preferred_location, '')), 'C') ||
      setweight(to_tsvector('arabic', COALESCE(NEW.property_type_interest, '')), 'C') ||
      setweight(to_tsvector('arabic', COALESCE(NEW.internal_notes, '')), 'D') ||
      setweight(to_tsvector('arabic', COALESCE(NEW.public_notes, '')), 'D');
    
    RETURN NEW;
  END;
  $func$ LANGUAGE plpgsql;
  
  -- إنشاء أو تحديث trigger للبحث
  DROP TRIGGER IF EXISTS enhanced_contacts_search_vector_update ON public.enhanced_contacts;
  CREATE TRIGGER enhanced_contacts_search_vector_update
    BEFORE INSERT OR UPDATE ON public.enhanced_contacts
    FOR EACH ROW EXECUTE FUNCTION update_enhanced_contacts_search_vector();
  
  RAISE NOTICE 'تم تحديث دالة البحث وإنشاء trigger';
END $$;

-- 12. إزالة قيود NOT NULL من أعمدة phone و name
DO $$
BEGIN
  -- التحقق من وجود قيد NOT NULL على عمود phone
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'phone' 
    AND is_nullable = 'NO'
  ) THEN
    -- إزالة قيد NOT NULL
    ALTER TABLE enhanced_contacts ALTER COLUMN phone DROP NOT NULL;
    RAISE NOTICE 'تم إزالة قيد NOT NULL من عمود phone';
  END IF;
  
  -- التحقق من وجود قيد NOT NULL على عمود name
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'name' 
    AND is_nullable = 'NO'
  ) THEN
    -- إزالة قيد NOT NULL
    ALTER TABLE enhanced_contacts ALTER COLUMN name DROP NOT NULL;
    RAISE NOTICE 'تم إزالة قيد NOT NULL من عمود name';
  END IF;
END $$;

-- 13. تحديث القيم الفارغة
DO $$
BEGIN
  -- تحديث القيم الفارغة
  UPDATE enhanced_contacts SET phone = '' WHERE phone IS NULL;
  UPDATE enhanced_contacts SET name = 'بدون اسم' WHERE name IS NULL OR name = '';
  UPDATE enhanced_contacts SET status = 'active' WHERE status IS NULL;
  UPDATE enhanced_contacts SET language = 'ar' WHERE language IS NULL;
  UPDATE enhanced_contacts SET priority = 'medium' WHERE priority IS NULL;
  UPDATE enhanced_contacts SET roles = '{}' WHERE roles IS NULL;
  UPDATE enhanced_contacts SET tags = '{}' WHERE tags IS NULL;
  
  RAISE NOTICE 'تم تحديث القيم الفارغة';
END $$;

-- 14. التحقق من نجاح العملية
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'enhanced_contacts' 
AND table_schema = 'public'
ORDER BY column_name;