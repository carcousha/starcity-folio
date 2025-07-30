-- إنشاء وحدة إدارة الليدات (Leads Management Module)

-- جدول الليدات الرئيسي
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    nationality TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'ar',
    lead_source TEXT NOT NULL CHECK (lead_source IN ('facebook_ads', 'google_ads', 'referral', 'whatsapp', 'real_estate_expo', 'other')),
    property_type TEXT NOT NULL CHECK (property_type IN ('villa', 'apartment', 'land', 'townhouse', 'commercial')),
    budget_min NUMERIC,
    budget_max NUMERIC,
    preferred_location TEXT,
    purchase_purpose TEXT NOT NULL CHECK (purchase_purpose IN ('investment', 'residence', 'resale')),
    assigned_to UUID REFERENCES public.profiles(user_id),
    stage TEXT NOT NULL DEFAULT 'new' CHECK (stage IN ('new', 'contacted', 'property_shown', 'negotiation', 'closed_won', 'closed_lost')),
    lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID NOT NULL REFERENCES public.profiles(user_id),
    next_follow_up DATE,
    converted_to_client BOOLEAN DEFAULT false,
    converted_client_id UUID,
    conversion_date TIMESTAMP WITH TIME ZONE
);

-- جدول أنشطة الليدات لتسجيل كل التفاعلات
CREATE TABLE public.lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'whatsapp', 'email', 'meeting', 'property_viewing', 'note')),
    title TEXT NOT NULL,
    description TEXT,
    activity_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    duration_minutes INTEGER,
    outcome TEXT CHECK (outcome IN ('positive', 'neutral', 'negative')),
    next_action TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول حفظ تفضيلات الليدات للعقارات
CREATE TABLE public.lead_property_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id),
    interest_level TEXT CHECK (interest_level IN ('high', 'medium', 'low')),
    feedback TEXT,
    viewing_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إضافة فهارس لتحسين الأداء
CREATE INDEX idx_leads_stage ON public.leads(stage);
CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX idx_leads_source ON public.leads(lead_source);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);
CREATE INDEX idx_leads_next_follow_up ON public.leads(next_follow_up);
CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX idx_lead_activities_date ON public.lead_activities(activity_date);

-- تمكين RLS للجداول
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_property_preferences ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان للجدول الرئيسي
CREATE POLICY "Admins can manage all leads" ON public.leads
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Accountants can view all leads" ON public.leads
FOR SELECT USING (has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Employees can view their assigned leads" ON public.leads
FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'accountant'::app_role) OR 
    assigned_to = auth.uid() OR 
    created_by = auth.uid()
);

CREATE POLICY "Employees can create leads" ON public.leads
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Employees can update their assigned leads" ON public.leads
FOR UPDATE USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    assigned_to = auth.uid() OR 
    created_by = auth.uid()
);

-- سياسات أنشطة الليدات
CREATE POLICY "Users can view lead activities for accessible leads" ON public.lead_activities
FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'accountant'::app_role) OR 
    EXISTS (
        SELECT 1 FROM public.leads 
        WHERE id = lead_activities.lead_id 
        AND (assigned_to = auth.uid() OR created_by = auth.uid())
    )
);

CREATE POLICY "Users can create activities for their leads" ON public.lead_activities
FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
        SELECT 1 FROM public.leads 
        WHERE id = lead_activities.lead_id 
        AND (assigned_to = auth.uid() OR created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
);

-- سياسات تفضيلات العقارات
CREATE POLICY "Users can manage property preferences for their leads" ON public.lead_property_preferences
FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    EXISTS (
        SELECT 1 FROM public.leads 
        WHERE id = lead_property_preferences.lead_id 
        AND (assigned_to = auth.uid() OR created_by = auth.uid())
    )
);

