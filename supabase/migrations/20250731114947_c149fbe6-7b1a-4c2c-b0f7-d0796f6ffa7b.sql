-- إنشاء نظام عمولات متطور لدعم عدة موظفين

-- تحديث جدول العمولات الأساسي
DROP TABLE IF EXISTS public.deal_commissions CASCADE;
CREATE TABLE public.commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  client_name TEXT,
  property_title TEXT,
  deal_amount NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC NOT NULL DEFAULT 2.5,
  total_commission NUMERIC NOT NULL DEFAULT 0,
  office_share NUMERIC NOT NULL DEFAULT 0,
  remaining_for_employees NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  notes TEXT,
  created_by UUID NOT NULL DEFAULT auth.uid(),
  approved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول ربط الموظفين بالعمولات
CREATE TABLE public.commission_employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commission_id UUID NOT NULL REFERENCES public.commissions(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  percentage NUMERIC NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  calculated_share NUMERIC NOT NULL DEFAULT 0,
  deducted_debt NUMERIC NOT NULL DEFAULT 0,
  net_share NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(commission_id, employee_id)
);

-- تفعيل RLS على الجداول
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_employees ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للعمولات
CREATE POLICY "Admins and accountants can manage commissions" 
ON public.commissions FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Employees can view relevant commissions" 
ON public.commissions FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'accountant'::app_role) OR 
  EXISTS (
    SELECT 1 FROM public.commission_employees ce 
    WHERE ce.commission_id = commissions.id AND ce.employee_id = auth.uid()
  )
);

-- سياسات الأمان لربط الموظفين
CREATE POLICY "Admins and accountants can manage commission employees" 
ON public.commission_employees FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Employees can view their commission details" 
ON public.commission_employees FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'accountant'::app_role) OR 
  employee_id = auth.uid()
);

-- دالة حساب توزيع العمولة
CREATE OR REPLACE FUNCTION public.calculate_commission_distribution()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- حساب نصيب المكتب (50% من العمولة الإجمالية)
    NEW.office_share = NEW.total_commission * 0.5;
    
    -- حساب المتبقي للموظفين (50% من العمولة الإجمالية)
    NEW.remaining_for_employees = NEW.total_commission * 0.5;
    
    RETURN NEW;
END;
$$;

-- دالة تحديث حسابات الموظفين
CREATE OR REPLACE FUNCTION public.update_commission_employee_calculations()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    commission_record RECORD;
    employee_debt NUMERIC := 0;
BEGIN
    -- جلب بيانات العمولة
    SELECT remaining_for_employees INTO commission_record
    FROM public.commissions 
    WHERE id = NEW.commission_id;
    
    -- حساب نصيب الموظف بناءً على النسبة المحددة
    NEW.calculated_share = (commission_record.remaining_for_employees * NEW.percentage) / 100;
    
    -- جلب إجمالي ديون الموظف المعلقة
    SELECT COALESCE(SUM(amount), 0) INTO employee_debt
    FROM public.debts 
    WHERE debtor_id = NEW.employee_id 
    AND status = 'pending'
    AND auto_deduct_from_commission = true;
    
    -- حساب المبلغ المخصوم من الديون (الحد الأدنى بين الدين والنصيب المحسوب)
    NEW.deducted_debt = LEAST(employee_debt, NEW.calculated_share);
    
    -- حساب النصيب الصافي
    NEW.net_share = NEW.calculated_share - NEW.deducted_debt;
    
    RETURN NEW;
END;
$$;

-- دالة معالجة خصم الديون من العمولة
CREATE OR REPLACE FUNCTION public.process_commission_debt_deduction()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- إنشاء المشغلات (Triggers)
CREATE TRIGGER trigger_calculate_commission_distribution
    BEFORE INSERT OR UPDATE ON public.commissions
    FOR EACH ROW EXECUTE FUNCTION public.calculate_commission_distribution();

CREATE TRIGGER trigger_update_commission_employee_calculations
    BEFORE INSERT OR UPDATE ON public.commission_employees
    FOR EACH ROW EXECUTE FUNCTION public.update_commission_employee_calculations();

CREATE TRIGGER trigger_process_commission_debt_deduction
    BEFORE INSERT ON public.commission_employees
    FOR EACH ROW EXECUTE FUNCTION public.process_commission_debt_deduction();

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_commissions_deal_id ON public.commissions(deal_id);
CREATE INDEX idx_commissions_status ON public.commissions(status);
CREATE INDEX idx_commission_employees_commission_id ON public.commission_employees(commission_id);
CREATE INDEX idx_commission_employees_employee_id ON public.commission_employees(employee_id);

