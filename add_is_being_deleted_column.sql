-- إضافة عمود is_being_deleted إلى جدول enhanced_contacts

-- التحقق من وجود العمود وإضافته إذا لم يكن موجوداً
DO $$
BEGIN
  -- التحقق من وجود عمود is_being_deleted
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'is_being_deleted'
  ) THEN
    -- إضافة عمود is_being_deleted
    ALTER TABLE public.enhanced_contacts 
    ADD COLUMN IF NOT EXISTS is_being_deleted BOOLEAN DEFAULT FALSE;
    
    RAISE NOTICE 'تم إضافة عمود is_being_deleted إلى جدول enhanced_contacts';
  ELSE
    RAISE NOTICE 'عمود is_being_deleted موجود بالفعل في جدول enhanced_contacts';
  END IF;
  
  -- إضافة تعليق للعمود الجديد
  COMMENT ON COLUMN enhanced_contacts.is_being_deleted IS 'علامة تشير إلى أن جهة الاتصال قيد عملية الحذف لمنع المزامنة العكسية';
  
  RAISE NOTICE 'تم إكمال عملية إضافة عمود is_being_deleted بنجاح';
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
AND column_name = 'is_being_deleted';