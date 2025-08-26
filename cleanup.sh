#!/bin/bash

echo "🧹 بدء تنظيف الموقع..."

# 1. حذف ملفات HTML الاختبارية
echo "📁 حذف ملفات HTML الاختبارية..."
rm -f test_*.html
rm -f whatsapp_*.html
rm -f debug_*.html
rm -f check_*.html
rm -f create_*.html
rm -f apply_*.html

# 2. إنشاء مجلدات منظمة
echo "�� إنشاء مجلدات منظمة..."
mkdir -p database/migrations
mkdir -p database/scripts

# 3. نقل ملفات SQL
echo "🗄️ نقل ملفات SQL..."
mv *.sql database/ 2>/dev/null || echo "لا توجد ملفات SQL"

# 4. حذف الصفحات غير المستخدمة
echo "🗑️ حذف الصفحات غير المستخدمة..."
rm -f src/pages/NotificationsPage.tsx

echo "✅ تم الانتهاء من التنظيف!"
echo "📊 حجم الموقع قبل التنظيف: $(du -sh . | cut -f1)"
echo "📊 حجم الموقع بعد التنظيف: $(du -sh . | cut -f1)"
