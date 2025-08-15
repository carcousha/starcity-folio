-- Create Land Sales Module Tables

-- 1. Lands table
CREATE TABLE public.land_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  area_sqm NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  images JSONB DEFAULT '[]'::jsonb,
  videos JSONB DEFAULT '[]'::jsonb,
  source_type TEXT NOT NULL CHECK (source_type IN ('owner', 'broker')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
  internal_notes TEXT,
  description TEXT,
  created_by UUID NOT NULL,
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Land Brokers table
CREATE TABLE public.land_brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  whatsapp_number TEXT,
  areas_specialization JSONB DEFAULT '[]'::jsonb,
  commission_percentage NUMERIC DEFAULT 2.5,
  activity_status TEXT DEFAULT 'active' CHECK (activity_status IN ('active', 'medium', 'low', 'inactive')),
  deals_count INTEGER DEFAULT 0,
  total_sales_amount NUMERIC DEFAULT 0,
  last_activity_date TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Land Clients table  
CREATE TABLE public.land_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  nationality TEXT,
  preferred_locations JSONB DEFAULT '[]'::jsonb,
  area_min NUMERIC,
  area_max NUMERIC,
  budget_min NUMERIC,
  budget_max NUMERIC,
  status TEXT DEFAULT 'interested' CHECK (status IN ('interested', 'negotiation', 'closed', 'lost')),
  notes TEXT,
  last_contact_date TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Land Tasks table
CREATE TABLE public.land_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  due_time TIME,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  task_type TEXT DEFAULT 'general' CHECK (task_type IN ('general', 'land_related', 'client_related', 'broker_related')),
  related_land_id UUID REFERENCES public.land_properties(id),
  related_client_id UUID REFERENCES public.land_clients(id),
  related_broker_id UUID REFERENCES public.land_brokers(id),
  assigned_to UUID NOT NULL,
  created_by UUID NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Land Deals table for tracking sales
CREATE TABLE public.land_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  land_id UUID NOT NULL REFERENCES public.land_properties(id),
  client_id UUID NOT NULL REFERENCES public.land_clients(id),
  broker_id UUID REFERENCES public.land_brokers(id),
  deal_amount NUMERIC NOT NULL,
  commission_amount NUMERIC,
  deal_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes TEXT,
  created_by UUID NOT NULL,
  closed_by UUID,
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Client-Land Interactions table
CREATE TABLE public.land_client_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.land_clients(id),
  land_id UUID REFERENCES public.land_properties(id),
  broker_id UUID REFERENCES public.land_brokers(id),
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('call', 'email', 'whatsapp', 'meeting', 'offer_sent', 'viewing')),
  interaction_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.land_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.land_brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.land_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.land_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.land_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.land_client_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for land_properties
CREATE POLICY "Users can view all land properties" ON public.land_properties
  FOR SELECT USING (is_employee());

CREATE POLICY "Users can insert land properties" ON public.land_properties
  FOR INSERT WITH CHECK (is_employee() AND created_by = auth.uid());

CREATE POLICY "Users can update land properties" ON public.land_properties
  FOR UPDATE USING (is_employee() AND (created_by = auth.uid() OR assigned_to = auth.uid() OR is_admin()));

CREATE POLICY "Admins can delete land properties" ON public.land_properties
  FOR DELETE USING (is_admin());

-- RLS Policies for land_brokers
CREATE POLICY "Users can view all brokers" ON public.land_brokers
  FOR SELECT USING (is_employee());

CREATE POLICY "Users can insert brokers" ON public.land_brokers
  FOR INSERT WITH CHECK (is_employee() AND created_by = auth.uid());

CREATE POLICY "Users can update brokers" ON public.land_brokers
  FOR UPDATE USING (is_employee() AND (created_by = auth.uid() OR is_admin()));

CREATE POLICY "Admins can delete brokers" ON public.land_brokers
  FOR DELETE USING (is_admin());

