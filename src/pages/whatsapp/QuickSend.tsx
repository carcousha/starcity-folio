import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Send, MessageSquare, Phone, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import whatsappSender from '@/lib/whatsapp-iframe-sender';
import { useAuth } from '@/hooks/useAuth';

export default function QuickSend() {
  const { user } = useAuth();
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    messagesSentToday: 0,
    totalSuppliers: 0,
    pendingTasks: 0
  });

  // تحميل الإحصائيات عند تحميل الصفحة
  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  // تحميل الإحصائيات
  const loadStats = async () => {
    try {
      // استخدام بيانات محلية مؤقتة
      setStats({
        messagesSentToday: Math.floor(Math.random() * 50) + 10,
        totalSuppliers: Math.floor(Math.random() * 200) + 50,
        pendingTasks: Math.floor(Math.random() * 20) + 5
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  // التحقق من صيغة الرقم الدولي
  const validatePhoneNumber = (phone: string): boolean => {
    // إزالة المسافات والرموز
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    // صيغة دولية: +[country code][number]
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(cleanPhone);
  };

  // تنظيف رقم الهاتف
  const cleanPhoneNumber = (phone: string): string => {
    return phone.replace(/[\s\-\(\)]/g, '');
  };

  const handleSendMessage = async () => {
    if (!recipient || !message) {
      setError('يرجى ملء جميع الحقول');
      return;
    }

    const cleanPhone = cleanPhoneNumber(recipient);
    if (!validatePhoneNumber(cleanPhone)) {
      setError('صيغة الرقم غير صحيحة. استخدم الصيغة الدولية (+971501234567)');
      return;
    }

    setIsLoading(true);
    setError('');
    setIsSuccess(false);

    try {
      // إرسال الرسالة عبر iframe
      const messageData = {
        type: 'text' as const,
        data: {
          api_key: 'api_key',
          sender: 'StarCity Folio',
          number: cleanPhone,
          message: message,
          footer: 'StarCity Folio'
        }
      };
      
      const result = await whatsappSender.sendMessage(messageData);
      
      if (result.status) {
        setIsSuccess(true);
        setRecipient('');
        setMessage('');
        
        // تحديث الإحصائيات
        await loadStats();
      } else {
        setError(result.message || 'فشل في إرسال الرسالة. يرجى المحاولة مرة أخرى.');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('حدث خطأ في إرسال الرسالة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold">الإرسال السريع</h1>
        <p className="text-muted-foreground">إرسال رسائل واتساب فردية بسرعة وسهولة</p>
      </div>

      {/* رسائل النجاح والخطأ */}
      {isSuccess && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">تم إرسال الرسالة بنجاح!</span>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* النموذج */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                معلومات المستلم
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">رقم المستلم</Label>
                <Input
                  id="recipient"
                  placeholder="+971501234567"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  استخدم الصيغة الدولية مع رمز البلد (+971501234567)
                </p>
                {recipient && !validatePhoneNumber(cleanPhoneNumber(recipient)) && (
                  <p className="text-xs text-red-600">
                    ⚠️ صيغة الرقم غير صحيحة
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                محتوى الرسالة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message">نص الرسالة</Label>
                <Textarea
                  id="message"
                  placeholder="اكتب رسالتك هنا..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>يمكنك استخدام متغيرات مثل {'{name}'} و {'{company}'}</span>
                  <span>{message.length}/1000</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !recipient || !message || !validatePhoneNumber(cleanPhoneNumber(recipient))}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 ml-2" />
                    إرسال الرسالة
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* معاينة الرسالة والإحصائيات */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                معاينة الرسالة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recipient && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">إلى:</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-green-600" />
                    <span className="font-medium">{recipient}</span>
                    {validatePhoneNumber(cleanPhoneNumber(recipient)) && (
                      <Badge variant="secondary" className="text-xs">✓ صحيح</Badge>
                    )}
                  </div>
                </div>
              )}

              {message && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">المحتوى:</Label>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <p className="text-sm">{message}</p>
                  </div>
                </div>
              )}

              {!recipient && !message && (
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">املأ النموذج لرؤية معاينة الرسالة</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* إحصائيات سريعة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                إحصائيات اليوم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">الرسائل المرسلة</span>
                  <Badge variant="secondary">{stats.messagesSentToday}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">إجمالي الموردين</span>
                  <Badge variant="default" className="bg-blue-100 text-blue-800">{stats.totalSuppliers}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">المهام المعلقة</span>
                  <Badge variant="destructive">{stats.pendingTasks}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                نصائح سريعة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>تأكد من صحة رقم الهاتف بالصيغة الدولية</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>استخدم رسائل واضحة ومختصرة</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>اختبر الرسالة قبل الإرسال</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>احترم أوقات العمل المناسبة</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
