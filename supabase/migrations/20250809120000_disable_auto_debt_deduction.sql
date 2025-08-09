-- تعطيل أي تريجر يقوم بالخصم التلقائي من العمولات تجاه الديون
-- الهدف: عدم إجراء خصومات تلقائية، وترك القرار للمستخدم عبر الواجهة

DROP TRIGGER IF EXISTS update_commission_employee_trigger ON public.commission_employees;
DROP TRIGGER IF EXISTS trigger_update_commission_employee_calculations ON public.commission_employees;
DROP TRIGGER IF EXISTS update_commission_employee_calculations_trigger ON public.commission_employees;
DROP TRIGGER IF EXISTS trigger_process_commission_debt_deduction ON public.commission_employees;
DROP TRIGGER IF EXISTS process_commission_debt_deduction_trigger ON public.commission_employees;

-- ملاحظة: نبقي الدوال موجودة لاستخدامها يدويًا إن لزم لاحقًا، لكن لن يتم استدعاؤها تلقائيًا

