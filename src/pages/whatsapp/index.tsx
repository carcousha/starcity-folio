import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MessageCircle, Settings, Send, BarChart3 } from 'lucide-react';

export default function WhatsAppHome() {
  return (
    <div className="container mx-auto p-6 max-w-6xl" dir="rtl">
      <div className="space-y-6">
        {/* العنوان */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary">وحدة واتساب ستار سيتي</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            نظام إرسال رسائل واتساب المتكامل عبر X-Growth API
          </p>
        </div>

        {/* البطاقات الرئيسية */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>لوحة التحكم</CardTitle>
              <CardDescription>
                نظرة عامة على إحصائيات الإرسال والنشاط
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/whatsapp/dashboard">
                <Button className="w-full" size="lg">
                  عرض لوحة التحكم
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                <Send className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>الإرسال السريع</CardTitle>
              <CardDescription>
                إرسال رسائل واتساب فورية لأرقام محددة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/whatsapp/quick-send">
                <Button className="w-full" size="lg" variant="outline">
                  بدء الإرسال
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                <Settings className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle>الإعدادات</CardTitle>
              <CardDescription>
                تكوين API واختبار الاتصال
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/whatsapp/settings">
                <Button className="w-full" size="lg" variant="outline">
                  إعداد الخدمة
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* معلومات إضافية */}
        <div className="bg-muted/50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-center">مميزات النظام</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">رسائل متنوعة</h3>
              <p className="text-sm text-muted-foreground">نصوص، وسائط، أزرار تفاعلية</p>
            </div>
            
            <div className="text-center">
              <Settings className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">سهولة التكوين</h3>
              <p className="text-sm text-muted-foreground">إعداد بسيط ومرن</p>
            </div>
            
            <div className="text-center">
              <Send className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">إرسال سريع</h3>
              <p className="text-sm text-muted-foreground">واجهة سهلة للإرسال الفوري</p>
            </div>
            
            <div className="text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">تتبع شامل</h3>
              <p className="text-sm text-muted-foreground">إحصائيات ومراقبة مفصلة</p>
            </div>
          </div>
        </div>

        {/* خطوات البدء */}
        <Card>
          <CardHeader>
            <CardTitle>خطوات البدء السريع</CardTitle>
            <CardDescription>
              اتبع هذه الخطوات لبدء استخدام خدمة واتساب
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-medium">الحصول على API Key</h4>
                  <p className="text-sm text-muted-foreground">
                    سجل في موقع app.x-growth.tech واحصل على مفتاح API
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-medium">تكوين الإعدادات</h4>
                  <p className="text-sm text-muted-foreground">
                    أدخل مفتاح API واسم المرسل في صفحة الإعدادات
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-medium">اختبار الاتصال</h4>
                  <p className="text-sm text-muted-foreground">
                    تأكد من صحة الإعدادات باستخدام ميزة اختبار الاتصال
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-medium">بدء الإرسال</h4>
                  <p className="text-sm text-muted-foreground">
                    استخدم الإرسال السريع لإرسال أول رسالة واتساب
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


