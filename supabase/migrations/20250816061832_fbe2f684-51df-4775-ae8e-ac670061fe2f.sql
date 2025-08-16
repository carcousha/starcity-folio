-- Add all missing columns to land_properties table
ALTER TABLE public.land_properties 
ADD COLUMN IF NOT EXISTS plot_number TEXT,
ADD COLUMN IF NOT EXISTS area_sqm NUMERIC,
ADD COLUMN IF NOT EXISTS source_name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;