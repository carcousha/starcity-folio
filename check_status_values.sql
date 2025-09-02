-- استعلام للتحقق من القيم الموجودة في عمود status

-- 1. عرض القيم الفريدة الموجودة في عمود status
SELECT status, COUNT(*) as count
FROM enhanced_contacts
GROUP BY status
ORDER BY status;

-- 2. عرض القيم غير المتوافقة مع قيد التحقق
SELECT status, COUNT(*) as count
FROM enhanced_contacts
WHERE status NOT IN ('active', 'inactive', 'lead', 'prospect', 'customer', 'archived', 'deleted')
GROUP BY status
ORDER BY count DESC;

-- 3. عرض القيم الفريدة الموجودة في عمود language
SELECT language, COUNT(*) as count
FROM enhanced_contacts
GROUP BY language
ORDER BY language;

-- 4. عرض القيم غير المتوافقة مع قيد التحقق
SELECT language, COUNT(*) as count
FROM enhanced_contacts
WHERE language NOT IN ('ar', 'en', 'fr', 'other')
GROUP BY language
ORDER BY count DESC;