-- دالة حساب العمولة المطورة لدعم عدة موظفين
CREATE OR REPLACE FUNCTION public.calculate_deal_commission(
    deal_id_param UUID,
    employee_ids UUID[] DEFAULT NULL,
    employee_percentages NUMERIC[] DEFAULT NULL
)
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    deal_record RECORD;
    commission_record RECORD;
    calculated_commission NUMERIC;
    total_percentage NUMERIC := 0;
    employee_count INTEGER;
    equal_percentage NUMERIC;
    i INTEGER;
    result_json JSONB;
    commission_id UUID;
BEGIN
    -- التحقق من الصلاحيات
    IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role)) THEN
        RAISE EXCEPTION 'لا تملك صلاحية حساب العمولات';
    END IF;
    
    -- جلب بيانات الصفقة
    SELECT 
        d.*,
        c.name as client_name,
        p.title as property_title
    INTO deal_record
    FROM public.deals d
    LEFT JOIN public.clients c ON d.client_id = c.id
    LEFT JOIN public.properties p ON d.property_id = p.id
    WHERE d.id = deal_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'الصفقة غير موجودة';
    END IF;
    
    IF deal_record.status != 'closed' THEN
        RAISE EXCEPTION 'لا يمكن حساب العمولة إلا للصفقات المغلقة';
    END IF;
    
    -- حساب العمولة الإجمالية
    calculated_commission := (deal_record.amount * deal_record.commission_rate) / 100;
    
    -- تحديد الموظفين والنسب
    IF employee_ids IS NULL THEN
        -- استخدام الموظف المسؤول عن الصفقة
        employee_ids := ARRAY[deal_record.handled_by];
        employee_percentages := ARRAY[100];
    END IF;
    
    employee_count := array_length(employee_ids, 1);
    
    -- التحقق من صحة النسب
    IF employee_percentages IS NOT NULL THEN
        IF array_length(employee_percentages, 1) != employee_count THEN
            RAISE EXCEPTION 'عدد النسب يجب أن يساوي عدد الموظفين';
        END IF;
        
        -- حساب إجمالي النسب
        SELECT SUM(unnest) INTO total_percentage FROM unnest(employee_percentages);
        
        IF total_percentage != 100 THEN
            RAISE EXCEPTION 'إجمالي النسب يجب أن يساوي 100%%، النسبة الحالية: %', total_percentage;
        END IF;
    ELSE
        -- توزيع متساوي
        equal_percentage := 100.0 / employee_count;
        employee_percentages := array_fill(equal_percentage, ARRAY[employee_count]);
    END IF;
    
    -- التحقق من وجود عمولة سابقة
    SELECT * INTO commission_record
    FROM public.commissions
    WHERE deal_id = deal_id_param;
    
    IF FOUND THEN
        commission_id := commission_record.id;
        -- تحديث العمولة الموجودة
        UPDATE public.commissions
        SET 
            deal_amount = deal_record.amount,
            commission_rate = deal_record.commission_rate,
            total_commission = calculated_commission,
            client_name = deal_record.client_name,
            property_title = deal_record.property_title,
            updated_at = now()
        WHERE id = commission_id;
        
        -- حذف الموظفين السابقين
        DELETE FROM public.commission_employees WHERE commission_id = commission_id;
    ELSE
        -- إنشاء عمولة جديدة
        INSERT INTO public.commissions (
            deal_id,
            deal_amount,
            commission_rate,
            total_commission,
            client_name,
            property_title,
            created_by
        ) VALUES (
            deal_id_param,
            deal_record.amount,
            deal_record.commission_rate,
            calculated_commission,
            deal_record.client_name,
            deal_record.property_title,
            auth.uid()
        ) RETURNING id INTO commission_id;
    END IF;
    
    -- إضافة الموظفين وحساب نصيب كل واحد
    FOR i IN 1..employee_count LOOP
        INSERT INTO public.commission_employees (
            commission_id,
            employee_id,
            percentage
        ) VALUES (
            commission_id,
            employee_ids[i],
            employee_percentages[i]
        );
    END LOOP;
    
    -- تحديث حالة الصفقة
    UPDATE public.deals
    SET 
        commission_amount = calculated_commission,
        commission_calculated = true
    WHERE id = deal_id_param;
    
    -- تسجيل النشاط
    PERFORM public.log_financial_activity(
        'commission_calculated',
        'تم حساب عمولة للصفقة: ' || COALESCE(deal_record.client_name, 'غير محدد') || ' بمبلغ ' || calculated_commission || ' د.إ',
        calculated_commission,
        'commissions',
        commission_id,
        'deals',
        deal_id_param,
        auth.uid(),
        jsonb_build_object(
            'deal_amount', deal_record.amount,
            'commission_rate', deal_record.commission_rate,
            'employee_count', employee_count,
            'client_name', deal_record.client_name
        )
    );
    
    -- إرجاع النتيجة
    result_json := jsonb_build_object(
        'success', true,
        'commission_id', commission_id,
        'total_commission', calculated_commission,
        'office_share', calculated_commission * 0.5,
        'remaining_for_employees', calculated_commission * 0.5,
        'employee_count', employee_count,
        'deal_amount', deal_record.amount,
        'commission_rate', deal_record.commission_rate
    );
    
    RETURN result_json;
