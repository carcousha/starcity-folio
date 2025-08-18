// Bulk Message Types
// أنواع الرسائل الجماعية

export interface BulkMessage {
  id: string;
  name: string;
  message_content: string;
  message_type: 'text' | 'media' | 'button' | 'poll';
  media_url?: string;
  media_type?: string;
  button_text?: string;
  button_url?: string;
  poll_options?: string[];
  template_id?: string;
  
  // إعدادات المستلمين
  recipient_type: 'all' | 'by_type' | 'by_company' | 'by_tags' | 'custom';
  recipient_filters?: RecipientFilters;
  custom_recipients?: string[];
  
  // إعدادات الإرسال
  send_type: 'immediate' | 'scheduled' | 'gradual';
  scheduled_at?: string;
  gradual_settings?: GradualSettings;
  
  // الحالة والتقدم
  status: 'draft' | 'queued' | 'sending' | 'completed' | 'paused' | 'cancelled';
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  success_rate: number;
  
  // التواريخ
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BulkMessageRecipient {
  id: string;
  bulk_message_id: string;
  contact_id?: string;
  phone_number: string;
  
  // حالة الإرسال
  status: 'pending' | 'sent' | 'failed' | 'retrying';
  sent_at?: string;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  
  // بيانات الرسالة الفعلية
  message_id?: string;
  personalized_content?: string;
  
  created_at: string;
  updated_at: string;
}

export interface RecipientFilters {
  contact_types?: string[];
  companies?: string[];
  tags?: string[];
  exclude_numbers?: string[];
  exclude_recent_contacts?: boolean;
  exclude_recent_days?: number;
}

export interface GradualSettings {
  batch_size: number;
  delay_minutes: number;
  max_concurrent_batches?: number;
}

export interface CreateBulkMessageForm {
  name: string;
  message_content: string;
  message_type: 'text' | 'media' | 'button' | 'poll';
  media_url?: string;
  media_type?: string;
  button_text?: string;
  button_url?: string;
  poll_options?: string[];
  template_id?: string;
  
  recipient_type: 'all' | 'by_type' | 'by_company' | 'by_tags' | 'custom';
  recipient_filters?: RecipientFilters;
  custom_recipients?: string[];
  
  send_type: 'immediate' | 'scheduled' | 'gradual';
  scheduled_at?: string;
  gradual_settings?: GradualSettings;
}

export interface BulkMessageStats {
  total_bulk_messages: number;
  active_bulk_messages: number;
  completed_bulk_messages: number;
  total_recipients: number;
  total_sent: number;
  total_failed: number;
  average_success_rate: number;
  today_sent: number;
  today_failed: number;
}

export interface BulkMessageFilter {
  search?: string;
  status?: 'all' | 'draft' | 'queued' | 'sending' | 'completed' | 'paused' | 'cancelled';
  recipient_type?: 'all' | 'by_type' | 'by_company' | 'by_tags' | 'custom';
  send_type?: 'all' | 'immediate' | 'scheduled' | 'gradual';
  date_from?: string;
  date_to?: string;
}

export interface BulkMessageProgress {
  bulk_message_id: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  pending_count: number;
  success_rate: number;
  estimated_completion?: string;
  current_batch?: number;
  total_batches?: number;
}

export interface RecipientSelection {
  type: 'all' | 'by_type' | 'by_company' | 'by_tags' | 'custom';
  filters?: RecipientFilters;
  custom_numbers?: string[];
  selected_contacts?: string[];
  count: number;
  preview?: Array<{
    id: string;
    name: string;
    phone: string;
    company?: string;
    contact_type: string;
  }>;
}

export interface BulkMessageTemplate {
  id: string;
  name: string;
  description?: string;
  recipient_type: 'all' | 'by_type' | 'by_company' | 'by_tags' | 'custom';
  recipient_filters?: RecipientFilters;
  message_content: string;
  message_type: 'text' | 'media' | 'button' | 'poll';
  media_url?: string;
  button_text?: string;
  button_url?: string;
  poll_options?: string[];
  created_at: string;
  updated_at: string;
}

export interface BulkMessageError {
  code: string;
  message: string;
  details?: any;
  recipient_id?: string;
  phone_number?: string;
}

export interface BulkMessageValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recipient_count: number;
  estimated_duration?: string;
  estimated_cost?: number;
}
