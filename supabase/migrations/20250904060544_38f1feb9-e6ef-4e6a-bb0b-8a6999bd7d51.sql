-- إنشاء الجداول الأساسية المفقودة مع تجنب الأخطاء السابقة
-- المرحلة الأولى: جداول CRM الأساسية

-- 1. جدول enhanced_contacts (الأهم لحل مشكلة المزامنة)
CREATE TABLE IF NOT EXISTS enhanced_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT,
    short_name TEXT,
    phone TEXT,
    email TEXT,
    company TEXT,
    position TEXT,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'UAE',
    nationality TEXT,
    source TEXT,
    status TEXT DEFAULT 'active',
    priority TEXT DEFAULT 'medium',
    language TEXT DEFAULT 'ar',
    rating INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    roles TEXT[] DEFAULT '{}',
    
    -- Property Interest Fields
    property_type_interest TEXT,
    area_min DECIMAL(10,2),
    area_max DECIMAL(10,2),
    budget_min DECIMAL(15,2),
    budget_max DECIMAL(15,2),
    preferred_location TEXT,
    
    -- Contact Details
    phone_primary TEXT,
    phone_secondary TEXT,
    whatsapp_number TEXT,
    emergency_contact TEXT,
    emergency_phone TEXT,
    
    -- Business Fields
    lead_source TEXT,
    client_stage TEXT DEFAULT 'prospect',
    last_interaction_date TIMESTAMP WITH TIME ZONE,
    next_follow_up_date TIMESTAMP WITH TIME ZONE,
    follow_up_status TEXT DEFAULT 'pending',
    
    -- Statistics
    deals_count INTEGER DEFAULT 0,
    total_deal_value DECIMAL(15,2) DEFAULT 0,
    last_deal_date TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    custom_fields JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    search_vector tsvector,
    
    -- Sync fields
    original_table TEXT,
    original_id UUID,
    is_being_deleted BOOLEAN DEFAULT false,
    
    -- Audit fields
    created_by UUID NOT NULL DEFAULT auth.uid(),
    updated_by UUID DEFAULT auth.uid(),
    assigned_to UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إضافة فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_full_name ON enhanced_contacts(full_name);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_phone ON enhanced_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_email ON enhanced_contacts(email);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_company ON enhanced_contacts(company);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_status ON enhanced_contacts(status);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_original_table ON enhanced_contacts(original_table);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_created_by ON enhanced_contacts(created_by);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_assigned_to ON enhanced_contacts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_priority ON enhanced_contacts(priority);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_language ON enhanced_contacts(language);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_created_at ON enhanced_contacts(created_at);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_tags ON enhanced_contacts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_roles ON enhanced_contacts USING GIN(roles);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_search ON enhanced_contacts USING GIN(search_vector);

-- تفعيل RLS
ALTER TABLE enhanced_contacts ENABLE ROW LEVEL SECURITY;

