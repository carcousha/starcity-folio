-- Define enum types for properties and related tables
CREATE TYPE public.property_type AS ENUM ('villa', 'apartment', 'land', 'commercial');
CREATE TYPE public.property_status AS ENUM ('available', 'rented', 'sold', 'reserved');
CREATE TYPE public.deal_status AS ENUM ('open', 'closed', 'cancelled');
CREATE TYPE public.commission_status AS ENUM ('pending', 'paid', 'cancelled');
CREATE TYPE public.debt_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');
CREATE TYPE public.vehicle_status AS ENUM ('active', 'maintenance', 'inactive');

-- Drop existing check constraints
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_property_type_check;
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_status_check;
ALTER TABLE public.deals DROP CONSTRAINT IF EXISTS deals_status_check;
ALTER TABLE public.commissions DROP CONSTRAINT IF EXISTS commissions_status_check;
ALTER TABLE public.debts DROP CONSTRAINT IF EXISTS debts_status_check;
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_status_check;

-- Alter columns to use enums
ALTER TABLE public.properties
  ALTER COLUMN property_type TYPE public.property_type USING property_type::public.property_type,
  ALTER COLUMN status TYPE public.property_status USING status::public.property_status,
  ALTER COLUMN status SET DEFAULT 'available';

ALTER TABLE public.rental_properties
  ALTER COLUMN property_type TYPE public.property_type USING property_type::public.property_type,
  ALTER COLUMN property_type SET DEFAULT 'apartment',
  ALTER COLUMN status TYPE public.property_status USING status::public.property_status,
  ALTER COLUMN status SET DEFAULT 'available';

ALTER TABLE public.deals
  ALTER COLUMN status TYPE public.deal_status USING status::public.deal_status,
  ALTER COLUMN status SET DEFAULT 'open';

ALTER TABLE public.commissions
  ALTER COLUMN status TYPE public.commission_status USING status::public.commission_status,
  ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE public.debts
  ALTER COLUMN status TYPE public.debt_status USING status::public.debt_status,
  ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE public.vehicles
  ALTER COLUMN status TYPE public.vehicle_status USING status::public.vehicle_status,
  ALTER COLUMN status SET DEFAULT 'active';
