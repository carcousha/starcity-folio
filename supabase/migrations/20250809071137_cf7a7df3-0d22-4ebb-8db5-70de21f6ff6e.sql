-- Add minimal new columns to support richer property data
ALTER TABLE public.crm_properties
  ADD COLUMN IF NOT EXISTS property_code TEXT,
  ADD COLUMN IF NOT EXISTS listing_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS property_details JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Optional: simple index to help search by property_code later
CREATE INDEX IF NOT EXISTS idx_crm_properties_property_code ON public.crm_properties (property_code);
