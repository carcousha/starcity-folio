-- إضافة DELETE policy لجدول rental_contracts
CREATE POLICY "Admins and accountants can delete rental contracts" 
ON public.rental_contracts 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);