-- 2. جدول enhanced_contact_channels (قنوات التواصل)
CREATE TABLE IF NOT EXISTS enhanced_contact_channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID NOT NULL,
    channel_type TEXT NOT NULL, -- phone, email, whatsapp, social
    channel_value TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enhanced_contact_channels_contact_id ON enhanced_contact_channels(contact_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_contact_channels_type ON enhanced_contact_channels(channel_type);
CREATE INDEX IF NOT EXISTS idx_enhanced_contact_channels_primary ON enhanced_contact_channels(is_primary);

ALTER TABLE enhanced_contact_channels ENABLE ROW LEVEL SECURITY;

-- 3. جدول clients (العملاء)
CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    company TEXT,
    address TEXT,
    city TEXT,
    nationality TEXT,
    id_number TEXT,
    passport_number TEXT,
    
    -- Client Details
    client_type TEXT DEFAULT 'individual', -- individual, company
    status TEXT DEFAULT 'active',
    priority TEXT DEFAULT 'medium',
    source TEXT,
    preferred_language TEXT DEFAULT 'ar',
    
    -- Property Preferences
    property_interest TEXT,
    budget_min DECIMAL(15,2),
    budget_max DECIMAL(15,2),
    preferred_areas TEXT[],
    
    -- Notes and Tags
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Audit fields
    created_by UUID NOT NULL DEFAULT auth.uid(),
    updated_by UUID DEFAULT auth.uid(),
    assigned_to UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_full_name ON clients(full_name);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON clients(assigned_to);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- 4. جدول properties (العقارات)
CREATE TABLE IF NOT EXISTS properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    property_type TEXT NOT NULL, -- villa, apartment, office, land, commercial
    
    -- Location
    address TEXT,
    city TEXT,
    area TEXT,
    building_name TEXT,
    floor_number INTEGER,
    unit_number TEXT,
    
    -- Details
    bedrooms INTEGER,
    bathrooms INTEGER,
    area_sqft DECIMAL(10,2),
    area_sqm DECIMAL(10,2),
    
    -- Pricing
    price DECIMAL(15,2),
    price_per_sqft DECIMAL(10,2),
    price_negotiable BOOLEAN DEFAULT true,
    
    -- Status
    status TEXT DEFAULT 'available', -- available, sold, rented, off_market
    listing_type TEXT, -- sale, rent, both
    
    -- Features
    features TEXT[],
    amenities TEXT[],
    
    -- Media
    images TEXT[],
    documents TEXT[],
    virtual_tour_url TEXT,
    
    -- Ownership
    owner_id UUID,
    
    -- Notes
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Audit fields
    created_by UUID NOT NULL DEFAULT auth.uid(),
    updated_by UUID DEFAULT auth.uid(),
    assigned_to UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_title ON properties(title);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_created_by ON properties(created_by);
CREATE INDEX IF NOT EXISTS idx_properties_assigned_to ON properties(assigned_to);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- 5. جدول leads (العملاء المحتملون)
CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    company TEXT,
    
    -- Lead Details
    source TEXT, -- website, referral, social_media, cold_call
    status TEXT DEFAULT 'new', -- new, contacted, qualified, converted, lost
    stage TEXT DEFAULT 'prospect', -- prospect, interested, negotiating, closed
    
    -- Interest
    property_interest TEXT,
    budget_range TEXT,
    timeline TEXT,
    specific_requirements TEXT,
    
    -- Interaction
    last_contact_date TIMESTAMP WITH TIME ZONE,
    next_follow_up TIMESTAMP WITH TIME ZONE,
    interaction_count INTEGER DEFAULT 0,
    
    -- Conversion
    converted_to_client_id UUID,
    conversion_date TIMESTAMP WITH TIME ZONE,
    
    -- Notes
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Audit fields
    created_by UUID NOT NULL DEFAULT auth.uid(),
    updated_by UUID DEFAULT auth.uid(),
    assigned_to UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_full_name ON leads(full_name);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(created_by);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 6. جدول property_owners (ملاك العقارات)
CREATE TABLE IF NOT EXISTS property_owners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    company TEXT,
    address TEXT,
    city TEXT,
    nationality TEXT,
    id_number TEXT,
    passport_number TEXT,
    
    -- Owner Details
    owner_type TEXT DEFAULT 'individual', -- individual, company, government
    status TEXT DEFAULT 'active',
    preferred_language TEXT DEFAULT 'ar',
    
    -- Contact Preferences
    preferred_contact_method TEXT DEFAULT 'phone',
    best_time_to_call TEXT,
    
    -- Properties Count
    properties_count INTEGER DEFAULT 0,
    
    -- Notes
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Audit fields
    created_by UUID NOT NULL DEFAULT auth.uid(),
    updated_by UUID DEFAULT auth.uid(),
    assigned_to UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_owners_full_name ON property_owners(full_name);
CREATE INDEX IF NOT EXISTS idx_property_owners_phone ON property_owners(phone);
CREATE INDEX IF NOT EXISTS idx_property_owners_email ON property_owners(email);
CREATE INDEX IF NOT EXISTS idx_property_owners_status ON property_owners(status);
CREATE INDEX IF NOT EXISTS idx_property_owners_created_by ON property_owners(created_by);

ALTER TABLE property_owners ENABLE ROW LEVEL SECURITY;