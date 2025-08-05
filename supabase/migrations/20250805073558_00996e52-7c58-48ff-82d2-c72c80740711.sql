-- إضافة قيم جديدة لـ operation_type في جدول activity_logs
ALTER TABLE public.activity_logs 
DROP CONSTRAINT IF EXISTS activity_logs_operation_type_check;

ALTER TABLE public.activity_logs 
ADD CONSTRAINT activity_logs_operation_type_check 
CHECK (operation_type = ANY (ARRAY[
  'expense_added'::text, 
  'revenue_added'::text, 
  'commission_processed'::text, 
  'commission_calculated'::text, 
  'commission_calculated_fixed'::text, 
  'commission_approved'::text, 
  'auto_commission_calculated'::text, 
  'debt_payment'::text, 
  'vehicle_expense'::text, 
  'treasury_transaction'::text, 
  'profile_updated'::text, 
  'role_changed'::text, 
  'role_change_attempted'::text, 
  'unauthorized_role_change_attempt'::text, 
  'budget_alert'::text, 
  'installment_payment'::text, 
  'debt_deduction_from_commission'::text,
  'commission_created'::text,
  'commission_created_new_system'::text,
  'security_event'::text
]));