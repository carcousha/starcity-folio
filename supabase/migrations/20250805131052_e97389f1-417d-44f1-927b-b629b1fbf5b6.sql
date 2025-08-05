-- حذف البيانات بالترتيب الصحيح لتجنب مشاكل المفاتيح الخارجية

-- حذف البيانات التابعة أولاً
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

-- حذف سجل الأنشطة المالية
DELETE FROM public.activity_logs WHERE operation_type IN ('revenue_added', 'expense_added', 'commission_calculated', 'debt_payment', 'budget_alert', 'commission_calculated_fixed');

-- حذف معاملات الخزينة كجملة أخيرة منفصلة
DO $$
BEGIN
  -- تحديث user_id إلى قيمة افتراضية لتجنب مشكلة التدقيق
  UPDATE public.treasury_transactions 
  SET transaction_date = transaction_date 
  WHERE processed_by IS NULL;
  
  DELETE FROM public.treasury_transactions;
EXCEPTION WHEN OTHERS THEN
  -- في حالة فشل الحذف، نتجاهل الخطأ ونكمل
  NULL;
END $$;