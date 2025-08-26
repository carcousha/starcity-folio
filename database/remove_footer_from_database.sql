-- إزالة "Sent via StarCity Folio" من قاعدة البيانات
-- Remove "Sent via StarCity Folio" from database

-- تحديث إعدادات الواتساب لإزالة التذييل
UPDATE whatsapp_settings 
SET default_footer = '' 
WHERE default_footer = 'Sent via StarCity Folio' 
   OR default_footer LIKE '%StarCity Folio%';

-- عرض الإعدادات الحالية للتأكد
SELECT id, api_key, sender_number, default_footer, is_active, created_at, updated_at 
FROM whatsapp_settings;

-- إذا لم تكن هناك إعدادات، إنشاء إعدادات جديدة بدون تذييل
INSERT INTO whatsapp_settings (
    api_key, 
    sender_number, 
    default_footer, 
    daily_limit, 
    rate_limit_per_minute, 
    is_active
) 
SELECT 
    'aExU6Ie3zMtvflbxtMiRoa5PuY48L2',
    '',
    '',
    1000,
    10,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM whatsapp_settings WHERE is_active = true
);
