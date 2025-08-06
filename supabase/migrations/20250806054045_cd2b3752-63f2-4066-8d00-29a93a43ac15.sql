-- Fix the operation_type constraint to include 'debt' as valid type
ALTER TABLE public.activity_logs DROP CONSTRAINT IF EXISTS activity_logs_operation_type_check;

-- Add updated constraint that includes debt type
ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_operation_type_check 
CHECK (operation_type IN (
  'revenue', 'expense', 'commission_calculated', 'commission_calculated_fixed', 
  'debt_deduction_from_commission', 'installment_payment', 'role_changed', 
  'role_change_attempted', 'unauthorized_role_change_attempt', 
  'commission_earned', 'budget_alert', 'security_event', 'profile_updated',
  'debt', 'debt_creation', 'debt_creation_sync', 'debt_payment'
));