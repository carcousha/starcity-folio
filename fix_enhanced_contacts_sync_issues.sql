-- إصلاح مشاكل مزامنة جدول enhanced_contacts
-- هذا الملف يعالج أخطاء مزامنة الوسطاء والملاك والمستأجرين
-- الخطأ: null value in column "phone" of relation "enhanced_contacts" violates not-null constraint

-- 0. تحويل عمود channel_type إلى TEXT وإضافة قيمة 'mobile' إلى نوع التعداد
DO $$ 
BEGIN
    -- تحويل عمود channel_type إلى TEXT في جدول enhanced_contact_channels
    ALTER TABLE IF EXISTS public.enhanced_contact_channels 
    ALTER COLUMN channel_type TYPE TEXT;
    
    -- إعادة إنشاء نوع التعداد مع القيم الجديدة
    DROP TYPE IF EXISTS public.contact_channel_type CASCADE;
    CREATE TYPE public.contact_channel_type AS ENUM (
        'phone', 'mobile', 'whatsapp', 'email', 'address', 'website', 'social'
    );
    
    RAISE NOTICE 'تم تحويل عمود channel_type إلى TEXT وإعادة إنشاء نوع التعداد';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'حدث خطأ أثناء تحديث نوع التعداد: %', SQLERRM;
END $$;

-- 1. إزالة قيد NOT NULL من عمود phone إذا كان موجودًا
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
  ELSE
    RAISE NOTICE 'عمود phone لا يحتوي على قيد NOT NULL';
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
  ELSE
    RAISE NOTICE 'عمود name لا يحتوي على قيد NOT NULL';
  END IF;
END $$;

-- 2. التأكد من وجود أعمدة phone و phone_primary و phone_secondary و name و areas_specialization
DO $$
BEGIN
  -- إضافة عمود phone إذا لم يكن موجودًا
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN phone TEXT DEFAULT '';
    RAISE NOTICE 'تم إضافة عمود phone';
  END IF;
  
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
  
  -- إضافة عمود name إذا لم يكن موجودًا
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN name TEXT DEFAULT 'بدون اسم';
    RAISE NOTICE 'تم إضافة عمود name';
  END IF;
  
  -- إضافة عمود areas_specialization إذا لم يكن موجودًا
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'areas_specialization'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN areas_specialization TEXT[] DEFAULT '{}';
    RAISE NOTICE 'تم إضافة عمود areas_specialization';
  END IF;
END $$;

-- 3. تحديث القيم الفارغة في phone إلى سلسلة فارغة وفي name إلى "بدون اسم" وتعيين قيم افتراضية للحقول المطلوبة
UPDATE enhanced_contacts SET phone = '' WHERE phone IS NULL;
UPDATE enhanced_contacts SET name = 'بدون اسم' WHERE name IS NULL OR name = '';
UPDATE enhanced_contacts SET status = 'active' WHERE status IS NULL;
UPDATE enhanced_contacts SET language = 'ar' WHERE language IS NULL;

-- 3.1 معالجة قيود التحقق (check constraints) التي تسبب أخطاء المزامنة
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
  RAISE NOTICE 'تم إعادة إنشاء قيد chk_status بقيم صحيحة تشمل جميع القيم المستخدمة في التطبيق';
  
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
END $$;

-- 4. إضافة فهرس على عمود phone
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_phone ON enhanced_contacts(phone);

-- 5. إنشاء دالة لتحديث أرقام الهواتف في enhanced_contacts من enhanced_contact_channels
CREATE OR REPLACE FUNCTION update_contact_phones()
RETURNS TRIGGER AS $$
BEGIN
  -- تحديث الهاتف الرئيسي
  UPDATE enhanced_contacts ec
  SET 
    phone = COALESCE((
      SELECT value FROM enhanced_contact_channels 
      WHERE contact_id = NEW.contact_id AND channel_type = 'phone' AND is_primary = true
      LIMIT 1
    ), ''),
    phone_primary = COALESCE((
      SELECT value FROM enhanced_contact_channels 
      WHERE contact_id = NEW.contact_id AND channel_type = 'phone' AND is_primary = true
      LIMIT 1
    ), ''),
    phone_secondary = COALESCE((
      SELECT value FROM enhanced_contact_channels 
      WHERE contact_id = NEW.contact_id AND channel_type = 'phone' AND is_primary = false
      LIMIT 1
    ), '')
  WHERE ec.id = NEW.contact_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. إنشاء trigger لتحديث أرقام الهواتف تلقائيًا
DROP TRIGGER IF EXISTS update_contact_phones_trigger ON enhanced_contact_channels;

CREATE TRIGGER update_contact_phones_trigger
AFTER INSERT OR UPDATE OR DELETE ON enhanced_contact_channels
FOR EACH ROW
EXECUTE FUNCTION update_contact_phones();

-- 7. تحديث أرقام الهواتف الحالية
-- تعليق: يمكن تنفيذ هذا الأمر من خلال واجهة Supabase SQL Editor أو أي أداة إدارة قواعد البيانات متاحة

/*
DO $$
BEGIN
  -- تحديث الهاتف الرئيسي لجميع جهات الاتصال
  UPDATE enhanced_contacts ec
  SET 
    phone = COALESCE((
      SELECT value FROM enhanced_contact_channels 
      WHERE contact_id = ec.id AND channel_type = 'phone' AND is_primary = true
      LIMIT 1
    ), ''),
    phone_primary = COALESCE((
      SELECT value FROM enhanced_contact_channels 
      WHERE contact_id = ec.id AND channel_type = 'phone' AND is_primary = true
      LIMIT 1
    ), ''),
    phone_secondary = COALESCE((
      SELECT value FROM enhanced_contact_channels 
      WHERE contact_id = ec.id AND channel_type = 'phone' AND is_primary = false
      LIMIT 1
    ), '');
    
  RAISE NOTICE 'تم تحديث أرقام الهواتف لجميع جهات الاتصال';
END $$;
*/

-- بديل: استخدم هذا الأمر المباشر في واجهة SQL Editor
UPDATE enhanced_contacts ec
SET 
  phone = COALESCE((
    SELECT value FROM enhanced_contact_channels 
    WHERE contact_id = ec.id AND channel_type = 'phone' AND is_primary = true
    LIMIT 1
  ), ''),
  phone_primary = COALESCE((
    SELECT value FROM enhanced_contact_channels 
    WHERE contact_id = ec.id AND channel_type = 'phone' AND is_primary = true
    LIMIT 1
  ), ''),
  phone_secondary = COALESCE((
    SELECT value FROM enhanced_contact_channels 
    WHERE contact_id = ec.id AND channel_type = 'phone' AND is_primary = false
    LIMIT 1
  ), '');