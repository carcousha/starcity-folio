-- دوال متقدمة لوحدة عقود الإيجار

-- دالة توليد أقساط الإيجار التلقائية
CREATE OR REPLACE FUNCTION public.generate_rental_installments(
    p_contract_id UUID,
    p_start_date DATE,
    p_installments_count INTEGER,
    p_frequency TEXT,
    p_amount_per_installment NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    installment_date DATE;
    i INTEGER;
BEGIN
    installment_date := p_start_date;
    
    FOR i IN 1..p_installments_count LOOP
        INSERT INTO public.rental_installments (
            contract_id,
            installment_number,
            amount,
            due_date
        ) VALUES (
            p_contract_id,
            i,
            p_amount_per_installment,
            installment_date
        );
        
        -- حساب التاريخ التالي حسب التردد
        installment_date := CASE p_frequency
            WHEN 'شهري' THEN installment_date + INTERVAL '1 month'
            WHEN 'ربع سنوي' THEN installment_date + INTERVAL '3 months'
            WHEN 'نصف سنوي' THEN installment_date + INTERVAL '6 months'
            WHEN 'سنوي' THEN installment_date + INTERVAL '1 year'
            ELSE installment_date + INTERVAL '1 month'
        END;
    END LOOP;
END;
$$;

-- دالة جدولة تنبيهات تجديد العقود
CREATE OR REPLACE FUNCTION public.schedule_renewal_notifications()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    contract_record RECORD;
BEGIN
    FOR contract_record IN 
        SELECT c.*, p.property_title, t.full_name
        FROM public.rental_contracts c
        JOIN public.rental_properties p ON c.property_id = p.id
        JOIN public.rental_tenants t ON c.tenant_id = t.id
        WHERE c.contract_status = 'نشط'
        AND c.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days'
        AND NOT EXISTS (
            SELECT 1 FROM public.rental_notifications rn
            WHERE rn.contract_id = c.id 
            AND rn.notification_type = 'تجديد عقد'
            AND rn.status IN ('مجدول', 'مرسل')
        )
    LOOP
        -- إشعار قبل شهرين
        INSERT INTO public.rental_notifications (
            contract_id,
            notification_type,
            title,
            message,
            recipient_type,
            scheduled_date
        ) VALUES (
            contract_record.id,
            'تجديد عقد',
            'تذكير تجديد العقد - شهرين',
            'عقد إيجار العقار ' || contract_record.property_title || ' للمستأجر ' || contract_record.full_name || ' ينتهي في ' || contract_record.end_date,
            'إدارة',
            contract_record.end_date - INTERVAL '60 days'
        );
        
        -- إشعار قبل شهر
        INSERT INTO public.rental_notifications (
            contract_id,
            notification_type,
            title,
            message,
            recipient_type,
            scheduled_date
        ) VALUES (
            contract_record.id,
            'تجديد عقد',
            'تذكير تجديد العقد - شهر واحد',
            'عقد إيجار العقار ' || contract_record.property_title || ' للمستأجر ' || contract_record.full_name || ' ينتهي في ' || contract_record.end_date,
            'إدارة',
            contract_record.end_date - INTERVAL '30 days'
        );
        
        -- إشعار قبل أسبوع
        INSERT INTO public.rental_notifications (
            contract_id,
            notification_type,
            title,
            message,
            recipient_type,
            scheduled_date
        ) VALUES (
            contract_record.id,
            'تجديد عقد',
            'تذكير تجديد العقد - أسبوع واحد',
            'عقد إيجار العقار ' || contract_record.property_title || ' للمستأجر ' || contract_record.full_name || ' ينتهي في ' || contract_record.end_date,
            'إدارة',
            contract_record.end_date - INTERVAL '7 days'
        );
    END LOOP;
END;
$$;

-- دالة معالجة دفع قسط الإيجار
CREATE OR REPLACE FUNCTION public.process_rental_payment(
    p_installment_id UUID,
    p_payment_amount NUMERIC,
    p_payment_method TEXT DEFAULT 'نقدي',
    p_cheque_number TEXT DEFAULT NULL,
    p_bank_name TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    installment_record RECORD;
    contract_record RECORD;
    property_record RECORD;
    default_account_id UUID;
BEGIN
    -- جلب بيانات القسط
    SELECT * INTO installment_record 
    FROM public.rental_installments 
    WHERE id = p_installment_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'القسط غير موجود';
    END IF;
    
    -- جلب بيانات العقد والعقار
    SELECT c.*, p.property_title, p.owner_name, p.commission_percentage
    INTO contract_record
    FROM public.rental_contracts c
    JOIN public.rental_properties p ON c.property_id = p.id
    WHERE c.id = installment_record.contract_id;
    
    -- تحديث القسط
    UPDATE public.rental_installments 
    SET 
        paid_amount = paid_amount + p_payment_amount,
        payment_date = CASE 
            WHEN paid_amount + p_payment_amount >= amount THEN CURRENT_DATE
            ELSE payment_date
        END,
        payment_method = p_payment_method,
        cheque_number = p_cheque_number,
        bank_name = p_bank_name,
        status = CASE 
            WHEN paid_amount + p_payment_amount >= amount THEN 'مدفوع'
            ELSE 'مدفوع جزئياً'
        END,
        notes = COALESCE(notes, '') || 
            CASE WHEN notes IS NOT NULL THEN E'\n' ELSE '' END ||
            'دفعة: ' || p_payment_amount || ' د.إ في ' || CURRENT_DATE ||
            CASE WHEN p_notes IS NOT NULL THEN ' - ' || p_notes ELSE '' END,
        updated_at = now()
    WHERE id = p_installment_id;
    
    -- الحصول على الحساب النقدي الافتراضي
    SELECT id INTO default_account_id 
    FROM public.treasury_accounts 
    WHERE account_type = 'cash' AND is_active = true 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    -- إضافة المعاملة للخزينة
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
            'rental_payment',
            p_payment_amount,
            default_account_id,
            'rental_installment',
            p_installment_id,
            'دفع قسط إيجار: ' || contract_record.property_title,
            auth.uid(),
            CURRENT_DATE
        );
    END IF;
    
    -- تسجيل النشاط
    PERFORM public.log_financial_activity(
        'rental_payment',
        'دفع قسط إيجار بمبلغ ' || p_payment_amount || ' د.إ - ' || contract_record.property_title,
        p_payment_amount,
        'rental_installments',
        p_installment_id,
        'rental_contracts',
        installment_record.contract_id,
        auth.uid(),
        jsonb_build_object(
            'installment_number', installment_record.installment_number,
            'payment_method', p_payment_method,
            'property_title', contract_record.property_title
        )
    );
    
    RETURN TRUE;
END;
$$;

-- دالة الحصول على تقرير العقود
CREATE OR REPLACE FUNCTION public.get_contracts_report(
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL,
    p_status TEXT DEFAULT NULL
)
RETURNS TABLE(
    contract_id UUID,
    contract_number TEXT,
    property_title TEXT,
    tenant_name TEXT,
    rent_amount NUMERIC,
    start_date DATE,
    end_date DATE,
    contract_status TEXT,
    total_installments BIGINT,
    paid_installments BIGINT,
    pending_installments BIGINT,
    total_paid NUMERIC,
    total_pending NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as contract_id,
        c.contract_number,
        p.property_title,
        t.full_name as tenant_name,
        c.rent_amount,
        c.start_date,
        c.end_date,
        c.contract_status,
        COUNT(ri.id) as total_installments,
        COUNT(CASE WHEN ri.status = 'مدفوع' THEN 1 END) as paid_installments,
        COUNT(CASE WHEN ri.status IN ('معلق', 'متأخر') THEN 1 END) as pending_installments,
        COALESCE(SUM(CASE WHEN ri.status = 'مدفوع' THEN ri.paid_amount ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN ri.status IN ('معلق', 'متأخر') THEN ri.amount ELSE 0 END), 0) as total_pending
    FROM public.rental_contracts c
    JOIN public.rental_properties p ON c.property_id = p.id
    JOIN public.rental_tenants t ON c.tenant_id = t.id
    LEFT JOIN public.rental_installments ri ON c.id = ri.contract_id
    WHERE 
        (p_start_date IS NULL OR c.start_date >= p_start_date)
        AND (p_end_date IS NULL OR c.end_date <= p_end_date)
        AND (p_status IS NULL OR c.contract_status = p_status)
    GROUP BY c.id, c.contract_number, p.property_title, t.full_name, 
             c.rent_amount, c.start_date, c.end_date, c.contract_status
    ORDER BY c.created_at DESC;
END;
$$;

-- دالة توليد رقم عقد تلقائي
CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    contract_year TEXT;
    contract_sequence INTEGER;
    contract_number TEXT;
BEGIN
    contract_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- الحصول على آخر رقم تسلسلي للسنة الحالية
    SELECT COALESCE(MAX(
        CAST(SPLIT_PART(contract_number, '-', 2) AS INTEGER)
    ), 0) + 1
    INTO contract_sequence
    FROM public.rental_contracts
    WHERE contract_number LIKE contract_year || '-%';
    
    -- تكوين رقم العقد الجديد
    contract_number := contract_year || '-' || LPAD(contract_sequence::TEXT, 4, '0');
    
    RETURN contract_number;
END;
$$;