-- إنشاء تريجر لتحديث updated_at
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- دالة لحساب نقاط الليد (Lead Scoring)
CREATE OR REPLACE FUNCTION public.calculate_lead_score(lead_record public.leads)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    score INTEGER := 0;
BEGIN
    -- نقاط حسب الميزانية
    IF lead_record.budget_max >= 1000000 THEN
        score := score + 30;
    ELSIF lead_record.budget_max >= 500000 THEN
        score := score + 20;
    ELSIF lead_record.budget_max >= 200000 THEN
        score := score + 10;
    END IF;
    
    -- نقاط حسب نوع العقار
    IF lead_record.property_type IN ('villa', 'townhouse') THEN
        score := score + 20;
    ELSIF lead_record.property_type IN ('apartment') THEN
        score := score + 15;
    ELSIF lead_record.property_type IN ('commercial') THEN
        score := score + 25;
    END IF;
    
    -- نقاط حسب الغرض
    IF lead_record.purchase_purpose = 'investment' THEN
        score := score + 15;
    ELSIF lead_record.purchase_purpose = 'residence' THEN
        score := score + 10;
    END IF;
    
    -- نقاط حسب توفر البريد الإلكتروني
    IF lead_record.email IS NOT NULL THEN
        score := score + 5;
    END IF;
    
    -- نقاط حسب عدد الأنشطة (التفاعل)
    score := score + (
        SELECT COALESCE(COUNT(*) * 2, 0)::INTEGER 
        FROM public.lead_activities 
        WHERE lead_id = lead_record.id 
        LIMIT 10
    );
    
    RETURN LEAST(score, 100);
END;
$$;

-- تريجر لحساب نقاط الليد تلقائياً
CREATE OR REPLACE FUNCTION public.update_lead_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NEW.lead_score := public.calculate_lead_score(NEW);
    RETURN NEW;
END;
$$;

CREATE TRIGGER calculate_lead_score_trigger
    BEFORE INSERT OR UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_lead_score();

-- دالة لتحويل الليد إلى عميل
CREATE OR REPLACE FUNCTION public.convert_lead_to_client(lead_id_param UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    lead_record public.leads%ROWTYPE;
    new_client_id UUID;
    activity_id UUID;
BEGIN
    -- جلب بيانات الليد
    SELECT * INTO lead_record FROM public.leads WHERE id = lead_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'الليد غير موجود';
    END IF;
    
    -- التحقق من صلاحية المستخدم
    IF NOT (
        has_role(auth.uid(), 'admin'::app_role) OR 
        lead_record.assigned_to = auth.uid() OR 
        lead_record.created_by = auth.uid()
    ) THEN
        RAISE EXCEPTION 'ليس لديك صلاحية لتحويل هذا الليد';
    END IF;
    
    -- إنشاء عميل جديد
    INSERT INTO public.clients (
        name,
        phone,
        email,
        address,
        notes,
        preferences,
        created_by,
        assigned_to
    ) VALUES (
        lead_record.full_name,
        lead_record.phone,
        lead_record.email,
        lead_record.preferred_location,
        'تم التحويل من ليد: ' || COALESCE(lead_record.notes, ''),
        jsonb_build_object(
            'nationality', lead_record.nationality,
            'preferred_language', lead_record.preferred_language,
            'property_type', lead_record.property_type,
            'budget_min', lead_record.budget_min,
            'budget_max', lead_record.budget_max,
            'purchase_purpose', lead_record.purchase_purpose
        ),
        auth.uid(),
        lead_record.assigned_to
    ) RETURNING id INTO new_client_id;
    
    -- تحديث الليد
    UPDATE public.leads 
    SET 
        converted_to_client = true,
        converted_client_id = new_client_id,
        conversion_date = now(),
        stage = 'closed_won',
        updated_at = now()
    WHERE id = lead_id_param;
    
    -- تسجيل النشاط
    INSERT INTO public.lead_activities (
        lead_id,
        activity_type,
        title,
        description,
        outcome,
        created_by
    ) VALUES (
        lead_id_param,
        'note',
        'تحويل إلى عميل',
        'تم تحويل الليد بنجاح إلى عميل في النظام',
        'positive',
        auth.uid()
    );
    
    -- تسجيل النشاط في السجل العام
    activity_id := public.log_financial_activity(
        'lead_converted',
        'تم تحويل ليد إلى عميل: ' || lead_record.full_name,
        0,
        'leads',
        lead_id_param,
        'clients',
        new_client_id,
        auth.uid(),
        jsonb_build_object(
            'lead_name', lead_record.full_name,
            'client_id', new_client_id,
            'conversion_type', 'manual'
        )
    );
    
    RETURN new_client_id;
END;
$$;