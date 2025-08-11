-- AI Engine Foundation Migration
-- Creates the foundational database structure for AI-powered real estate CRM

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create clients table with multilingual support
CREATE TABLE IF NOT EXISTS ai_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_info JSONB NOT NULL DEFAULT '{}',
    preferences JSONB NOT NULL DEFAULT '{}',
    assigned_broker_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create properties table with multilingual support
CREATE TABLE IF NOT EXISTS ai_properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    type VARCHAR(100) NOT NULL,
    price DECIMAL(15,2),
    area DECIMAL(10,2),
    location JSONB NOT NULL DEFAULT '{}',
    features JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'available',
    listed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create client interactions table
CREATE TABLE IF NOT EXISTS ai_client_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES ai_clients(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    channel VARCHAR(100) NOT NULL,
    notes TEXT,
    property_ids_sent JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system configuration table
CREATE TABLE IF NOT EXISTS ai_system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI engine logs table for monitoring and debugging
CREATE TABLE IF NOT EXISTS ai_engine_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation VARCHAR(100) NOT NULL,
    input_data JSONB,
    output_data JSONB,
    execution_time_ms INTEGER,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_clients_broker_id ON ai_clients(assigned_broker_id);
CREATE INDEX IF NOT EXISTS idx_ai_clients_created_at ON ai_clients(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_properties_status ON ai_properties(status);
CREATE INDEX IF NOT EXISTS idx_ai_properties_type ON ai_properties(type);
CREATE INDEX IF NOT EXISTS idx_ai_properties_price ON ai_properties(price);
CREATE INDEX IF NOT EXISTS idx_ai_client_interactions_client_id ON ai_client_interactions(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_client_interactions_date ON ai_client_interactions(date);
CREATE INDEX IF NOT EXISTS idx_ai_system_config_key ON ai_system_config(key);
CREATE INDEX IF NOT EXISTS idx_ai_engine_logs_operation ON ai_engine_logs(operation);
CREATE INDEX IF NOT EXISTS idx_ai_engine_logs_created_at ON ai_engine_logs(created_at);

-- Insert initial system configuration
INSERT INTO ai_system_config (key, value) VALUES
('ai_engine_version', '"1.0.0"'),
('supported_languages', '["en", "ar"]'),
('default_preferences', '{"min_price": 0, "max_price": 1000000, "property_types": ["apartment", "villa", "office"]}'),
('matching_algorithm', '"basic_similarity"'),
('market_analysis_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_ai_clients_updated_at 
    BEFORE UPDATE ON ai_clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_properties_updated_at 
    BEFORE UPDATE ON ai_properties 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE ai_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_client_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_engine_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic - can be customized based on your auth system)
CREATE POLICY "Enable read access for authenticated users" ON ai_clients
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON ai_clients
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON ai_clients
    FOR UPDATE USING (true);

CREATE POLICY "Enable read access for authenticated users" ON ai_properties
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON ai_properties
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON ai_properties
    FOR UPDATE USING (true);

CREATE POLICY "Enable read access for authenticated users" ON ai_client_interactions
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON ai_client_interactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for authenticated users" ON ai_system_config
    FOR SELECT USING (true);

CREATE POLICY "Enable update for authenticated users" ON ai_system_config
    FOR UPDATE USING (true);

CREATE POLICY "Enable read access for authenticated users" ON ai_engine_logs
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON ai_engine_logs
    FOR INSERT WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
