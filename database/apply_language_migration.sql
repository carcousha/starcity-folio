-- تطبيق migration حقل اللغة لجدول وسطاء الأراضي
-- Add language column to land_brokers table

-- إضافة حقل اللغة
ALTER TABLE public.land_brokers
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'arabic' CHECK (language IN ('arabic', 'english'));

-- إضافة تعليق للحقل الجديد
COMMENT ON COLUMN public.land_brokers.language IS 'لغة الوسيط المفضلة للتواصل - Broker preferred language for communication';

-- تحديث السجلات الموجودة لتكون اللغة العربية افتراضياً
UPDATE public.land_brokers 
SET language = 'arabic' 
WHERE language IS NULL;

-- إنشاء فهرس لتحسين الأداء في فلترة اللغة
CREATE INDEX IF NOT EXISTS idx_land_brokers_language ON public.land_brokers(language);

-- إضافة سياسة RLS لحقل اللغة
DROP POLICY IF EXISTS "Users can filter brokers by language" ON public.land_brokers;
CREATE POLICY "Users can filter brokers by language" ON public.land_brokers
FOR SELECT USING (true);

-- عرض رسالة نجاح
SELECT 'تم تطبيق migration حقل اللغة بنجاح' as message;
