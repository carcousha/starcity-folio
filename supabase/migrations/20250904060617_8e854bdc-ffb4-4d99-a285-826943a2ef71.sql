-- إنشاء جداول الواتساب والمحاسبة الأساسية
-- المرحلة الثانية: جداول الواتساب والمحاسبة

-- 1. جداول الواتساب
CREATE TABLE IF NOT EXISTS whatsapp_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    api_key TEXT,
    phone_number TEXT,
    default_footer TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    type TEXT DEFAULT 'client',
    company TEXT,
    email TEXT,
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    variables TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    template_id UUID,
    status TEXT DEFAULT 'draft',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID,
    contact_id UUID,
    phone_number TEXT NOT NULL,
    message_content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    status TEXT DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    sent_by UUID NOT NULL DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_bulk_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    message_content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    media_url TEXT,
    media_type TEXT,
    recipient_type TEXT DEFAULT 'all',
    recipient_filters JSONB DEFAULT '{}',
    custom_recipients TEXT[] DEFAULT '{}',
    send_type TEXT DEFAULT 'immediate',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'draft',
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    created_by UUID NOT NULL DEFAULT auth.uid(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. جداول المحاسبة الأساسية
CREATE TABLE IF NOT EXISTS commissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL,
    property_id UUID,
    client_id UUID,
    deal_id UUID,
    
    -- Commission Details
    commission_type TEXT NOT NULL, -- sale, rental, referral
    amount DECIMAL(15,2) NOT NULL,
    percentage DECIMAL(5,2),
    base_amount DECIMAL(15,2),
    
    -- Status
    status TEXT DEFAULT 'pending', -- pending, approved, paid, cancelled
    payment_status TEXT DEFAULT 'unpaid', -- unpaid, partial, paid
    
    -- Dates
    earned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    paid_date TIMESTAMP WITH TIME ZONE,
    
    -- Notes
    description TEXT,
    notes TEXT,
    
    -- Audit
    created_by UUID NOT NULL DEFAULT auth.uid(),
    updated_by UUID DEFAULT auth.uid(),
    approved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Basic Info
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- office, marketing, utilities, travel, etc
    subcategory TEXT,
    
    -- Amount
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'AED',
    
    -- Date
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Status
    status TEXT DEFAULT 'pending', -- pending, approved, rejected, paid
    
    -- Payment Info
    payment_method TEXT, -- cash, card, bank_transfer, cheque
    reference_number TEXT,
    vendor_name TEXT,
    
    -- Attachments
    receipt_url TEXT,
    attachments TEXT[] DEFAULT '{}',
    
    -- Employee/Requestor
    employee_id UUID,
    department TEXT,
    
    -- Approval
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Notes
    notes TEXT,
    
    -- Audit
    created_by UUID NOT NULL DEFAULT auth.uid(),
    updated_by UUID DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS revenues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Basic Info
    title TEXT NOT NULL,
    description TEXT,
    source TEXT NOT NULL, -- property_sale, rental, commission, service_fee
    subcategory TEXT,
    
    -- Amount
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'AED',
    
    -- Related Records
    property_id UUID,
    client_id UUID,
    contract_id UUID,
    
    -- Date
    revenue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Status
    status TEXT DEFAULT 'confirmed', -- pending, confirmed, cancelled
    
    -- Payment Info
    payment_method TEXT, -- cash, card, bank_transfer, cheque
    reference_number TEXT,
    
    -- Notes
    notes TEXT,
    
    -- Audit
    created_by UUID NOT NULL DEFAULT auth.uid(),
    updated_by UUID DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS debts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Debtor Info
    debtor_type TEXT NOT NULL, -- employee, supplier, client, company
    debtor_id UUID, -- Reference to profiles, suppliers, clients, etc
    debtor_name TEXT NOT NULL,
    
    -- Debt Details
    debt_type TEXT NOT NULL, -- commission, expense, loan, advance
    original_amount DECIMAL(15,2) NOT NULL,
    remaining_amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'AED',
    
    -- Status
    status TEXT DEFAULT 'active', -- active, paid, overdue, cancelled
    
    -- Dates
    debt_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    
    -- Related Records
    source_table TEXT, -- commissions, expenses, etc
    source_id UUID,
    
    -- Description
    description TEXT,
    notes TEXT,
    
    -- Audit
    created_by UUID NOT NULL DEFAULT auth.uid(),
    updated_by UUID DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Vehicle Info
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER,
    color TEXT,
    plate_number TEXT,
    vin_number TEXT,
    
    -- Registration
    registration_number TEXT,
    registration_expiry DATE,
    
    -- Insurance
    insurance_company TEXT,
    insurance_policy_number TEXT,
    insurance_expiry DATE,
    
    -- Status
    status TEXT DEFAULT 'active', -- active, maintenance, inactive
    
    -- Assignment
    assigned_to UUID, -- Employee ID
    assigned_date DATE,
    
    -- Purchase Info
    purchase_date DATE,
    purchase_price DECIMAL(15,2),
    current_value DECIMAL(15,2),
    
    -- Notes
    notes TEXT,
    
    -- Audit
    created_by UUID NOT NULL DEFAULT auth.uid(),
    updated_by UUID DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إضافة الفهارس
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_phone ON whatsapp_contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_type ON whatsapp_contacts(type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone ON whatsapp_messages(phone_number);

CREATE INDEX IF NOT EXISTS idx_commissions_employee ON commissions(employee_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_earned_date ON commissions(earned_date);

CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_employee ON expenses(employee_id);

CREATE INDEX IF NOT EXISTS idx_revenues_source ON revenues(source);
CREATE INDEX IF NOT EXISTS idx_revenues_revenue_date ON revenues(revenue_date);
CREATE INDEX IF NOT EXISTS idx_revenues_status ON revenues(status);

CREATE INDEX IF NOT EXISTS idx_debts_debtor_type ON debts(debtor_type);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_due_date ON debts(due_date);

CREATE INDEX IF NOT EXISTS idx_vehicles_assigned_to ON vehicles(assigned_to);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

-- تفعيل RLS لجميع الجداول
ALTER TABLE whatsapp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_bulk_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;