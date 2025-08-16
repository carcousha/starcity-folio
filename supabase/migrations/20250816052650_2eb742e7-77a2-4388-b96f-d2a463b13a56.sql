-- Add missing area_sqft column to land_properties table
ALTER TABLE public.land_properties 
ADD COLUMN IF NOT EXISTS area_sqft NUMERIC;