// أنواع نظام جهات الاتصال المطور
export type ContactCategory = 
  | 'مسوق بيشتري'
  | 'مسوق بيسوق' 
  | 'مالك بيع'
  | 'مالك ايجار'
  | 'عميل ارض'
  | 'عميل فيلا'
  | 'مؤجر';

export interface EnhancedContact {
  id: string;
  name: string;
  phone: string;
  whatsapp_number?: string;
  category: ContactCategory;
  rating: number; // 1-5
  office_name?: string; // للمسوقين فقط
  about?: string; // معلومات عن الشخص
  email?: string;
  address?: string;
  notes?: string;
  is_active: boolean;
  created_by?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  last_contact_date?: string;
  interaction_count?: number;
}

export interface ContactInteraction {
  id: string;
  contact_id: string;
  interaction_type: 'call' | 'whatsapp' | 'meeting' | 'email' | 'other';
  interaction_date: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface ContactFormData {
  name: string;
  phone: string;
  whatsapp_number?: string;
  category: ContactCategory;
  rating: number;
  office_name?: string;
  about?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface ContactFilters {
  search?: string;
  category?: ContactCategory;
  minRating?: number;
  maxRating?: number;
  officeFilter?: string;
}

export const CONTACT_CATEGORIES: { value: ContactCategory; label: string; description: string }[] = [
  { value: 'مسوق بيشتري', label: 'مسوق بيشتري', description: 'مسوق يبحث عن عقارات للشراء' },
  { value: 'مسوق بيسوق', label: 'مسوق بيسوق', description: 'مسوق يروج للعقارات' },
  { value: 'مالك بيع', label: 'مالك بيع', description: 'مالك يريد بيع عقاره' },
  { value: 'مالك ايجار', label: 'مالك ايجار', description: 'مالك يريد تأجير عقاره' },
  { value: 'عميل ارض', label: 'عميل ارض', description: 'عميل مهتم بشراء أرض' },
  { value: 'عميل فيلا', label: 'عميل فيلا', description: 'عميل مهتم بشراء فيلا' },
  { value: 'مؤجر', label: 'مؤجر', description: 'شخص يبحث عن عقار للإيجار' }
];

export const INTERACTION_TYPES = [
  { value: 'call', label: 'مكالمة هاتفية', icon: '📞' },
  { value: 'whatsapp', label: 'واتساب', icon: '💬' },
  { value: 'meeting', label: 'اجتماع', icon: '🤝' },
  { value: 'email', label: 'بريد إلكتروني', icon: '📧' },
  { value: 'other', label: 'أخرى', icon: '📝' }
];

export const RATING_LABELS = [
  { value: 1, label: 'ضعيف جداً', color: 'red' },
  { value: 2, label: 'ضعيف', color: 'orange' },
  { value: 3, label: 'متوسط', color: 'yellow' },
  { value: 4, label: 'جيد', color: 'blue' },
  { value: 5, label: 'ممتاز', color: 'green' }
];