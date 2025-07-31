-- إصلاح نهائي لنظام العمولات - حل شامل ومتكامل

-- إنشاء جدول deals إذا لم يكن موجود بشكل صحيح
DO $$
BEGIN
    -- التأكد من وجود deals table مع كل الحقول المطلوبة
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'deals' AND column_name = 'commission_calculated') THEN
        ALTER TABLE public.deals ADD COLUMN commission_calculated BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- إنشاء جدول commissions بشكل محدث إذا احتجنا
CREATE TABLE IF NOT EXISTS public.deal_commissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    commission_rate NUMERIC NOT NULL DEFAULT 2.5,
    commission_amount NUMERIC NOT NULL DEFAULT 0,
    office_share NUMERIC NOT NULL DEFAULT 0,
    employee_share NUMERIC NOT NULL DEFAULT 0,
    
    -- تفاصيل العميل والعقار
    client_name TEXT,
    property_title TEXT,
    deal_amount NUMERIC NOT NULL DEFAULT 0,
    
    -- الموظف المسؤول
    handled_by UUID NOT NULL REFERENCES public.profiles(user_id),
    
    -- حالة العمولة
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    
    -- تواريخ
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    approved_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- من قام بالمعالجة
    created_by UUID NOT NULL DEFAULT auth.uid(),
    approved_by UUID,
    
    -- ملاحظات
    notes TEXT
);

