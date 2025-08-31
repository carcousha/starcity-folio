export interface EnhancedContact {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  office?: string;
  bio?: string;
  roles: string[];
  status: 'active' | 'inactive' | 'archived';
  follow_up_status: 'new' | 'contacted' | 'interested' | 'negotiating' | 'closed' | 'lost' | 'inactive';
  rating?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  last_contact_date?: string;
  next_contact_date?: string;
  birthday?: string;
  created_by?: string;
  assigned_to?: string;
  is_duplicate: boolean;
  master_contact_id?: string;
  notes?: string;
  metadata: any;
  tags: string[];
  created_at: string;
  updated_at: string;
  
  // الحقول الأساسية المحدثة
  short_name?: string;
  language?: 'ar' | 'en';
  rating_1_5?: number;
  office_name?: string;
  office_location?: string;
  office_classification?: 'platinum' | 'gold' | 'silver' | 'bronze';
  
  // معلومات الاتصال الإضافية
  email?: string;
  preferred_contact_method?: 'phone' | 'whatsapp' | 'email' | 'sms';
  
  // المعلومات الشخصية والهوية
  nationality?: string;
  emirates_id?: string;
  passport_number?: string;
  id_number?: string;
  residence_status?: 'citizen' | 'resident' | 'visitor' | 'investor';
  owner_type?: 'individual' | 'company' | 'government' | 'investment_fund';
  address?: string;
  
  // المعلومات المهنية
  employer_name?: string;
  job_title?: string;
  monthly_salary?: number;
  license_number?: string;
  license_expiry_date?: string;
  cr_number?: string;
  cr_expiry_date?: string;
  visa_status?: 'valid' | 'expired' | 'pending' | 'cancelled';
  
  // معلومات العقارات والاستثمار
  property_type_interest?: string;
  purchase_purpose?: 'investment' | 'personal_use' | 'resale' | 'rental';
  budget_min?: number;
  budget_max?: number;
  preferred_location?: string;
  planned_purchase_date?: string;
  preferred_payment_method?: 'cash' | 'mortgage' | 'installments' | 'bank_transfer';
  area_min?: number;
  area_max?: number;
  units_count?: number;
  property_value?: number;
  
  // المعلومات المالية والمصرفية
  bank_name?: string;
  account_number?: string;
  iban?: string;
  
  // الحالات والمصادر
  client_status?: 'lead' | 'prospect' | 'active' | 'closed' | 'inactive';
  source?: 'website' | 'social_media' | 'referral' | 'advertisement' | 'walk_in' | 'phone_call' | 'email' | 'exhibition' | 'other';
  
  // الإحصائيات والأرقام
  deals_count?: number;
  total_sales?: number;
  previous_deals_count?: number;
  
  // التواريخ المهمة
  last_contacted?: string;
  next_follow_up?: string;
  birth_date?: string;
  
  // جهة اتصال الطوارئ
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  
  // الملاحظات والتفضيلات
  internal_notes?: string;
  preferences?: string;
  
  // معلومات النظام
  organization_id?: string;
  id_type?: 'national_id' | 'iqama' | 'passport';
  id_expiry_date?: string;
}

export interface ContactChannel {
  id: string;
  contact_id: string;
  channel_type: 'phone' | 'whatsapp' | 'email' | 'website' | 'social' | 'other';
  value: string;
  is_primary: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactActivity {
  id: string;
  contact_id: string;
  activity_type: 'call' | 'meeting' | 'email' | 'whatsapp' | 'note' | 'task' | 'deal' | 'other';
  title: string;
  description?: string;
  activity_date: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_by?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}