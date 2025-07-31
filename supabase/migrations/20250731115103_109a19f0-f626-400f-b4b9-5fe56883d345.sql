-- تحديث نظام العمولات لدعم عدة موظفين

-- تحديث جدول commission_employees ليتوافق مع النظام الجديد
DROP TRIGGER IF EXISTS trigger_update_commission_employee_calculations ON public.commission_employees;
DROP TRIGGER IF EXISTS trigger_process_commission_debt_deduction ON public.commission_employees;

-- تحديث دالة حساب العمولة المطورة لدعم عدة موظفين
CREATE OR REPLACE FUNCTION public.calculate_deal_commission_multi(
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
    office_share NUMERIC;
    employee_total_share NUMERIC;
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
    
    -- حساب التوزيع: 50% للمكتب، 50% للموظفين
    office_share := calculated_commission * 0.5;
    employee_total_share := calculated_commission * 0.5;
    
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
            amount = deal_record.amount,
            percentage = deal_record.commission_rate,
            total_commission = calculated_commission,
            office_share = office_share,
            remaining_for_employees = employee_total_share,
            client_name = deal_record.client_name,
            updated_at = now()
        WHERE id = commission_id;
        
        -- حذف الموظفين السابقين
        DELETE FROM public.commission_employees WHERE commission_id = commission_id;
    ELSE
        -- إنشاء عمولة جديدة
        INSERT INTO public.commissions (
            deal_id,
            employee_id,
            amount,
            percentage,
            total_commission,
            office_share,
            remaining_for_employees,
            client_name
        ) VALUES (
            deal_id_param,
            deal_record.handled_by, -- الموظف الرئيسي
            deal_record.amount,
            deal_record.commission_rate,
            calculated_commission,
            office_share,
            employee_total_share,
            deal_record.client_name
        ) RETURNING id INTO commission_id;
    END IF;
    
    -- إضافة الموظفين وحساب نصيب كل واحد
    FOR i IN 1..employee_count LOOP
        INSERT INTO public.commission_employees (
            commission_id,
            employee_id,
            percentage,
            calculated_share,
            net_share
        ) VALUES (
            commission_id,
            employee_ids[i],
            employee_percentages[i],
            (employee_total_share * employee_percentages[i]) / 100,
            (employee_total_share * employee_percentages[i]) / 100
        );
    END LOOP;
    
    -- تحديث حالة الصفقة
    UPDATE public.deals
    SET 
        commission_amount = calculated_commission,
        commission_calculated = true
    WHERE id = deal_id_param;
    
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
        'نصيب المكتب من عمولة: ' || COALESCE(deal_record.client_name, 'غير محدد'),
        office_share,
        'عمولة صفقة',
        CURRENT_DATE,
        auth.uid()
    );
    
    -- تسجيل النشاط
    PERFORM public.log_financial_activity(
        'commission_calculated_multi',
        'تم حساب عمولة متعددة الموظفين للصفقة: ' || COALESCE(deal_record.client_name, 'غير محدد') || ' بمبلغ ' || calculated_commission || ' د.إ',
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
            'office_share', office_share,
            'employee_total_share', employee_total_share,
            'client_name', deal_record.client_name
        )
    );
    
    -- إرجاع النتيجة
    result_json := jsonb_build_object(
        'success', true,
        'commission_id', commission_id,
        'total_commission', calculated_commission,
        'office_share', office_share,
        'employee_total_share', employee_total_share,
        'employee_count', employee_count,
        'deal_amount', deal_record.amount,
        'commission_rate', deal_record.commission_rate,
        'employees', (
            SELECT json_agg(
                json_build_object(
                    'employee_id', ce.employee_id,
                    'percentage', ce.percentage,
                    'calculated_share', ce.calculated_share,
                    'net_share', ce.net_share
                )
            )
            FROM public.commission_employees ce
            WHERE ce.commission_id = commission_id
        )
    );
    
    RETURN result_json;
END;
$$;

-- دالة اعتماد العمولة المطورة للنظام الجديد
CREATE OR REPLACE FUNCTION public.approve_commission_multi(commission_id_param UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    commission_record RECORD;
    employee_record RECORD;
    default_account_id UUID;
    debt_amount NUMERIC;
    deduction_amount NUMERIC;
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
        paid_at = now()
    WHERE id = commission_id_param;
    
    -- معالجة كل موظف
    FOR employee_record IN 
        SELECT * FROM public.commission_employees 
        WHERE commission_id = commission_id_param
    LOOP
        -- حساب الديون المعلقة للموظف
        SELECT COALESCE(SUM(amount), 0) INTO debt_amount
        FROM public.debts 
        WHERE debtor_id = employee_record.employee_id 
        AND status = 'pending'
        AND auto_deduct_from_commission = true;
        
        -- حساب مبلغ الخصم
        deduction_amount := LEAST(debt_amount, employee_record.calculated_share);
        
        -- تحديث نصيب الموظف
        UPDATE public.commission_employees
        SET 
            deducted_debt = deduction_amount,
            net_share = calculated_share - deduction_amount
        WHERE id = employee_record.id;
        
        -- خصم الديون إذا وجدت
        IF deduction_amount > 0 THEN
            UPDATE public.debts 
            SET 
                amount = GREATEST(0, amount - deduction_amount),
                status = CASE 
                    WHEN amount <= deduction_amount THEN 'paid'
                    ELSE 'pending'
                END,
                paid_at = CASE 
                    WHEN amount <= deduction_amount THEN now()
                    ELSE paid_at
                END
            WHERE debtor_id = employee_record.employee_id 
            AND status = 'pending'
            AND auto_deduct_from_commission = true
            AND amount > 0;
        END IF;
    END LOOP;
    
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
        'commission_approved_multi',
        'تم اعتماد العمولة متعددة الموظفين بمبلغ ' || commission_record.total_commission || ' د.إ',
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