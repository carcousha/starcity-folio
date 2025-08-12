-- فحص الجداول الموجودة في قاعدة البيانات
-- Check existing tables in the database

-- عرض جميع الجداول
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- البحث عن أي جدول يحتوي على كلمة supplier
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name ILIKE '%supplier%'
ORDER BY table_name;
