-- إنشاء وحدة عقود الإيجار المتكاملة

-- جدول العقارات المؤجرة
CREATE TABLE IF NOT EXISTS public.rental_properties (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    property_title TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    area TEXT NOT NULL,
    plot_number TEXT,
    building_name TEXT,
    unit_number TEXT,
    unit_type TEXT NOT NULL CHECK (unit_type IN ('فيلا', 'شقة', 'محل تجاري', 'مكتب', 'مستودع', 'أرض')),
    purpose_of_use TEXT NOT NULL CHECK (purpose_of_use IN ('سكني', 'تجاري', 'صناعي', 'مكتبي', 'مختلط')),
    total_area NUMERIC,
    property_status TEXT NOT NULL DEFAULT 'متاح' CHECK (property_status IN ('متاح', 'مؤجر', 'صيانة', 'غير متاح')),
    commission_percentage NUMERIC DEFAULT 2.5,
    special_features TEXT[],
    images TEXT[],
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول المستأجرين
CREATE TABLE IF NOT EXISTS public.rental_tenants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    nationality TEXT,
    emirates_id TEXT,
    passport_number TEXT,
    phone_primary TEXT NOT NULL,
    phone_secondary TEXT,
    email TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    employer_name TEXT,
    monthly_salary NUMERIC,
    job_title TEXT,
    current_address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول عقود الإيجار
CREATE TABLE IF NOT EXISTS public.rental_contracts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_number TEXT NOT NULL UNIQUE,
    property_id UUID NOT NULL REFERENCES public.rental_properties(id),
    tenant_id UUID NOT NULL REFERENCES public.rental_tenants(id),
    
    -- تفاصيل العقد
    rent_amount NUMERIC NOT NULL,
    security_deposit NUMERIC NOT NULL DEFAULT 0,
    contract_duration_months INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- تفاصيل الدفع
    payment_method TEXT NOT NULL CHECK (payment_method IN ('شيك', 'تحويل بنكي', 'نقدي', 'مختلط')),
    installment_frequency TEXT NOT NULL CHECK (installment_frequency IN ('شهري', 'ربع سنوي', 'نصف سنوي', 'سنوي')),
    installments_count INTEGER NOT NULL,
    
    -- حالة العقد
    contract_status TEXT NOT NULL DEFAULT 'مسودة' CHECK (contract_status IN ('مسودة', 'نشط', 'منتهي', 'ملغي', 'مجدد')),
    
    -- تفاصيل إضافية
    renewal_notice_days INTEGER DEFAULT 30,
    auto_renewal BOOLEAN DEFAULT false,
    special_terms TEXT,
    commission_amount NUMERIC,
    
    -- تواريخ مهمة
    signed_date DATE,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول أقساط الإيجار
CREATE TABLE IF NOT EXISTS public.rental_installments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_id UUID NOT NULL REFERENCES public.rental_contracts(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    amount NUMERIC NOT NULL,
    due_date DATE NOT NULL,
    paid_amount NUMERIC DEFAULT 0,
    payment_date DATE,
    payment_method TEXT,
    cheque_number TEXT,
    bank_name TEXT,
    status TEXT NOT NULL DEFAULT 'معلق' CHECK (status IN ('معلق', 'مدفوع جزئياً', 'مدفوع', 'متأخر', 'ملغي')),
    late_fee NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول مستندات العقود
CREATE TABLE IF NOT EXISTS public.contract_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_id UUID NOT NULL REFERENCES public.rental_contracts(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN (
        'العقد الأصلي', 'هوية المستأجر', 'جواز السفر', 'شهادة الراتب', 
        'شيكات الإيجار', 'شهادة عدم الممانعة', 'تأمين العقار', 'مستندات أخرى'
    )),
    document_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    uploaded_by UUID NOT NULL,
    expiry_date DATE,
    is_signed BOOLEAN DEFAULT false,
    notes TEXT
);

-- جدول تنبيهات عقود الإيجار
CREATE TABLE IF NOT EXISTS public.rental_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_id UUID REFERENCES public.rental_contracts(id),
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'تذكير دفعة', 'تأخير دفعة', 'انتهاء عقد', 'تجديد عقد', 'مستندات ناقصة', 'أخرى'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('مالك', 'مستأجر', 'إدارة', 'الكل')),
    recipient_id UUID,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_date TIMESTAMP WITH TIME ZONE,
    channel TEXT NOT NULL DEFAULT 'نظام' CHECK (channel IN ('نظام', 'إيميل', 'واتساب', 'رسالة نصية')),
    status TEXT NOT NULL DEFAULT 'مجدول' CHECK (status IN ('مجدول', 'مرسل', 'فشل', 'ملغي')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول قوالب العقود
CREATE TABLE IF NOT EXISTS public.contract_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    template_name TEXT NOT NULL,
    template_type TEXT NOT NULL CHECK (template_type IN ('سكني', 'تجاري', 'مكتبي', 'عام')),
    template_file_url TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0',
    is_active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_rental_contracts_property_id ON public.rental_contracts(property_id);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_tenant_id ON public.rental_contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_status ON public.rental_contracts(contract_status);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_dates ON public.rental_contracts(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_rental_installments_contract_id ON public.rental_installments(contract_id);
CREATE INDEX IF NOT EXISTS idx_rental_installments_due_date ON public.rental_installments(due_date);
CREATE INDEX IF NOT EXISTS idx_rental_installments_status ON public.rental_installments(status);

CREATE INDEX IF NOT EXISTS idx_contract_documents_contract_id ON public.contract_documents(contract_id);
CREATE INDEX IF NOT EXISTS idx_rental_notifications_scheduled_date ON public.rental_notifications(scheduled_date);

-- تمكين RLS على جميع الجداول
ALTER TABLE public.rental_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للعقارات المؤجرة
CREATE POLICY "الإداريون والمحاسبون يمكنهم إدارة العقارات المؤجرة" ON public.rental_properties
    FOR ALL TO authenticated
    USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- سياسات RLS للمستأجرين
CREATE POLICY "الإداريون والمحاسبون يمكنهم إدارة المستأجرين" ON public.rental_tenants
    FOR ALL TO authenticated
    USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- سياسات RLS لعقود الإيجار
CREATE POLICY "الإداريون والمحاسبون يمكنهم إدارة عقود الإيجار" ON public.rental_contracts
    FOR ALL TO authenticated
    USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- سياسات RLS للأقساط
CREATE POLICY "الإداريون والمحاسبون يمكنهم إدارة الأقساط" ON public.rental_installments
    FOR ALL TO authenticated
    USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- سياسات RLS للمستندات
CREATE POLICY "الإداريون والمحاسبون يمكنهم إدارة المستندات" ON public.contract_documents
    FOR ALL TO authenticated
    USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- سياسات RLS للتنبيهات
CREATE POLICY "الإداريون والمحاسبون يمكنهم إدارة التنبيهات" ON public.rental_notifications
    FOR ALL TO authenticated
    USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- سياسات RLS لقوالب العقود
CREATE POLICY "الإداريون والمحاسبون يمكنهم إدارة قوالب العقود" ON public.contract_templates
    FOR ALL TO authenticated
    USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));