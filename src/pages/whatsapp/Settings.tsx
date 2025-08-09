import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function WhatsAppSettings() {
  const [senderNumber, setSenderNumber] = useState('');
  const [defaultLang, setDefaultLang] = useState<'ar'|'en'>('ar');

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">إعدادات وحدة الواتساب</h1>
        <p className="text-muted-foreground">إعدادات أساسية (قابلة للتوسعة لاحقًا لمزود API)</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>الإعدادات العامة</CardTitle>
          <CardDescription>حفظ الإعدادات المحلية للواجهة فقط حالياً</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm">رقم المرسل الافتراضي</label>
            <Input value={senderNumber} onChange={(e)=>setSenderNumber(e.target.value)} placeholder="+9715XXXXXXX" />
          </div>
          <div>
            <label className="text-sm">اللغة الافتراضية</label>
            <select className="border rounded px-3 py-2" value={defaultLang} onChange={(e)=>setDefaultLang(e.target.value as any)}>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>
          <Button disabled>حفظ (لاحقًا)</Button>
        </CardContent>
      </Card>
    </div>
  );
}


