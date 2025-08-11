-- إنشاء البنية التحتية لنظام إعدادات الذكاء الاصطناعي
-- AI Settings Infrastructure Migration

-- جدول إعدادات الذكاء الاصطناعي الرئيسية
CREATE TABLE IF NOT EXISTS ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN (
    'general', 'propertyMatching', 'clientAnalysis', 'marketInsights',
    'notifications', 'uaeSpecific', 'integrations', 'security', 
    'performance', 'machineLearning', 'analytics'
  )),
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  company_id UUID DEFAULT NULL,
  is_global BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, key, user_id, company_id)
);

-- جدول إعدادات السوق الإماراتي المتخصصة
CREATE TABLE IF NOT EXISTS uae_market_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_id UUID DEFAULT NULL,
  
  -- الإعدادات الجغرافية
  primary_emirate TEXT DEFAULT 'عجمان',
  focus_areas TEXT[] DEFAULT ARRAY['مدينة عجمان', 'الراشدية', 'النعيمية', 'الحميدية'],
  nearby_emirates_included BOOLEAN DEFAULT TRUE,
  search_radius_km INTEGER DEFAULT 50,
  
  -- إعدادات اللغة والتواصل
  primary_language TEXT DEFAULT 'ar' CHECK (primary_language IN ('ar', 'en')),
  secondary_language TEXT DEFAULT 'en' CHECK (secondary_language IN ('ar', 'en', 'none')),
  arabic_dialect TEXT DEFAULT 'gulf' CHECK (arabic_dialect IN ('gulf', 'levantine', 'egyptian', 'standard')),
  translation_quality INTEGER DEFAULT 85 CHECK (translation_quality BETWEEN 50 AND 100),
  
  -- الإعدادات الثقافية والدينية
  respect_prayer_times BOOLEAN DEFAULT TRUE,
  observe_local_holidays BOOLEAN DEFAULT TRUE,
  weekend_friday_saturday BOOLEAN DEFAULT TRUE,
  cultural_sensitivity BOOLEAN DEFAULT TRUE,
  family_oriented_content BOOLEAN DEFAULT TRUE,
  gender_separate_options BOOLEAN DEFAULT FALSE,
  
  -- الإعدادات القانونية والتنظيمية
  uae_property_laws BOOLEAN DEFAULT TRUE,
  visa_requirements BOOLEAN DEFAULT TRUE,
  banking_regulations BOOLEAN DEFAULT TRUE,
  emirati_preference BOOLEAN DEFAULT TRUE,
  foreign_ownership_rules BOOLEAN DEFAULT TRUE,
  
  -- إعدادات العملة والأسعار
  primary_currency TEXT DEFAULT 'AED' CHECK (primary_currency IN ('AED', 'USD')),
  show_multiple_currencies BOOLEAN DEFAULT TRUE,
  exchange_rate_updates BOOLEAN DEFAULT TRUE,
  price_formatting TEXT DEFAULT 'arabic' CHECK (price_formatting IN ('arabic', 'western')),
  
  -- إعدادات العمل والتواصل
  business_hours_start TIME DEFAULT '09:00',
  business_hours_end TIME DEFAULT '18:00',
  adjust_for_ramadan BOOLEAN DEFAULT TRUE,
  communication_style TEXT DEFAULT 'friendly' CHECK (communication_style IN ('formal', 'friendly', 'mixed')),
  client_followup_frequency INTEGER DEFAULT 3 CHECK (client_followup_frequency BETWEEN 1 AND 14),
  local_partner_preference BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

-- جدول نماذج الذكاء الاصطناعي المحلية
CREATE TABLE IF NOT EXISTS ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'property_matcher', 'market_predictor', 'client_classifier', 
    'price_estimator', 'demand_forecaster', 'sentiment_analyzer'
  )),
  region TEXT DEFAULT 'uae',
  specialization TEXT[] DEFAULT ARRAY['real_estate'],
  
  -- تكوين النموذج
  config JSONB NOT NULL DEFAULT '{}',
  parameters JSONB DEFAULT '{}',
  training_data_sources TEXT[] DEFAULT ARRAY[],
  
  -- حالة النموذج
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'training', 'inactive', 'deprecated')),
  version TEXT DEFAULT '1.0.0',
  accuracy_score DECIMAL(5,2) DEFAULT 0.00,
  last_training_date TIMESTAMP WITH TIME ZONE,
  
  -- بيانات الأداء
  total_predictions INTEGER DEFAULT 0,
  successful_predictions INTEGER DEFAULT 0,
  average_response_time_ms INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول تكاملات المنصات الخارجية
