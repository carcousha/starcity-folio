-- إضافة بعض النشاطات التجريبية لاختبار النظام
INSERT INTO public.activity_logs (
  operation_type,
  description,
  amount,
  source_table,
  source_id,
  user_id
) VALUES 
(
  'expense_added',
  'تم إضافة مصروف تجريبي للاختبار',
  500.00,
  'expenses',
  gen_random_uuid(),
  (SELECT user_id FROM public.profiles LIMIT 1)
),
(
  'revenue_added', 
  'تم إضافة إيراد تجريبي للاختبار',
  2000.00,
  'revenues',
  gen_random_uuid(),
  (SELECT user_id FROM public.profiles LIMIT 1)
),
(
  'commission_processed',
  'تم معالجة عمولة تجريبية للاختبار',
  1500.00,
  'commissions',
  gen_random_uuid(),
  (SELECT user_id FROM public.profiles LIMIT 1)
);