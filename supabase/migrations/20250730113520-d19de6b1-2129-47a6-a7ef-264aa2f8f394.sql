-- Enhanced Financial Integration System
-- إنشاء نظام ربط ديناميكي بين الوحدات المحاسبية

-- Create activity logs table for tracking all financial operations
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('expense_added', 'revenue_added', 'commission_processed', 'debt_payment', 'vehicle_expense', 'treasury_transaction')),
  description TEXT NOT NULL,
  amount NUMERIC,
  source_table TEXT NOT NULL,
  source_id UUID NOT NULL,
  related_table TEXT,
  related_id UUID,
  user_id UUID NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy for activity logs
CREATE POLICY "Admins and accountants can view activity logs"
ON public.activity_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- Function to log financial activities
CREATE OR REPLACE FUNCTION public.log_financial_activity(
  p_operation_type TEXT,
  p_description TEXT,
  p_amount NUMERIC,
  p_source_table TEXT,
  p_source_id UUID,
  p_related_table TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.activity_logs (
    operation_type,
    description,
    amount,
    source_table,
    source_id,
    related_table,
    related_id,
    user_id,
    metadata
  ) VALUES (
    p_operation_type,
    p_description,
    p_amount,
    p_source_table,
    p_source_id,
    p_related_table,
    p_related_id,
    COALESCE(p_user_id, auth.uid()),
    p_metadata
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enhanced function for commission processing with revenue integration
CREATE OR REPLACE FUNCTION public.process_commission_with_revenue()
RETURNS TRIGGER AS $$
DECLARE
  default_account_id UUID;
  activity_id UUID;
BEGIN
  -- Get the default cash account for revenue
  SELECT id INTO default_account_id 
  FROM public.treasury_accounts 
  WHERE account_type = 'cash' AND is_active = true 
  ORDER BY created_at ASC 
  LIMIT 1;

  -- Add office share to revenues
  IF NEW.office_share > 0 AND default_account_id IS NOT NULL THEN
    INSERT INTO public.revenues (
      title,
      description,
      amount,
      source,
      revenue_date,
      recorded_by,
      employee_id
    ) VALUES (
      'نصيب المكتب من العمولة',
      'نصيب المكتب من عمولة عقد: ' || COALESCE(NEW.client_name, 'غير محدد'),
      NEW.office_share,
      'عمولة صفقة',
      CURRENT_DATE,
      auth.uid(),
      NULL
    );

    -- Add to treasury
    INSERT INTO public.treasury_transactions (
      transaction_type,
      amount,
      to_account_id,
      reference_type,
      reference_id,
      description,
      processed_by,
      transaction_date
    ) VALUES (
      'commission',
      NEW.office_share,
      default_account_id,
      'commission',
      NEW.id,
      'نصيب المكتب من العمولة: ' || COALESCE(NEW.client_name, 'غير محدد'),
      auth.uid(),
      CURRENT_DATE
    );

    -- Log activity
    activity_id := public.log_financial_activity(
      'commission_processed',
      'تم معالجة عمولة بمبلغ ' || NEW.total_commission || ' د.إ - نصيب المكتب: ' || NEW.office_share || ' د.إ',
      NEW.total_commission,
      'commissions',
      NEW.id,
      'revenues',
      NULL,
      auth.uid(),
      jsonb_build_object('office_share', NEW.office_share, 'client_name', NEW.client_name)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enhanced function for expense integration with activity logging
CREATE OR REPLACE FUNCTION public.process_expense_with_logging()
RETURNS TRIGGER AS $$
DECLARE
  default_account_id UUID;
  activity_id UUID;
BEGIN
  -- Get the default cash account
  SELECT id INTO default_account_id 
  FROM public.treasury_accounts 
  WHERE account_type = 'cash' AND is_active = true 
  ORDER BY created_at ASC 
  LIMIT 1;

  -- Add to treasury transactions
  IF default_account_id IS NOT NULL THEN
    INSERT INTO public.treasury_transactions (
      transaction_type,
      amount,
      from_account_id,
      reference_type,
      reference_id,
      description,
      processed_by,
      transaction_date
    ) VALUES (
      'expense',
      NEW.amount,
      default_account_id,
      'expense',
      NEW.id,
      'مصروف: ' || NEW.title,
      NEW.recorded_by,
      NEW.expense_date
    );

    -- Log activity
    activity_id := public.log_financial_activity(
      'expense_added',
      'تم إضافة مصروف: ' || NEW.title || ' بمبلغ ' || NEW.amount || ' د.إ',
      NEW.amount,
      'expenses',
      NEW.id,
      'treasury_transactions',
      NULL,
      NEW.recorded_by,
      jsonb_build_object('category', NEW.category, 'title', NEW.title)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enhanced function for vehicle expense integration
CREATE OR REPLACE FUNCTION public.process_vehicle_expense_with_integration()
RETURNS TRIGGER AS $$
DECLARE
  default_account_id UUID;
  expense_id UUID;
  activity_id UUID;
  vehicle_info RECORD;
BEGIN
  -- Get vehicle information
  SELECT make, model, license_plate INTO vehicle_info
  FROM public.vehicles
  WHERE id = NEW.vehicle_id;

  -- Get the default cash account
  SELECT id INTO default_account_id 
  FROM public.treasury_accounts 
  WHERE account_type = 'cash' AND is_active = true 
  ORDER BY created_at ASC 
  LIMIT 1;

  -- Add to general expenses
  INSERT INTO public.expenses (
    title,
    description,
    amount,
    category,
    expense_date,
    recorded_by
  ) VALUES (
    'مصاريف سيارة: ' || vehicle_info.make || ' ' || vehicle_info.model,
    NEW.description || ' - لوحة: ' || vehicle_info.license_plate,
    NEW.amount,
    'مصاريف سيارات',
    NEW.expense_date,
    NEW.recorded_by
  ) RETURNING id INTO expense_id;

  -- Add to treasury
  IF default_account_id IS NOT NULL THEN
    INSERT INTO public.treasury_transactions (
      transaction_type,
      amount,
      from_account_id,
      reference_type,
      reference_id,
      description,
      processed_by,
      transaction_date
    ) VALUES (
      'expense',
      NEW.amount,
      default_account_id,
      'vehicle_expense',
      NEW.id,
      'مصروف سيارة: ' || vehicle_info.make || ' ' || vehicle_info.model,
      NEW.recorded_by,
      NEW.expense_date
    );
  END IF;

  -- Handle debt assignment
  IF NEW.debt_assignment = 'employee' AND EXISTS (
    SELECT 1 FROM public.vehicles WHERE id = NEW.vehicle_id AND assigned_to IS NOT NULL
  ) THEN
    INSERT INTO public.debts (
      debtor_type,
      debtor_name,
      debtor_id,
      amount,
      description,
      recorded_by
    ) 
    SELECT 
      'employee',
      p.first_name || ' ' || p.last_name,
      v.assigned_to,
      NEW.amount,
      'مصروف سيارة: ' || NEW.description,
      NEW.recorded_by
    FROM public.vehicles v
    JOIN public.profiles p ON v.assigned_to = p.user_id
    WHERE v.id = NEW.vehicle_id;
  END IF;

  -- Log activity
  activity_id := public.log_financial_activity(
    'vehicle_expense',
    'تم إضافة مصروف سيارة بمبلغ ' || NEW.amount || ' د.إ للسيارة: ' || vehicle_info.make || ' ' || vehicle_info.model,
    NEW.amount,
    'vehicle_expenses',
    NEW.id,
    'expenses',
    expense_id,
    NEW.recorded_by,
    jsonb_build_object('vehicle_info', vehicle_info, 'expense_type', NEW.expense_type)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enhanced function for revenue integration with activity logging
CREATE OR REPLACE FUNCTION public.process_revenue_with_logging()
RETURNS TRIGGER AS $$
DECLARE
  default_account_id UUID;
  activity_id UUID;
BEGIN
  -- Get the default cash account
  SELECT id INTO default_account_id 
  FROM public.treasury_accounts 
  WHERE account_type = 'cash' AND is_active = true 
  ORDER BY created_at ASC 
  LIMIT 1;

  -- Add to treasury
  IF default_account_id IS NOT NULL THEN
    INSERT INTO public.treasury_transactions (
      transaction_type,
      amount,
      to_account_id,
      reference_type,
      reference_id,
      description,
      processed_by,
      transaction_date
    ) VALUES (
      'revenue',
      NEW.amount,
      default_account_id,
      'revenue',
      NEW.id,
      'إيراد: ' || NEW.title,
      NEW.recorded_by,
      NEW.revenue_date
    );

    -- Log activity
    activity_id := public.log_financial_activity(
      'revenue_added',
      'تم إضافة إيراد: ' || NEW.title || ' بمبلغ ' || NEW.amount || ' د.إ',
      NEW.amount,
      'revenues',
      NEW.id,
      'treasury_transactions',
      NULL,
      NEW.recorded_by,
      jsonb_build_object('source', NEW.source, 'title', NEW.title)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing triggers
DROP TRIGGER IF EXISTS auto_expense_to_treasury_trigger ON public.expenses;
DROP TRIGGER IF EXISTS auto_revenue_to_treasury_trigger ON public.revenues;
DROP TRIGGER IF EXISTS auto_vehicle_expense_to_treasury_trigger ON public.vehicle_expenses;

-- Create enhanced triggers
CREATE TRIGGER enhanced_expense_integration_trigger
  AFTER INSERT ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.process_expense_with_logging();

CREATE TRIGGER enhanced_revenue_integration_trigger
  AFTER INSERT ON public.revenues
  FOR EACH ROW EXECUTE FUNCTION public.process_revenue_with_logging();

CREATE TRIGGER enhanced_vehicle_expense_integration_trigger
  AFTER INSERT ON public.vehicle_expenses
  FOR EACH ROW EXECUTE FUNCTION public.process_vehicle_expense_with_integration();

CREATE TRIGGER enhanced_commission_integration_trigger
  AFTER INSERT ON public.commissions
  FOR EACH ROW EXECUTE FUNCTION public.process_commission_with_revenue();

-- Function to get employee financial summary
CREATE OR REPLACE FUNCTION public.get_employee_financial_summary(employee_user_id UUID)
RETURNS TABLE(
  total_commissions NUMERIC,
  total_debts NUMERIC,
  net_commissions NUMERIC,
  total_deals INTEGER,
  recent_activities JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(ce.calculated_share), 0) as total_commissions,
    COALESCE((SELECT SUM(d.amount) FROM public.debts d WHERE d.debtor_id = employee_user_id AND d.status = 'pending'), 0) as total_debts,
    COALESCE(SUM(ce.net_share), 0) as net_commissions,
    COALESCE((SELECT COUNT(*)::INTEGER FROM public.deals WHERE handled_by = employee_user_id), 0) as total_deals,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'operation_type', al.operation_type,
          'description', al.description,
          'amount', al.amount,
          'created_at', al.created_at
        ) ORDER BY al.created_at DESC
      )
      FROM public.activity_logs al
      WHERE al.user_id = employee_user_id
      LIMIT 10
    ) as recent_activities
  FROM public.commission_employees ce
  WHERE ce.employee_id = employee_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;