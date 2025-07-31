-- إنشاء جدول أهداف الموظفين
CREATE TABLE public.employee_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('monthly', 'yearly', 'quarterly')),
  target_period DATE NOT NULL, -- بداية فترة الهدف (شهر/سنة)
  sales_target NUMERIC NOT NULL DEFAULT 0, -- هدف المبيعات
  deals_target INTEGER NOT NULL DEFAULT 0, -- هدف عدد الصفقات
  commission_target NUMERIC NOT NULL DEFAULT 0, -- هدف العمولات
  current_sales NUMERIC NOT NULL DEFAULT 0, -- المبيعات الحالية
  current_deals INTEGER NOT NULL DEFAULT 0, -- الصفقات الحالية
  current_commission NUMERIC NOT NULL DEFAULT 0, -- العمولات الحالية
  is_achieved BOOLEAN NOT NULL DEFAULT false,
  achieved_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول قواعد التحفيز
CREATE TABLE public.incentive_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('monthly', 'yearly', 'quarterly')),
  achievement_percentage NUMERIC NOT NULL DEFAULT 100, -- نسبة تحقيق الهدف المطلوبة
  incentive_type TEXT NOT NULL CHECK (incentive_type IN ('percentage', 'fixed_amount')),
  incentive_value NUMERIC NOT NULL, -- قيمة التحفيز (نسبة مئوية أو مبلغ ثابت)
  max_incentive_amount NUMERIC, -- الحد الأقصى للتحفيز
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول سجل التحفيز المطبق
CREATE TABLE public.applied_incentives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  target_id UUID NOT NULL,
  incentive_rule_id UUID NOT NULL,
  calculated_amount NUMERIC NOT NULL,
  achievement_percentage NUMERIC NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  notes TEXT
);

-- إنشاء جدول تفضيلات التنبيهات
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL UNIQUE,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  whatsapp_notifications BOOLEAN NOT NULL DEFAULT false,
  whatsapp_number TEXT,
  commission_alerts BOOLEAN NOT NULL DEFAULT true,
  target_alerts BOOLEAN NOT NULL DEFAULT true,
  debt_alerts BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول سجل التنبيهات
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'system')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة الفهارس
CREATE INDEX idx_employee_targets_employee_id ON public.employee_targets(employee_id);
CREATE INDEX idx_employee_targets_period ON public.employee_targets(target_period);
CREATE INDEX idx_applied_incentives_employee_id ON public.applied_incentives(employee_id);
CREATE INDEX idx_notification_logs_employee_id ON public.notification_logs(employee_id);
CREATE INDEX idx_notification_logs_status ON public.notification_logs(status);

-- إنشاء view لكشف حساب العمولات الذكي
CREATE VIEW public.employee_commission_statement AS
SELECT 
  ce.employee_id,
  p.first_name || ' ' || p.last_name as employee_name,
  p.email as employee_email,
  COUNT(ce.id) as total_commissions_count,
  SUM(ce.calculated_share) as total_calculated_commissions,
  SUM(ce.deducted_debt) as total_deducted_debts,
  SUM(ce.net_share) as total_net_commissions,
  SUM(CASE WHEN c.status = 'paid' THEN ce.net_share ELSE 0 END) as total_paid_commissions,
  SUM(CASE WHEN c.status = 'pending' THEN ce.net_share ELSE 0 END) as total_pending_commissions,
  COALESCE(ai.total_incentives, 0) as total_incentives,
  COALESCE(current_debts.total_debts, 0) as current_total_debts
FROM public.commission_employees ce
JOIN public.profiles p ON ce.employee_id = p.user_id
JOIN public.commissions c ON ce.commission_id = c.id
LEFT JOIN (
  SELECT 
    employee_id,
    SUM(calculated_amount) as total_incentives
  FROM public.applied_incentives
  GROUP BY employee_id
) ai ON ce.employee_id = ai.employee_id
LEFT JOIN (
  SELECT 
    debtor_id,
    SUM(amount) as total_debts
  FROM public.debts
  WHERE status = 'pending'
  GROUP BY debtor_id
) current_debts ON ce.employee_id = current_debts.debtor_id
GROUP BY ce.employee_id, p.first_name, p.last_name, p.email, ai.total_incentives, current_debts.total_debts;

