-- إضافة صلاحية للمديرين والمحاسبين لرؤية بيانات commission_employees
CREATE POLICY IF NOT EXISTS "المديرين والمحاسبين يمكنهم عرض commission_employees" 
ON public.commission_employees 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'accountant') 
  AND is_active = true
));

-- التحقق من البيانات الموجودة في commission_employees للعمولة الجديدة
SELECT ce.*, p.first_name, p.last_name
FROM public.commission_employees ce
LEFT JOIN public.profiles p ON ce.employee_id = p.user_id
WHERE ce.commission_id = 'd085f30c-2e16-4995-bd7c-c7d7cc83a74a';