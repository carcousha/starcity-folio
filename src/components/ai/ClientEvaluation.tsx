import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useQuery } from '@tanstack/react-query';
import { getTemplates, TemplateDTO, WhatsAppStage, Lang } from '../../services/templateService';
import { 
  Users, 
  RefreshCw, 
  Star, 
  Clock, 
  Eye, 
  MessageSquare, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Plus,
  Bell,
  BarChart3,
  PieChart,
  Phone,
  Mail,
  Calendar,
  Send,
  User,
  AlertTriangle,
  Home,
  DollarSign,
  Ruler,
  MapPin,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// أنواع البيانات
interface ClientEvaluation {
  id: string;
  full_name: string;
  phone: string;
  location: string;
  communication_frequency: number;
  timing_urgency: number;
  budget_clarity: number;
  response_rate: number;
  preview_activity: number;
  overall_score: number;
  status: 'needs_followup' | 'active' | 'hot_lead' | 'cold_lead';
  last_contact_date: string;
  recommendations: string[];
  notes?: string;
  priority: 'low' | 'medium' | 'high';
  assigned_to?: string;
}

// نوع البيانات للإجراءات المتاحة
interface ActionOption {
  id: string;
  type: 'call' | 'whatsapp' | 'email' | 'schedule_meeting' | 'send_properties' | 'update_status' | 'add_reminder';
  label: string;
  description: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
}

// دالة تحويل مراحل WhatsApp إلى فئات تقييم العملاء
const getStageForClientStatus = (status: ClientEvaluation['status']): WhatsAppStage => {
  switch (status) {
    case 'hot_lead':
      return 'Negotiation'; // العميل الساخن في مرحلة التفاوض
    case 'active':
      return 'Lead'; // العميل النشط في مرحلة البداية
    case 'needs_followup':
      return 'Lead'; // يحتاج متابعة في مرحلة البداية
    case 'cold_lead':
      return 'Lead'; // العميل البارد في مرحلة البداية
    default:
      return 'Lead';
  }
};

// دالة تحويل القوالب من TemplateDTO إلى التنسيق المحلي
const convertTemplateToLocal = (template: TemplateDTO, successRate: number = 75): WhatsAppTemplate => {
  return {
    id: template.id || '',
    name: template.name,
    category: mapStageToCategory(template.stage),
    body: template.body,
    variables: template.variables || [],
    usage_count: 0, // يمكن إضافة هذا من الإحصائيات لاحقاً
    success_rate: successRate
  };
};

// دالة ربط مراحل WhatsApp بفئات تقييم العملاء
const mapStageToCategory = (stage: WhatsAppStage): 'initial_contact' | 'follow_up' | 'property_sharing' | 'appointment' | 'general' => {
  switch (stage) {
    case 'Lead':
      return 'initial_contact';
    case 'Negotiation':
      return 'follow_up';
    case 'Closing':
      return 'appointment';
    case 'PostSale':
      return 'general';
    default:
      return 'general';
  }
};

// نوع البيانات لقوالب WhatsApp (محلي)
interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'initial_contact' | 'follow_up' | 'property_sharing' | 'appointment' | 'general';
  body: string;
  variables: string[];
  usage_count: number;
  success_rate: number;
}

// نوع البيانات لسجل المحادثات
interface ConversationLog {
  id: string;
  client_id: string;
  message_sent: string;
  sent_at: string;
  response_received?: string;
  response_at?: string;
  employee_notes?: string;
  status: 'sent' | 'delivered' | 'read' | 'replied' | 'no_response';
}

// نوع البيانات للعقارات المقترحة
interface PropertyRecommendation {
  property: Property;
  match_score: number;
  match_reasons: string[];
  predicted_interest: number;
}

// نوع البيانات للعقارات
interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  property_type: 'villa' | 'apartment' | 'land' | 'office' | 'warehouse' | 'shop' | 'building';
  area_name: string;
  city: string;
  district: string;
  features: string[];
  images: string[];
  status: 'available' | 'sold' | 'rented' | 'under_contract';
  owner_id: string;
  listed_date: string;
  last_updated: string;
  views_count: number;
  inquiries_count: number;
  ai_score?: number;
}

// نوع بيانات عميل CRM (من جدول clients)
type CrmClient = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  nationality?: string;
  preferred_language?: string;
  preferred_contact_method?: string;
  property_type_interest?: string;
  purchase_purpose?: string;
  budget_min?: number;
  budget_max?: number;
  preferred_location?: string;
  planned_purchase_date?: string;
  client_status?: 'new' | 'contacted' | 'negotiating' | 'deal_closed' | 'deal_lost';
  source?: string;
  last_contacted?: string;
  previous_deals_count?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
};

const mapStatusToEvaluation = (status?: CrmClient['client_status']): ClientEvaluation['status'] => {
  switch (status) {
    case 'negotiating':
      return 'hot_lead';
    case 'contacted':
    case 'deal_closed':
      return 'active';
    case 'deal_lost':
      return 'cold_lead';
    case 'new':
    default:
      return 'needs_followup';
  }
};