-- دالة لحساب وتطبيق التحفيز
CREATE OR REPLACE FUNCTION public.calculate_and_apply_incentives(target_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_record public.employee_targets%ROWTYPE;
  incentive_rule public.incentive_rules%ROWTYPE;
  calculated_incentive NUMERIC := 0;
  achievement_pct NUMERIC := 0;
  sales_achievement NUMERIC := 0;
  deals_achievement NUMERIC := 0;
  commission_achievement NUMERIC := 0;
  overall_achievement NUMERIC := 0;
  applied_incentive_id UUID;
BEGIN
  -- جلب بيانات الهدف
  SELECT * INTO target_record FROM public.employee_targets WHERE id = target_id_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Target not found');
  END IF;
  
  -- حساب نسب التحقيق
  IF target_record.sales_target > 0 THEN
    sales_achievement := (target_record.current_sales / target_record.sales_target) * 100;
  END IF;
  
  IF target_record.deals_target > 0 THEN
    deals_achievement := (target_record.current_deals::NUMERIC / target_record.deals_target::NUMERIC) * 100;
  END IF;
  
  IF target_record.commission_target > 0 THEN
    commission_achievement := (target_record.current_commission / target_record.commission_target) * 100;
  END IF;
  
  -- حساب الإنجاز الإجمالي (متوسط الثلاث نسب)
  overall_achievement := (sales_achievement + deals_achievement + commission_achievement) / 3;
  
  -- البحث عن قاعدة تحفيز مناسبة
  SELECT * INTO incentive_rule 
  FROM public.incentive_rules 
  WHERE target_type = target_record.target_type 
    AND achievement_percentage <= overall_achievement 
    AND is_active = true
  ORDER BY achievement_percentage DESC
  LIMIT 1;
  
  IF FOUND AND overall_achievement >= incentive_rule.achievement_percentage THEN
    -- حساب التحفيز
    IF incentive_rule.incentive_type = 'percentage' THEN
      calculated_incentive := target_record.current_commission * (incentive_rule.incentive_value / 100);
    ELSE
      calculated_incentive := incentive_rule.incentive_value;
    END IF;
    
    -- تطبيق الحد الأقصى إذا كان محدد
    IF incentive_rule.max_incentive_amount IS NOT NULL AND calculated_incentive > incentive_rule.max_incentive_amount THEN
      calculated_incentive := incentive_rule.max_incentive_amount;
    END IF;
    
    -- حفظ التحفيز المطبق
    INSERT INTO public.applied_incentives (
      employee_id,
      target_id,
      incentive_rule_id,
      calculated_amount,
      achievement_percentage,
      created_by
    ) VALUES (
      target_record.employee_id,
      target_id_param,
      incentive_rule.id,
      calculated_incentive,
      overall_achievement,
      auth.uid()
    ) RETURNING id INTO applied_incentive_id;
    
    -- تحديث حالة الهدف
    UPDATE public.employee_targets 
    SET is_achieved = true, achieved_at = now()
    WHERE id = target_id_param;
    
    RETURN jsonb_build_object(
      'success', true,
      'incentive_applied', true,
      'calculated_amount', calculated_incentive,
      'achievement_percentage', overall_achievement,
      'applied_incentive_id', applied_incentive_id
    );
  ELSE
    RETURN jsonb_build_object(
      'success', true,
      'incentive_applied', false,
      'achievement_percentage', overall_achievement,
      'message', 'No applicable incentive rule found or target not achieved'
    );
  END IF;
END;
$$;

-- دالة لتحديث أهداف الموظف بناءً على الأنشطة الجديدة
CREATE OR REPLACE FUNCTION public.update_employee_targets_progress(employee_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- تحديث الأهداف الشهرية
  UPDATE public.employee_targets 
  SET 
    current_sales = (
      SELECT COALESCE(SUM(d.amount), 0)
      FROM public.deals d
      WHERE d.handled_by = employee_id_param
        AND d.status = 'closed'
        AND DATE_TRUNC('month', d.closed_at) = DATE_TRUNC('month', employee_targets.target_period)
    ),
    current_deals = (
      SELECT COUNT(*)
      FROM public.deals d
      WHERE d.handled_by = employee_id_param
        AND d.status = 'closed'
        AND DATE_TRUNC('month', d.closed_at) = DATE_TRUNC('month', employee_targets.target_period)
    ),
    current_commission = (
      SELECT COALESCE(SUM(ce.calculated_share), 0)
      FROM public.commission_employees ce
      JOIN public.commissions c ON ce.commission_id = c.id
      WHERE ce.employee_id = employee_id_param
        AND DATE_TRUNC('month', c.created_at) = DATE_TRUNC('month', employee_targets.target_period)
    ),
    updated_at = now()
  WHERE employee_id = employee_id_param 
    AND target_type = 'monthly'
    AND is_achieved = false;
  
  -- تحديث الأهداف السنوية
  UPDATE public.employee_targets 
  SET 
    current_sales = (
      SELECT COALESCE(SUM(d.amount), 0)
      FROM public.deals d
      WHERE d.handled_by = employee_id_param
        AND d.status = 'closed'
        AND DATE_TRUNC('year', d.closed_at) = DATE_TRUNC('year', employee_targets.target_period)
    ),
    current_deals = (
      SELECT COUNT(*)
      FROM public.deals d
      WHERE d.handled_by = employee_id_param
        AND d.status = 'closed'
        AND DATE_TRUNC('year', d.closed_at) = DATE_TRUNC('year', employee_targets.target_period)
    ),
    current_commission = (
      SELECT COALESCE(SUM(ce.calculated_share), 0)
      FROM public.commission_employees ce
      JOIN public.commissions c ON ce.commission_id = c.id
      WHERE ce.employee_id = employee_id_param
        AND DATE_TRUNC('year', c.created_at) = DATE_TRUNC('year', employee_targets.target_period)
    ),
    updated_at = now()
  WHERE employee_id = employee_id_param 
    AND target_type = 'yearly'
    AND is_achieved = false;
END;
$$;

-- دالة لإرسال تنبيه عمولة جديدة
CREATE OR REPLACE FUNCTION public.send_commission_notification(employee_id_param UUID, commission_id_param UUID, commission_amount NUMERIC)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  notification_id UUID;
  employee_prefs public.notification_preferences%ROWTYPE;
  employee_name TEXT;
BEGIN
  -- جلب اسم الموظف
  SELECT first_name || ' ' || last_name INTO employee_name
  FROM public.profiles 
  WHERE user_id = employee_id_param;
  
  -- جلب تفضيلات التنبيه
  SELECT * INTO employee_prefs
  FROM public.notification_preferences
  WHERE employee_id = employee_id_param;
  
  -- إنشاء تنبيه إذا كان مفعل
  IF employee_prefs.commission_alerts OR employee_prefs IS NULL THEN
    INSERT INTO public.notification_logs (
      employee_id,
      notification_type,
      title,
      message,
      channel,
      metadata
    ) VALUES (
      employee_id_param,
      'commission_earned',
      'عمولة جديدة',
      'تم إضافة عمولة جديدة بقيمة ' || commission_amount || ' د.إ',
      'system',
      jsonb_build_object(
        'commission_id', commission_id_param,
        'amount', commission_amount,
        'employee_name', employee_name
      )
    ) RETURNING id INTO notification_id;
  END IF;
  
  RETURN notification_id;
END;
$$;

-- إنشاء trigger لتحديث أهداف الموظف عند إضافة صفقة جديدة
CREATE OR REPLACE FUNCTION public.trigger_update_employee_targets()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'closed' AND (OLD.status IS NULL OR OLD.status != 'closed') THEN
    PERFORM public.update_employee_targets_progress(NEW.handled_by);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_employee_targets_on_deal_close
  AFTER UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_employee_targets();

-- إنشاء trigger لإرسال تنبيه عند إضافة عمولة جديدة
CREATE OR REPLACE FUNCTION public.trigger_commission_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.send_commission_notification(
    NEW.employee_id,
    NEW.commission_id,
    NEW.calculated_share
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER send_commission_notification_on_insert
  AFTER INSERT ON public.commission_employees
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_commission_notification();

-- RLS Policies
ALTER TABLE public.employee_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incentive_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applied_incentives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لجدول أهداف الموظفين
CREATE POLICY "Admins and accountants can manage employee targets"
ON public.employee_targets FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Employees can view their own targets"
ON public.employee_targets FOR SELECT
USING (employee_id = auth.uid());

-- سياسات الأمان لجدول قواعد التحفيز
CREATE POLICY "Admins can manage incentive rules"
ON public.incentive_rules FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "All users can view active incentive rules"
ON public.incentive_rules FOR SELECT
USING (is_active = true);

-- سياسات الأمان لجدول التحفيز المطبق
CREATE POLICY "Admins and accountants can view applied incentives"
ON public.applied_incentives FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Employees can view their own applied incentives"
ON public.applied_incentives FOR SELECT
USING (employee_id = auth.uid());

-- سياسات الأمان لتفضيلات التنبيهات
CREATE POLICY "Users can manage their own notification preferences"
ON public.notification_preferences FOR ALL
USING (employee_id = auth.uid());

-- سياسات الأمان لسجل التنبيهات
CREATE POLICY "Admins can view all notification logs"
ON public.notification_logs FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can view their own notification logs"
ON public.notification_logs FOR SELECT
USING (employee_id = auth.uid());