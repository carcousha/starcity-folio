-- إصلاح نهائي للـ RLS policies - السماح للمستخدمين المصادق عليهم والمشرفين
-- حذف جميع السياسات الحالية وإعادة إنشائها بشكل صحيح

-- إزالة السياسات الحالية للمصروفات
DROP POLICY IF EXISTS "Admins and accountants can view all expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admins and accountants can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admins can delete expenses" ON public.expenses;

-- إنشاء سياسات جديدة للمصروفات
CREATE POLICY "Anyone can view expenses" 
ON public.expenses 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert expenses" 
ON public.expenses 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update expenses" 
ON public.expenses 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete expenses" 
ON public.expenses 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- إزالة السياسات الحالية للإيرادات
DROP POLICY IF EXISTS "Admins and accountants can view all revenues" ON public.revenues;
DROP POLICY IF EXISTS "Authenticated users can insert revenues" ON public.revenues;
DROP POLICY IF EXISTS "Admins and accountants can update revenues" ON public.revenues;
DROP POLICY IF EXISTS "Admins can delete revenues" ON public.revenues;

-- إنشاء سياسات جديدة للإيرادات
CREATE POLICY "Anyone can view revenues" 
ON public.revenues 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert revenues" 
ON public.revenues 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update revenues" 
ON public.revenues 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete revenues" 
ON public.revenues 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- إزالة السياسات الحالية للديون
DROP POLICY IF EXISTS "Admins and accountants can view all debts" ON public.debts;
DROP POLICY IF EXISTS "Admins and accountants can insert debts" ON public.debts;
DROP POLICY IF EXISTS "Admins and accountants can update debts" ON public.debts;
DROP POLICY IF EXISTS "Admins can delete debts" ON public.debts;

-- إنشاء سياسات جديدة للديون
CREATE POLICY "Anyone can view debts" 
ON public.debts 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert debts" 
ON public.debts 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update debts" 
ON public.debts 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete debts" 
ON public.debts 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- إزالة السياسات الحالية للعمولات
DROP POLICY IF EXISTS "Admins and accountants can view all commissions" ON public.commissions;
DROP POLICY IF EXISTS "Admins and accountants can insert commissions" ON public.commissions;
DROP POLICY IF EXISTS "Admins and accountants can update commissions" ON public.commissions;
DROP POLICY IF EXISTS "Admins can delete commissions" ON public.commissions;

-- إنشاء سياسات جديدة للعمولات
CREATE POLICY "Anyone can view commissions" 
ON public.commissions 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert commissions" 
ON public.commissions 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update commissions" 
ON public.commissions 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete commissions" 
ON public.commissions 
FOR DELETE 
USING (auth.uid() IS NOT NULL);