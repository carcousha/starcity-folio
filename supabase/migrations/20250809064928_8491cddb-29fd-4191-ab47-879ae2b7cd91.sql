-- Add missing foreign key relationships for property_owners table

-- Add foreign key for assigned_employee to profiles table
ALTER TABLE public.property_owners 
ADD CONSTRAINT property_owners_assigned_employee_fkey 
FOREIGN KEY (assigned_employee) REFERENCES public.profiles(user_id);

-- Add foreign key for created_by to profiles table  
ALTER TABLE public.property_owners 
ADD CONSTRAINT property_owners_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(user_id);

-- Update the search query to use proper relationship syntax
-- Also make sure all the columns exist and have proper default values
ALTER TABLE public.property_owners 
ALTER COLUMN total_properties_count SET DEFAULT 0,
ALTER COLUMN total_properties_value SET DEFAULT 0;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_property_owners_assigned_employee ON public.property_owners(assigned_employee);
CREATE INDEX IF NOT EXISTS idx_property_owners_created_by ON public.property_owners(created_by);