-- RLS Policies for land_clients
CREATE POLICY "Users can view all land clients" ON public.land_clients
  FOR SELECT USING (is_employee());

CREATE POLICY "Users can insert land clients" ON public.land_clients
  FOR INSERT WITH CHECK (is_employee() AND created_by = auth.uid());

CREATE POLICY "Users can update land clients" ON public.land_clients
  FOR UPDATE USING (is_employee() AND (created_by = auth.uid() OR assigned_to = auth.uid() OR is_admin()));

CREATE POLICY "Admins can delete land clients" ON public.land_clients
  FOR DELETE USING (is_admin());

-- RLS Policies for land_tasks
CREATE POLICY "Users can view assigned tasks" ON public.land_tasks
  FOR SELECT USING (assigned_to = auth.uid() OR created_by = auth.uid() OR is_admin());

CREATE POLICY "Users can insert tasks" ON public.land_tasks
  FOR INSERT WITH CHECK (is_employee() AND created_by = auth.uid());

CREATE POLICY "Users can update own tasks" ON public.land_tasks
  FOR UPDATE USING (assigned_to = auth.uid() OR created_by = auth.uid() OR is_admin());

CREATE POLICY "Admins can delete tasks" ON public.land_tasks
  FOR DELETE USING (is_admin());

-- RLS Policies for land_deals
CREATE POLICY "Users can view all deals" ON public.land_deals
  FOR SELECT USING (is_employee());

CREATE POLICY "Users can insert deals" ON public.land_deals
  FOR INSERT WITH CHECK (is_employee() AND created_by = auth.uid());

CREATE POLICY "Users can update deals" ON public.land_deals
  FOR UPDATE USING (is_employee() AND (created_by = auth.uid() OR is_admin()));

CREATE POLICY "Admins can delete deals" ON public.land_deals
  FOR DELETE USING (is_admin());

-- RLS Policies for land_client_interactions
CREATE POLICY "Users can view all interactions" ON public.land_client_interactions
  FOR SELECT USING (is_employee());

CREATE POLICY "Users can insert interactions" ON public.land_client_interactions
  FOR INSERT WITH CHECK (is_employee() AND created_by = auth.uid());

CREATE POLICY "Users can update interactions" ON public.land_client_interactions
  FOR UPDATE USING (is_employee() AND (created_by = auth.uid() OR is_admin()));

CREATE POLICY "Admins can delete interactions" ON public.land_client_interactions
  FOR DELETE USING (is_admin());

-- Create indexes for better performance
CREATE INDEX idx_land_properties_status ON public.land_properties(status);
CREATE INDEX idx_land_properties_location ON public.land_properties(location);
CREATE INDEX idx_land_properties_price ON public.land_properties(price);
CREATE INDEX idx_land_brokers_activity ON public.land_brokers(activity_status);
CREATE INDEX idx_land_clients_status ON public.land_clients(status);
CREATE INDEX idx_land_tasks_assigned_to ON public.land_tasks(assigned_to);
CREATE INDEX idx_land_tasks_due_date ON public.land_tasks(due_date);
CREATE INDEX idx_land_deals_status ON public.land_deals(status);

-- Create update timestamp triggers
CREATE OR REPLACE FUNCTION public.update_land_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_land_properties_updated_at
  BEFORE UPDATE ON public.land_properties
  FOR EACH ROW EXECUTE FUNCTION public.update_land_updated_at();

CREATE TRIGGER update_land_brokers_updated_at
  BEFORE UPDATE ON public.land_brokers
  FOR EACH ROW EXECUTE FUNCTION public.update_land_updated_at();

CREATE TRIGGER update_land_clients_updated_at
  BEFORE UPDATE ON public.land_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_land_updated_at();

CREATE TRIGGER update_land_tasks_updated_at
  BEFORE UPDATE ON public.land_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_land_updated_at();

CREATE TRIGGER update_land_deals_updated_at
  BEFORE UPDATE ON public.land_deals
  FOR EACH ROW EXECUTE FUNCTION public.update_land_updated_at();