-- إصلاح قيد NOT NULL في عمود phone في جدول enhanced_contacts

-- التحقق من وجود القيد
DO $$
BEGIN
  -- إزالة قيد NOT NULL من عمود phone
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

  -- التأكد من أن عمود phone موجود وإضافته إذا لم يكن موجودًا
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE enhanced_contacts ADD COLUMN phone TEXT;
    RAISE NOTICE 'تم إضافة عمود phone';
  END IF;

  -- تحديث قيم NULL في عمود phone إلى سلسلة فارغة
  UPDATE enhanced_contacts SET phone = '' WHERE phone IS NULL;
  RAISE NOTICE 'تم تحديث القيم الفارغة في عمود phone';

END;
$$;