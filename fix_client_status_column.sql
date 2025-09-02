-- إضافة عمود client_status إلى جدول enhanced_contacts

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
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'enhanced_contacts' 
    AND constraint_name = 'chk_client_status'
  ) THEN
    ALTER TABLE enhanced_contacts ADD CONSTRAINT chk_client_status 
      CHECK (client_status IS NULL OR client_status IN ('new', 'contacted', 'negotiating', 'deal_closed', 'deal_lost', 'lead', 'prospect', 'active', 'closed', 'inactive'));
    RAISE NOTICE 'تم إنشاء قيد chk_client_status';
  ELSE
    RAISE NOTICE 'قيد chk_client_status موجود بالفعل';
  END IF;

  -- تحديث القيم الفارغة في client_status
  UPDATE enhanced_contacts SET client_status = 'active' WHERE client_status IS NULL;
  
  RAISE NOTICE 'تم إكمال إضافة وتحديث عمود client_status بنجاح';
END $$;