CREATE TABLE IF NOT EXISTS external_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_id UUID DEFAULT NULL,
  platform TEXT NOT NULL CHECK (platform IN (
    'dubizzle', 'bayut', 'propertyfinder', 'whatsapp_business', 
    'google_maps', 'banking_apis', 'crm_systems'
  )),
  
  -- إعدادات الاتصال
  is_enabled BOOLEAN DEFAULT FALSE,
  api_key TEXT DEFAULT NULL,
  api_secret TEXT DEFAULT NULL,
  webhook_url TEXT DEFAULT NULL,
  
  -- إعدادات المزامنة
  sync_frequency_hours INTEGER DEFAULT 24,
  auto_import BOOLEAN DEFAULT FALSE,
  auto_export BOOLEAN DEFAULT FALSE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  
  -- إعدادات خاصة
  custom_config JSONB DEFAULT '{}',
  
  -- حالة الاتصال
  connection_status TEXT DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'error')),
  last_test_at TIMESTAMP WITH TIME ZONE,
  test_result JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, company_id, platform)
);

-- جدول قيم التكوين المحددة مسبقاً
CREATE TABLE IF NOT EXISTS ai_config_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  preset_type TEXT NOT NULL CHECK (preset_type IN ('uae_real_estate', 'general', 'enterprise')),
  config JSONB NOT NULL,
  is_system_preset BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول سجل التغييرات للإعدادات
CREATE TABLE IF NOT EXISTS ai_settings_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_ai_settings_category ON ai_settings(category);
CREATE INDEX IF NOT EXISTS idx_ai_settings_user_id ON ai_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_settings_company_id ON ai_settings(company_id);

CREATE INDEX IF NOT EXISTS idx_uae_market_settings_user_id ON uae_market_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_uae_market_settings_company_id ON uae_market_settings(company_id);

CREATE INDEX IF NOT EXISTS idx_ai_models_type ON ai_models(type);
CREATE INDEX IF NOT EXISTS idx_ai_models_status ON ai_models(status);
CREATE INDEX IF NOT EXISTS idx_ai_models_region ON ai_models(region);

CREATE INDEX IF NOT EXISTS idx_external_integrations_platform ON external_integrations(platform);
CREATE INDEX IF NOT EXISTS idx_external_integrations_status ON external_integrations(connection_status);

-- إنشاء triggers لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_settings_updated_at BEFORE UPDATE ON ai_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_uae_market_settings_updated_at BEFORE UPDATE ON uae_market_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON ai_models 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_integrations_updated_at BEFORE UPDATE ON external_integrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- إنشاء trigger لتسجيل التغييرات في سجل التدقيق
CREATE OR REPLACE FUNCTION audit_settings_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO ai_settings_audit (table_name, record_id, action, old_values, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), COALESCE(OLD.user_id, auth.uid()));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO ai_settings_audit (table_name, record_id, action, old_values, new_values, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), COALESCE(NEW.user_id, auth.uid()));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO ai_settings_audit (table_name, record_id, action, new_values, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(NEW), COALESCE(NEW.user_id, auth.uid()));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- تطبيق triggers للتدقيق على الجداول الرئيسية
CREATE TRIGGER audit_ai_settings_changes AFTER INSERT OR UPDATE OR DELETE ON ai_settings
    FOR EACH ROW EXECUTE FUNCTION audit_settings_changes();

CREATE TRIGGER audit_uae_market_settings_changes AFTER INSERT OR UPDATE OR DELETE ON uae_market_settings
    FOR EACH ROW EXECUTE FUNCTION audit_settings_changes();

-- إدراج القيم الافتراضية لنماذج الذكاء الاصطناعي الإماراتية
INSERT INTO ai_models (name, display_name, type, region, config, status, version) VALUES
('uae_property_matcher', 'مطابق العقارات الإماراتي', 'property_matcher', 'uae', 
 '{"algorithms": ["collaborative_filtering", "content_based"], "uae_preferences": true}', 'active', '2.1.0'),

('ajman_market_predictor', 'متنبئ السوق العقاري - عجمان', 'market_predictor', 'ajman',
 '{"prediction_horizon_months": 12, "local_factors": true, "seasonal_adjustments": true}', 'active', '1.8.0'),

