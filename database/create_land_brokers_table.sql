-- إنشاء جدول وسطاء الأراضي
CREATE TABLE IF NOT EXISTS land_brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  whatsapp_number TEXT,
  areas_specialization TEXT[] DEFAULT '{}',
  office_name TEXT,
  office_location TEXT,
  activity_status TEXT DEFAULT 'active' CHECK (activity_status IN ('active', 'medium', 'low', 'inactive')),
  deals_count INTEGER DEFAULT 0,
  total_sales_amount DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  language TEXT DEFAULT 'arabic' CHECK (language IN ('arabic', 'english')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهارس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_land_brokers_name ON land_brokers USING gin(to_tsvector('arabic', name));
CREATE INDEX IF NOT EXISTS idx_land_brokers_phone ON land_brokers(phone);
CREATE INDEX IF NOT EXISTS idx_land_brokers_activity_status ON land_brokers(activity_status);
CREATE INDEX IF NOT EXISTS idx_land_brokers_language ON land_brokers(language);
CREATE INDEX IF NOT EXISTS idx_land_brokers_created_at ON land_brokers(created_at DESC);

-- إنشاء RLS policies
ALTER TABLE land_brokers ENABLE ROW LEVEL SECURITY;

-- السماح للمستخدمين المصادق عليهم بالقراءة
CREATE POLICY "Users can view land brokers" ON land_brokers
  FOR SELECT USING (auth.role() = 'authenticated');

-- السماح للمستخدمين المصادق عليهم بالإضافة
CREATE POLICY "Users can insert land brokers" ON land_brokers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- السماح للمستخدمين المصادق عليهم بالتحديث
CREATE POLICY "Users can update land brokers" ON land_brokers
  FOR UPDATE USING (auth.role() = 'authenticated');

-- السماح للمستخدمين المصادق عليهم بالحذف
CREATE POLICY "Users can delete land brokers" ON land_brokers
  FOR DELETE USING (auth.role() = 'authenticated');

-- إنشاء trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_land_brokers_updated_at 
  BEFORE UPDATE ON land_brokers 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
