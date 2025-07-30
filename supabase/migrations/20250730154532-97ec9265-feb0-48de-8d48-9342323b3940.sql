-- Fix the RLS policies for expenses table
-- Drop conflicting policies first
DROP POLICY IF EXISTS "Allow all operations on expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can insert expenses" ON public.expenses;

-- Create proper RLS policies for expenses
CREATE POLICY "Admins and accountants can view all expenses" 
ON public.expenses 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'accountant'::app_role)
);

CREATE POLICY "Authenticated users can insert expenses" 
ON public.expenses 
FOR INSERT 
WITH CHECK (auth.uid() = recorded_by);

CREATE POLICY "Admins and accountants can update expenses" 
ON public.expenses 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'accountant'::app_role)
);

CREATE POLICY "Admins can delete expenses" 
ON public.expenses 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix other financial tables that might have similar issues
-- Revenues table
DROP POLICY IF EXISTS "Allow all operations on revenues" ON public.revenues;

CREATE POLICY "Admins and accountants can view all revenues" 
ON public.revenues 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'accountant'::app_role)
);

CREATE POLICY "Authenticated users can insert revenues" 
ON public.revenues 
FOR INSERT 
WITH CHECK (auth.uid() = recorded_by);

CREATE POLICY "Admins and accountants can update revenues" 
ON public.revenues 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'accountant'::app_role)
);

CREATE POLICY "Admins can delete revenues" 
ON public.revenues 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Debts table
DROP POLICY IF EXISTS "Allow all operations on debts" ON public.debts;

CREATE POLICY "Admins and accountants can view all debts" 
ON public.debts 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'accountant'::app_role) OR
  debtor_id = auth.uid()
);

CREATE POLICY "Admins and accountants can insert debts" 
ON public.debts 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'accountant'::app_role)
);

CREATE POLICY "Admins and accountants can update debts" 
ON public.debts 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'accountant'::app_role)
);

CREATE POLICY "Admins can delete debts" 
ON public.debts 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Commissions table
DROP POLICY IF EXISTS "Allow all operations on commissions" ON public.commissions;

CREATE POLICY "Admins and accountants can view all commissions" 
ON public.commissions 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'accountant'::app_role) OR
  employee_id = auth.uid()
);

CREATE POLICY "Admins and accountants can insert commissions" 
ON public.commissions 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'accountant'::app_role)
);

CREATE POLICY "Admins and accountants can update commissions" 
ON public.commissions 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'accountant'::app_role)
);

CREATE POLICY "Admins can delete commissions" 
ON public.commissions 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));