-- تمكين RLS على الجدول الجديد
ALTER TABLE public.deal_commissions ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للعمولات
CREATE POLICY "Admins and accountants can manage deal commissions"
ON public.deal_commissions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Employees can view their deal commissions"
ON public.deal_commissions
FOR SELECT
USING (handled_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- دالة لحساب العمولة تلقائياً
CREATE OR REPLACE FUNCTION public.calculate_deal_commission(deal_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    deal_record RECORD;
    commission_record RECORD;
    calculated_commission NUMERIC;
    office_share NUMERIC;
    employee_share NUMERIC;
    result_json JSONB;
BEGIN
    -- جلب بيانات الصفقة
    SELECT 
        d.*,
        c.name as client_name,
        p.title as property_title,
        pr.first_name || ' ' || pr.last_name as employee_name
    INTO deal_record
    FROM public.deals d
    LEFT JOIN public.clients c ON d.client_id = c.id
    LEFT JOIN public.properties p ON d.property_id = p.id
    LEFT JOIN public.profiles pr ON d.handled_by = pr.user_id
    WHERE d.id = deal_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'الصفقة غير موجودة';
    END IF;
    
    -- حساب العمولة
    calculated_commission := (deal_record.amount * deal_record.commission_rate) / 100;
    office_share := calculated_commission * 0.5; -- 50% للمكتب
    employee_share := calculated_commission * 0.5; -- 50% للموظف
    
    -- التحقق من وجود عمولة سابقة
    SELECT * INTO commission_record
    FROM public.deal_commissions
    WHERE deal_id = deal_id_param;
    
    IF FOUND THEN
        -- تحديث العمولة الموجودة
        UPDATE public.deal_commissions
        SET 
            total_amount = deal_record.amount,
            commission_rate = deal_record.commission_rate,
            commission_amount = calculated_commission,
            office_share = office_share,
            employee_share = employee_share,
            client_name = deal_record.client_name,
            property_title = deal_record.property_title,
            deal_amount = deal_record.amount,
            updated_at = now()
        WHERE deal_id = deal_id_param
        RETURNING * INTO commission_record;
    ELSE
        -- إنشاء عمولة جديدة
        INSERT INTO public.deal_commissions (
            deal_id,
            total_amount,
            commission_rate,
            commission_amount,
            office_share,
            employee_share,
            client_name,
            property_title,
            deal_amount,
            handled_by,
            created_by
        ) VALUES (
            deal_id_param,
            deal_record.amount,
            deal_record.commission_rate,
            calculated_commission,
            office_share,
            employee_share,
            deal_record.client_name,
            deal_record.property_title,
            deal_record.amount,
            deal_record.handled_by,
            auth.uid()
        ) RETURNING * INTO commission_record;
    END IF;
    
    -- تحديث حالة الصفقة
    UPDATE public.deals
    SET 
        commission_amount = calculated_commission,
        commission_calculated = true
    WHERE id = deal_id_param;
    
    -- إضافة إيراد للمكتب
    INSERT INTO public.revenues (
        title,
        description,
        amount,
        source,
        revenue_date,
        recorded_by
    ) VALUES (
        'نصيب المكتب من العمولة',
        'نصيب المكتب من عمولة صفقة: ' || COALESCE(deal_record.client_name, 'غير محدد'),
        office_share,
        'عمولة صفقة',
        CURRENT_DATE,
        auth.uid()
    );
    
    -- تسجيل النشاط
    PERFORM public.log_financial_activity(
        'commission_calculated',
        'تم حساب عمولة للصفقة: ' || COALESCE(deal_record.client_name, 'غير محدد') || ' بمبلغ ' || calculated_commission || ' د.إ',
        calculated_commission,
        'deal_commissions',
        commission_record.id,
        'deals',
        deal_id_param,
        auth.uid(),
        jsonb_build_object(
            'deal_amount', deal_record.amount,
            'commission_rate', deal_record.commission_rate,
            'office_share', office_share,
            'employee_share', employee_share,
            'client_name', deal_record.client_name
        )
    );
    
    -- إرجاع النتيجة
    result_json := jsonb_build_object(
        'success', true,
        'commission_id', commission_record.id,
        'total_commission', calculated_commission,
        'office_share', office_share,
        'employee_share', employee_share,
        'deal_amount', deal_record.amount,
        'commission_rate', deal_record.commission_rate
    );
    
    RETURN result_json;
END;
$function$;

-- دالة لاعتماد العمولة
CREATE OR REPLACE FUNCTION public.approve_commission(commission_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    commission_record RECORD;
BEGIN
    -- التحقق من الصلاحية
    IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role)) THEN
        RAISE EXCEPTION 'لا تملك صلاحية اعتماد العمولات';
    END IF;
    
    -- جلب بيانات العمولة
    SELECT * INTO commission_record
    FROM public.deal_commissions
    WHERE id = commission_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'العمولة غير موجودة';
    END IF;
    
    -- اعتماد العمولة
    UPDATE public.deal_commissions
    SET 
        status = 'approved',
        approved_at = now(),
        approved_by = auth.uid()
    WHERE id = commission_id_param;
    
    -- إضافة العمولة للموظف في commission_employees
    INSERT INTO public.commission_employees (
        commission_id,
        employee_id,
        percentage,
        calculated_share,
        net_share
    ) 
    SELECT 
        (SELECT id FROM public.commissions 
         WHERE deal_id = commission_record.deal_id 
         ORDER BY created_at DESC LIMIT 1),
        commission_record.handled_by,
        50, -- 50% للموظف
        commission_record.employee_share,
        commission_record.employee_share
    WHERE EXISTS (
        SELECT 1 FROM public.commissions 
        WHERE deal_id = commission_record.deal_id
    );
    
    -- تسجيل النشاط
    PERFORM public.log_financial_activity(
        'commission_approved',
        'تم اعتماد العمولة بمبلغ ' || commission_record.commission_amount || ' د.إ',
        commission_record.commission_amount,
        'deal_commissions',
        commission_id_param,
        'deals',
        commission_record.deal_id,
        auth.uid(),
        jsonb_build_object(
            'approved_by', auth.uid(),
            'employee_share', commission_record.employee_share
        )
    );
    
    RETURN TRUE;
END;
$function$;

-- تشغيل العمولة تلقائياً عند إغلاق الصفقة
CREATE OR REPLACE FUNCTION public.auto_calculate_commission_on_deal_close()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    commission_result JSONB;
BEGIN
    -- إذا تم تغيير حالة الصفقة إلى مغلقة
    IF NEW.status = 'closed' AND (OLD.status IS NULL OR OLD.status != 'closed') THEN
        -- حساب العمولة تلقائياً
        commission_result := public.calculate_deal_commission(NEW.id);
        
        -- تسجيل العملية
        PERFORM public.log_financial_activity(
            'auto_commission_calculated',
            'تم حساب العمولة تلقائياً عند إغلاق الصفقة',
            (commission_result->>'total_commission')::NUMERIC,
            'deals',
            NEW.id,
            'deal_commissions',
            NULL,
            auth.uid(),
            commission_result
        );
    END IF;
    
    RETURN NEW;
END;
$function$;

-- إنشاء trigger للحساب التلقائي
DROP TRIGGER IF EXISTS auto_commission_on_deal_close ON public.deals;
CREATE TRIGGER auto_commission_on_deal_close
    AFTER UPDATE ON public.deals
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_calculate_commission_on_deal_close();

-- تحديث timestamps
CREATE TRIGGER update_deal_commissions_updated_at
    BEFORE UPDATE ON public.deal_commissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();