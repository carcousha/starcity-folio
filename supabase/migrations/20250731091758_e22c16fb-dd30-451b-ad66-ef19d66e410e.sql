-- تحسين نظام إدارة المديونيات مع التنبيهات والجدولة الآلية

-- إضافة جدول للأقساط والجدولة الآلية
CREATE TABLE public.debt_installments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  paid_amount NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'partially_paid')),
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء فهرس للبحث السريع
CREATE INDEX idx_debt_installments_due_date ON public.debt_installments(due_date);
CREATE INDEX idx_debt_installments_status ON public.debt_installments(status);
CREATE INDEX idx_debt_installments_debt_id ON public.debt_installments(debt_id);

-- تمكين RLS
ALTER TABLE public.debt_installments ENABLE ROW LEVEL SECURITY;

-- إضافة سياسات الأمان
CREATE POLICY "Admins and accountants can manage debt installments" 
ON public.debt_installments FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Users can view relevant debt installments" 
ON public.debt_installments FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'accountant'::app_role) OR 
  EXISTS (
    SELECT 1 FROM public.debts d 
    WHERE d.id = debt_installments.debt_id 
    AND d.debtor_id = auth.uid()
  )
);

-- إضافة جدول للتنبيهات والإشعارات
CREATE TABLE public.debt_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  debt_id UUID REFERENCES public.debts(id) ON DELETE CASCADE,
  installment_id UUID REFERENCES public.debt_installments(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('due_reminder', 'overdue_alert', 'payment_received', 'installment_due')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_user_id UUID,
  is_read BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- فهارس للتنبيهات
CREATE INDEX idx_debt_notifications_scheduled ON public.debt_notifications(scheduled_for);
CREATE INDEX idx_debt_notifications_target_user ON public.debt_notifications(target_user_id);
CREATE INDEX idx_debt_notifications_status ON public.debt_notifications(status);

-- تمكين RLS للتنبيهات
ALTER TABLE public.debt_notifications ENABLE ROW LEVEL SECURITY;

-- سياسات أمان التنبيهات
CREATE POLICY "Users can view their notifications" 
ON public.debt_notifications FOR SELECT 
USING (
  target_user_id = auth.uid() OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'accountant'::app_role)
);

