-- Add missing land_location column to land_properties table
ALTER TABLE public.land_properties 
ADD COLUMN IF NOT EXISTS land_location TEXT;