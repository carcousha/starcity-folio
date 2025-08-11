-- AI Engine Advanced Features Migration
-- Extends the AI system with advanced analytics and recommendation tracking

-- Create recommendations table
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('follow_up', 'property_match', 'market_insight', 'broker_assignment')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    client_id UUID REFERENCES ai_clients(id) ON DELETE CASCADE,
    property_id UUID REFERENCES ai_properties(id) ON DELETE SET NULL,
    broker_id UUID,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    action_required BOOLEAN DEFAULT FALSE,
    action_deadline TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
    confidence_score DECIMAL(3,2) DEFAULT 0.80,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create client intent scores table
CREATE TABLE IF NOT EXISTS ai_client_intent_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES ai_clients(id) ON DELETE CASCADE,
    overall_score INTEGER NOT NULL CHECK (overall_score BETWEEN 1 AND 5),
    contact_frequency_score DECIMAL(3,2) DEFAULT 0.5,
    urgency_score DECIMAL(3,2) DEFAULT 0.5,
    clarity_score DECIMAL(3,2) DEFAULT 0.5,
    interaction_score DECIMAL(3,2) DEFAULT 0.5,
    factors JSONB DEFAULT '{"positive": [], "negative": []}',
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Create property matches table
CREATE TABLE IF NOT EXISTS ai_property_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES ai_clients(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES ai_properties(id) ON DELETE CASCADE,
    match_score INTEGER NOT NULL CHECK (match_score BETWEEN 0 AND 100),
    match_reasons JSONB DEFAULT '[]',
    was_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,
    client_response VARCHAR(50) CHECK (client_response IN ('interested', 'not_interested', 'viewed', 'contacted', 'scheduled_viewing')),
    response_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create market insights table
CREATE TABLE IF NOT EXISTS ai_market_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN ('trend', 'opportunity', 'warning', 'analysis')),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    area VARCHAR(200),
    property_type VARCHAR(100),
    data JSONB NOT NULL DEFAULT '{}',
    confidence_score DECIMAL(3,2) DEFAULT 0.75,
    impact_level VARCHAR(20) DEFAULT 'medium' CHECK (impact_level IN ('low', 'medium', 'high')),
    is_active BOOLEAN DEFAULT TRUE,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Create message templates table
CREATE TABLE IF NOT EXISTS ai_message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    language VARCHAR(5) DEFAULT 'ar',
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversation logs table
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES ai_clients(id) ON DELETE CASCADE,
    broker_id UUID,
    conversation_type VARCHAR(50) DEFAULT 'chat',
    messages JSONB DEFAULT '[]',
    sentiment_score DECIMAL(3,2) DEFAULT 0.5,
    intent_detected VARCHAR(100),
    follow_up_required BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics aggregations table
CREATE TABLE IF NOT EXISTS ai_analytics_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    total_recommendations INTEGER DEFAULT 0,
    successful_matches INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0.0,
    avg_response_time_hours DECIMAL(5,2) DEFAULT 0.0,
    top_performing_broker UUID,
    top_performing_area VARCHAR(200),
    insights_generated INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date)
);

-- Create AI settings table
CREATE TABLE IF NOT EXISTS ai_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    setting_type VARCHAR(50) NOT NULL CHECK (setting_type IN ('string', 'number', 'boolean', 'object', 'array')),
    description TEXT,
    is_editable BOOLEAN DEFAULT TRUE,
    category VARCHAR(100) DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance metrics table
CREATE TABLE IF NOT EXISTS ai_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_date DATE NOT NULL,
    metric_type VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    metadata JSONB DEFAULT '{}',
    broker_id UUID,
    client_segment VARCHAR(50),
    property_type VARCHAR(100),
    area VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(metric_date, metric_type, broker_id, client_segment, property_type, area)
);

