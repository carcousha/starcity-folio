import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestPage() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>صفحة اختبار WhatsApp</CardTitle>
          <CardDescription>هذه صفحة اختبار للتأكد من أن التوجيه يعمل بشكل صحيح</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-green-600 font-bold">✅ التوجيه يعمل بشكل صحيح!</p>
          <p className="mt-4">يمكنك الآن الوصول إلى جميع صفحات WhatsApp:</p>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>لوحة التحكم: /whatsapp/dashboard</li>
            <li>اختبار الإرسال: /whatsapp/test-send</li>
            <li>اختبار بسيط: /whatsapp/simple-test</li>
            <li>اختبار المرفقات: /whatsapp/test-media</li>
            <li>اختبار Bucket: /whatsapp/test-bucket</li>
            <li>اختبار مرفقات مبسط: /whatsapp/test-media-simple</li>
            <li>اختبار مرفقات نهائي: /whatsapp/test-media-final</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
