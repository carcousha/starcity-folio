// WhatsApp Types - Enhanced with Deduplication Support
// أنواع WhatsApp - محسّنة مع دعم إزالة التكرار

export interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  whatsapp_number?: string;
  contact_type: 'client' | 'marketer' | 'owner' | 'supplier' | 'other';
  email?: string;
  company?: string;
  notes?: string;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_contact_date?: string;
  total_messages?: number;
  status: 'active' | 'inactive' | 'blocked';
  priority: 'high' | 'medium' | 'low';
  source?: string; // مصدر جهة الاتصال
  external_id?: string; // معرف خارجي للربط
}

export interface CreateContactForm {
  name: string;
  phone: string;
  whatsapp_number?: string;
  contact_type: 'client' | 'marketer' | 'owner' | 'supplier' | 'other';
  email?: string;
  company?: string;
  notes?: string;
  tags: string[];
  source?: string;
  external_id?: string;
}

export interface UpdateContactForm extends Partial<CreateContactForm> {
  id: string;
}

export interface ContactsFilter {
  search?: string;
  contact_type?: string;
  tags?: string[];
  is_active?: boolean;
  source?: string;
  priority?: string;
  created_after?: string;
  created_before?: string;
}

export interface ContactGroup {
  id: string;
  name: string;
  description?: string;
  contacts: WhatsAppContact[];
  created_at: string;
  updated_at: string;
}

export interface ContactTag {
  id: string;
  name: string;
  color: string;
  description?: string;
  usage_count: number;
  created_at: string;
}

// أنواع إزالة التكرار
export interface DuplicateContact {
  id: string;
  phone: string;
  name: string;
  email?: string;
  source_tables: string[];
  data: ContactSourceData[];
  similarity_score: number;
  merge_priority: 'high' | 'medium' | 'low';
  last_activity?: string;
  total_records: number;
}

export interface ContactSourceData {
  source: string;
  source_id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  additional_data?: Record<string, any>;
}

export interface DeduplicationResult {
  total_duplicates: number;
  cleaned_contacts: number;
  merged_contacts: number;
  errors: string[];
  warnings: string[];
  processing_time: number;
  summary: {
    brokers: number;
    clients: number;
    owners: number;
    tenants: number;
    whatsapp: number;
    total_saved_space: number;
  };
  detailed_results: {
    successful_merges: Array<{
      contact_name: string;
      phone: string;
      merged_sources: string[];
      master_contact_id: string;
    }>;
    failed_merges: Array<{
      contact_name: string;
      phone: string;
      error: string;
      sources: string[];
    }>;
  };
}

export interface DeduplicationOptions {
  auto_merge: boolean;
  similarity_threshold: number;
  preserve_data: boolean;
  dry_run: boolean;
  batch_size: number;
}

// أنواع الرسائل
export interface WhatsAppMessage {
  id: string;
  contact_id: string;
  message_type: 'text' | 'media' | 'sticker' | 'document' | 'location';
  content: string;
  media_url?: string;
  media_type?: string;
  file_size?: number;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  direction: 'inbound' | 'outbound';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  language: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// أنواع الحملات
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  message_template_id: string;
  target_contacts: string[];
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
  schedule_time?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  total_contacts: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
}

export interface CampaignSettings {
  message_interval: number; // بالثواني
  batch_size: number;
  pause_after_batch: boolean;
  pause_duration: number; // بالثواني
  do_not_disturb_start: string; // وقت بداية عدم الإزعاج
  do_not_disturb_end: string; // وقت نهاية عدم الإزعاج
  daily_message_cap: number;
  error_simulation: boolean;
  auto_reschedule_failed: boolean;
  retry_attempts: number;
  retry_delay: number; // بالثواني
}

// أنواع التقارير
export interface ContactReport {
  total_contacts: number;
  active_contacts: number;
  inactive_contacts: number;
  contacts_by_type: Record<string, number>;
  contacts_by_source: Record<string, number>;
  contacts_by_priority: Record<string, number>;
  recent_contacts: number;
  duplicate_contacts: number;
  potential_savings: number;
}

export interface MessageReport {
  total_messages: number;
  sent_messages: number;
  delivered_messages: number;
  read_messages: number;
  failed_messages: number;
  messages_by_type: Record<string, number>;
  messages_by_status: Record<string, number>;
  average_delivery_time: number;
  success_rate: number;
}

export interface CampaignReport {
  campaign_id: string;
  campaign_name: string;
  start_time: string;
  end_time?: string;
  duration: number; // بالثواني
  total_contacts: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  success_rate: number;
  average_delivery_time: number;
  cost_analysis?: {
    total_cost: number;
    cost_per_message: number;
    cost_per_delivery: number;
  };
  performance_metrics: {
    delivery_rate: number;
    read_rate: number;
    engagement_rate: number;
    bounce_rate: number;
  };
}

// أنواع الإعدادات
export interface WhatsAppSettings {
  api_endpoint: string;
  api_key: string;
  webhook_url?: string;
  default_language: string;
  timezone: string;
  business_hours: {
    start: string;
    end: string;
    days: string[];
  };
  auto_replies: {
    enabled: boolean;
    message: string;
    schedule: {
      start: string;
      end: string;
    };
  };
  rate_limiting: {
    messages_per_minute: number;
    messages_per_hour: number;
    messages_per_day: number;
  };
  deduplication: {
    enabled: boolean;
    similarity_threshold: number;
    auto_merge: boolean;
    preserve_data: boolean;
    batch_size: number;
  };
}

// أنواع الأحداث
export interface WhatsAppEvent {
  id: string;
  event_type: 'message_received' | 'message_delivered' | 'message_read' | 'contact_updated' | 'duplicate_found';
  contact_id: string;
  data: Record<string, any>;
  timestamp: string;
  processed: boolean;
}

// أنواع المزامنة
export interface SyncStatus {
  id: string;
  entity_type: 'broker' | 'client' | 'owner' | 'tenant';
  entity_id: string;
  whatsapp_contact_id?: string;
  sync_status: 'pending' | 'synced' | 'failed' | 'conflict';
  last_sync: string;
  sync_attempts: number;
  error_message?: string;
  metadata?: Record<string, any>;
}

// أنواع النسخ الاحتياطي
export interface BackupInfo {
  id: string;
  backup_type: 'full' | 'incremental' | 'contacts_only';
  file_path: string;
  file_size: number;
  created_at: string;
  status: 'completed' | 'failed' | 'in_progress';
  records_count: number;
  compression_ratio: number;
  checksum: string;
}

// أنواع المراقبة
export interface SystemHealth {
  database_connections: number;
  active_campaigns: number;
  pending_messages: number;
  failed_operations: number;
  system_load: number;
  memory_usage: number;
  disk_usage: number;
  last_check: string;
  status: 'healthy' | 'warning' | 'critical';
}

// أنواع التحديثات
export interface SystemUpdate {
  id: string;
  version: string;
  description: string;
  release_date: string;
  changelog: string[];
  breaking_changes: string[];
  migration_required: boolean;
  migration_script?: string;
  rollback_available: boolean;
  status: 'available' | 'downloading' | 'installing' | 'completed' | 'failed';
}
