import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function WhatsAppHome() {
  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold">وحدة الواتساب</h1>
        <p className="text-muted-foreground">لوحة التحكم الرئيسية للوحدة</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>لوحة التحكم</CardTitle>
            <CardDescription>نظرة عامة على النشاط</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/whatsapp/dashboard">
              <Button variant="outline" className="w-full">فتح</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الرسائل الذكية</CardTitle>
            <CardDescription>رسائل مؤتمتة وذكية</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/whatsapp/smart-messages">
              <Button variant="outline" className="w-full">فتح</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>القوالب</CardTitle>
            <CardDescription>قوالب الرسائل الجاهزة</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/whatsapp/templates">
              <Button variant="outline" className="w-full">فتح</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>السجل</CardTitle>
            <CardDescription>تتبع الرسائل</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/whatsapp/logs">
              <Button variant="outline" className="w-full">فتح</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الرد التلقائي</CardTitle>
            <CardDescription>ردود تلقائية</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/whatsapp/auto-reply">
              <Button variant="outline" className="w-full">فتح</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إنشاء حملة</CardTitle>
            <CardDescription>حملات رسائل جماعية</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/whatsapp/campaigns">
              <Button variant="outline" className="w-full">فتح</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>التقارير</CardTitle>
            <CardDescription>تقارير مفصلة</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/whatsapp/reports">
              <Button variant="outline" className="w-full">فتح</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الإرسال السريع</CardTitle>
            <CardDescription>إرسال رسائل فردية بسرعة</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/whatsapp/quick-send">
              <Button variant="outline" className="w-full">فتح</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الإعدادات</CardTitle>
            <CardDescription>تكوين الوحدة</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/whatsapp/settings">
              <Button variant="outline" className="w-full">فتح</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


