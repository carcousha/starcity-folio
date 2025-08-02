-- إضافة RLS policies للمصروفات
CREATE POLICY "المديرين والمحاسبين يمكنهم رؤية جميع المصروفات" 
ON public.expenses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

CREATE POLICY "المديرين والمحاسبين يمكنهم إضافة مصروفات" 
ON public.expenses 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

CREATE POLICY "المديرين والمحاسبين يمكنهم تحديث المصروفات" 
ON public.expenses 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

CREATE POLICY "المديرين والمحاسبين يمكنهم حذف المصروفات" 
ON public.expenses 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

-- إضافة RLS policies للإيرادات
CREATE POLICY "المديرين والمحاسبين يمكنهم رؤية جميع الإيرادات" 
ON public.revenues 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

CREATE POLICY "المديرين والمحاسبين يمكنهم إضافة إيرادات" 
ON public.revenues 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

CREATE POLICY "المديرين والمحاسبين يمكنهم تحديث الإيرادات" 
ON public.revenues 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

CREATE POLICY "المديرين والمحاسبين يمكنهم حذف الإيرادات" 
ON public.revenues 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

-- إضافة RLS policies للديون  
CREATE POLICY "المديرين والمحاسبين يمكنهم رؤية جميع الديون" 
ON public.debts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

CREATE POLICY "المديرين والمحاسبين يمكنهم إضافة ديون" 
ON public.debts 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

CREATE POLICY "المديرين والمحاسبين يمكنهم تحديث الديون" 
ON public.debts 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

CREATE POLICY "المديرين والمحاسبين يمكنهم حذف الديون" 
ON public.debts 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

-- إضافة RLS policies للعمولات
CREATE POLICY "المديرين والمحاسبين يمكنهم رؤية جميع العمولات" 
ON public.commissions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

CREATE POLICY "المديرين والمحاسبين يمكنهم إضافة عمولات" 
ON public.commissions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

CREATE POLICY "المديرين والمحاسبين يمكنهم تحديث العمولات" 
ON public.commissions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

CREATE POLICY "المديرين والمحاسبين يمكنهم حذف العمولات" 
ON public.commissions 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

-- إضافة RLS policies لمرفقات المصروفات
CREATE POLICY "المديرين والمحاسبين يمكنهم رؤية جميع مرفقات المصروفات" 
ON public.expense_attachments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

CREATE POLICY "المديرين والمحاسبين يمكنهم إضافة مرفقات المصروفات" 
ON public.expense_attachments 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

CREATE POLICY "المديرين والمحاسبين يمكنهم تحديث مرفقات المصروفات" 
ON public.expense_attachments 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

CREATE POLICY "المديرين والمحاسبين يمكنهم حذف مرفقات المصروفات" 
ON public.expense_attachments 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);