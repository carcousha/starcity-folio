// WhatsApp Module Types
// أنواع البيانات الخاصة بوحدة الواتساب

export interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  whatsapp_number?: string;
  contact_type: 'owner' | 'marketer' | 'client';
  email?: string;
  company?: string;
  notes?: string;
  tags: string[];
  is_active: boolean;
  last_contacted?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  content: string;
  template_type: 'text' | 'media' | 'button' | 'poll' | 'sticker' | 'product';
  category: 'real_estate_offer' | 'advertisement' | 'reminder' | 'other';
  media_url?: string;
  buttons: WhatsAppButton[];
  poll_options: string[];
  is_active: boolean;
  usage_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppButton {
  type: 'reply' | 'call' | 'url' | 'copy';
  displayText: string;
  phoneNumber?: string; // لنوع call
  url?: string; // لنوع url
  copyText?: string; // لنوع copy
}

export interface WhatsAppCampaign {
  id: string;
  name: string;
  description?: string;
  template_id: string;
  template?: WhatsAppTemplate;
  target_audience: CampaignTargetAudience;
  scheduled_at?: string;
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused' | 'cancelled';
  total_recipients: number;
  messages_sent: number;
  messages_delivered: number;
  messages_failed: number;
  started_at?: string;
  completed_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignTargetAudience {
  contact_types: ('owner' | 'marketer' | 'client')[];
  tags?: string[];
  companies?: string[];
  exclude_recent_contacts?: boolean; // استثناء من تم التواصل معهم مؤخراً
  exclude_recent_days?: number; // عدد الأيام للاستثناء
}

export interface WhatsAppMessage {
  id: string;
  campaign_id?: string;
  contact_id: string;
  template_id?: string;
  phone_number: string;
  message_type: 'text' | 'media' | 'button' | 'poll' | 'sticker' | 'product';
  content: string;
  media_url?: string;
  additional_data: Record<string, any>;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  api_response: Record<string, any>;
  error_message?: string;
  sent_at?: string;
  delivered_at?: string;
  created_by: string;
  created_at: string;
  contact?: WhatsAppContact;
  template?: WhatsAppTemplate;
}

export interface WhatsAppSettings {
  id: string;
  api_key: string;
  sender_number: string;
  default_footer: string;
  daily_limit: number;
  rate_limit_per_minute: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// API Request Types
export interface SendMessageRequest {
  api_key: string;
  sender: string;
  number: string;
  message: string;
  footer?: string;
  url?: string; // للوسائط
  media_type?: 'image' | 'video' | 'audio' | 'document';
  caption?: string;
  button?: WhatsAppButton[];
  name?: string; // للاستطلاعات
  option?: string[]; // للاستطلاعات
  countable?: '1' | '0'; // للاستطلاعات
}

export interface WhatsAppApiResponse {
  status: boolean;
  message: string;
  error?: string;
}

// Statistics Types
export interface WhatsAppStats {
  total_contacts: number;
  total_campaigns: number;
  total_messages_sent: number;
  messages_sent_today: number;
  success_rate: number;
  failed_rate: number;
  active_campaigns: number;
  contacts_by_type: {
    owners: number;
    marketers: number;
    clients: number;
  };
  messages_by_status: {
    sent: number;
    delivered: number;
    failed: number;
    pending: number;
  };
  recent_activity: WhatsAppMessage[];
}

// Form Types
export interface CreateContactForm {
  name: string;
  phone: string;
  whatsapp_number?: string;
  contact_type: 'owner' | 'marketer' | 'client';
  email?: string;
  company?: string;
  notes?: string;
  tags: string[];
}

export interface CreateTemplateForm {
  name: string;
  content: string;
  template_type: 'text' | 'media' | 'button' | 'poll' | 'sticker' | 'product';
  category: 'real_estate_offer' | 'advertisement' | 'reminder' | 'other';
  media_url?: string;
  buttons: WhatsAppButton[];
  poll_options: string[];
}

export interface CreateCampaignForm {
  name: string;
  description?: string;
  template_id: string;
  target_audience: CampaignTargetAudience;
  scheduled_at?: string;
}

export interface SendSingleMessageForm {
  contact_id?: string;
  phone_number?: string;
  template_id?: string;
  custom_message?: string;
  message_type: 'text' | 'media' | 'button' | 'poll' | 'sticker' | 'product';
  media_url?: string;
  buttons: WhatsAppButton[];
  poll_options: string[];
}

// Filter and Search Types
export interface ContactsFilter {
  search?: string;
  contact_type?: 'owner' | 'marketer' | 'client' | 'all';
  is_active?: boolean;
  company?: string;
  tags?: string[];
}

export interface CampaignsFilter {
  search?: string;
  status?: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused' | 'cancelled' | 'all';
  category?: 'real_estate_offer' | 'advertisement' | 'reminder' | 'other' | 'all';
  date_from?: string;
  date_to?: string;
}

export interface MessagesFilter {
  search?: string;
  status?: 'pending' | 'sent' | 'delivered' | 'failed' | 'all';
  contact_type?: 'owner' | 'marketer' | 'client' | 'all';
  campaign_id?: string;
  date_from?: string;
  date_to?: string;
}

// Bulk Operations Types
export interface BulkOperation {
  type: 'send_message' | 'add_tag' | 'remove_tag' | 'deactivate' | 'activate';
  contact_ids: string[];
  data?: any; // حسب نوع العملية
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Export utility types
export type ContactType = WhatsAppContact['contact_type'];
export type MessageType = WhatsAppMessage['message_type'];
export type CampaignStatus = WhatsAppCampaign['status'];
export type MessageStatus = WhatsAppMessage['status'];
export type TemplateCategory = WhatsAppTemplate['category'];
