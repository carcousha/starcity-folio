import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Phone, Send, Settings, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// استيراد المكتبة الجديدة للإرسال المباشر
import whatsappDirectSender from '@/lib/whatsapp-direct-sender';

export default function QuickSend() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  // إعدادات API (يجب أن تأتي من الإعدادات)
  const [apiSettings, setApiSettings] = useState({
    apiKey: localStorage.getItem('whatsapp_api_key') || '',
    sender: localStorage.getItem('whatsapp_sender') || 'StarCity Folio'
  });

  // التحقق من صحة رقم الهاتف
  const validatePhoneNumber = (phone: string): boolean => {
    // إزالة المسافات والرموز
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    
    // التحقق من الصيغة الإماراتية أو الدولية
    const uaePattern = /^(\+971|971|05)\d{8,9}$/;
    const internationalPattern = /^\+\d{10,15}$/;
    
    return uaePattern.test(cleanPhone) || internationalPattern.test(cleanPhone);
  };

  // تنسيق رقم الهاتف
  const formatPhoneNumber = (phone: string): string => {
    let cleanPhone = phone.replace(/[^\d+]/g, '');
    
    // إذا بدأ بـ 05، استبدل بـ +971
    if (cleanPhone.startsWith('05')) {
      cleanPhone = '+971' + cleanPhone.substring(1);
    }
    // إذا بدأ بـ 971 بدون +، أضف +
    else if (cleanPhone.startsWith('971') && !cleanPhone.startsWith('+971')) {
      cleanPhone = '+' + cleanPhone;
    }
    // إذا لم يبدأ بـ +، أضف +
    else if (!cleanPhone.startsWith('+')) {
      cleanPhone = '+' + cleanPhone;
    }
    
    return cleanPhone;
  };

  // إرسال الرسالة
  const handleSendMessage = async () => {
    // التحقق من الحقول المطلوبة
    if (!apiSettings.apiKey) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال مفتاح API أولاً",
        variant: "destructive"
      });
      return;
    }

    if (!phoneNumber || !message) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم الهاتف والرسالة",
        variant: "destructive"
      });
      return;
    }

    // التحقق من صحة رقم الهاتف
    if (!validatePhoneNumber(phoneNumber)) {
      toast({
        title: "خطأ في رقم الهاتف",
        description: "يرجى إدخال رقم هاتف صحيح (مثال: +971501234567 أو 0501234567)",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setLastResult(null);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      console.log('🔄 بدء إرسال الرسالة...');
      console.log('📞 الرقم المنسق:', formattedPhone);
      console.log('💬 الرسالة:', message);
      
      const result = await whatsappDirectSender.sendMessage({
        type: 'text',
        data: {
          api_key: apiSettings.apiKey,
          sender: apiSettings.sender,
          number: formattedPhone,
          message: message,
          footer: 'مرسل عبر StarCity Folio'
        }
      });

      console.log('📊 نتيجة الإرسال:', result);

      if (result.status) {
        setLastResult({ success: true, message: 'تم إرسال الرسالة بنجاح!' });
        toast({
          title: "نجح الإرسال",
          description: `تم إرسال الرسالة إلى ${formattedPhone}`,
        });
        
        // مسح الحقول بعد الإرسال الناجح
        setMessage('');
      } else {
        throw new Error(result.message || 'فشل في الإرسال');
      }
    } catch (error: any) {
      console.error('خطأ في إرسال الرسالة:', error);
      setLastResult({ 
        success: false, 
        message: error.message || 'حدث خطأ أثناء الإرسال' 
      });
      toast({
        title: "فشل الإرسال",
        description: error.message || 'حدث خطأ أثناء إرسال الرسالة',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // حفظ الإعدادات
  const saveSettings = () => {
    localStorage.setItem('whatsapp_api_key', apiSettings.apiKey);
    localStorage.setItem('whatsapp_sender', apiSettings.sender);
    toast({
      title: "تم الحفظ",
      description: "تم حفظ إعدادات API بنجاح"
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl" dir="rtl">
      <div className="space-y-6">
        {/* العنوان */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">الإرسال السريع - واتساب</h1>
          <p className="text-muted-foreground mt-2">
            إرسال رسائل واتساب فورية عبر StarCity Folio
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* بطاقة الإعدادات */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                إعدادات API
              </CardTitle>
              <CardDescription>
                تكوين اتصال واتساب API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="apiKey">مفتاح API</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="أدخل مفتاح API الخاص بك"
                  value={apiSettings.apiKey}
                  onChange={(e) => setApiSettings({...apiSettings, apiKey: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="sender">اسم المرسل</Label>
                <Input
                  id="sender"
                  placeholder="StarCity Folio"
                  value={apiSettings.sender}
                  onChange={(e) => setApiSettings({...apiSettings, sender: e.target.value})}
                />
              </div>

              <Button onClick={saveSettings} className="w-full" variant="outline">
                حفظ الإعدادات
              </Button>
            </CardContent>
          </Card>

          {/* بطاقة الإرسال */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                إرسال رسالة
              </CardTitle>
              <CardDescription>
                أرسل رسالة واتساب فورية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phone">رقم الهاتف</Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    dir="ltr"
                    placeholder="+971501234567 أو 0501234567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  صيغة الأرقام المقبولة: +971501234567، 971501234567، 0501234567
                </p>
              </div>

              <div>
                <Label htmlFor="message">نص الرسالة</Label>
                <Textarea
                  id="message"
                  placeholder="اكتب رسالتك هنا..."
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  عدد الأحرف: {message.length}
                </p>
              </div>

              <Button 
                onClick={handleSendMessage} 
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="ml-2 h-4 w-4" />
                    إرسال الرسالة
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* نتيجة آخر عملية إرسال */}
        {lastResult && (
          <Alert className={lastResult.success ? "border-green-500" : "border-red-500"}>
            {lastResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={lastResult.success ? "text-green-700" : "text-red-700"}>
              {lastResult.message}
            </AlertDescription>
          </Alert>
        )}

        {/* معلومات إضافية */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات مهمة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold">صيغ الأرقام المقبولة:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>+971501234567 (دولي)</li>
                  <li>971501234567 (بدون +)</li>
                  <li>0501234567 (محلي إماراتي)</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">نصائح للاستخدام:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>تأكد من صحة مفتاح API</li>
                  <li>تحقق من رقم الهاتف قبل الإرسال</li>
                  <li>اكتب رسائل واضحة ومهذبة</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}