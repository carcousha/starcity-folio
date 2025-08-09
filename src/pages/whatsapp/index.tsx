import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function WhatsAppHome() {
  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold">وحدة الواتساب</h1>
        <p className="text-muted-foreground">لوحة التحكم الرئيسية للوحدة</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>الإعدادات</CardTitle>
            <CardDescription>تهيئة الوحدة والمزود لاحقًا</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/whatsapp/settings"><Button variant="outline">فتح</Button></Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>القوالب</CardTitle>
            <CardDescription>إدارة قوالب الرسائل</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/whatsapp/templates"><Button variant="outline">فتح</Button></Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>الذكّي</CardTitle>
            <CardDescription>قائمة الرسائل المقترحة اليوم</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/whatsapp/smart"><Button variant="outline">فتح</Button></Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>السجل</CardTitle>
            <CardDescription>سجل عمليات الإرسال</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/whatsapp/logs"><Button variant="outline">فتح</Button></Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>التذكيرات</CardTitle>
            <CardDescription>إدارة التذكيرات</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/whatsapp/reminders"><Button variant="outline">فتح</Button></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


