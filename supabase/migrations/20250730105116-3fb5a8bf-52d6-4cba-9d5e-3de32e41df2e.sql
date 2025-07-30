-- Create commission_employees table for detailed commission tracking
CREATE TABLE public.commission_employees (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    commission_id UUID NOT NULL REFERENCES public.commissions(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL,
    percentage NUMERIC NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    calculated_share NUMERIC NOT NULL DEFAULT 0,
    deducted_debt NUMERIC NOT NULL DEFAULT 0,
    net_share NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to commissions table for enhanced tracking
ALTER TABLE public.commissions 
ADD COLUMN IF NOT EXISTS total_commission NUMERIC,
ADD COLUMN IF NOT EXISTS office_share NUMERIC,
ADD COLUMN IF NOT EXISTS remaining_for_employees NUMERIC,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS client_name TEXT;

-- Enable RLS on commission_employees
ALTER TABLE public.commission_employees ENABLE ROW LEVEL SECURITY;

-- Create policies for commission_employees
CREATE POLICY "Admins and accountants can manage commission employees" 
ON public.commission_employees 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Employees can view their commission details" 
ON public.commission_employees 
FOR SELECT 
USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'accountant'::app_role) OR 
    (employee_id = auth.uid())
);

-- Create function to calculate commission distribution
CREATE OR REPLACE FUNCTION public.calculate_commission_distribution()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Calculate office share (50% of total commission)
    NEW.office_share = NEW.total_commission * 0.5;
    
    -- Calculate remaining for employees (50% of total commission)
    NEW.remaining_for_employees = NEW.total_commission * 0.5;
    
    RETURN NEW;
END;
$$;

-- Create trigger for automatic commission calculation
CREATE TRIGGER calculate_commission_trigger
    BEFORE INSERT OR UPDATE ON public.commissions
    FOR EACH ROW
    WHEN (NEW.total_commission IS NOT NULL)
    EXECUTE FUNCTION public.calculate_commission_distribution();

-- Create function to update commission employee calculations
CREATE OR REPLACE FUNCTION public.update_commission_employee_calculations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    commission_record RECORD;
    employee_debt NUMERIC := 0;
BEGIN
    -- Get commission details
    SELECT remaining_for_employees INTO commission_record
    FROM public.commissions 
    WHERE id = NEW.commission_id;
    
    -- Calculate employee's share based on percentage
    NEW.calculated_share = (commission_record.remaining_for_employees * NEW.percentage) / 100;
    
    -- Get employee's debt amount
    SELECT COALESCE(SUM(amount), 0) INTO employee_debt
    FROM public.debts 
    WHERE debtor_id = NEW.employee_id 
    AND status = 'pending';
    
    -- Calculate deducted debt (min of debt and calculated share)
    NEW.deducted_debt = LEAST(employee_debt, NEW.calculated_share);
    
    -- Calculate net share
    NEW.net_share = NEW.calculated_share - NEW.deducted_debt;
    
    -- Update debt status if fully deducted
    IF NEW.deducted_debt > 0 THEN
        UPDATE public.debts 
        SET status = 'paid', paid_at = now()
        WHERE debtor_id = NEW.employee_id 
        AND status = 'pending'
        AND amount <= NEW.deducted_debt;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for commission employee calculations
CREATE TRIGGER update_commission_employee_trigger
    BEFORE INSERT OR UPDATE ON public.commission_employees
    FOR EACH ROW
    EXECUTE FUNCTION public.update_commission_employee_calculations();

-- Create updated_at trigger for commission_employees
CREATE TRIGGER update_commission_employees_updated_at
    BEFORE UPDATE ON public.commission_employees
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_commission_employees_commission_id ON public.commission_employees(commission_id);
CREATE INDEX idx_commission_employees_employee_id ON public.commission_employees(employee_id);
CREATE INDEX idx_commissions_date ON public.commissions(created_at);
CREATE INDEX idx_commissions_status ON public.commissions(status);