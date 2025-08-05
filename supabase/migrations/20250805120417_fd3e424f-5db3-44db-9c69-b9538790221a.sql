-- إضافة policy جديد للمديرين والمحاسبين لعرض جميع المديونيات
CREATE POLICY "Admins and accountants can view all debts" 
ON public.debts 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);