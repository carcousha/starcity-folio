-- حذف جميع بيانات قيود اليومية والحسابات للبدء من جديد

-- حذف سجل الأنشطة المالية
DELETE FROM public.activity_logs WHERE operation_type IN ('revenue_added', 'expense_added', 'commission_calculated', 'debt_payment', 'budget_alert');

-- حذف معاملات الخزينة
DELETE FROM public.treasury_transactions;

-- حذف الأقساط المتعلقة بالديون
DELETE FROM public.debt_installments;

-- حذف تنبيهات الديون
DELETE FROM public.debt_notifications;

-- حذف العمولات المطبقة
DELETE FROM public.applied_incentives;

-- حذف موظفي العمولات
DELETE FROM public.commission_employees;

-- حذف العمولات
DELETE FROM public.commissions;

-- حذف عمولات الصفقات
DELETE FROM public.deal_commissions;

-- حذف الديون
DELETE FROM public.debts;

-- حذف مرفقات المصروفات
DELETE FROM public.expense_attachments;

-- حذف المصروفات
DELETE FROM public.expenses;

-- حذف الإيرادات
DELETE FROM public.revenues;

-- إعادة تعيين العدادات التلقائية إذا كانت موجودة
-- يمكن إضافة المزيد حسب الحاجة

-- تسجيل عملية التنظيف
INSERT INTO public.activity_logs (
    operation_type,
    description,
    amount,
    source_table,
    source_id,
    user_id
) VALUES (
    'data_cleanup',
    'تم حذف جميع بيانات قيود اليومية والحسابات للبدء من جديد',
    0,
    'system',
    gen_random_uuid(),
    auth.uid()
);