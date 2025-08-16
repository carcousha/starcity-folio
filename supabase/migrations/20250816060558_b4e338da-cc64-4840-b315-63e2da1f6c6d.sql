-- Add missing land_type column to land_properties table
ALTER TABLE public.land_properties 
ADD COLUMN IF NOT EXISTS land_type TEXT;