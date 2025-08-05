-- حذف جميع بيانات قيود اليومية والحسابات بطريقة آمنة

-- تعطيل التدقيق مؤقتاً لتجنب الأخطاء
SET session_replication_role = replica;

-- حذف البيانات بالترتيب الصحيح
TRUNCATE TABLE public.activity_logs CASCADE;
TRUNCATE TABLE public.treasury_transactions CASCADE;
TRUNCATE TABLE public.debt_installments CASCADE;
TRUNCATE TABLE public.debt_notifications CASCADE;
TRUNCATE TABLE public.applied_incentives CASCADE;
TRUNCATE TABLE public.commission_employees CASCADE;
TRUNCATE TABLE public.commissions CASCADE;
TRUNCATE TABLE public.deal_commissions CASCADE;
TRUNCATE TABLE public.debts CASCADE;
TRUNCATE TABLE public.expense_attachments CASCADE;
TRUNCATE TABLE public.expenses CASCADE;
TRUNCATE TABLE public.revenues CASCADE;

-- إعادة تشغيل التدقيق
SET session_replication_role = DEFAULT;

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
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000')
);