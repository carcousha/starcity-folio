-- Create whatsapp_smart_logs table
CREATE TABLE IF NOT EXISTS whatsapp_smart_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES external_suppliers(id),
  task_id UUID REFERENCES daily_tasks(id),
  message_template TEXT NOT NULL,
  message_sent TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  status TEXT CHECK (status IN ('sent', 'delivered', 'read', 'failed')) DEFAULT 'sent',
  whatsapp_message_id TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_by TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_sent_at ON whatsapp_smart_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_sent_by ON whatsapp_smart_logs(sent_by);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_phone ON whatsapp_smart_logs(phone_number);

-- Enable RLS (Row Level Security)
ALTER TABLE whatsapp_smart_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own logs
CREATE POLICY "Users can view their own WhatsApp logs" ON whatsapp_smart_logs
  FOR SELECT USING (auth.uid()::text = sent_by);

-- Create policy for users to insert their own logs
CREATE POLICY "Users can insert their own WhatsApp logs" ON whatsapp_smart_logs
  FOR INSERT WITH CHECK (auth.uid()::text = sent_by);

-- Grant permissions
GRANT ALL ON whatsapp_smart_logs TO authenticated;
GRANT ALL ON whatsapp_smart_logs TO service_role;

