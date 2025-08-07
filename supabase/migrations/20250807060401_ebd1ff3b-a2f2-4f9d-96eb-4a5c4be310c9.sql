-- Create employee vehicle assignments table
CREATE TABLE IF NOT EXISTS public.employee_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  return_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'maintenance')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employee_id, vehicle_id)
);

-- Create daily tasks table
CREATE TABLE IF NOT EXISTS public.daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority_level INTEGER DEFAULT 2 CHECK (priority_level IN (1, 2, 3)),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create employee performance evaluations table  
CREATE TABLE IF NOT EXISTS public.employee_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  evaluation_period_start DATE NOT NULL,
  evaluation_period_end DATE NOT NULL,
  overall_rating NUMERIC(3,2) CHECK (overall_rating >= 0 AND overall_rating <= 5),
  performance_categories JSONB DEFAULT '[]'::jsonb,
  achievements TEXT[],
  feedback JSONB DEFAULT '[]'::jsonb,
  manager_comments TEXT,
  self_assessment TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create contract renewal alerts table
CREATE TABLE IF NOT EXISTS public.contract_renewal_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  contract_type TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  days_before_expiry INTEGER DEFAULT 30,
  alert_sent BOOLEAN DEFAULT false,
  alert_sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'acknowledged', 'renewed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_renewal_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_vehicles
CREATE POLICY "Employee can view own vehicle assignments" 
  ON public.employee_vehicles FOR SELECT 
  USING (employee_id = auth.uid());

CREATE POLICY "Admins can manage all vehicle assignments" 
  ON public.employee_vehicles FOR ALL 
  USING (is_admin());

-- RLS Policies for daily_tasks
CREATE POLICY "Employee can view own tasks" 
  ON public.daily_tasks FOR SELECT 
  USING (employee_id = auth.uid());

CREATE POLICY "Employee can update own tasks" 
  ON public.daily_tasks FOR UPDATE 
  USING (employee_id = auth.uid());

CREATE POLICY "Admins can manage all tasks" 
  ON public.daily_tasks FOR ALL 
  USING (is_admin());

-- RLS Policies for employee_evaluations
CREATE POLICY "Employee can view own evaluations" 
  ON public.employee_evaluations FOR SELECT 
  USING (employee_id = auth.uid());

CREATE POLICY "Admins can manage all evaluations" 
  ON public.employee_evaluations FOR ALL 
  USING (is_admin());

-- RLS Policies for contract_renewal_alerts
CREATE POLICY "Employee can view own contract alerts" 
  ON public.contract_renewal_alerts FOR SELECT 
  USING (employee_id = auth.uid());

CREATE POLICY "Admins can manage all contract alerts" 
  ON public.contract_renewal_alerts FOR ALL 
  USING (is_admin());

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employee_vehicles_updated_at
  BEFORE UPDATE ON public.employee_vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_tasks_updated_at
  BEFORE UPDATE ON public.daily_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_evaluations_updated_at
  BEFORE UPDATE ON public.employee_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contract_renewal_alerts_updated_at
  BEFORE UPDATE ON public.contract_renewal_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();