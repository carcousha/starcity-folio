-- ===== فحص هيكل قاعدة البيانات الحالية =====
-- قم بنسخ هذا الكود ولصقه في Supabase SQL Editor
-- أو استخدمه في أي أداة إدارة قواعد البيانات PostgreSQL

-- 1. عرض جميع الجداول في قاعدة البيانات
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. عرض تفاصيل الأعمدة لكل جدول
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.is_nullable,
    c.column_default,
    c.ordinal_position
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;

-- 3. عرض المفاتيح الأساسية
SELECT 
    tc.table_name,
    kc.column_name,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kc 
    ON tc.constraint_name = kc.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 4. عرض المفاتيح الخارجية والعلاقات
SELECT 
    tc.table_name AS source_table,
    kcu.column_name AS source_column,
    ccu.table_name AS target_table,
    ccu.column_name AS target_column,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 5. عرض الفهارس
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 6. عرض الدوال المخزنة (Functions)
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 7. عرض المشاهدات (Views)
SELECT 
    table_name,
    view_definition
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 8. عرض سياسات الأمان RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 9. عرض إحصائيات الجداول (عدد الصفوف)
SELECT 
    schemaname,
    relname AS table_name,
    n_tup_ins AS inserts,
    n_tup_upd AS updates,
    n_tup_del AS deletes,
    n_live_tup AS live_rows,
    n_dead_tup AS dead_rows
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY live_rows DESC;

-- 10. عرض أحجام الجداول
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 11. فحص الجداول المهمة في التطبيق
-- جدول المستخدمين والملفات الشخصية
SELECT 'profiles' AS table_name, COUNT(*) AS row_count FROM profiles
UNION ALL
SELECT 'enhanced_contacts', COUNT(*) FROM enhanced_contacts
UNION ALL
SELECT 'land_brokers', COUNT(*) FROM land_brokers
UNION ALL
SELECT 'external_suppliers', COUNT(*) FROM external_suppliers
UNION ALL
SELECT 'whatsapp_contacts', COUNT(*) FROM whatsapp_contacts
UNION ALL
SELECT 'whatsapp_templates', COUNT(*) FROM whatsapp_templates
UNION ALL
SELECT 'settings', COUNT(*) FROM settings;

-- 12. فحص آخر التحديثات
SELECT 
    'profiles' AS table_name,
    MAX(updated_at) AS last_update
FROM profiles
WHERE updated_at IS NOT NULL
UNION ALL
SELECT 
    'enhanced_contacts',
    MAX(updated_at)
FROM enhanced_contacts
WHERE updated_at IS NOT NULL
UNION ALL
SELECT 
    'land_brokers',
    MAX(updated_at)
FROM land_brokers
WHERE updated_at IS NOT NULL
ORDER BY last_update DESC;

-- ===== ملاحظات مهمة =====
-- 1. تأكد من أن لديك صلاحيات القراءة على جميع الجداول
-- 2. بعض الاستعلامات قد تستغرق وقتاً طويلاً على قواعد البيانات الكبيرة
-- 3. استخدم LIMIT لتقليل النتائج إذا لزم الأمر
-- 4. يمكنك تشغيل كل استعلام منفرداً حسب الحاجة

-- مثال لفحص جدول محدد:
-- SELECT * FROM information_schema.columns 
-- WHERE table_name = 'اسم_الجدول' 
-- ORDER BY ordinal_position;