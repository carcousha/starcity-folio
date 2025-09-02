-- إصلاح خطأ: Could not find the 'deals_count' column of 'enhanced_contacts' in the schema cache

-- إضافة عمود deals_count إلى جدول enhanced_contacts
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
  
  RAISE NOTICE 'تم إكمال عملية إضافة عمود deals_count بنجاح';
END $$;

-- التحقق من نجاح العملية
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'enhanced_contacts' 
AND table_schema = 'public'
AND column_name = 'deals_count';