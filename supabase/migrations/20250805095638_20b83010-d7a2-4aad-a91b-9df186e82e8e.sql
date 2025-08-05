-- إنشاء سياسة حذف السيارات للمحاسبين والمديرين
CREATE POLICY "Accountants and Admins can delete vehicles" 
ON public.vehicles 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'accountant') 
        AND is_active = true
    )
);