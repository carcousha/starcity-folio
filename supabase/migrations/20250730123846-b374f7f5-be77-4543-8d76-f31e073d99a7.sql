-- Add missing columns to vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS license_expiry DATE,
ADD COLUMN IF NOT EXISTS insurance_expiry DATE,
ADD COLUMN IF NOT EXISTS last_maintenance DATE,
ADD COLUMN IF NOT EXISTS next_maintenance DATE,
ADD COLUMN IF NOT EXISTS odometer_reading INTEGER DEFAULT 0;