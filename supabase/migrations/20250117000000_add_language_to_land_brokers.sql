-- Add language column to land_brokers table
-- إضافة حقل اللغة لجدول وسطاء الأراضي

ALTER TABLE public.land_brokers
ADD COLUMN language TEXT DEFAULT 'arabic' CHECK (language IN ('arabic', 'english'));

-- Add comment for the new column
COMMENT ON COLUMN public.land_brokers.language IS 'لغة الوسيط المفضلة للتواصل - Broker preferred language for communication';

-- Update existing records to have default language
UPDATE public.land_brokers 
SET language = 'arabic' 
WHERE language IS NULL;

-- Create index for better performance on language filtering
CREATE INDEX idx_land_brokers_language ON public.land_brokers(language);

-- Add RLS policy for language column
CREATE POLICY "Users can filter brokers by language" ON public.land_brokers
FOR SELECT USING (true);
