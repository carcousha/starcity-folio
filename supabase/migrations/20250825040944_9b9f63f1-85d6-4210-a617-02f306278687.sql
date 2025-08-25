-- إضافة فهارس لتحسين الأداء على جدول الوسطاء
CREATE INDEX IF NOT EXISTS idx_land_brokers_search 
ON land_brokers USING gin(
  to_tsvector('arabic', 
    COALESCE(name, '') || ' ' || 
    COALESCE(short_name, '') || ' ' || 
    COALESCE(phone, '') || ' ' || 
    COALESCE(email, '') || ' ' || 
    COALESCE(office_name, '')
  )
);

-- فهرس على حالة النشاط
CREATE INDEX IF NOT EXISTS idx_land_brokers_activity_status 
ON land_brokers(activity_status);

-- فهرس على اللغة
CREATE INDEX IF NOT EXISTS idx_land_brokers_language 
ON land_brokers(language);

-- فهرس مركب للفلترة
CREATE INDEX IF NOT EXISTS idx_land_brokers_filters 
ON land_brokers(activity_status, language, created_at DESC);

-- فهرس على الهاتف للبحث السريع
CREATE INDEX IF NOT EXISTS idx_land_brokers_phone 
ON land_brokers(phone);

-- فهرس على البريد الإلكتروني
CREATE INDEX IF NOT EXISTS idx_land_brokers_email 
ON land_brokers(email) WHERE email IS NOT NULL;