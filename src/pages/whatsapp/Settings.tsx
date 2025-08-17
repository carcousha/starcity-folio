import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, TestTube, Save, Globe, Lock, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

// استيراد المكتبة الجديدة للاختبار
import whatsappDirectSender from '@/lib/whatsapp-direct-sender';

export default function Settings() {
  const [apiSettings, setApiSettings] = useState({
    apiKey: '',
    sender: 'StarCity Folio',
    baseUrl: 'https://app.x-growth.tech'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  // تحميل الإعدادات المحفوظة عند بدء التطبيق
  useEffect(() => {
    const savedApiKey = localStorage.getItem('whatsapp_api_key') || '';
    const savedSender = localStorage.getItem('whatsapp_sender') || 'StarCity Folio';
    const savedBaseUrl = localStorage.getItem('whatsapp_base_url') || 'https://app.x-growth.tech';
    
    setApiSettings({
      apiKey: savedApiKey,
      sender: savedSender,
      baseUrl: savedBaseUrl
    });
  }, []);

  // حفظ الإعدادات
  const handleSave = () => {
    if (!apiSettings.apiKey.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال مفتاح API",
        variant: "destructive"
      });
      return;
    }

    if (!apiSettings.sender.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم المرسل",
        variant: "destructive"
      });
      return;
    }

    // حفظ في localStorage
    localStorage.setItem('whatsapp_api_key', apiSettings.apiKey);
    localStorage.setItem('whatsapp_sender', apiSettings.sender);
    localStorage.setItem('whatsapp_base_url', apiSettings.baseUrl);

    toast({
      title: "تم الحفظ",
      description: "تم حفظ الإعدادات بنجاح",
    });

    setTestResult(null); // إعادة تعيين نتيجة الاختبار
  };

  // اختبار الاتصال
  const handleTestConnection = async () => {
    if (!apiSettings.apiKey.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال مفتاح API أولاً",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      console.log('🔄 بدء اختبار الاتصال...');
      console.log('🔑 API Key:', apiSettings.apiKey.substring(0, 10) + '...');
      console.log('👤 المرسل:', apiSettings.sender);
      
      const result = await whatsappDirectSender.testConnection(
        apiSettings.apiKey,
        apiSettings.sender
      );

      console.log('📊 نتيجة الاختبار:', result);

      if (result.status) {
        setTestResult({ 
          success: true, 
          message: 'تم الاتصال بنجاح! API يعمل بشكل صحيح.' 
        });
        toast({
          title: "نجح الاختبار",
          description: "تم الاتصال بـ API بنجاح",
        });
      } else {
        throw new Error(result.message || 'فشل في الاتصال');
      }
    } catch (error: any) {
      console.error('خطأ في اختبار الاتصال:', error);
      setTestResult({ 
        success: false, 
        message: error.message || 'فشل في الاتصال بـ API' 
      });
      toast({
        title: "فشل الاختبار",
        description: error.message || 'فشل في الاتصال بـ API',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl" dir="rtl">
      <div className="space-y-6">
        {/* العنوان */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">إعدادات واتساب API</h1>
          <p className="text-muted-foreground mt-2">
            تكوين وإدارة اتصال واتساب عبر X-Growth API
          </p>
        </div>

        <Tabs defaultValue="api" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="api">إعدادات API</TabsTrigger>
            <TabsTrigger value="test">اختبار الاتصال</TabsTrigger>
            <TabsTrigger value="info">معلومات API</TabsTrigger>
          </TabsList>

          {/* تبويب إعدادات API */}
          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  تكوين API
                </CardTitle>
                <CardDescription>
                  أدخل بيانات API الخاصة بك من موقع x-growth.tech
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="baseUrl" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      رابط API الأساسي
                    </Label>
                    <Input
                      id="baseUrl"
                      value={apiSettings.baseUrl}
                      onChange={(e) => setApiSettings({...apiSettings, baseUrl: e.target.value})}
                      placeholder="https://app.x-growth.tech"
                      dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      الرابط الأساسي لخدمة واتساب API
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="apiKey" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      مفتاح API *
                    </Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={apiSettings.apiKey}
                      onChange={(e) => setApiSettings({...apiSettings, apiKey: e.target.value})}
                      placeholder="أدخل مفتاح API الخاص بك"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      يمكنك الحصول على مفتاح API من لوحة التحكم في x-growth.tech
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="sender">اسم المرسل</Label>
                    <Input
                      id="sender"
                      value={apiSettings.sender}
                      onChange={(e) => setApiSettings({...apiSettings, sender: e.target.value})}
                      placeholder="StarCity Folio"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      الاسم الذي سيظهر كمرسل للرسائل
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-3">
                  <Button onClick={handleSave} className="flex-1">
                    <Save className="ml-2 h-4 w-4" />
                    حفظ الإعدادات
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب اختبار الاتصال */}
          <TabsContent value="test" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  اختبار الاتصال
                </CardTitle>
                <CardDescription>
                  تحقق من صحة إعدادات API قبل البدء في الإرسال
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Button 
                    onClick={handleTestConnection} 
                    disabled={isLoading}
                    size="lg"
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <div className="ml-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                        جاري الاختبار...
                      </>
                    ) : (
                      <>
                        <TestTube className="ml-2 h-4 w-4" />
                        اختبار الاتصال
                      </>
                    )}
                  </Button>
                </div>

                {/* نتيجة الاختبار */}
                {testResult && (
                  <Alert className={testResult.success ? "border-green-500" : "border-red-500"}>
                    <Info className={`h-4 w-4 ${testResult.success ? "text-green-600" : "text-red-600"}`} />
                    <AlertDescription className={testResult.success ? "text-green-700" : "text-red-700"}>
                      {testResult.message}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">ما يحدث عند الاختبار:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• إرسال طلب اختبار إلى API</li>
                    <li>• التحقق من صحة مفتاح API</li>
                    <li>• فحص إعدادات المرسل</li>
                    <li>• التأكد من حالة الاتصال</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب معلومات API */}
          <TabsContent value="info" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  معلومات API
                </CardTitle>
                <CardDescription>
                  إرشادات ومعلومات حول استخدام x-growth.tech API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">خطوات الحصول على API Key:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>اذهب إلى موقع <code className="bg-muted px-1 rounded">app.x-growth.tech</code></li>
                      <li>سجل دخولك أو أنشئ حساباً جديداً</li>
                      <li>انتقل إلى قسم "الإعدادات" أو "API Settings"</li>
                      <li>انسخ مفتاح API الخاص بك</li>
                      <li>الصقه في حقل "مفتاح API" أعلاه</li>
                    </ol>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-3">أنواع الرسائل المدعومة:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="bg-muted p-3 rounded">
                        <h5 className="font-medium">رسائل نصية</h5>
                        <p className="text-muted-foreground">نصوص عادية مع إمكانية إضافة footer</p>
                      </div>
                      <div className="bg-muted p-3 rounded">
                        <h5 className="font-medium">رسائل وسائط</h5>
                        <p className="text-muted-foreground">صور، فيديوهات، مستندات</p>
                      </div>
                      <div className="bg-muted p-3 rounded">
                        <h5 className="font-medium">رسائل تفاعلية</h5>
                        <p className="text-muted-foreground">أزرار، قوائم، استطلاعات</p>
                      </div>
                      <div className="bg-muted p-3 rounded">
                        <h5 className="font-medium">ملصقات</h5>
                        <p className="text-muted-foreground">ملصقات متحركة وثابتة</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-3">متطلبات مهمة:</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span>مفتاح API صحيح وفعال</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span>أرقام هواتف بصيغة دولية صحيحة</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span>رصيد كافي في حساب x-growth.tech</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span>اتصال إنترنت مستقر</span>
                      </li>
                    </ul>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      للحصول على دعم تقني أو مساعدة في التكوين، يرجى زيارة موقع x-growth.tech أو التواصل مع فريق الدعم.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}