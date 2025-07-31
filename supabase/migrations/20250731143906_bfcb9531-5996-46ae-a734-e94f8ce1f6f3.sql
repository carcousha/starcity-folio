-- إضافة حقول لحفظ البيانات النصية في جدول rental_contracts
ALTER TABLE public.rental_contracts 
ADD COLUMN IF NOT EXISTS property_title TEXT,
ADD COLUMN IF NOT EXISTS tenant_name TEXT;

-- تحديث السياسات للسماح بـ property_id و tenant_id فارغين
ALTER TABLE public.rental_contracts 
ALTER COLUMN property_id DROP NOT NULL,
ALTER COLUMN tenant_id DROP NOT NULL;

-- إضافة تعليق للتوضيح
COMMENT ON COLUMN public.rental_contracts.property_id IS 'معرف العقار - اختياري إذا تم إدخال البيانات يدوياً';
COMMENT ON COLUMN public.rental_contracts.tenant_id IS 'معرف المستأجر - اختياري إذا تم إدخال البيانات يدوياً';
COMMENT ON COLUMN public.rental_contracts.property_title IS 'عنوان العقار النصي - للعقود اليدوية';
COMMENT ON COLUMN public.rental_contracts.tenant_name IS 'اسم المستأجر النصي - للعقود اليدوية';