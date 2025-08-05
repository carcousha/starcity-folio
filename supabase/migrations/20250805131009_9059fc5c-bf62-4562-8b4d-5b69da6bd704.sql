-- تعطيل triggers التدقيق مؤقتاً
ALTER TABLE public.treasury_transactions DISABLE TRIGGER ALL;
ALTER TABLE public.expenses DISABLE TRIGGER ALL;
ALTER TABLE public.revenues DISABLE TRIGGER ALL;
ALTER TABLE public.commissions DISABLE TRIGGER ALL;
ALTER TABLE public.debts DISABLE TRIGGER ALL;

-- حذف البيانات
DELETE FROM public.commission_employees;
DELETE FROM public.applied_incentives;
DELETE FROM public.debt_installments;
DELETE FROM public.debt_notifications;
DELETE FROM public.expense_attachments;
DELETE FROM public.commissions;
DELETE FROM public.deal_commissions;
DELETE FROM public.debts;
DELETE FROM public.expenses;
DELETE FROM public.revenues;
DELETE FROM public.treasury_transactions;
DELETE FROM public.activity_logs WHERE operation_type IN ('revenue_added', 'expense_added', 'commission_calculated', 'debt_payment', 'budget_alert', 'commission_calculated_fixed');

-- إعادة تفعيل triggers
ALTER TABLE public.treasury_transactions ENABLE TRIGGER ALL;
ALTER TABLE public.expenses ENABLE TRIGGER ALL;
ALTER TABLE public.revenues ENABLE TRIGGER ALL;
ALTER TABLE public.commissions ENABLE TRIGGER ALL;
ALTER TABLE public.debts ENABLE TRIGGER ALL;