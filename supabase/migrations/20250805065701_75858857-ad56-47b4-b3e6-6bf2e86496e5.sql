-- حذف جميع السياسات المتضاربة من جدول العمولات
DROP POLICY IF EXISTS "commissions_delete" ON public.commissions;
DROP POLICY IF EXISTS "commissions_insert" ON public.commissions;
DROP POLICY IF EXISTS "commissions_update" ON public.commissions;
DROP POLICY IF EXISTS "المديرين والمحاسبين يمكنهم إضافة" ON public.commissions;
DROP POLICY IF EXISTS "المديرين والمحاسبين يمكنهم تحديث" ON public.commissions;

-- إنشاء سياسة موحدة وبسيطة للعمولات
CREATE POLICY "Admins and accountants can manage commissions" ON public.commissions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

-- سياسة للموظفين لرؤية عمولاتهم فقط
CREATE POLICY "Employees can view own commissions" ON public.commissions
FOR SELECT USING (
  employee_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);