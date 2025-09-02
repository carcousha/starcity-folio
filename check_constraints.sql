-- استعلام للبحث عن قيود التحقق في جدول enhanced_contacts
SELECT
    tc.constraint_name,
    tc.table_name,
    tc.constraint_type,
    cc.check_clause
FROM
    information_schema.table_constraints tc
JOIN
    information_schema.check_constraints cc
ON
    tc.constraint_name = cc.constraint_name
WHERE
    tc.table_name = 'enhanced_contacts'
    AND tc.constraint_type = 'CHECK';