END;
$$;

-- دالة اعتماد العمولة المطورة
CREATE OR REPLACE FUNCTION public.approve_commission(commission_id_param UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    commission_record RECORD;
    default_account_id UUID;
BEGIN
    -- التحقق من الصلاحية
    IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role)) THEN
        RAISE EXCEPTION 'لا تملك صلاحية اعتماد العمولات';
    END IF;
    
    -- جلب بيانات العمولة
    SELECT * INTO commission_record
    FROM public.commissions
    WHERE id = commission_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'العمولة غير موجودة';
    END IF;
    
    IF commission_record.status != 'pending' THEN
        RAISE EXCEPTION 'العمولة معتمدة بالفعل أو ملغية';
    END IF;
    
    -- اعتماد العمولة
    UPDATE public.commissions
    SET 
        status = 'approved',
        approved_at = now(),
        approved_by = auth.uid()
    WHERE id = commission_id_param;
    
    -- إضافة نصيب المكتب للإيرادات
    INSERT INTO public.revenues (
        title,
        description,
        amount,
        source,
        revenue_date,
        recorded_by
    ) VALUES (
        'نصيب المكتب من العمولة',
        'نصيب المكتب من عمولة: ' || COALESCE(commission_record.client_name, 'غير محدد'),
        commission_record.office_share,
        'عمولة صفقة',
        CURRENT_DATE,
        auth.uid()
    );
    
    -- إضافة إلى الخزينة
    SELECT id INTO default_account_id 
    FROM public.treasury_accounts 
    WHERE account_type = 'cash' AND is_active = true 
    ORDER BY created_at ASC 
    LIMIT 1;
    
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
            'commission',
            commission_record.office_share,
            default_account_id,
            'commission',
            commission_id_param,
            'نصيب المكتب من العمولة: ' || COALESCE(commission_record.client_name, 'غير محدد'),
            auth.uid(),
            CURRENT_DATE
        );
    END IF;
    
    -- تسجيل النشاط
    PERFORM public.log_financial_activity(
        'commission_approved',
        'تم اعتماد العمولة بمبلغ ' || commission_record.total_commission || ' د.إ',
        commission_record.total_commission,
        'commissions',
        commission_id_param,
        'deals',
        commission_record.deal_id,
        auth.uid(),
        jsonb_build_object(
            'approved_by', auth.uid(),
            'office_share', commission_record.office_share,
            'remaining_for_employees', commission_record.remaining_for_employees
        )
    );
    
    RETURN TRUE;
END;
$$;

-- مشغل حساب العمولة التلقائي عند إغلاق الصفقة
CREATE OR REPLACE FUNCTION public.auto_calculate_commission_on_deal_close()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    commission_result JSONB;
BEGIN
    -- إذا تم تغيير حالة الصفقة إلى مغلقة
    IF NEW.status = 'closed' AND (OLD.status IS NULL OR OLD.status != 'closed') THEN
        -- حساب العمولة تلقائياً للموظف المسؤول
        commission_result := public.calculate_deal_commission(
            NEW.id,
            ARRAY[NEW.handled_by],
            ARRAY[100]
        );
        
        -- تسجيل العملية
        PERFORM public.log_financial_activity(
            'auto_commission_calculated',
            'تم حساب العمولة تلقائياً عند إغلاق الصفقة',
            (commission_result->>'total_commission')::NUMERIC,
            'deals',
            NEW.id,
            'commissions',
            NULL,
            auth.uid(),
            commission_result
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- إنشاء مشغل الحساب التلقائي
DROP TRIGGER IF EXISTS trigger_auto_calculate_commission_on_deal_close ON public.deals;
CREATE TRIGGER trigger_auto_calculate_commission_on_deal_close
    AFTER UPDATE ON public.deals
    FOR EACH ROW EXECUTE FUNCTION public.auto_calculate_commission_on_deal_close();