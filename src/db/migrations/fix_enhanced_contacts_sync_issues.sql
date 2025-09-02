-- إصلاح مشاكل مزامنة جدول enhanced_contacts

-- 1. إزالة قيد NOT NULL من عمود phone
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'phone' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE enhanced_contacts ALTER COLUMN phone DROP NOT NULL;
    RAISE NOTICE 'تم إزالة قيد NOT NULL من عمود phone';
  ELSE
    RAISE NOTICE 'عمود phone لا يحتوي على قيد NOT NULL';
  END IF;
END;
$$;

-- 2. التأكد من وجود الأعمدة المطلوبة للمزامنة
DO $$
BEGIN
  -- إضافة عمود phone إذا لم يكن موجودًا
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN phone TEXT;
    RAISE NOTICE 'تم إضافة عمود phone';
  END IF;

  -- إضافة عمود phone_primary إذا لم يكن موجودًا
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'phone_primary'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN phone_primary TEXT;
    RAISE NOTICE 'تم إضافة عمود phone_primary';
  END IF;

  -- إضافة عمود phone_secondary إذا لم يكن موجودًا
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'phone_secondary'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN phone_secondary TEXT;
    RAISE NOTICE 'تم إضافة عمود phone_secondary';
  END IF;

  -- إضافة عمود name إذا لم يكن موجودًا
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN name TEXT;
    RAISE NOTICE 'تم إضافة عمود name';
  END IF;

  -- إزالة قيد NOT NULL من عمود name إذا كان موجودًا
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'name' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE enhanced_contacts ALTER COLUMN name DROP NOT NULL;
    RAISE NOTICE 'تم إزالة قيد NOT NULL من عمود name';
  END IF;
END;
$$;

-- 3. تحديث القيم الفارغة في الأعمدة المهمة
UPDATE enhanced_contacts SET phone = '' WHERE phone IS NULL;
UPDATE enhanced_contacts SET name = 'بدون اسم' WHERE name IS NULL OR name = '';

-- 4. إضافة فهرس لتحسين أداء البحث
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'enhanced_contacts' 
    AND indexname = 'idx_enhanced_contacts_phone'
  ) THEN
    CREATE INDEX idx_enhanced_contacts_phone ON enhanced_contacts(phone);
    RAISE NOTICE 'تم إنشاء فهرس على عمود phone';
  END IF;
END;
$$;

-- 5. إنشاء دالة لتحديث قيم phone من جدول قنوات الاتصال
CREATE OR REPLACE FUNCTION update_contact_phones()
RETURNS TRIGGER AS $$
BEGIN
  -- تحديث أرقام الهواتف في جدول enhanced_contacts من جدول القنوات
  UPDATE enhanced_contacts ec
  SET 
    phone = COALESCE((SELECT value FROM enhanced_contact_channels 
                     WHERE contact_id = ec.id AND channel_type = 'mobile' 
                     ORDER BY is_primary DESC LIMIT 1), ''),
    phone_primary = COALESCE((SELECT value FROM enhanced_contact_channels 
                            WHERE contact_id = ec.id AND channel_type = 'mobile' AND is_primary = true 
                            LIMIT 1), ''),
    phone_secondary = COALESCE((SELECT value FROM enhanced_contact_channels 
                              WHERE contact_id = ec.id AND channel_type = 'mobile' AND is_primary = false 
                              LIMIT 1), '')
  WHERE ec.id = NEW.contact_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. إنشاء trigger لتحديث أرقام الهواتف تلقائيًا عند تغيير قنوات الاتصال
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_contact_phones'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_update_contact_phones ON enhanced_contact_channels;
    
    CREATE TRIGGER trigger_update_contact_phones
    AFTER INSERT OR UPDATE OR DELETE ON enhanced_contact_channels
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_phones();
    
    RAISE NOTICE 'تم إنشاء trigger لتحديث أرقام الهواتف تلقائيًا';
  END IF;
END;
$$;

-- 7. تحديث أرقام الهواتف الحالية من جدول قنوات الاتصال
UPDATE enhanced_contacts ec
SET 
  phone = COALESCE((SELECT value FROM enhanced_contact_channels 
                   WHERE contact_id = ec.id AND channel_type = 'mobile' 
                   ORDER BY is_primary DESC LIMIT 1), ''),
  phone_primary = COALESCE((SELECT value FROM enhanced_contact_channels 
                          WHERE contact_id = ec.id AND channel_type = 'mobile' AND is_primary = true 
                          LIMIT 1), ''),
  phone_secondary = COALESCE((SELECT value FROM enhanced_contact_channels 
                            WHERE contact_id = ec.id AND channel_type = 'mobile' AND is_primary = false 
                            LIMIT 1), '');

DO $$
BEGIN
  RAISE NOTICE 'تم تحديث أرقام الهواتف من جدول قنوات الاتصال';
END;
$$;