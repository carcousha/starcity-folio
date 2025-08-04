-- Add indexes to foreign key columns to improve query performance
CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON public.clients(assigned_to);
CREATE INDEX IF NOT EXISTS idx_properties_listed_by ON public.properties(listed_by);
CREATE INDEX IF NOT EXISTS idx_deals_client_id ON public.deals(client_id);
CREATE INDEX IF NOT EXISTS idx_deals_property_id ON public.deals(property_id);
CREATE INDEX IF NOT EXISTS idx_commissions_deal_id ON public.commissions(deal_id);
CREATE INDEX IF NOT EXISTS idx_commissions_employee_id ON public.commissions(employee_id);