-- Create learning data table for continuous improvement
CREATE TABLE IF NOT EXISTS ai_learning_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_type VARCHAR(100) NOT NULL,
    input_data JSONB NOT NULL,
    expected_output JSONB,
    actual_output JSONB,
    feedback_score DECIMAL(3,2),
    is_positive_feedback BOOLEAN,
    tags JSONB DEFAULT '[]',
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_client_id ON ai_recommendations(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_type ON ai_recommendations(type);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_priority ON ai_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_status ON ai_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_created_at ON ai_recommendations(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_broker_id ON ai_recommendations(broker_id);

CREATE INDEX IF NOT EXISTS idx_ai_client_intent_scores_client_id ON ai_client_intent_scores(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_client_intent_scores_overall_score ON ai_client_intent_scores(overall_score);
CREATE INDEX IF NOT EXISTS idx_ai_client_intent_scores_calculated_at ON ai_client_intent_scores(calculated_at);

CREATE INDEX IF NOT EXISTS idx_ai_property_matches_client_id ON ai_property_matches(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_property_matches_property_id ON ai_property_matches(property_id);
CREATE INDEX IF NOT EXISTS idx_ai_property_matches_match_score ON ai_property_matches(match_score);
CREATE INDEX IF NOT EXISTS idx_ai_property_matches_was_sent ON ai_property_matches(was_sent);

CREATE INDEX IF NOT EXISTS idx_ai_market_insights_insight_type ON ai_market_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_market_insights_area ON ai_market_insights(area);
CREATE INDEX IF NOT EXISTS idx_ai_market_insights_property_type ON ai_market_insights(property_type);
CREATE INDEX IF NOT EXISTS idx_ai_market_insights_generated_at ON ai_market_insights(generated_at);

CREATE INDEX IF NOT EXISTS idx_ai_message_templates_category ON ai_message_templates(category);
CREATE INDEX IF NOT EXISTS idx_ai_message_templates_language ON ai_message_templates(language);
CREATE INDEX IF NOT EXISTS idx_ai_message_templates_is_active ON ai_message_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_client_id ON ai_conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_broker_id ON ai_conversations(broker_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_status ON ai_conversations(status);

CREATE INDEX IF NOT EXISTS idx_ai_analytics_daily_date ON ai_analytics_daily(date);
CREATE INDEX IF NOT EXISTS idx_ai_performance_metrics_date ON ai_performance_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_ai_performance_metrics_type ON ai_performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_type ON ai_learning_data(data_type);
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_processed ON ai_learning_data(processed);

-- Add triggers for updated_at columns
CREATE TRIGGER update_ai_recommendations_updated_at 
    BEFORE UPDATE ON ai_recommendations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_message_templates_updated_at 
    BEFORE UPDATE ON ai_message_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at 
    BEFORE UPDATE ON ai_conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_settings_updated_at 
    BEFORE UPDATE ON ai_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all new tables
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_client_intent_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_property_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_market_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users" ON ai_recommendations FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON ai_recommendations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON ai_recommendations FOR UPDATE USING (true);

CREATE POLICY "Enable read access for authenticated users" ON ai_client_intent_scores FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON ai_client_intent_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON ai_client_intent_scores FOR UPDATE USING (true);

CREATE POLICY "Enable read access for authenticated users" ON ai_property_matches FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON ai_property_matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON ai_property_matches FOR UPDATE USING (true);

CREATE POLICY "Enable read access for authenticated users" ON ai_market_insights FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON ai_market_insights FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON ai_market_insights FOR UPDATE USING (true);

CREATE POLICY "Enable read access for authenticated users" ON ai_message_templates FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON ai_message_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON ai_message_templates FOR UPDATE USING (true);

CREATE POLICY "Enable read access for authenticated users" ON ai_conversations FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON ai_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON ai_conversations FOR UPDATE USING (true);

CREATE POLICY "Enable read access for authenticated users" ON ai_analytics_daily FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON ai_analytics_daily FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON ai_analytics_daily FOR UPDATE USING (true);

CREATE POLICY "Enable read access for authenticated users" ON ai_settings FOR SELECT USING (true);
CREATE POLICY "Enable update for authenticated users" ON ai_settings FOR UPDATE USING (true);

CREATE POLICY "Enable read access for authenticated users" ON ai_performance_metrics FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON ai_performance_metrics FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for authenticated users" ON ai_learning_data FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON ai_learning_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON ai_learning_data FOR UPDATE USING (true);

-- Insert default AI settings
INSERT INTO ai_settings (setting_key, setting_value, setting_type, description, category) VALUES
('ai_engine_enabled', 'true', 'boolean', 'Enable or disable AI engine', 'general'),
('min_match_score_threshold', '70', 'number', 'Minimum score for property matching', 'matching'),
('max_recommendations_per_client', '5', 'number', 'Maximum recommendations to generate per client', 'recommendations'),
('auto_follow_up_days', '3', 'number', 'Days before automatic follow-up recommendation', 'follow_up'),
('client_intent_refresh_hours', '24', 'number', 'Hours between client intent score recalculation', 'scoring'),
('market_insight_generation_enabled', 'true', 'boolean', 'Enable automatic market insights generation', 'insights'),
('conversation_sentiment_analysis', 'true', 'boolean', 'Enable sentiment analysis in conversations', 'conversations'),
('learning_mode_enabled', 'true', 'boolean', 'Enable machine learning data collection', 'learning'),
('notification_settings', '{"email": true, "sms": false, "push": true}', 'object', 'Notification preferences', 'notifications'),
('supported_property_types', '["villa", "apartment", "land", "office", "warehouse", "shop", "building"]', 'array', 'Supported property types', 'properties')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default message templates
INSERT INTO ai_message_templates (name, category, content, variables, language) VALUES
('welcome_new_client', 'general', 'مرحباً {{client_name}}، نحن سعداء لانضمامك إلينا! كيف يمكننا مساعدتك في العثور على العقار المثالي؟', '["client_name"]', 'ar'),
('property_recommendation', 'property_match', 'مرحباً {{client_name}}، وجدنا عقار رائع قد يناسبك في {{area}}! {{property_details}}', '["client_name", "area", "property_details"]', 'ar'),
('follow_up_reminder', 'follow_up', 'مرحباً {{client_name}}، أردنا المتابعة معك بخصوص {{subject}}. هل لديك أي أسئلة؟', '["client_name", "subject"]', 'ar'),
('market_update', 'market_insight', 'تحديث السوق: {{insight_title}}. {{insight_description}}', '["insight_title", "insight_description"]', 'ar'),
('appointment_confirmation', 'appointment', 'تأكيد موعد: {{appointment_date}} في {{location}} لمعاينة {{property_title}}', '["appointment_date", "location", "property_title"]', 'ar')
ON CONFLICT DO NOTHING;

-- Create a view for active recommendations with client details
CREATE OR REPLACE VIEW ai_active_recommendations AS
SELECT 
    r.*,
    c.name as client_name,
    c.contact_info as client_contact,
    p.title as property_title,
    p.type as property_type,
    p.price as property_price
FROM ai_recommendations r
LEFT JOIN ai_clients c ON r.client_id = c.id
LEFT JOIN ai_properties p ON r.property_id = p.id
WHERE r.status = 'active'
ORDER BY r.priority DESC, r.created_at DESC;

-- Create a view for client analytics summary
CREATE OR REPLACE VIEW ai_client_analytics_summary AS
SELECT 
    c.id,
    c.name,
    c.created_at,
    COUNT(r.id) as total_recommendations,
    COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed_recommendations,
    AVG(pm.match_score) as avg_match_score,
    MAX(cis.overall_score) as latest_intent_score,
    COUNT(CASE WHEN pm.client_response = 'interested' THEN 1 END) as interested_properties
FROM ai_clients c
LEFT JOIN ai_recommendations r ON c.id = r.client_id
LEFT JOIN ai_property_matches pm ON c.id = pm.client_id
LEFT JOIN ai_client_intent_scores cis ON c.id = cis.client_id
GROUP BY c.id, c.name, c.created_at;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
