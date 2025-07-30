-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  license_plate TEXT NOT NULL UNIQUE,
  color TEXT,
  purchase_date DATE,
  purchase_price NUMERIC,
  assigned_to UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired')),
  license_expiry DATE,
  insurance_expiry DATE,
  last_maintenance DATE,
  next_maintenance DATE,
  odometer_reading INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on vehicles
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Create policies for vehicles
CREATE POLICY "Admins can manage vehicles" 
ON public.vehicles 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view relevant vehicles" 
ON public.vehicles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role) OR (assigned_to = auth.uid()));

-- Create vehicle_expenses table
CREATE TABLE public.vehicle_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  expense_type TEXT NOT NULL CHECK (expense_type IN ('fuel', 'maintenance', 'insurance', 'fines', 'repairs', 'other')),
  amount NUMERIC NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  odometer_reading INTEGER,
  description TEXT,
  receipt_url TEXT,
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  debt_assignment TEXT DEFAULT 'company' CHECK (debt_assignment IN ('company', 'employee')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on vehicle_expenses
ALTER TABLE public.vehicle_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for vehicle_expenses
CREATE POLICY "Admins and accountants can manage vehicle expenses" 
ON public.vehicle_expenses 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Users can view relevant vehicle expenses" 
ON public.vehicle_expenses 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'accountant'::app_role) OR 
  (EXISTS (
    SELECT 1 FROM vehicles 
    WHERE vehicles.id = vehicle_expenses.vehicle_id 
    AND vehicles.assigned_to = auth.uid()
  ))
);

-- Create trigger for updating timestamps
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicle_expenses_updated_at
  BEFORE UPDATE ON public.vehicle_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create debts for employee vehicle expenses
CREATE OR REPLACE FUNCTION public.handle_vehicle_expense_debt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vehicle_record RECORD;
  employee_profile RECORD;
BEGIN
  -- Only process if debt is assigned to employee
  IF NEW.debt_assignment = 'employee' THEN
    -- Get vehicle and assigned employee info
    SELECT v.*, p.first_name, p.last_name 
    INTO vehicle_record
    FROM vehicles v
    LEFT JOIN profiles p ON p.user_id = v.assigned_to
    WHERE v.id = NEW.vehicle_id;
    
    -- If vehicle has an assigned employee, create a debt record
    IF vehicle_record.assigned_to IS NOT NULL THEN
      INSERT INTO public.debts (
        debtor_name,
        debtor_type,
        debtor_id,
        amount,
        description,
        status,
        recorded_by
      ) VALUES (
        COALESCE(vehicle_record.first_name || ' ' || vehicle_record.last_name, 'موظف غير محدد'),
        'موظف',
        vehicle_record.assigned_to,
        NEW.amount,
        'مصروف سيارة (' || NEW.expense_type || ') - ' || vehicle_record.make || ' ' || vehicle_record.model || ' (' || vehicle_record.license_plate || ')',
        'pending',
        NEW.recorded_by
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for vehicle expense debt handling
CREATE TRIGGER handle_vehicle_expense_debt_trigger
  AFTER INSERT ON public.vehicle_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_vehicle_expense_debt();

-- Insert sample data (optional)
INSERT INTO public.vehicles (make, model, year, license_plate, color, assigned_to, license_expiry, insurance_expiry) 
VALUES 
  ('Toyota', 'Camry', 2022, 'A-12345', 'أبيض', NULL, '2024-12-31', '2024-11-30'),
  ('Honda', 'Civic', 2021, 'B-67890', 'أسود', NULL, '2025-01-15', '2024-12-15');