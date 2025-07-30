-- حذف جميع السياسات أولاً ثم إنشاء سياسات جديدة

-- حذف سياسات المصروفات
DROP POLICY IF EXISTS "Anyone can view expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can delete expenses" ON public.expenses;

-- حذف سياسات الإيرادات  
DROP POLICY IF EXISTS "Anyone can view revenues" ON public.revenues;
DROP POLICY IF EXISTS "Authenticated users can insert revenues" ON public.revenues;
DROP POLICY IF EXISTS "Authenticated users can update revenues" ON public.revenues;
DROP POLICY IF EXISTS "Authenticated users can delete revenues" ON public.revenues;

-- حذف سياسات الديون
DROP POLICY IF EXISTS "Anyone can view debts" ON public.debts;
DROP POLICY IF EXISTS "Authenticated users can insert debts" ON public.debts;
DROP POLICY IF EXISTS "Authenticated users can update debts" ON public.debts;
DROP POLICY IF EXISTS "Authenticated users can delete debts" ON public.debts;

-- حذف سياسات العمولات
DROP POLICY IF EXISTS "Anyone can view commissions" ON public.commissions;
DROP POLICY IF EXISTS "Authenticated users can insert commissions" ON public.commissions;
DROP POLICY IF EXISTS "Authenticated users can update commissions" ON public.commissions;
DROP POLICY IF EXISTS "Authenticated users can delete commissions" ON public.commissions;

-- إنشاء سياسات جديدة تعمل مع أو بدون تسجيل دخول
-- المصروفات
CREATE POLICY "Public can view expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Users can manage expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

-- الإيرادات  
CREATE POLICY "Public can view revenues" ON public.revenues FOR SELECT USING (true);
CREATE POLICY "Users can manage revenues" ON public.revenues FOR ALL USING (true) WITH CHECK (true);

-- الديون
CREATE POLICY "Public can view debts" ON public.debts FOR SELECT USING (true);
CREATE POLICY "Users can manage debts" ON public.debts FOR ALL USING (true) WITH CHECK (true);

-- العمولات
CREATE POLICY "Public can view commissions" ON public.commissions FOR SELECT USING (true);
CREATE POLICY "Users can manage commissions" ON public.commissions FOR ALL USING (true) WITH CHECK (true);