CREATE POLICY "Admins can manage notifications" 
ON public.debt_notifications FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- إضافة أعمدة جديدة لجدول الديون
ALTER TABLE public.debts 
ADD COLUMN installment_count INTEGER DEFAULT 1,
ADD COLUMN installment_frequency TEXT DEFAULT 'monthly' CHECK (installment_frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
ADD COLUMN auto_deduct_from_commission BOOLEAN DEFAULT false,
ADD COLUMN priority_level INTEGER DEFAULT 1 CHECK (priority_level BETWEEN 1 AND 5),
ADD COLUMN grace_period_days INTEGER DEFAULT 0,
ADD COLUMN late_fee_amount NUMERIC DEFAULT 0,
ADD COLUMN payment_method TEXT,
ADD COLUMN contract_reference TEXT,
ADD COLUMN guarantor_name TEXT,
ADD COLUMN guarantor_phone TEXT;

-- دالة لإنشاء الأقساط التلقائية
CREATE OR REPLACE FUNCTION public.create_debt_installments(
  p_debt_id UUID,
  p_installment_count INTEGER,
  p_frequency TEXT,
  p_start_date DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  debt_record RECORD;
  installment_amount NUMERIC;
  current_date DATE;
  i INTEGER;
BEGIN
  -- جلب بيانات الدين
  SELECT * INTO debt_record FROM public.debts WHERE id = p_debt_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'الدين غير موجود';
  END IF;
  
  -- حساب مبلغ القسط
  installment_amount := debt_record.amount / p_installment_count;
  current_date := p_start_date;
  
  -- إنشاء الأقساط
  FOR i IN 1..p_installment_count LOOP
    INSERT INTO public.debt_installments (
      debt_id,
      installment_number,
      amount,
      due_date
    ) VALUES (
      p_debt_id,
      i,
      CASE 
        WHEN i = p_installment_count THEN 
          debt_record.amount - (installment_amount * (p_installment_count - 1))
        ELSE installment_amount
      END,
      current_date
    );
    
    -- تحديد التاريخ التالي حسب التردد
    current_date := CASE p_frequency
      WHEN 'weekly' THEN current_date + INTERVAL '1 week'
      WHEN 'monthly' THEN current_date + INTERVAL '1 month'
      WHEN 'quarterly' THEN current_date + INTERVAL '3 months'
      WHEN 'yearly' THEN current_date + INTERVAL '1 year'
      ELSE current_date + INTERVAL '1 month'
    END;
  END LOOP;
  
  -- تحديث الدين الأصلي
  UPDATE public.debts 
  SET 
    installment_count = p_installment_count,
    installment_frequency = p_frequency,
    due_date = p_start_date
  WHERE id = p_debt_id;
END;
$$;

-- دالة لجدولة التنبيهات التلقائية
CREATE OR REPLACE FUNCTION public.schedule_debt_notifications()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  installment_record RECORD;
  debt_record RECORD;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- جدولة تنبيهات الأقساط المستحقة
  FOR installment_record IN 
    SELECT di.*, d.debtor_name, d.debtor_id, d.description
    FROM public.debt_installments di
    JOIN public.debts d ON di.debt_id = d.id
    WHERE di.status = 'pending'
    AND di.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.debt_notifications dn
      WHERE dn.installment_id = di.id 
      AND dn.notification_type = 'installment_due'
      AND dn.status IN ('pending', 'sent')
    )
  LOOP
    -- إنشاء عنوان ورسالة التنبيه
    notification_title := 'تذكير: قسط مستحق قريباً';
    notification_message := 'قسط بمبلغ ' || installment_record.amount || ' د.إ مستحق في ' || installment_record.due_date;
    
    -- إنشاء التنبيه
    INSERT INTO public.debt_notifications (
      debt_id,
      installment_id,
      notification_type,
      title,
      message,
      target_user_id,
      scheduled_for,
      metadata
    ) VALUES (
      installment_record.debt_id,
      installment_record.id,
      'installment_due',
      notification_title,
      notification_message,
      installment_record.debtor_id,
      installment_record.due_date - INTERVAL '2 days',
      jsonb_build_object(
        'installment_number', installment_record.installment_number,
        'amount', installment_record.amount,
        'debtor_name', installment_record.debtor_name
      )
    );
  END LOOP;
  
  -- جدولة تنبيهات التأخير
  FOR installment_record IN 
    SELECT di.*, d.debtor_name, d.debtor_id, d.description, d.grace_period_days
    FROM public.debt_installments di
    JOIN public.debts d ON di.debt_id = d.id
    WHERE di.status = 'pending'
    AND di.due_date < CURRENT_DATE - INTERVAL '1 day' * COALESCE(d.grace_period_days, 0)
    AND NOT EXISTS (
      SELECT 1 FROM public.debt_notifications dn
      WHERE dn.installment_id = di.id 
      AND dn.notification_type = 'overdue_alert'
      AND dn.status IN ('pending', 'sent')
    )
  LOOP
    -- تحديث حالة القسط إلى متأخر
    UPDATE public.debt_installments 
    SET status = 'overdue' 
    WHERE id = installment_record.id;
    
    -- إنشاء تنبيه التأخير
    notification_title := 'تنبيه: قسط متأخر';
    notification_message := 'قسط بمبلغ ' || installment_record.amount || ' د.إ متأخر منذ ' || installment_record.due_date;
    
    INSERT INTO public.debt_notifications (
      debt_id,
      installment_id,
      notification_type,
      title,
      message,
      target_user_id,
      scheduled_for,
      metadata
    ) VALUES (
      installment_record.debt_id,
      installment_record.id,
      'overdue_alert',
      notification_title,
      notification_message,
      installment_record.debtor_id,
      now(),
      jsonb_build_object(
        'installment_number', installment_record.installment_number,
        'amount', installment_record.amount,
        'days_overdue', CURRENT_DATE - installment_record.due_date,
        'debtor_name', installment_record.debtor_name
      )
    );
  END LOOP;
END;
$$;

-- تحسين دالة ربط العمولات بالديون
CREATE OR REPLACE FUNCTION public.process_commission_debt_deduction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  pending_debts NUMERIC := 0;
  debt_record RECORD;
  remaining_amount NUMERIC;
  deduction_amount NUMERIC;
  total_deducted NUMERIC := 0;
BEGIN
  -- حساب إجمالي الديون المعلقة للموظف مع التفضيل للخصم التلقائي
  SELECT COALESCE(SUM(amount), 0) INTO pending_debts
  FROM public.debts 
  WHERE debtor_id = NEW.employee_id 
  AND status = 'pending'
  AND auto_deduct_from_commission = true;
  
  IF pending_debts > 0 AND NEW.calculated_share > 0 THEN
    remaining_amount := NEW.calculated_share;
    
    -- معالجة كل دين على حدة (حسب الأولوية)
    FOR debt_record IN 
      SELECT * FROM public.debts 
      WHERE debtor_id = NEW.employee_id 
      AND status = 'pending'
      AND auto_deduct_from_commission = true
      ORDER BY priority_level DESC, created_at ASC
    LOOP
      IF remaining_amount <= 0 THEN
        EXIT;
      END IF;
      
      -- حساب مبلغ الخصم
      deduction_amount := LEAST(debt_record.amount, remaining_amount);
      total_deducted := total_deducted + deduction_amount;
      remaining_amount := remaining_amount - deduction_amount;
      
      -- تحديث الدين
      IF deduction_amount >= debt_record.amount THEN
        -- سداد كامل
        UPDATE public.debts 
        SET 
          status = 'paid',
          paid_at = now(),
          description = COALESCE(description, '') || ' (تم السداد من العمولة)'
        WHERE id = debt_record.id;
      ELSE
        -- سداد جزئي
        UPDATE public.debts 
        SET 
          amount = amount - deduction_amount,
          description = COALESCE(description, '') || ' (خصم جزئي من العمولة: ' || deduction_amount || ' د.إ)'
        WHERE id = debt_record.id;
      END IF;
      
      -- تسجيل عملية الخصم في السجل
      PERFORM public.log_financial_activity(
        'debt_deduction_from_commission',
        'خصم دين من العمولة: ' || deduction_amount || ' د.إ لـ' || debt_record.debtor_name,
        deduction_amount,
        'commission_employees',
        NEW.id,
        'debts',
        debt_record.id,
        auth.uid(),
        jsonb_build_object(
          'debt_id', debt_record.id,
          'commission_id', NEW.commission_id,
          'employee_id', NEW.employee_id,
          'deduction_amount', deduction_amount,
          'debt_description', debt_record.description
        )
      );
    END LOOP;
  END IF;
  
  -- تحديث المبالغ المحسوبة
  NEW.deducted_debt = total_deducted;
  NEW.net_share = NEW.calculated_share - total_deducted;
  
  RETURN NEW;
END;
$$;

-- ربط الدالة الجديدة بجدول العمولات
DROP TRIGGER IF EXISTS update_commission_employee_calculations_trigger ON public.commission_employees;
CREATE TRIGGER update_commission_employee_calculations_trigger
  BEFORE INSERT OR UPDATE ON public.commission_employees
  FOR EACH ROW EXECUTE FUNCTION public.process_commission_debt_deduction();

-- دالة لمعالجة دفع الأقساط
CREATE OR REPLACE FUNCTION public.process_installment_payment(
  p_installment_id UUID,
  p_payment_amount NUMERIC,
  p_payment_method TEXT DEFAULT 'cash',
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  installment_record RECORD;
  debt_record RECORD;
  remaining_installments INTEGER;
BEGIN
  -- جلب بيانات القسط
  SELECT * INTO installment_record 
  FROM public.debt_installments 
  WHERE id = p_installment_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'القسط غير موجود';
  END IF;
  
  -- جلب بيانات الدين
  SELECT * INTO debt_record 
  FROM public.debts 
  WHERE id = installment_record.debt_id;
  
  -- تحديث القسط
  UPDATE public.debt_installments 
  SET 
    paid_amount = paid_amount + p_payment_amount,
    status = CASE 
      WHEN paid_amount + p_payment_amount >= amount THEN 'paid'
      ELSE 'partially_paid'
    END,
    paid_at = CASE 
      WHEN paid_amount + p_payment_amount >= amount THEN now()
      ELSE paid_at
    END,
    notes = COALESCE(notes, '') || 
      CASE WHEN notes IS NOT NULL THEN E'\n' ELSE '' END ||
      'دفعة: ' || p_payment_amount || ' د.إ في ' || CURRENT_DATE ||
      CASE WHEN p_notes IS NOT NULL THEN ' - ' || p_notes ELSE '' END,
    updated_at = now()
  WHERE id = p_installment_id;
  
  -- فحص إذا تم سداد جميع الأقساط
  SELECT COUNT(*) INTO remaining_installments
  FROM public.debt_installments
  WHERE debt_id = installment_record.debt_id
  AND status != 'paid';
  
  -- تحديث حالة الدين الأصلي إذا تم السداد الكامل
  IF remaining_installments = 0 THEN
    UPDATE public.debts 
    SET 
      status = 'paid',
      paid_at = now()
    WHERE id = installment_record.debt_id;
  END IF;
  
  -- تسجيل العملية في الخزينة
  INSERT INTO public.treasury_transactions (
    transaction_type,
    amount,
    to_account_id,
    reference_type,
    reference_id,
    description,
    processed_by,
    transaction_date
  ) 
  SELECT 
    'debt_payment',
    p_payment_amount,
    ta.id,
    'debt_installment',
    p_installment_id,
    'سداد قسط: ' || debt_record.debtor_name || ' - القسط رقم ' || installment_record.installment_number,
    auth.uid(),
    CURRENT_DATE
  FROM public.treasury_accounts ta
  WHERE ta.account_type = 'cash' AND ta.is_active = true
  ORDER BY ta.created_at ASC
  LIMIT 1;
  
  -- تسجيل النشاط
  PERFORM public.log_financial_activity(
    'installment_payment',
    'سداد قسط بمبلغ ' || p_payment_amount || ' د.إ - ' || debt_record.debtor_name,
    p_payment_amount,
    'debt_installments',
    p_installment_id,
    'debts',
    installment_record.debt_id,
    auth.uid(),
    jsonb_build_object(
      'installment_number', installment_record.installment_number,
      'payment_method', p_payment_method,
      'debtor_name', debt_record.debtor_name
    )
  );
  
  -- إرسال تنبيه بالسداد
  INSERT INTO public.debt_notifications (
    debt_id,
    installment_id,
    notification_type,
    title,
    message,
    target_user_id,
    scheduled_for,
    status,
    metadata
  ) VALUES (
    installment_record.debt_id,
    p_installment_id,
    'payment_received',
    'تم استلام دفعة',
    'تم استلام دفعة بمبلغ ' || p_payment_amount || ' د.إ من ' || debt_record.debtor_name,
    debt_record.debtor_id,
    now(),
    'sent',
    jsonb_build_object(
      'payment_amount', p_payment_amount,
      'payment_method', p_payment_method,
      'installment_number', installment_record.installment_number
    )
  );
  
  RETURN TRUE;
END;
$$;

-- إضافة تريجر للتحديث التلقائي للأوقات
CREATE TRIGGER update_debt_installments_updated_at
  BEFORE UPDATE ON public.debt_installments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- إنشاء فيو لإحصائيات الديون
CREATE OR REPLACE VIEW public.debt_statistics AS
SELECT 
  'overview' as category,
  COUNT(*) as total_debts,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_debts,
  COUNT(*) FILTER (WHERE status = 'paid') as paid_debts,
  COUNT(*) FILTER (WHERE status = 'overdue') as overdue_debts,
  COALESCE(SUM(amount), 0) as total_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) as paid_amount,
  COUNT(*) FILTER (WHERE auto_deduct_from_commission = true) as auto_deduct_count
FROM public.debts;

-- منح الصلاحيات المطلوبة
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;