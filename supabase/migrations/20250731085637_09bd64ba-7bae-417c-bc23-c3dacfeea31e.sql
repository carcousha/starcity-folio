-- إضافة حدود الميزانية للمصروفات
CREATE TABLE public.budget_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  monthly_limit NUMERIC DEFAULT 0,
  yearly_limit NUMERIC DEFAULT 0,
  alert_threshold NUMERIC DEFAULT 80, -- نسبة التنبيه (80%)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة عمود للفواتير في جدول المصروفات  
ALTER TABLE public.expenses 
ADD COLUMN receipt_reference TEXT,
ADD COLUMN budget_category TEXT DEFAULT 'عام',
ADD COLUMN is_approved BOOLEAN DEFAULT true,
ADD COLUMN approved_by UUID,
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;

-- إنشاء جدول مرفقات المصروفات
CREATE TABLE public.expense_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.budget_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_attachments ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للحدود
CREATE POLICY "Admins and accountants can manage budget limits" 
ON public.budget_limits 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "All users can view budget limits" 
ON public.budget_limits 
FOR SELECT 
USING (true);

-- سياسات الأمان للمرفقات
CREATE POLICY "Users can view expense attachments" 
ON public.expense_attachments 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert expense attachments" 
ON public.expense_attachments 
FOR INSERT 
WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Admins can delete expense attachments" 
ON public.expense_attachments 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- إنشاء bucket للفواتير
INSERT INTO storage.buckets (id, name, public) 
VALUES ('expense-receipts', 'expense-receipts', false);

-- سياسات storage للفواتير
CREATE POLICY "Users can view expense receipts" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'expense-receipts');

CREATE POLICY "Users can upload expense receipts" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'expense-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their expense receipts" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'expense-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- إنشاء دالة للتحقق من حدود الميزانية
CREATE OR REPLACE FUNCTION public.check_budget_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  monthly_total NUMERIC := 0;
  yearly_total NUMERIC := 0;
  budget_limit RECORD;
  current_month_start DATE;
  current_year_start DATE;
BEGIN
  -- حساب بداية الشهر والسنة الحالية
  current_month_start := DATE_TRUNC('month', NEW.expense_date);
  current_year_start := DATE_TRUNC('year', NEW.expense_date);
  
  -- جلب حدود الميزانية للفئة
  SELECT * INTO budget_limit 
  FROM public.budget_limits 
  WHERE category = NEW.category 
  AND is_active = true 
  LIMIT 1;
  
  IF budget_limit.id IS NOT NULL THEN
    -- حساب إجمالي المصروفات الشهرية
    SELECT COALESCE(SUM(amount), 0) INTO monthly_total
    FROM public.expenses 
    WHERE category = NEW.category 
    AND expense_date >= current_month_start 
    AND expense_date < current_month_start + INTERVAL '1 month'
    AND id != NEW.id; -- استثناء المصروف الحالي
    
    -- حساب إجمالي المصروفات السنوية
    SELECT COALESCE(SUM(amount), 0) INTO yearly_total
    FROM public.expenses 
    WHERE category = NEW.category 
    AND expense_date >= current_year_start 
    AND expense_date < current_year_start + INTERVAL '1 year'
    AND id != NEW.id; -- استثناء المصروف الحالي
    
    -- إضافة المبلغ الجديد
    monthly_total := monthly_total + NEW.amount;
    yearly_total := yearly_total + NEW.amount;
    
    -- تسجيل تحذير في سجل النشاطات
    IF budget_limit.monthly_limit > 0 AND monthly_total > (budget_limit.monthly_limit * budget_limit.alert_threshold / 100) THEN
      PERFORM public.log_financial_activity(
        'budget_alert',
        'تحذير: تم تجاوز ' || budget_limit.alert_threshold || '% من الحد الشهري لفئة ' || NEW.category || '. المصروف: ' || monthly_total || ' من أصل ' || budget_limit.monthly_limit,
        monthly_total,
        'expenses',
        NEW.id,
        'budget_limits',
        budget_limit.id,
        NEW.recorded_by,
        jsonb_build_object(
          'alert_type', 'monthly_threshold',
          'category', NEW.category,
          'current_amount', monthly_total,
          'limit_amount', budget_limit.monthly_limit,
          'percentage', (monthly_total / budget_limit.monthly_limit * 100)
        )
      );
    END IF;
    
    IF budget_limit.yearly_limit > 0 AND yearly_total > (budget_limit.yearly_limit * budget_limit.alert_threshold / 100) THEN
      PERFORM public.log_financial_activity(
        'budget_alert',
        'تحذير: تم تجاوز ' || budget_limit.alert_threshold || '% من الحد السنوي لفئة ' || NEW.category || '. المصروف: ' || yearly_total || ' من أصل ' || budget_limit.yearly_limit,
        yearly_total,
        'expenses',
        NEW.id,
        'budget_limits',
        budget_limit.id,
        NEW.recorded_by,
        jsonb_build_object(
          'alert_type', 'yearly_threshold',
          'category', NEW.category,
          'current_amount', yearly_total,
          'limit_amount', budget_limit.yearly_limit,
          'percentage', (yearly_total / budget_limit.yearly_limit * 100)
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- إنشاء trigger للتحقق من حدود الميزانية
CREATE TRIGGER check_budget_limit_trigger
  AFTER INSERT OR UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.check_budget_limit();

-- إنشاء دالة لحساب التقارير الشهرية
CREATE OR REPLACE FUNCTION public.get_monthly_budget_report(target_month DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  category TEXT,
  monthly_limit NUMERIC,
  actual_spent NUMERIC,
  remaining_budget NUMERIC,
  percentage_used NUMERIC,
  status TEXT,
  transaction_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  month_start DATE;
  month_end DATE;
BEGIN
  month_start := DATE_TRUNC('month', target_month);
  month_end := month_start + INTERVAL '1 month';
  
  RETURN QUERY
  SELECT 
    bl.category,
    bl.monthly_limit,
    COALESCE(SUM(e.amount), 0) as actual_spent,
    GREATEST(bl.monthly_limit - COALESCE(SUM(e.amount), 0), 0) as remaining_budget,
    CASE 
      WHEN bl.monthly_limit > 0 THEN (COALESCE(SUM(e.amount), 0) / bl.monthly_limit * 100)
      ELSE 0 
    END as percentage_used,
    CASE 
      WHEN bl.monthly_limit = 0 THEN 'بدون حد'
      WHEN COALESCE(SUM(e.amount), 0) >= bl.monthly_limit THEN 'تجاوز الحد'
      WHEN COALESCE(SUM(e.amount), 0) >= (bl.monthly_limit * bl.alert_threshold / 100) THEN 'اقتراب من الحد'
      ELSE 'ضمن الحد'
    END as status,
    COUNT(e.id)::INTEGER as transaction_count
  FROM public.budget_limits bl
  LEFT JOIN public.expenses e ON bl.category = e.category 
    AND e.expense_date >= month_start 
    AND e.expense_date < month_end
  WHERE bl.is_active = true
  GROUP BY bl.category, bl.monthly_limit, bl.alert_threshold
  ORDER BY percentage_used DESC;
END;
$$;

-- إضافة triggers للتحديث التلقائي
CREATE TRIGGER update_budget_limits_updated_at
  BEFORE UPDATE ON public.budget_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();