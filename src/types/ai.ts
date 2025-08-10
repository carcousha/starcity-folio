// أنواع البيانات لوحدة الذكاء الاصطناعي

export interface Client {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  budget_min: number;
  budget_max: number;
  preferred_area: string[];
  property_type: PropertyType[];
  purpose: 'residential' | 'investment' | 'both';
  area_min?: number;
  area_max?: number;
  bedrooms_min?: number;
  bathrooms_min?: number;
  urgency_level: 1 | 2 | 3 | 4 | 5;
  last_contact_date: string;
  contact_frequency: number;
  interaction_score: number;
  created_at: string;
  updated_at: string;
  assigned_broker_id?: string;
  status: 'active' | 'inactive' | 'converted' | 'lost';
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  property_type: PropertyType;
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

export type PropertyType = 
  | 'villa' 
  | 'apartment' 
  | 'land' 
  | 'office' 
  | 'warehouse' 
  | 'shop' 
  | 'building';

export interface PropertyMatch {
  property_id: string;
  property: Property;
  match_score: number;
  match_reasons: string[];
  previously_sent: boolean;
  sent_date?: string;
}

export interface ClientIntentScore {
  client_id: string;
  overall_score: number; // 1-5
  contact_frequency_score: number;
  urgency_score: number;
  clarity_score: number;
  interaction_score: number;
  last_calculated: string;
  factors: {
    positive: string[];
    negative: string[];
  };
}

export interface BrokerRecommendation {
  id: string;
  type: 'follow_up' | 'property_match' | 'broker_assignment' | 'market_insight';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  client_id?: string;
  property_id?: string;
  broker_id?: string;
  created_at: string;
  is_read: boolean;
  action_required: boolean;
  action_deadline?: string;
}

export interface MarketInsight {
  id: string;
  insight_type: 'trend' | 'opportunity' | 'warning' | 'analysis';
  title: string;
  description: string;
  data: {
    area: string;
    property_type: PropertyType;
    avg_price: number;
    demand_level: 'low' | 'medium' | 'high';
    supply_level: 'low' | 'medium' | 'high';
    price_trend: 'increasing' | 'decreasing' | 'stable';
    days_on_market_avg: number;
  };
  confidence_score: number;
  created_at: string;
  expires_at?: string;
}

export interface AIEngineConfig {
  id: string;
  name: string;
  description: string;
  weights: {
    budget: number;
    area: number;
    property_type: number;
    location: number;
    features: number;
    urgency: number;
  };
  thresholds: {
    min_match_score: number;
    high_intent_score: number;
    follow_up_days: number;
    market_analysis_frequency: number;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIAnalysisResult {
  client_id: string;
  analysis_date: string;
  property_matches: PropertyMatch[];
  intent_score: ClientIntentScore;
  recommendations: BrokerRecommendation[];
  market_insights: MarketInsight[];
  next_best_actions: string[];
}

// أنواع جديدة لإدارة المحادثات والتفاعلات
export interface Conversation {
  id: string;
  client_id: string;
  broker_id?: string;
  messages: Message[];
  sentiment_score: number;
  intent_detected: string;
  follow_up_required: boolean;
  created_at: string;
  updated_at: string;
  status: 'active' | 'closed' | 'archived';
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'client' | 'broker' | 'ai_assistant';
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'document' | 'voice';
  timestamp: string;
  is_ai_generated: boolean;
  sentiment?: 'positive' | 'negative' | 'neutral';
  keywords: string[];
}

// أنواع لتحليل سلوك العميل
export interface ClientBehavior {
  client_id: string;
  analysis_date: string;
  browsing_patterns: {
    most_viewed_properties: string[];
    search_frequency: number;
    session_duration_avg: number;
    time_of_day_preference: string;
  };
  communication_preferences: {
    preferred_channel: 'phone' | 'email' | 'whatsapp' | 'in_person';
    response_time_avg: number;
    message_length_preference: 'short' | 'medium' | 'long';
  };
  decision_factors: {
    price_sensitivity: number; // 1-5
    location_importance: number; // 1-5
    feature_importance: number; // 1-5
    urgency_factor: number; // 1-5
  };
}

// أنواع لإدارة التذكيرات والجدولة
export interface AIReminder {
  id: string;
  type: 'follow_up' | 'property_update' | 'market_alert' | 'client_birthday';
  title: string;
  description: string;
  client_id?: string;
  broker_id?: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_recurring: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  status: 'pending' | 'completed' | 'overdue' | 'cancelled';
  created_at: string;
  completed_at?: string;
}

// أنواع لتحليل الأداء والتحسين
export interface AIPerformanceMetrics {
  id: string;
  date: string;
  metrics: {
    total_recommendations: number;
    successful_matches: number;
    conversion_rate: number;
    response_time_avg: number;
    client_satisfaction_score: number;
    broker_efficiency_score: number;
  };
  insights: {
    top_performing_areas: string[];
    improvement_opportunities: string[];
    trend_analysis: string;
  };
}

// أنواع لإدارة القوالب والرسائل
export interface MessageTemplate {
  id: string;
  name: string;
  category: 'follow_up' | 'property_match' | 'market_update' | 'general';
  content: string;
  variables: string[];
  language: 'ar' | 'en';
  is_active: boolean;
  usage_count: number;
  success_rate: number;
  created_at: string;
  updated_at: string;
}

// أنواع لإدارة التعلم والتحسين
export interface AILearningData {
  id: string;
  data_type: 'client_feedback' | 'broker_feedback' | 'conversion_data' | 'market_data';
  content: any;
  feedback_score?: number;
  is_positive: boolean;
  tags: string[];
  created_at: string;
  processed: boolean;
}

// أنواع لإدارة التنبؤات والتحليلات المتقدمة
export interface MarketPrediction {
  id: string;
  area: string;
  property_type: PropertyType;
  prediction_type: 'price_trend' | 'demand_forecast' | 'supply_forecast' | 'market_cycle';
  timeframe: '1_month' | '3_months' | '6_months' | '1_year';
  prediction_value: number;
  confidence_level: number;
  factors: string[];
  created_at: string;
  expires_at: string;
}

// أنواع لإدارة التقارير والتحليلات
export interface AIReport {
  id: string;
  report_type: 'client_analysis' | 'market_analysis' | 'performance_analysis' | 'trend_analysis';
  title: string;
  summary: string;
  data: any;
  insights: string[];
  recommendations: string[];
  generated_at: string;
  expires_at?: string;
  is_automated: boolean;
}

// أنواع لإدارة الإعدادات والتكوين
export interface AISettings {
  id: string;
  setting_key: string;
  setting_value: any;
  setting_type: 'string' | 'number' | 'boolean' | 'object';
  description: string;
  is_editable: boolean;
  category: 'matching' | 'notifications' | 'analysis' | 'general';
  created_at: string;
  updated_at: string;
}

// أنواع لإدارة الأخطاء والسجلات
export interface AIErrorLog {
  id: string;
  error_type: 'matching_error' | 'analysis_error' | 'notification_error' | 'system_error';
  error_message: string;
  stack_trace?: string;
  context: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  created_at: string;
  resolved_at?: string;
}

// أنواع لإدارة الإشعارات والتنبيهات
export interface AINotification {
  id: string;
  type: 'alert' | 'info' | 'warning' | 'success';
  title: string;
  message: string;
  recipient_type: 'broker' | 'admin' | 'system';
  recipient_id?: string;
  data?: any;
  is_read: boolean;
  created_at: string;
  expires_at?: string;
  action_required: boolean;
  action_url?: string;
}
