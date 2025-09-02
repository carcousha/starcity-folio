-- إصلاح خطأ: Could not find the 'current_address' column of 'enhanced_contacts' in the schema cache

-- إضافة عمود current_address إلى جدول enhanced_contacts
DO $$
BEGIN
  -- التحقق من وجود عمود current_address
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'current_address'
  ) THEN
    -- إضافة عمود current_address
    ALTER TABLE public.enhanced_contacts 
    ADD COLUMN IF NOT EXISTS current_address TEXT;
    
    RAISE NOTICE 'تم إضافة عمود current_address إلى جدول enhanced_contacts';
  ELSE
    RAISE NOTICE 'عمود current_address موجود بالفعل في جدول enhanced_contacts';
  END IF;
  
  -- التحقق من وجود عمود address
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'address'
  ) THEN
    -- إضافة عمود address
    ALTER TABLE public.enhanced_contacts 
    ADD COLUMN IF NOT EXISTS address TEXT;
    
    RAISE NOTICE 'تم إضافة عمود address إلى جدول enhanced_contacts';
  ELSE
    RAISE NOTICE 'عمود address موجود بالفعل في جدول enhanced_contacts';
  END IF;
  
  -- إضافة تعليق للأعمدة الجديدة
  COMMENT ON COLUMN enhanced_contacts.current_address IS 'العنوان الحالي لجهة الاتصال';
  COMMENT ON COLUMN enhanced_contacts.address IS 'عنوان جهة الاتصال';
  
  -- نسخ البيانات من address إلى current_address إذا كان address موجودًا وcurrent_address فارغًا
  UPDATE enhanced_contacts
  SET current_address = address
  WHERE address IS NOT NULL AND current_address IS NULL;
  
  RAISE NOTICE 'تم إكمال عملية إضافة وتحديث أعمدة العناوين بنجاح';
END $$;

-- التحقق من نجاح العملية
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'enhanced_contacts' 
AND table_schema = 'public'
AND column_name IN ('current_address', 'address')
ORDER BY column_name;