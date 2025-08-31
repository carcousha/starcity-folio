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
  // حقول إضافية من قاعدة البيانات
  short_name?: string;
  language?: 'ar' | 'en';
  rating_1_5?: number;
  office_name?: string;
  office_classification?: 'platinum' | 'gold' | 'silver' | 'bronze';
  job_title?: string;
  cr_number?: string;
  cr_expiry_date?: string;
  units_count?: number;
  nationality?: string;
  id_type?: 'national_id' | 'iqama' | 'passport';
  id_number?: string;
  id_expiry_date?: string;
  bank_name?: string;
  account_number?: string;
  iban?: string;
  organization_id?: string;
  preferred_contact_method?: 'phone' | 'whatsapp' | 'email' | 'sms';
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