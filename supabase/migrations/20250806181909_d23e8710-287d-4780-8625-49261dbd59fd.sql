-- إضافة revenue_added إلى قائمة operation_types المسموحة في activity_logs
ALTER TABLE public.activity_logs 
DROP CONSTRAINT activity_logs_operation_type_check;

ALTER TABLE public.activity_logs 
ADD CONSTRAINT activity_logs_operation_type_check 
CHECK (operation_type = ANY (ARRAY[
  'revenue'::text, 
  'expense'::text, 
  'commission_calculated'::text, 
  'commission_calculated_fixed'::text, 
  'debt_deduction_from_commission'::text, 
  'installment_payment'::text, 
  'role_changed'::text, 
  'role_change_attempted'::text, 
  'unauthorized_role_change_attempt'::text, 
  'commission_earned'::text, 
  'budget_alert'::text, 
  'security_event'::text, 
  'profile_updated'::text, 
  'debt'::text, 
  'debt_creation'::text, 
  'debt_creation_sync'::text, 
  'debt_payment'::text, 
  'expense_added'::text, 
  'commission_processed'::text, 
  'commission_created'::text, 
  'vehicle_expense'::text, 
  'vehicle_deleted'::text, 
  'data_restored'::text,
  'revenue_added'::text  -- ✅ إضافة النوع الناقص
]));