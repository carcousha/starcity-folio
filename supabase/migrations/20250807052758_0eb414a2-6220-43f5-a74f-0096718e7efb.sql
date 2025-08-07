-- فحص أنواع العمليات الموجودة في الجدول
SELECT DISTINCT operation_type, COUNT(*) as count
FROM public.activity_logs
GROUP BY operation_type
ORDER BY operation_type;

-- تحديث أي أنواع عمليات غير صالحة إلى نوع عملية صالح
UPDATE public.activity_logs 
SET operation_type = 'financial_activity'
WHERE operation_type NOT IN (
    'expense_created', 'expense_updated', 'expense_deleted',
    'revenue_created', 'revenue_updated', 'revenue_deleted',
    'debt_created', 'debt_updated', 'debt_deleted', 'debt_paid',
    'vehicle_created', 'vehicle_updated', 'vehicle_deleted',
    'commission_created', 'commission_updated', 'commission_deleted',
    'commission_approved', 'commission_paid', 'commission_calculated',
    'commission_calculated_fixed', 'commission_debt_deduction',
    'deal_created', 'deal_updated', 'deal_deleted', 'deal_closed',
    'client_created', 'client_updated', 'client_deleted',
    'property_created', 'property_updated', 'property_deleted',
    'staff_created', 'staff_updated', 'staff_deleted',
    'role_changed', 'unauthorized_role_change_attempt',
    'security_event', 'budget_alert', 'installment_payment',
    'debt_deduction_from_commission', 'vehicle_expense_created',
    'treasury_transaction', 'financial_activity', 'backup_created'
);

-- الآن إزالة قيد الفحص القديم
ALTER TABLE public.activity_logs DROP CONSTRAINT IF EXISTS activity_logs_operation_type_check;

-- إضافة قيد الفحص الجديد
ALTER TABLE public.activity_logs 
ADD CONSTRAINT activity_logs_operation_type_check 
CHECK (operation_type IN (
    'expense_created', 'expense_updated', 'expense_deleted',
    'revenue_created', 'revenue_updated', 'revenue_deleted',
    'debt_created', 'debt_updated', 'debt_deleted', 'debt_paid',
    'vehicle_created', 'vehicle_updated', 'vehicle_deleted',
    'commission_created', 'commission_updated', 'commission_deleted',
    'commission_approved', 'commission_paid', 'commission_calculated',
    'commission_calculated_fixed', 'commission_debt_deduction',
    'deal_created', 'deal_updated', 'deal_deleted', 'deal_closed',
    'client_created', 'client_updated', 'client_deleted',
    'property_created', 'property_updated', 'property_deleted',
    'staff_created', 'staff_updated', 'staff_deleted',
    'role_changed', 'unauthorized_role_change_attempt',
    'security_event', 'budget_alert', 'installment_payment',
    'debt_deduction_from_commission', 'vehicle_expense_created',
    'treasury_transaction', 'financial_activity', 'backup_created'
));