const calcUrgency = (planned?: string): number => {
  if (!planned) return 50;
  const now = new Date();
  const date = new Date(planned);
  const diffDays = Math.max(0, Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  if (diffDays <= 30) return 90;
  if (diffDays <= 90) return 70;
  if (diffDays <= 180) return 60;
  return 40;
};

const calcBudgetClarity = (min?: number, max?: number): number => {
  if (typeof min === 'number' && typeof max === 'number' && max > 0 && max >= min) {
    const range = max - min;
    const ratio = range / Math.max(1, max);
    return Math.round(Math.max(30, Math.min(100, 100 - ratio * 100)));
  }
  return 50;
};

const calcOverallScore = (
  communication: number,
  urgency: number,
  budget: number,
  response: number,
  preview: number
): number => {
  const avg = (communication + urgency + budget + response + preview) / 5;
  return Math.min(5, Math.max(1, Math.round((avg / 100) * 5)));
};

const buildRecommendations = (ev: ClientEvaluation): string[] => {
  const list: string[] = [];
  if (ev.status === 'needs_followup') list.push('زيادة وتيرة التواصل مع العميل');
  if (ev.timing_urgency >= 80) list.push('حجز موعد معاينة قريب');
  if (ev.budget_clarity < 60) list.push('تأكيد نطاق الميزانية وتوضيح المتطلبات');
  if (ev.response_rate < 40) list.push('استخدام قناة تواصل بديلة (واتساب/اتصال)');
  if (ev.preview_activity < 40) list.push('إرسال أمثلة عقارات أقرب لاهتمام العميل');
  if (list.length === 0) list.push('متابعة دورية وتقديم عروض مناسبة');
  return list;
};

const mapCrmClientToEvaluation = (c: CrmClient): ClientEvaluation => {
  const communication_frequency = c.previous_deals_count ? Math.min(100, c.previous_deals_count * 10) : 50;
  const timing_urgency = calcUrgency(c.planned_purchase_date);
  const budget_clarity = calcBudgetClarity(c.budget_min, c.budget_max);
  const response_rate = 50; // يمكن لاحقاً ربطه بإحصائيات حقيقية
  const preview_activity = 50; // يمكن لاحقاً ربطه بتتبّع فتح الروابط/المعاينات
  const status = mapStatusToEvaluation(c.client_status);
  const overall_score = calcOverallScore(
    communication_frequency,
    timing_urgency,
    budget_clarity,
    response_rate,
    preview_activity
  );

  const base: ClientEvaluation = {
    id: c.id,
    full_name: c.name,
    phone: c.phone,
    location: c.preferred_location || c.address || 'غير محدد',
    communication_frequency,
    timing_urgency,
    budget_clarity,
    response_rate,
    preview_activity,
    overall_score,
    status,
    last_contact_date: c.last_contacted || c.updated_at || c.created_at,
    recommendations: [],
    priority:
      timing_urgency >= 80 || status === 'hot_lead'
        ? 'high'
        : timing_urgency >= 60
        ? 'medium'
        : 'low',
    assigned_to: c.assigned_to,
  };

  return { ...base, recommendations: buildRecommendations(base) };
};

// بيانات تجريبية للعملاء
const mockClientEvaluations: ClientEvaluation[] = [
  {
    id: '1',
    full_name: 'أحمد محمد علي',
    phone: '+971501234567',
    location: 'الروضة',
    communication_frequency: 10,
    timing_urgency: 80,
    budget_clarity: 60,
    response_rate: 0,
    preview_activity: 20,
    overall_score: 2,
    status: 'needs_followup',
    last_contact_date: '2024-01-15',
    recommendations: [
      'عميل يحتاج تطوير - زيادة التواصل',
      'اعرض خيارات متنوعة لفهم احتياجاته أكثر',
      'زيادة التواصل - لم يتم التواصل مؤخراً',
      'اقترح معاينات لزيادة الاهتمام'
    ],
    priority: 'high',
    assigned_to: 'أحمد محمد',
    notes: 'عميل مهتم جداً بالعقارات في الروضة'
  },
  {
    id: '2',
    full_name: 'Sarah Johnson',
    phone: '+971507654321',
    location: 'Dubai Marina',
    communication_frequency: 10,
    timing_urgency: 100,
    budget_clarity: 60,
    response_rate: 50,
    preview_activity: 33,
    overall_score: 2,
    status: 'needs_followup',
    last_contact_date: '2024-01-14',
    recommendations: [
      'عميل يحتاج تطوير - زيادة التواصل',
      'اعرض خيارات متنوعة لفهم احتياجاته أكثر',
      'زيادة التواصل - لم يتم التواصل مؤخراً'
    ],
    priority: 'medium',
    assigned_to: 'سارة أحمد'
  },
  {
    id: '3',
    full_name: 'محمد العلي',
    phone: '+971502345678',
    location: 'الرمرام',
    communication_frequency: 10,
    timing_urgency: 60,
    budget_clarity: 60,
    response_rate: 50,
    preview_activity: 20,
    overall_score: 2,
    status: 'needs_followup',
    last_contact_date: '2024-01-13',
    recommendations: [
      'عميل يحتاج تطوير - زيادة التواصل',
      'اعرض خيارات متنوعة لفهم احتياجاته أكثر',
      'زيادة التواصل - لم يتم التواصل مؤخراً',
      'اقترح معاينات لزيادة الاهتمام'
    ],
    priority: 'low',
    assigned_to: 'محمد علي'
  },
  {
    id: '4',
    full_name: 'فاطمة الزهراء',
    phone: '+971503456789',
    location: 'المنطقة الحرة',
    communication_frequency: 85,
    timing_urgency: 90,
    budget_clarity: 95,
    response_rate: 100,
    preview_activity: 88,
    overall_score: 5,
    status: 'hot_lead',
    last_contact_date: '2024-01-16',
    recommendations: [
      'عميل جاهز للصفقة - اعرض العقارات المناسبة',
      'احجز معاينة فورية',
      'أرسل عروض خاصة'
    ],
    priority: 'high',
    assigned_to: 'فاطمة أحمد'
  },
  {
    id: '5',
    full_name: 'علي حسن',
    phone: '+971504567890',
    location: 'الشارقة',
    communication_frequency: 70,
    timing_urgency: 75,
    budget_clarity: 80,
    response_rate: 85,
    preview_activity: 72,
    overall_score: 4,
    status: 'active',
    last_contact_date: '2024-01-15',
    recommendations: [
      'عميل نشط - استمر في التواصل',
      'اعرض عقارات جديدة',
      'اقترح خيارات تمويل'
    ],
    priority: 'medium',
    assigned_to: 'علي محمد'
  }
];

// بيانات تجريبية للعقارات
const mockProperties: Property[] = [
  {
    id: '1',
    title: 'فيلا فاخرة في الروضة - 4 غرف نوم',
    description: 'فيلا حديثة البناء مع حديقة خاصة ومسبح، تشطيب فاخر، موقع ممتاز',
    price: 2800000,
    area: 3500,
    bedrooms: 4,
    bathrooms: 3,
    property_type: 'villa',
    area_name: 'الروضة',
    city: 'الرياض',
    district: 'الروضة',
    features: ['حديقة خاصة', 'مسبح', 'مطبخ مجهز', 'مصعد', 'نظام أمني', 'موقف سيارتين'],
    images: ['/images/villa1.jpg', '/images/villa1_2.jpg'],
    status: 'available',
    owner_id: 'owner1',
    listed_date: '2024-01-10',
    last_updated: '2024-01-15',
    views_count: 45,
    inquiries_count: 8,
    ai_score: 95
  },
  {
    id: '2',
    title: 'شقة عصرية في دبي مارينا - إطلالة بحرية',
    description: 'شقة فاخرة بغرفتين وصالة، إطلالة مباشرة على البحر، أثاث كامل',
    price: 1800000,
    area: 1200,
    bedrooms: 2,
    bathrooms: 2,
    property_type: 'apartment',
    area_name: 'Dubai Marina',
    city: 'دبي',
    district: 'دبي مارينا',
    features: ['إطلالة بحرية', 'مؤثثة بالكامل', 'نظام تكييف مركزي', 'أمن 24/7', 'جيم', 'مسبح مشترك'],
    images: ['/images/apt1.jpg', '/images/apt1_2.jpg'],
    status: 'available',
    owner_id: 'owner2',
    listed_date: '2024-01-12',
    last_updated: '2024-01-16',
    views_count: 62,
    inquiries_count: 12,
    ai_score: 88
  },
  {
    id: '3',
    title: 'قطعة أرض استثمارية في الرمرام',
    description: 'أرض سكنية في موقع استراتيجي، قريبة من الخدمات، مناسبة للاستثمار',
    price: 1200000,
    area: 800,
    bedrooms: 0,
    bathrooms: 0,
    property_type: 'land',
    area_name: 'الرمرام',
    city: 'دبي',
    district: 'الرمرام',
    features: ['موقع استراتيجي', 'قريب من الخدمات', 'إمكانية البناء فوراً', 'استثمار مضمون'],
    images: ['/images/land1.jpg'],
    status: 'available',
    owner_id: 'owner3',
    listed_date: '2024-01-08',
    last_updated: '2024-01-14',
    views_count: 28,
    inquiries_count: 5,
    ai_score: 75
  },
  {
    id: '4',
    title: 'فيلا عائلية في الإمارات هيلز - 5 غرف',
    description: 'فيلا واسعة مع حديقة كبيرة، مناسبة للعائلات الكبيرة، في مجتمع راقي',
    price: 4200000,
    area: 4500,
    bedrooms: 5,
    bathrooms: 4,
    property_type: 'villa',
    area_name: 'الإمارات هيلز',
    city: 'دبي',
    district: 'الإمارات هيلز',
    features: ['حديقة واسعة', 'مسبح خاص', 'غرفة خادمة', 'موقف 3 سيارات', 'نادي صحي', 'ملعب أطفال'],
    images: ['/images/villa2.jpg', '/images/villa2_2.jpg', '/images/villa2_3.jpg'],
    status: 'available',
    owner_id: 'owner4',
    listed_date: '2024-01-05',
    last_updated: '2024-01-17',
    views_count: 87,
    inquiries_count: 15,
    ai_score: 92
  }
];

// محرك ترشيح العقارات الذكي
const getPropertyRecommendations = (client: ClientEvaluation): PropertyRecommendation[] => {
  return mockProperties.map(property => {
    let matchScore = 0;
    const matchReasons: string[] = [];
    
    // تحليل التطابق مع الموقع
    if (property.area_name.toLowerCase().includes(client.location.toLowerCase()) ||
        client.location.toLowerCase().includes(property.area_name.toLowerCase())) {
      matchScore += 30;
      matchReasons.push(`يقع في ${client.location} المنطقة المفضلة`);
    }
    
    // تحليل نوع العقار (افتراضي: فيلا للعملاء ذوي التقييم العالي)
    if (client.overall_score >= 4 && property.property_type === 'villa') {
      matchScore += 25;
      matchReasons.push('نوع العقار يناسب متطلباتك');
    } else if (client.overall_score < 4 && property.property_type === 'apartment') {
      matchScore += 25;
      matchReasons.push('خيار عملي ومناسب');
    }
    
    // تحليل الميزانية (افتراضية بناءً على التقييم)
    const estimatedBudget = client.overall_score * 1000000; // تقدير الميزانية
    if (property.price <= estimatedBudget * 1.2 && property.price >= estimatedBudget * 0.7) {
      matchScore += 20;
      matchReasons.push('السعر ضمن النطاق المناسب');
    }
    
    // تحليل الأولوية
    if (client.priority === 'high' && property.ai_score >= 90) {
      matchScore += 15;
      matchReasons.push('عقار مميز عالي الجودة');
    }
    
    // تحليل حالة العميل
    if (client.status === 'hot_lead' && property.views_count > 50) {
      matchScore += 10;
      matchReasons.push('عقار شائع ومطلوب');
    }
    
    // حساب الاهتمام المتوقع
    const predictedInterest = Math.min(100, matchScore + (property.ai_score * 0.3));
    
    return {
      property,
      match_score: Math.min(100, matchScore),
      match_reasons: matchReasons,
      predicted_interest: predictedInterest
    };
  }).sort((a, b) => b.match_score - a.match_score);
};

// مكون صفحة العقارات المقترحة للعميل
const ClientPropertyRecommendations: React.FC<{
  client: ClientEvaluation;
  isOpen: boolean;
  onClose: () => void;
  onSendProperties: (selectedProperties: Property[], message: string) => void;
}> = ({ client, isOpen, onClose, onSendProperties }) => {
  const [recommendations] = useState<PropertyRecommendation[]>(() => getPropertyRecommendations(client));
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [customMessage, setCustomMessage] = useState('');

  if (!isOpen) return null;

  const handlePropertySelect = (propertyId: string) => {
    const newSelected = new Set(selectedProperties);
    if (newSelected.has(propertyId)) {
      newSelected.delete(propertyId);
    } else {
      newSelected.add(propertyId);
    }
    setSelectedProperties(newSelected);
  };

  const handleSendSelected = () => {
    const selected = recommendations
      .filter(rec => selectedProperties.has(rec.property.id))
      .map(rec => rec.property);
    
    if (selected.length > 0) {
      // تكوين رسالة تلقائية
      let message = `مرحباً ${client.full_name} 🏠\n\nوجدت لك عقارات رائعة قد تعجبك:\n\n`;
      
      selected.forEach((property, index) => {
        message += `${index + 1}. ${property.title}\n`;
        message += `💰 السعر: ${property.price.toLocaleString()} ريال\n`;
        message += `📐 المساحة: ${property.area} متر مربع\n`;
        if (property.bedrooms > 0) {
          message += `🛏️ الغرف: ${property.bedrooms} غرف نوم\n`;
        }
        message += `📍 الموقع: ${property.area_name}\n\n`;
      });
      
      message += customMessage || 'هل تود معاينة أي من هذه العقارات؟ 😊';
      
      onSendProperties(selected, message);
      onClose();
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-7xl max-h-[95vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Home className="h-5 w-5 text-blue-600" />
            <span>العقارات المقترحة للعميل</span>
          </CardTitle>
          <CardDescription>
            توصيات ذكية مخصصة للعميل: {client.full_name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* بروفايل العميل */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {client.full_name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-blue-900 mb-2">{client.full_name}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600 font-medium">الهاتف:</span>
                      <p className="text-blue-800">{client.phone}</p>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">الموقع المفضل:</span>
                      <p className="text-blue-800">{client.location}</p>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">التقييم:</span>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= client.overall_score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">الحالة:</span>
                      <Badge className={`${
                        client.status === 'hot_lead' ? 'bg-red-100 text-red-800' :
                        client.status === 'active' ? 'bg-green-100 text-green-800' :
                        client.status === 'needs_followup' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {client.status === 'hot_lead' ? 'عميل ساخن' :
                         client.status === 'active' ? 'نشط' :
                         client.status === 'needs_followup' ? 'يحتاج متابعة' : 'عميل بارد'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* العقارات المقترحة */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">
              العقارات المقترحة ({recommendations.length})
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {recommendations.map((recommendation) => (
                <Card 
                  key={recommendation.property.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg border ${
                    selectedProperties.has(recommendation.property.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handlePropertySelect(recommendation.property.id)}
                >
                  <CardContent className="p-4">
                    {/* صورة العقار */}
                    <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg mb-4 flex items-center justify-center">
                      <Home className="h-16 w-16 text-white" />
                    </div>
                    
                    {/* تفاصيل العقار */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h5 className="text-lg font-semibold text-gray-900 line-clamp-2">
                          {recommendation.property.title}
                        </h5>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchColor(recommendation.match_score)}`}>
                          {recommendation.match_score}% توافق
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {recommendation.property.description}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{recommendation.property.price.toLocaleString()} ريال</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Ruler className="h-4 w-4 text-gray-500" />
                          <span>{recommendation.property.area} م²</span>
                        </div>
                        {recommendation.property.bedrooms > 0 && (
                          <div className="flex items-center space-x-2">
                            <Home className="h-4 w-4 text-gray-500" />
                            <span>{recommendation.property.bedrooms} غرف</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span>{recommendation.property.area_name}</span>
                        </div>
                      </div>
                      
                      {/* أسباب التطابق */}
                      <div>
                        <p className="text-xs text-gray-600 mb-2">أسباب التوصية:</p>
                        <div className="space-y-1">
                          {recommendation.match_reasons.slice(0, 2).map((reason, index) => (
                            <div key={index} className="flex items-start space-x-2 text-xs text-green-700">
                              <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* إحصائيات */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>{recommendation.property.views_count} مشاهدة</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{recommendation.property.inquiries_count} استفسار</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>{recommendation.predicted_interest}% اهتمام متوقع</span>
                        </span>
                      </div>
                      
                      {/* مؤشر الاختيار */}
                      {selectedProperties.has(recommendation.property.id) && (
                        <div className="flex items-center justify-center p-2 bg-blue-100 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                          <span className="text-blue-800 font-medium">تم اختياره للإرسال</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* رسالة مخصصة */}
          {selectedProperties.size > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">رسالة إضافية (اختيارية):</h4>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg h-20 resize-none"
                placeholder="أضف رسالة شخصية للعميل..."
              />
            </div>
          )}

          {/* أزرار التحكم */}
          <div className="flex space-x-3 pt-4">
            <Button 
              onClick={handleSendSelected}
              disabled={selectedProperties.size === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4 mr-2" />
              إرسال العقارات المختارة ({selectedProperties.size})
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              إلغاء
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// قوالب رسائل WhatsApp الجاهزة
const whatsappTemplates: WhatsAppTemplate[] = [
  {
    id: 'initial_contact',
    name: 'التواصل الأولي',
    category: 'initial_contact',
    body: `مرحباً [CLIENT_NAME] 👋\n\nأتواصل معك من ستار سيتي العقارية بخصوص احتياجاتك العقارية.\n\nنحن متخصصون في [LOCATION] ولدينا عروض رائعة قد تناسبك.\n\nهل يمكننا التحدث لفهم احتياجاتك أكثر؟`,
    variables: ['CLIENT_NAME', 'LOCATION'],
    usage_count: 0,
    success_rate: 85
  },
  {
    id: 'follow_up_hot',
    name: 'متابعة العميل الساخن',
    category: 'follow_up',
    body: `أهلاً [CLIENT_NAME] 🔥\n\nأرى أنك مهتم جداً بالعقارات في [LOCATION]!\n\nلدي عقارات جديدة وصلت اليوم قد تعجبك:\n• [PROPERTY_TYPE] بمساحة [AREA]\n• ضمن ميزانيتك المحددة\n\nهل تود معاينة سريعة اليوم أو غداً؟`,
    variables: ['CLIENT_NAME', 'LOCATION', 'PROPERTY_TYPE', 'AREA'],
    usage_count: 0,
    success_rate: 78
  },
  {
    id: 'follow_up_needs_attention',
    name: 'متابعة يحتاج اهتمام',
    category: 'follow_up',
    body: `مرحباً [CLIENT_NAME] 😊\n\nلم نتواصل منذ فترة، وأردت أن أطمئن عليك.\n\nهل ما زلت تبحث عن [PROPERTY_TYPE] في [LOCATION]؟\n\nلدينا خيارات جديدة قد تناسبك، وأسعار مميزة هذا الشهر.\n\nمتى يناسبك نتحدث؟`,
    variables: ['CLIENT_NAME', 'PROPERTY_TYPE', 'LOCATION'],
    usage_count: 0,
    success_rate: 65
  },
  {
    id: 'property_sharing',
    name: 'مشاركة عقارات',
    category: 'property_sharing',
    body: `[CLIENT_NAME] وجدت لك شيء رائع! 🏠\n\n[PROPERTY_TYPE] في [LOCATION]\n💰 السعر: [PRICE]\n📐 المساحة: [AREA]\n🛏️ الغرف: [BEDROOMS]\n\nالعقار يطابق احتياجاتك تماماً!\n\nهل تود معاينة أو المزيد من التفاصيل؟`,
    variables: ['CLIENT_NAME', 'PROPERTY_TYPE', 'LOCATION', 'PRICE', 'AREA', 'BEDROOMS'],
    usage_count: 0,
    success_rate: 72
  },
  {
    id: 'appointment_booking',
    name: 'حجز موعد معاينة',
    category: 'appointment',
    body: `أهلاً [CLIENT_NAME] 📅\n\nلحجز موعد المعاينة:\n\n🏠 العقار: [PROPERTY_TYPE] في [LOCATION]\n⏰ المواعيد المتاحة:\n• اليوم من 2-5 مساءً\n• غداً من 10 صباحاً - 12 ظهراً\n• بعد غد من 3-6 مساءً\n\nأي موعد يناسبك أكثر؟`,
    variables: ['CLIENT_NAME', 'PROPERTY_TYPE', 'LOCATION'],
    usage_count: 0,
    success_rate: 80
  },
  {
    id: 'general_check',
    name: 'اطمئنان عام',
    category: 'general',
    body: `مرحباً [CLIENT_NAME] 💙\n\nكيف حالك؟ أتمنى أن تكون بخير.\n\nأردت أن أطمئن عليك وأسأل إذا كان لديك أي استفسارات عقارية.\n\nنحن هنا دائماً لمساعدتك! 🤝`,
    variables: ['CLIENT_NAME'],
    usage_count: 0,
    success_rate: 60
  }
];

// مكون نافذة اختيار قالب WhatsApp
const WhatsAppTemplateDialog: React.FC<{
  client: ClientEvaluation;
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (template: WhatsAppTemplate, customizedMessage: string) => void;
}> = ({ client, isOpen, onClose, onSendMessage }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [customizedMessage, setCustomizedMessage] = useState('');
  
  // جلب القوالب من قاعدة البيانات بناءً على حالة العميل
  const clientStage = getStageForClientStatus(client.status);
  const { data: dbTemplates = [], isLoading } = useQuery({
    queryKey: ['whatsapp-templates', clientStage, 'ar'],
    queryFn: () => getTemplates({ stage: clientStage, lang: 'ar' }),
    staleTime: 5 * 60 * 1000, // 5 دقائق
  });

  // جلب قوالب إضافية من المراحل الأخرى كخيارات احتياطية
  const { data: allTemplates = [] } = useQuery({
    queryKey: ['whatsapp-templates-all', 'ar'],
    queryFn: () => getTemplates({ lang: 'ar' }),
    staleTime: 5 * 60 * 1000,
  });

  // تحويل القوالب إلى التنسيق المحلي
  const primaryTemplates = dbTemplates.map(t => convertTemplateToLocal(t, 85));
  const allConvertedTemplates = allTemplates.map(t => convertTemplateToLocal(t, 75));

  if (!isOpen) return null;

  // تخصيص الرسالة بناءً على بيانات العميل
  const customizeTemplate = (template: WhatsAppTemplate) => {
    let message = template.body;
    
    // قاموس المتغيرات المتاحة
    const variables: { [key: string]: string } = {
      CLIENT_NAME: client.full_name,
      LOCATION: client.location,
      PHONE: client.phone,
      PRIORITY: client.priority === 'high' ? 'عالية' : client.priority === 'medium' ? 'متوسطة' : 'منخفضة',
      STATUS: client.status === 'hot_lead' ? 'عميل ساخن' :
              client.status === 'active' ? 'نشط' :
              client.status === 'needs_followup' ? 'يحتاج متابعة' : 'عميل بارد',
      ASSIGNED_TO: client.assigned_to || 'غير محدد',
      LAST_CONTACT: client.last_contact_date,
      // متغيرات افتراضية للعقارات
      PROPERTY_TYPE: client.overall_score >= 4 ? 'فيلا' : 'شقة',
      AREA: client.overall_score >= 4 ? '300-500 متر مربع' : '100-200 متر مربع',
      PRICE: `${(client.overall_score * 1000000).toLocaleString()} ريال`,
      BEDROOMS: client.overall_score >= 4 ? '4-5 غرف' : '2-3 غرف',
      // متغيرات عامة
      DATE: new Date().toLocaleDateString('ar-SA'),
      TIME: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      COMPANY: 'ستار سيتي العقارية'
    };
    
    // استبدال جميع المتغيرات الموجودة في القالب
    if (template.variables && template.variables.length > 0) {
      template.variables.forEach(variable => {
        const value = variables[variable] || `[${variable}]`;
        const regex = new RegExp(`\\[${variable}\\]`, 'g');
        message = message.replace(regex, value);
      });
    } else {
      // استبدال المتغيرات الشائعة إذا لم تكن محددة
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`\\[${key}\\]`, 'g');
        message = message.replace(regex, variables[key]);
      });
    }
    
    return message;
  };

  const handleTemplateSelect = (template: WhatsAppTemplate) => {
    setSelectedTemplate(template);
    const customized = customizeTemplate(template);
    setCustomizedMessage(customized);
  };

  const handleSend = () => {
    if (selectedTemplate && customizedMessage) {
      onSendMessage(selectedTemplate, customizedMessage);
      onClose();
    }
  };

  // تصفية القوالب حسب حالة العميل
  const getRecommendedTemplates = () => {
    // أولاً: القوالب المناسبة لحالة العميل من قاعدة البيانات
    let recommended = [...primaryTemplates];
    
    // ثانياً: إضافة قوالب احتياطية من المراحل الأخرى
    const fallbackTemplates = allConvertedTemplates.filter(t => 
      !primaryTemplates.some(p => p.id === t.id)
    );
    
    if (client.status === 'hot_lead') {
      // للعميل الساخن: أولوية للمتابعة والعقارات والمواعيد
      const hotLeadTemplates = fallbackTemplates.filter(t => 
        t.category === 'follow_up' || t.category === 'property_sharing' || t.category === 'appointment'
      );
      recommended = [...recommended, ...hotLeadTemplates];
    } else if (client.status === 'needs_followup') {
      // يحتاج متابعة: أولوية للمتابعة العامة
      const followupTemplates = fallbackTemplates.filter(t => 
        t.category === 'follow_up' || t.category === 'general'
      );
      recommended = [...recommended, ...followupTemplates];
    } else if (client.status === 'cold_lead') {
      // العميل البارد: أولوية للتواصل الأولي
      const coldLeadTemplates = fallbackTemplates.filter(t => 
        t.category === 'initial_contact' || t.category === 'general'
      );
      recommended = [...recommended, ...coldLeadTemplates];
    } else {
      // العميل النشط: جميع الأنواع
      recommended = [...recommended, ...fallbackTemplates];
    }
    
    // إضافة القوالب الثابتة كخيار احتياطي أخير إذا لم توجد قوالب في قاعدة البيانات
    if (recommended.length === 0) {
      recommended = whatsappTemplates.filter(t => {
        if (client.status === 'hot_lead') {
          return t.category === 'follow_up' || t.category === 'property_sharing' || t.category === 'appointment';
        } else if (client.status === 'needs_followup') {
          return t.category === 'follow_up' || t.category === 'general';
        } else if (client.status === 'cold_lead') {
          return t.category === 'initial_contact' || t.category === 'general';
        }
        return true;
      });
    }
    
    return recommended;
  };

  const recommendedTemplates = getRecommendedTemplates();
  
  // تحضير محتوى كتلة اختيار القوالب بدون تعشيش ثلاثي معقد لتجنب أخطاء JSX
  const templateSelectorBody = isLoading ? (
    <div className="flex items-center justify-center py-8">
      <RefreshCw className="h-6 w-6 animate-spin text-gray-400 mr-2" />
      <span className="text-gray-600">جاري تحميل القوالب...</span>
    </div>
  ) : recommendedTemplates.length === 0 ? (
    <div className="text-center py-8 text-gray-500">
      <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
      <p>لا توجد قوالب متاحة لهذه الحالة</p>
      <p className="text-sm">يمكنك إضافة قوالب جديدة من صفحة إدارة القوالب</p>
    </div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {recommendedTemplates.map((template) => (
        <Card
          key={template.id}
          className={`cursor-pointer transition-all duration-200 hover:shadow-md border ${
            selectedTemplate?.id === template.id 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-200 hover:border-green-300'
          }`}
          onClick={() => handleTemplateSelect(template)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h5 className="font-medium text-gray-900">{template.name}</h5>
              <div className="flex items-center space-x-1">
                <Badge variant="outline" className="text-xs">
                  {template.success_rate}% نجاح
                </Badge>
                {primaryTemplates.some(p => p.id === template.id) && (
                  <Badge variant="default" className="text-xs bg-green-600">
                    مخصص
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600 line-clamp-3">
              {template.body.substring(0, 100)}...
            </p>
            <div className="flex items-center justify-between mt-2">
              <Badge variant="secondary" className="text-xs">
                {template.category === 'initial_contact' ? 'تواصل أولي' :
                 template.category === 'follow_up' ? 'متابعة' :
                 template.category === 'property_sharing' ? 'مشاركة عقارات' :
                 template.category === 'appointment' ? 'حجز موعد' : 'عام'}
              </Badge>
              {template.variables && template.variables.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {template.variables.length} متغير
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            <span>إرسال رسالة WhatsApp</span>
            {isLoading && <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />}
          </CardTitle>
          <CardDescription>
            العميل: {client.full_name} • {client.phone} • المرحلة: {clientStage}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* اختيار القالب */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800">اختر قالب الرسالة:</h4>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>إجمالي القوالب: {recommendedTemplates.length}</span>
                {primaryTemplates.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {primaryTemplates.length} مخصص للحالة
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    // إعادة تحميل القوالب
                    window.location.href = '/whatsapp/templates';
                  }}
                  className="text-xs"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  إدارة القوالب
                </Button>
              </div>
            </div>
            {templateSelectorBody}
          </div>

          {/* معاينة الرسالة */}
          {selectedTemplate && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">معاينة وتعديل الرسالة:</h4>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium text-green-800">إلى: {client.full_name}</span>
                </div>
                <textarea
                  value={customizedMessage}
                  onChange={(e) => setCustomizedMessage(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg h-32 resize-none"
                  placeholder="اكتب رسالتك هنا..."
                />
                <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                  <span>عدد الأحرف: {customizedMessage.length}</span>
                  <div className="flex items-center space-x-2">
                    <span>القالب: {selectedTemplate.name}</span>
                    {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {selectedTemplate.variables.length} متغير تم استبداله
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* عرض المتغيرات المستخدمة */}
                {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                    <p className="text-gray-700 mb-1">المتغيرات المستخدمة:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedTemplate.variables.map((variable, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* أزرار التحكم */}
          <div className="flex space-x-3 pt-4">
            <Button 
              onClick={handleSend}
              disabled={!selectedTemplate || !customizedMessage.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4 mr-2" />
              إرسال رسالة WhatsApp
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              إلغاء
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// مكون تأكيد الإرسال ونافذة المتابعة
const MessageSentConfirmation: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  messageSent: string;
  clientName: string;
  onLogResponse: (response: string, notes: string) => void;
}> = ({ isOpen, onClose, messageSent, clientName, onLogResponse }) => {
  const [clientResponse, setClientResponse] = useState('');
  const [employeeNotes, setEmployeeNotes] = useState('');
  const [responseReceived, setResponseReceived] = useState(false);

  if (!isOpen) return null;

  const handleLogResponse = () => {
    onLogResponse(clientResponse, employeeNotes);
    onClose();
  };

  const handleNoResponse = () => {
    onLogResponse('', 'لم يرد العميل على الرسالة');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>تم إرسال الرسالة بنجاح!</span>
          </CardTitle>
          <CardDescription>
            تم إرسال الرسالة إلى {clientName} عبر WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* عرض الرسالة المرسلة */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">الرسالة المرسلة:</h4>
            <div className="bg-white border border-green-300 rounded-lg p-3">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{messageSent}</p>
            </div>
            <div className="flex items-center space-x-2 mt-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>تم الإرسال في {new Date().toLocaleString('ar-SA')}</span>
            </div>
          </div>

          {/* نظام تسجيل الرد */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-800 mb-3">تسجيل رد العميل:</h4>
            
            <div className="space-y-4">
              <div className="flex space-x-3">
                <Button
                  onClick={() => setResponseReceived(true)}
                  variant={responseReceived ? "default" : "outline"}
                  className="flex-1"
                >
                  رد العميل
                </Button>
                <Button
                  onClick={() => setResponseReceived(false)}
                  variant={!responseReceived ? "default" : "outline"}
                  className="flex-1"
                >
                  لم يرد بعد
                </Button>
              </div>

              {responseReceived && (
                <div className="space-y-3">
                  <div>
                    <Label>رد العميل:</Label>
                    <textarea
                      value={clientResponse}
                      onChange={(e) => setClientResponse(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg h-20 resize-none"
                      placeholder="اكتب رد العميل هنا..."
                    />
                  </div>
                </div>
              )}

              <div>
                <Label>ملاحظات الموظف:</Label>
                <textarea
                  value={employeeNotes}
                  onChange={(e) => setEmployeeNotes(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg h-20 resize-none"
                  placeholder="أضف ملاحظاتك حول المحادثة..."
                />
              </div>
            </div>
          </div>

          {/* أزرار التحكم */}
          <div className="flex space-x-3 pt-4">
            {responseReceived ? (
              <Button 
                onClick={handleLogResponse}
                disabled={!clientResponse.trim() && !employeeNotes.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                حفظ الرد والملاحظات
              </Button>
            ) : (
              <Button 
                onClick={handleNoResponse}
                className="flex-1 bg-gray-600 hover:bg-gray-700"
              >
                تسجيل: لم يرد العميل
              </Button>
            )}
            <Button onClick={onClose} variant="outline">
              إغلاق
            </Button>
          </div>

          {/* تذكير للمتابعة */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Bell className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">تذكير تلقائي</span>
            </div>
            <p className="text-sm text-blue-700">
              سيتم تذكيرك بمتابعة العميل إذا لم يرد خلال 24 ساعة
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// مكون نافذة اختيار الإجراء
const ActionDialog: React.FC<{
  client: ClientEvaluation;
  isOpen: boolean;
  onClose: () => void;
  onActionSelected: (action: ActionOption, client: ClientEvaluation) => void;
}> = ({ client, isOpen, onClose, onActionSelected }) => {
  if (!isOpen) return null;

  // الإجراءات المتاحة بناءً على حالة العميل
  const getAvailableActions = (client: ClientEvaluation): ActionOption[] => {
    const baseActions: ActionOption[] = [
      {
        id: 'call',
        type: 'call',
        label: 'مكالمة هاتفية',
        description: 'إجراء مكالمة مباشرة مع العميل',
        icon: 'Phone',
        priority: 'high'
      },
      {
        id: 'whatsapp',
        type: 'whatsapp',
        label: 'رسالة واتساب',
        description: 'إرسال رسالة عبر الواتساب',
        icon: 'MessageSquare',
        priority: 'high'
      },
      {
        id: 'email',
        type: 'email',
        label: 'إرسال إيميل',
        description: 'إرسال رسالة إلكترونية',
        icon: 'Mail',
        priority: 'medium'
      },
      {
        id: 'schedule_meeting',
        type: 'schedule_meeting',
        label: 'جدولة موعد',
        description: 'حجز موعد للمعاينة أو الاجتماع',
        icon: 'Calendar',
        priority: 'medium'
      },
      {
        id: 'send_properties',
        type: 'send_properties',
        label: 'إرسال عقارات',
        description: 'إرسال عقارات مناسبة للعميل',
        icon: 'Home',
        priority: 'high'
      },
      {
        id: 'add_reminder',
        type: 'add_reminder',
        label: 'إضافة تذكير',
        description: 'إضافة تذكير للمتابعة لاحقاً',
        icon: 'Bell',
        priority: 'low'
      }
    ];

    // إضافة إجراءات خاصة بناءً على حالة العميل
    if (client.status === 'needs_followup') {
      baseActions.push({
        id: 'urgent_followup',
        type: 'call',
        label: 'متابعة عاجلة',
        description: 'اتصال فوري للمتابعة',
        icon: 'AlertTriangle',
        priority: 'high'
      });
    }

    if (client.status === 'hot_lead') {
      baseActions.push({
        id: 'urgent_meeting',
        type: 'schedule_meeting',
        label: 'موعد عاجل',
        description: 'حجز موعد عاجل للمعاينة',
        icon: 'Calendar',
        priority: 'high'
      });
    }

    return baseActions.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const availableActions = getAvailableActions(client);

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      Phone,
      MessageSquare,
      Mail,
      Calendar,
      Home,
      Bell,
      AlertTriangle,
      User
    };
    const IconComponent = icons[iconName] || User;
    return IconComponent;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-xl">اختر الإجراء المناسب</CardTitle>
          <CardDescription>العميل: {client.full_name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* التوصيات الحالية */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-800 mb-3">التوصيات الحالية:</h4>
            <ul className="space-y-1">
              {client.recommendations.slice(0, 3).map((rec, index) => (
                <li key={index} className="text-sm text-blue-700 flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* الإجراءات المتاحة */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableActions.map((action) => {
              const IconComponent = getIconComponent(action.icon);
              return (
                <Card
                  key={action.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg border ${
                    action.priority === 'high' 
                      ? 'border-red-200 hover:border-red-300' 
                      : action.priority === 'medium'
                      ? 'border-yellow-200 hover:border-yellow-300'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onActionSelected(action, client)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        action.priority === 'high' 
                          ? 'bg-red-100 text-red-600' 
                          : action.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 mb-1">
                          {action.label}
                        </h5>
                        <p className="text-sm text-gray-600">
                          {action.description}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={`mt-2 ${
                            action.priority === 'high' 
                              ? 'border-red-200 text-red-700' 
                              : action.priority === 'medium'
                              ? 'border-yellow-200 text-yellow-700'
                              : 'border-gray-200 text-gray-700'
                          }`}
                        >
                          أولوية {action.priority === 'high' ? 'عالية' : action.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={onClose} variant="outline">
              إلغاء
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// مكون تعديل التقييم
const EditEvaluationDialog: React.FC<{
  client: ClientEvaluation;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedClient: ClientEvaluation) => void;
}> = ({ client, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<ClientEvaluation>(client);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>تعديل تقييم العميل</CardTitle>
          <CardDescription>تعديل بيانات التقييم للعميل {client.full_name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>تكرار التواصل (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.communication_frequency}
                onChange={(e) => setFormData({
                  ...formData,
                  communication_frequency: parseInt(e.target.value)
                })}
              />
            </div>
            <div>
              <Label>إلحاح التوقيت (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.timing_urgency}
                onChange={(e) => setFormData({
                  ...formData,
                  timing_urgency: parseInt(e.target.value)
                })}
              />
            </div>
            <div>
              <Label>وضوح الميزانية (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.budget_clarity}
                onChange={(e) => setFormData({
                  ...formData,
                  budget_clarity: parseInt(e.target.value)
                })}
              />
            </div>
            <div>
              <Label>معدل الاستجابة (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.response_rate}
                onChange={(e) => setFormData({
                  ...formData,
                  response_rate: parseInt(e.target.value)
                })}
              />
            </div>
            <div>
              <Label>نشاط المعاينة (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.preview_activity}
                onChange={(e) => setFormData({
                  ...formData,
                  preview_activity: parseInt(e.target.value)
                })}
              />
            </div>
            <div>
              <Label>التقييم العام</Label>
              <select
                value={formData.overall_score}
                onChange={(e) => setFormData({
                  ...formData,
                  overall_score: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {[1, 2, 3, 4, 5].map(score => (
                  <option key={score} value={score}>{score} نجوم</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <Label>الحالة</Label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({
                ...formData,
                status: e.target.value as ClientEvaluation['status']
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="hot_lead">عميل ساخن</option>
              <option value="active">نشط</option>
              <option value="needs_followup">يحتاج متابعة</option>
              <option value="cold_lead">عميل بارد</option>
            </select>
          </div>

          <div>
            <Label>الأولوية</Label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({
                ...formData,
                priority: e.target.value as ClientEvaluation['priority']
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="low">منخفضة</option>
              <option value="medium">متوسطة</option>
              <option value="high">عالية</option>
            </select>
          </div>

          <div>
            <Label>ملاحظات</Label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({
                ...formData,
                notes: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg h-20"
              placeholder="أضف ملاحظات حول العميل..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700">
              حفظ التغييرات
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              إلغاء
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// مكون تقييم العميل الفردي
const ClientEvaluationCard: React.FC<{ 
  client: ClientEvaluation;
  onEdit: (client: ClientEvaluation) => void;
  onDelete: (id: string) => void;
  onTakeAction?: (client: ClientEvaluation) => void;
}> = ({ client, onEdit, onDelete, onTakeAction }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [showPropertyDialog, setShowPropertyDialog] = useState(false);
  const [sentMessage, setSentMessage] = useState('');
  const [conversationLogs, setConversationLogs] = useState<ConversationLog[]>([]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hot_lead': return 'bg-red-100 text-red-800 border-red-200';
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'needs_followup': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cold_lead': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'hot_lead': return 'عميل ساخن';
      case 'active': return 'نشط';
      case 'needs_followup': return 'يحتاج متابعة';
      case 'cold_lead': return 'عميل بارد';
      default: return 'غير محدد';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'عالية';
      case 'medium': return 'متوسطة';
      case 'low': return 'منخفضة';
      default: return 'غير محدد';
    }
  };

  const getMetricColor = (value: number) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-purple-600';
    if (value >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const renderStars = (score: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 mr-2">{score} نجوم</span>
      </div>
    );
  };

  // معالج إرسال رسالة WhatsApp
  const handleWhatsAppSend = (template: WhatsAppTemplate, customizedMessage: string) => {
    // حفظ الرسالة المرسلة
    setSentMessage(customizedMessage);
    
    // إنشاء سجل المحادثة
    const newLog: ConversationLog = {
      id: `${client.id}_${Date.now()}`,
      client_id: client.id,
      message_sent: customizedMessage,
      sent_at: new Date().toISOString(),
      status: 'sent'
    };
    
    setConversationLogs(prev => [...prev, newLog]);
    
    // فتح WhatsApp
    const phoneNumber = client.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(customizedMessage)}`, '_blank');
    
    // إظهار نافذة التأكيد
    setShowConfirmationDialog(true);
    
    if (onTakeAction) onTakeAction(client);
  };

  // معالج تسجيل رد العميل
  const handleLogResponse = (response: string, notes: string) => {
    const currentLog = conversationLogs[conversationLogs.length - 1];
    if (currentLog) {
      const updatedLog: ConversationLog = {
        ...currentLog,
        response_received: response || undefined,
        response_at: response ? new Date().toISOString() : undefined,
        employee_notes: notes,
        status: response ? 'replied' : 'no_response'
      };
      
      setConversationLogs(prev => 
        prev.map(log => log.id === currentLog.id ? updatedLog : log)
      );
    }
    
    console.log('تم تسجيل رد العميل:', { response, notes });
  };

  // معالج إرسال العقارات المختارة
  const handleSendProperties = (selectedProperties: Property[], message: string) => {
    // حفظ الرسالة المرسلة
    setSentMessage(message);
    
    // إنشاء سجل المحادثة
    const newLog: ConversationLog = {
      id: `${client.id}_properties_${Date.now()}`,
      client_id: client.id,
      message_sent: message,
      sent_at: new Date().toISOString(),
      status: 'sent'
    };
    
    setConversationLogs(prev => [...prev, newLog]);
    
    // فتح WhatsApp
    const phoneNumber = client.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    
    // إظهار نافذة التأكيد
    setShowConfirmationDialog(true);
    
    if (onTakeAction) onTakeAction(client);
    
    console.log(`تم إرسال ${selectedProperties.length} عقارات للعميل ${client.full_name}`);
  };

  // معالج الإجراءات
  const handleActionSelected = (action: ActionOption, client: ClientEvaluation) => {
    setShowActionDialog(false);
    
    switch (action.type) {
      case 'call':
        // فتح تطبيق الهاتف للاتصال
        window.open(`tel:${client.phone}`, '_self');
        if (onTakeAction) onTakeAction(client);
        break;
        
      case 'whatsapp':
        // فتح نافذة اختيار القالب
        setShowWhatsAppDialog(true);
        break;
        
      case 'email':
        // فتح تطبيق الإيميل
        const subject = `متابعة العميل ${client.full_name}`;
        const body = `عزيزي ${client.full_name}،\n\nأتواصل معك للمتابعة حول احتياجاتك العقارية.`;
        window.open(`mailto:${client.phone}@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_self');
        if (onTakeAction) onTakeAction(client);
        break;
        
      case 'schedule_meeting':
        // إضافة إلى التقويم أو فتح نافذة أخرى للجدولة
        alert(`تم فتح نافذة جدولة الموعد للعميل ${client.full_name}`);
        if (onTakeAction) onTakeAction(client);
        break;
        
      case 'send_properties':
        // فتح نافذة العقارات المقترحة
        setShowPropertyDialog(true);
        break;
        
      case 'add_reminder':
        // إضافة تذكير
        alert(`تم إضافة تذكير للمتابعة مع العميل ${client.full_name}`);
        if (onTakeAction) onTakeAction(client);
        break;
        
      default:
        console.log(`تم تنفيذ الإجراء: ${action.label} للعميل: ${client.full_name}`);
        if (onTakeAction) onTakeAction(client);
    }
  };

  return (
    <Card className="border border-gray-200 hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        {/* معلومات العميل الأساسية */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {client.full_name.charAt(0)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{client.full_name}</h3>
              <p className="text-sm text-gray-600">{client.phone} • {client.location}</p>
              {client.assigned_to && (
                <p className="text-xs text-blue-600">مسؤول: {client.assigned_to}</p>
              )}
            </div>
          </div>
          
          <div className="text-left">
            {renderStars(client.overall_score)}
            <div className="flex space-x-2 mt-2">
              <Badge className={getStatusColor(client.status)}>
              {getStatusText(client.status)}
            </Badge>
              <Badge className={getPriorityColor(client.priority)}>
                {getPriorityText(client.priority)}
              </Badge>
            </div>
          </div>
        </div>

        {/* المقاييس الأساسية */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="text-center">
            <p className={`text-lg font-bold ${getMetricColor(client.communication_frequency)}`}>
              {client.communication_frequency}%
            </p>
            <p className="text-xs text-gray-600">تكرار التواصل</p>
          </div>
          
          <div className="text-center">
            <p className={`text-lg font-bold ${getMetricColor(client.timing_urgency)}`}>
              {client.timing_urgency}%
            </p>
            <p className="text-xs text-gray-600">إلحاح التوقيت</p>
          </div>
          
          <div className="text-center">
            <p className={`text-lg font-bold ${getMetricColor(client.budget_clarity)}`}>
              {client.budget_clarity}%
            </p>
            <p className="text-xs text-gray-600">وضوح الميزانية</p>
          </div>
          
          <div className="text-center">
            <p className={`text-lg font-bold ${getMetricColor(client.response_rate)}`}>
              {client.response_rate}%
            </p>
            <p className="text-xs text-gray-600">معدل الاستجابة</p>
          </div>
          
          <div className="text-center">
            <p className={`text-lg font-bold ${getMetricColor(client.preview_activity)}`}>
              {client.preview_activity}%
            </p>
            <p className="text-xs text-gray-600">نشاط المعاينة</p>
          </div>
        </div>

        {/* التوصيات */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Clock className="h-4 w-4 text-gray-600" />
            <h4 className="font-semibold text-gray-800">التوصيات:</h4>
          </div>
          <ul className="space-y-2">
            {client.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* الملاحظات (إذا كانت موجودة) */}
        {client.notes && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <h4 className="font-semibold text-blue-800">ملاحظات:</h4>
            </div>
            <p className="text-sm text-blue-700">{client.notes}</p>
          </div>
        )}

        {/* أزرار الإجراءات */}
        <div className="flex space-x-3">
          <Button 
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowActionDialog(true)}
          >
            <Send className="h-4 w-4 mr-2" />
            اتخاذ إجراء
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onEdit(client)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onDelete(client.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* التفاصيل الإضافية */}
        {showDetails && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-3">تفاصيل إضافية:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">آخر تواصل:</span>
                <p className="font-medium">{client.last_contact_date}</p>
              </div>
              <div>
                <span className="text-gray-600">معرف العميل:</span>
                <p className="font-medium">{client.id}</p>
              </div>
            </div>
          </div>
        )}

        {/* نافذة حوار الإجراءات */}
        {showActionDialog && (
          <ActionDialog
            client={client}
            isOpen={showActionDialog}
            onClose={() => setShowActionDialog(false)}
            onActionSelected={handleActionSelected}
          />
        )}

        {/* نافذة اختيار قالب WhatsApp */}
        {showWhatsAppDialog && (
          <WhatsAppTemplateDialog
            client={client}
            isOpen={showWhatsAppDialog}
            onClose={() => setShowWhatsAppDialog(false)}
            onSendMessage={handleWhatsAppSend}
          />
        )}

        {/* نافذة تأكيد الإرسال */}
        {showConfirmationDialog && (
          <MessageSentConfirmation
            isOpen={showConfirmationDialog}
            onClose={() => setShowConfirmationDialog(false)}
            messageSent={sentMessage}
            clientName={client.full_name}
            onLogResponse={handleLogResponse}
          />
        )}

        {/* نافذة العقارات المقترحة */}
        {showPropertyDialog && (
          <ClientPropertyRecommendations
            client={client}
            isOpen={showPropertyDialog}
            onClose={() => setShowPropertyDialog(false)}
            onSendProperties={handleSendProperties}
          />
        )}
      </CardContent>
    </Card>
  );
};

// المكون الرئيسي لتقييم العملاء
export default function ClientEvaluation() {
  const [clients, setClients] = useState<ClientEvaluation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<ClientEvaluation | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationLog[]>([]);
  const [pendingFollowups, setPendingFollowups] = useState<string[]>([]);

  // جلب عملاء CRM وتحويلهم لتقييم
  useEffect(() => {
    const fetchCrmClients = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('updated_at', { ascending: false });
        if (error) throw error;
        const mapped = (data as unknown as CrmClient[]).map(mapCrmClientToEvaluation);
        setClients(mapped);
      } catch (err) {
        console.error('فشل تحميل عملاء CRM:', err);
        // كخطة بديلة، يمكن استخدام البيانات التجريبية إن رغبت لاحقاً
      }
    };
    fetchCrmClients();
  }, []);

  // إحصائيات التقييم
  const getScoreDistribution = () => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    clients.forEach(client => {
      distribution[client.overall_score as keyof typeof distribution]++;
    });
    return distribution;
  };

  const scoreDistribution = getScoreDistribution();

  const performReanalysis = async () => {
    setIsAnalyzing(true);
    // محاكاة عملية إعادة التحليل
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsAnalyzing(false);
  };

  const handleEditClient = (client: ClientEvaluation) => {
    setEditingClient(client);
    setIsEditDialogOpen(true);
  };

  const handleSaveClient = (updatedClient: ClientEvaluation) => {
    setClients(clients.map(client => 
      client.id === updatedClient.id ? updatedClient : client
    ));
  };

  const handleDeleteClient = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      setClients(clients.filter(client => client.id !== id));
    }
  };

  const handleTakeAction = (client: ClientEvaluation) => {
    // تسجيل الإجراء المتخذ
    console.log(`تم اتخاذ إجراء للعميل: ${client.full_name}`);
    
    // تحديث تاريخ آخر تواصل
    const updatedClients = clients.map(c => 
      c.id === client.id 
        ? { ...c, last_contact_date: new Date().toISOString().split('T')[0] }
        : c
    );
    setClients(updatedClients);
  };

  // إضافة سجل محادثة جديد
  const addConversationLog = (log: ConversationLog) => {
    setConversationHistory(prev => [...prev, log]);
    
    // إضافة تذكير للمتابعة إذا لم يرد العميل
    setTimeout(() => {
      const updatedLog = conversationHistory.find(l => l.id === log.id);
      if (updatedLog && updatedLog.status === 'sent') {
        setPendingFollowups(prev => [...prev, log.client_id]);
        // يمكن إضافة إشعار للموظف هنا
        console.log(`تذكير: العميل ${log.client_id} لم يرد على الرسالة`);
      }
    }, 24 * 60 * 60 * 1000); // 24 ساعة
  };

  // إحصائيات المحادثات
  const getConversationStats = () => {
    const totalMessages = conversationHistory.length;
    const repliedMessages = conversationHistory.filter(log => log.status === 'replied').length;
    const responseRate = totalMessages > 0 ? (repliedMessages / totalMessages) * 100 : 0;
    
    return {
      totalMessages,
      repliedMessages,
      responseRate: Math.round(responseRate),
      pendingFollowups: pendingFollowups.length
    };
  };

  const exportReport = () => {
    const csvContent = [
      ['الاسم', 'الهاتف', 'الموقع', 'التقييم', 'الحالة', 'الأولوية', 'آخر تواصل'],
      ...clients.map(client => [
        client.full_name,
        client.phone,
        client.location,
        `${client.overall_score} نجوم`,
        getStatusText(client.status),
        getPriorityText(client.priority),
        client.last_contact_date
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'تقرير-تقييم-العملاء.csv';
    link.click();
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'hot_lead': return 'عميل ساخن';
      case 'active': return 'نشط';
      case 'needs_followup': return 'يحتاج متابعة';
      case 'cold_lead': return 'عميل بارد';
      default: return 'غير محدد';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'عالية';
      case 'medium': return 'متوسطة';
      case 'low': return 'منخفضة';
      default: return 'غير محدد';
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesStatus = selectedStatus === 'all' || client.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || client.priority === selectedPriority;
    const matchesSearch = client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone.includes(searchTerm) ||
                         client.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* العنوان الرئيسي */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-white bg-opacity-20 p-3 rounded-lg">
            <Users className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">تحليل جدية العملاء</h1>
            <p className="text-blue-100 text-lg">
              تقييم ذكي لمستوى جدية العملاء واحتمالية إتمام الصفقة
            </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={() => setShowCharts(!showCharts)}
              variant="outline"
              className="bg-white bg-opacity-20 border-white text-white hover:bg-white hover:text-blue-600"
            >
              {showCharts ? <BarChart3 className="h-4 w-4" /> : <PieChart className="h-4 w-4" />}
              {showCharts ? 'إخفاء الرسوم' : 'عرض الرسوم'}
            </Button>
            <Button
              onClick={exportReport}
              variant="outline"
              className="bg-white bg-opacity-20 border-white text-white hover:bg-white hover:text-blue-600"
            >
              <Download className="h-4 w-4 mr-2" />
              تصدير التقرير
            </Button>
          </div>
        </div>
      </div>

      {/* توزيع التقييمات بالنجوم */}
      <div className="grid grid-cols-5 gap-4">
        {[5, 4, 3, 2, 1].map((stars) => (
          <Card key={stars} className="text-center p-4">
            <div className="flex justify-center mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {scoreDistribution[stars as keyof typeof scoreDistribution]}
            </p>
            <p className="text-sm text-gray-600">{stars} نجوم</p>
          </Card>
        ))}
      </div>

      {/* أدوات البحث والتصفية */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* البحث */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث في العملاء..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* تصفية الحالة */}
            <div className="lg:w-48">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">جميع الحالات</option>
                <option value="hot_lead">عملاء ساخنون</option>
                <option value="active">نشطون</option>
                <option value="needs_followup">يحتاجون متابعة</option>
                <option value="cold_lead">عملاء باردون</option>
              </select>
            </div>

            {/* تصفية الأولوية */}
            <div className="lg:w-48">
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">جميع الأولويات</option>
                <option value="high">عالية</option>
                <option value="medium">متوسطة</option>
                <option value="low">منخفضة</option>
              </select>
            </div>

            {/* إعادة التحليل */}
          <Button
            onClick={performReanalysis}
            disabled={isAnalyzing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            إعادة التحليل
          </Button>
          </div>
        </CardContent>
      </Card>

      {/* الرسوم البيانية */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>توزيع الحالات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['hot_lead', 'active', 'needs_followup', 'cold_lead'].map(status => {
                  const count = clients.filter(c => c.status === status).length;
                  const percentage = clients.length > 0 ? (count / clients.length) * 100 : 0;
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{getStatusText(status)}</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={percentage} className="w-20" />
                        <span className="text-sm font-medium w-12">{Math.round(percentage)}%</span>
                      </div>
                    </div>
                  );
                })}
        </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>توزيع الأولويات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['high', 'medium', 'low'].map(priority => {
                  const count = clients.filter(c => c.priority === priority).length;
                  const percentage = clients.length > 0 ? (count / clients.length) * 100 : 0;
                  return (
                    <div key={priority} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{getPriorityText(priority)}</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={percentage} className="w-20" />
                        <span className="text-sm font-medium w-12">{Math.round(percentage)}%</span>
        </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
          <div className="text-sm text-gray-600">إجمالي العملاء</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-red-600">
            {clients.filter(c => c.status === 'hot_lead').length}
          </div>
          <div className="text-sm text-gray-600">عملاء ساخنون</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {clients.filter(c => c.status === 'needs_followup').length}
          </div>
          <div className="text-sm text-gray-600">يحتاجون متابعة</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-green-600">
            {clients.filter(c => c.priority === 'high').length}
          </div>
          <div className="text-sm text-gray-600">أولوية عالية</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-purple-600">
            {getConversationStats().totalMessages}
          </div>
          <div className="text-sm text-gray-600">رسائل مرسلة</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-orange-600">
            {getConversationStats().responseRate}%
          </div>
          <div className="text-sm text-gray-600">معدل الرد</div>
        </Card>
      </div>

      {/* تنبيهات المتابعة */}
      {pendingFollowups.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Bell className="h-5 w-5 text-orange-600" />
              <h4 className="font-semibold text-orange-800">تذكيرات المتابعة</h4>
              <Badge variant="destructive">{pendingFollowups.length}</Badge>
            </div>
            <p className="text-sm text-orange-700">
              لديك {pendingFollowups.length} عملاء يحتاجون متابعة (لم يردوا على رسائل WhatsApp خلال 24 ساعة)
            </p>
            <Button 
              size="sm" 
              className="mt-2 bg-orange-600 hover:bg-orange-700"
              onClick={() => setSelectedStatus('needs_followup')}
            >
              عرض العملاء المطلوب متابعتهم
            </Button>
          </CardContent>
        </Card>
      )}

      {/* قائمة تقييم العملاء */}
      <div className="space-y-4">
        {filteredClients.map((client) => (
          <ClientEvaluationCard 
            key={client.id} 
            client={client}
            onEdit={handleEditClient}
            onDelete={handleDeleteClient}
            onTakeAction={handleTakeAction}
          />
        ))}
      </div>

      {/* رسالة إذا لم توجد نتائج */}
      {filteredClients.length === 0 && (
        <Card className="text-center p-8">
          <div className="text-gray-500">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد نتائج</h3>
            <p className="text-gray-600">جرب تغيير معايير البحث أو التصفية</p>
          </div>
        </Card>
      )}

      {/* نافذة تعديل التقييم */}
      {editingClient && (
        <EditEvaluationDialog
          client={editingClient}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingClient(null);
          }}
          onSave={handleSaveClient}
        />
      )}
    </div>
  );
}