('arabic_client_classifier', 'مصنف العملاء العربي', 'client_classifier', 'gulf',
 '{"language_support": ["ar", "en"], "cultural_factors": true, "emirati_priority": true}', 'active', '1.5.0'),

('uae_price_estimator', 'مقدر الأسعار الإماراتي', 'price_estimator', 'uae',
 '{"currency": "AED", "local_regulations": true, "market_data_sources": ["dubizzle", "bayut"]}', 'active', '2.0.0'),

('gulf_sentiment_analyzer', 'محلل المشاعر الخليجي', 'sentiment_analyzer', 'gulf',
 '{"dialect_support": "gulf", "cultural_context": true, "formal_informal_detection": true}', 'training', '0.9.0');

-- إدراج الإعدادات المحددة مسبقاً
INSERT INTO ai_config_presets (name, description, preset_type, config, is_system_preset) VALUES
('إعدادات عجمان الأساسية', 'التكوين الأساسي للعمل في إمارة عجمان', 'uae_real_estate', 
 '{"location": {"primary_emirate": "عجمان", "focus_areas": ["مدينة عجمان", "الراشدية", "النعيمية"]}, 
   "cultural": {"respect_prayer_times": true, "arabic_priority": true}, 
   "currency": {"primary_currency": "AED"}}', true),

('إعدادات دبي المتقدمة', 'التكوين المتقدم للعمل في إمارة دبي', 'uae_real_estate',
 '{"location": {"primary_emirate": "دبي", "focus_areas": ["دبي مارينا", "وسط دبي", "دبي هيلز"]}, 
   "integrations": {"dubizzle": true, "bayut": true, "propertyfinder": true}}', true),

('الإعدادات العامة الشاملة', 'إعدادات عامة تناسب جميع الأسواق', 'general',
 '{"general": {"language": "both", "learning_mode": true}, 
   "performance": {"cache_enabled": true, "optimization": true}}', true);

-- إنشاء Row Level Security (RLS) للأمان
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE uae_market_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_settings_audit ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للمستخدمين
CREATE POLICY "Users can read their own AI settings" ON ai_settings FOR SELECT
    USING (auth.uid() = user_id OR is_global = true);

CREATE POLICY "Users can insert their own AI settings" ON ai_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI settings" ON ai_settings FOR UPDATE
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI settings" ON ai_settings FOR DELETE
    USING (auth.uid() = user_id);

-- نفس السياسات للجداول الأخرى
CREATE POLICY "Users can manage their UAE settings" ON uae_market_settings FOR ALL
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their integrations" ON external_integrations FOR ALL
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their audit logs" ON ai_settings_audit FOR SELECT
    USING (auth.uid() = changed_by);

-- إنشاء views مفيدة
CREATE OR REPLACE VIEW ai_settings_summary AS
SELECT 
    user_id,
    category,
    COUNT(*) as setting_count,
    MAX(updated_at) as last_updated
FROM ai_settings 
GROUP BY user_id, category;

CREATE OR REPLACE VIEW active_ai_models AS
SELECT 
    name,
    display_name,
    type,
    region,
    accuracy_score,
    total_predictions,
    CASE 
        WHEN total_predictions > 0 THEN 
            ROUND((successful_predictions::DECIMAL / total_predictions) * 100, 2)
        ELSE 0 
    END as success_rate
FROM ai_models 
WHERE status = 'active'
ORDER BY accuracy_score DESC;

-- منح الصلاحيات اللازمة
GRANT ALL ON ai_settings TO authenticated;
GRANT ALL ON uae_market_settings TO authenticated;
GRANT ALL ON ai_models TO authenticated;
GRANT ALL ON external_integrations TO authenticated;
GRANT ALL ON ai_config_presets TO authenticated;
GRANT SELECT ON ai_settings_audit TO authenticated;
GRANT SELECT ON ai_settings_summary TO authenticated;
GRANT SELECT ON active_ai_models TO authenticated;

-- تعليق على الجداول للتوثيق
COMMENT ON TABLE ai_settings IS 'جدول الإعدادات الرئيسية لنظام الذكاء الاصطناعي';
COMMENT ON TABLE uae_market_settings IS 'إعدادات متخصصة للسوق العقاري الإماراتي';
COMMENT ON TABLE ai_models IS 'نماذج الذكاء الاصطناعي المحلية والمتخصصة';
COMMENT ON TABLE external_integrations IS 'تكاملات مع المنصات والخدمات الخارجية';
COMMENT ON TABLE ai_settings_audit IS 'سجل تدقيق لجميع تغييرات الإعدادات';


