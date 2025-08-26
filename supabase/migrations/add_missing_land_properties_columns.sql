-- إضافة الأعمدة المفقودة لجدول land_properties
ALTER TABLE public.land_properties 
ADD COLUMN IF NOT EXISTS land_type TEXT CHECK (land_type IN ('villa', 'townhouse', 'commercial', 'residential_commercial', 'residential_buildings')),
ADD COLUMN IF NOT EXISTS plot_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS area_sqft NUMERIC,
ADD COLUMN IF NOT EXISTS area_sqm NUMERIC,
ADD COLUMN IF NOT EXISTS source_name TEXT,
ADD COLUMN IF NOT EXISTS land_location TEXT,
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb;

-- إنشاء فهرس لرقم القطعة للبحث السريع
CREATE INDEX IF NOT EXISTS idx_land_properties_plot_number ON public.land_properties(plot_number);

-- إنشاء فهرس لنوع الأرض
CREATE INDEX IF NOT EXISTS idx_land_properties_land_type ON public.land_properties(land_type);
