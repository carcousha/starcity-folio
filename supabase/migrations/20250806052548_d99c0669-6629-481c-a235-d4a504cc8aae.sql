-- إضافة دعم المديونيات في دفتر اليومية
-- 1. إضافة نوع "debt" لدفتر اليومية
-- 2. إضافة جدول ربط بين دفتر اليومية والديون
-- 3. إضافة دالة لإنشاء دين عند إدخال مصروف شخصي
-- 4. إضافة دالة لتحويل المصروفات الشخصية الموجودة إلى ديون

-- إنشاء جدول ربط دفتر اليومية بالديون
CREATE TABLE IF NOT EXISTS public.journal_debt_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID NOT NULL,
  debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('debt_creation', 'debt_payment')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- تفعيل RLS على الجدول الجديد
ALTER TABLE public.journal_debt_links ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للجدول الجديد
CREATE POLICY "Accountants can manage journal debt links" 
ON public.journal_debt_links 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

-- دالة لإنشاء دين تلقائياً عند إدخال مصروف شخصي
CREATE OR REPLACE FUNCTION public.create_debt_from_personal_expense()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  debt_id UUID;
  employee_name TEXT;
BEGIN
  -- إنشاء دين فقط للمصروفات الشخصية
  IF NEW.expense_type = 'personal' AND NEW.recorded_by IS NOT NULL THEN
    
    -- جلب اسم الموظف
    SELECT COALESCE(first_name || ' ' || last_name, 'موظف غير محدد') 
    INTO employee_name
    FROM public.profiles 
    WHERE user_id = NEW.recorded_by;
    
    -- إنشاء الدين
    INSERT INTO public.debts (
      debtor_name,
      debtor_type,
      debtor_id,
      amount,
      description,
      status,
      recorded_by,
      auto_deduct_from_commission
    ) VALUES (
      COALESCE(employee_name, 'موظف غير محدد'),
      'employee',
      NEW.recorded_by,
      NEW.amount,
      'مصروف شخصي: ' || NEW.title || CASE WHEN NEW.description IS NOT NULL THEN ' - ' || NEW.description ELSE '' END,
      'pending',
      NEW.recorded_by,
      true
    ) RETURNING id INTO debt_id;
    
    -- تسجيل النشاط
    PERFORM public.log_financial_activity(
      'personal_expense_to_debt',
      'تحويل مصروف شخصي إلى دين: ' || NEW.title || ' - ' || COALESCE(employee_name, 'موظف غير محدد'),
      NEW.amount,
      'expenses',
      NEW.id,
      'debts',
      debt_id,
      NEW.recorded_by,
      jsonb_build_object(
        'expense_id', NEW.id,
        'debt_id', debt_id,
        'employee_name', employee_name,
        'auto_converted', true
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- إنشاء التريجر للمصروفات الشخصية
DROP TRIGGER IF EXISTS trigger_create_debt_from_personal_expense ON public.expenses;
CREATE TRIGGER trigger_create_debt_from_personal_expense
  AFTER INSERT ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.create_debt_from_personal_expense();

-- دالة لتحويل المصروفات الشخصية الموجودة إلى ديون
CREATE OR REPLACE FUNCTION public.convert_existing_personal_expenses_to_debts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  expense_record RECORD;
  debt_id UUID;
  employee_name TEXT;
  converted_count INTEGER := 0;
BEGIN
  -- معالجة المصروفات الشخصية الموجودة التي ليس لها ديون مقابلة
  FOR expense_record IN 
    SELECT e.* 
    FROM public.expenses e
    WHERE e.expense_type = 'personal' 
    AND e.recorded_by IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.debts d 
      WHERE d.debtor_id = e.recorded_by 
      AND d.description LIKE '%' || e.title || '%'
      AND d.amount = e.amount
    )
  LOOP
    -- جلب اسم الموظف
    SELECT COALESCE(first_name || ' ' || last_name, 'موظف غير محدد') 
    INTO employee_name
    FROM public.profiles 
    WHERE user_id = expense_record.recorded_by;
    
    -- إنشاء الدين
    INSERT INTO public.debts (
      debtor_name,
      debtor_type,
      debtor_id,
      amount,
      description,
      status,
      recorded_by,
      auto_deduct_from_commission,
      created_at
    ) VALUES (
      COALESCE(employee_name, 'موظف غير محدد'),
      'employee',
      expense_record.recorded_by,
      expense_record.amount,
      'مصروف شخصي (محول): ' || expense_record.title || CASE WHEN expense_record.description IS NOT NULL THEN ' - ' || expense_record.description ELSE '' END,
      'pending',
      expense_record.recorded_by,
      true,
      expense_record.created_at
    ) RETURNING id INTO debt_id;
    
    converted_count := converted_count + 1;
    
    -- تسجيل النشاط
    PERFORM public.log_financial_activity(
      'converted_personal_expense_to_debt',
      'تحويل مصروف شخصي موجود إلى دين: ' || expense_record.title || ' - ' || COALESCE(employee_name, 'موظف غير محدد'),
      expense_record.amount,
      'expenses',
      expense_record.id,
      'debts',
      debt_id,
      expense_record.recorded_by,
      jsonb_build_object(
        'expense_id', expense_record.id,
        'debt_id', debt_id,
        'employee_name', employee_name,
        'conversion_type', 'existing_data'
      )
    );
  END LOOP;
  
  RETURN converted_count;
END;
$$;

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_journal_debt_links_journal_entry ON public.journal_debt_links(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_debt_links_debt ON public.journal_debt_links(debt_id);
CREATE INDEX IF NOT EXISTS idx_expenses_personal_recorded_by ON public.expenses(recorded_by) WHERE expense_type = 'personal';