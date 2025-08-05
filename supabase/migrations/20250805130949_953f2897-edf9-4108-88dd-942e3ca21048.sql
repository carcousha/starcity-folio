-- حذف جميع بيانات قيود اليومية والحسابات بدون تسجيل

-- حذف البيانات المترابطة أولاً
DELETE FROM public.commission_employees;
DELETE FROM public.applied_incentives;
DELETE FROM public.debt_installments;
DELETE FROM public.debt_notifications;
DELETE FROM public.expense_attachments;

-- حذف البيانات الرئيسية
DELETE FROM public.commissions;
DELETE FROM public.deal_commissions;
DELETE FROM public.debts;
DELETE FROM public.expenses;
DELETE FROM public.revenues;

-- حذف المعاملات والأنشطة
DELETE FROM public.treasury_transactions;
DELETE FROM public.activity_logs WHERE operation_type IN ('revenue_added', 'expense_added', 'commission_calculated', 'debt_payment', 'budget_alert', 'commission_calculated_fixed');