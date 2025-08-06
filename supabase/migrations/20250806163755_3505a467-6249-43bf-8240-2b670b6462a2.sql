-- Disable automatic debt deduction trigger
DROP TRIGGER IF EXISTS process_commission_debt_deduction_trigger ON public.commission_employees;

-- Comment: The process_commission_debt_deduction function will remain available for manual use
-- but will no longer run automatically when commission_employees records are created