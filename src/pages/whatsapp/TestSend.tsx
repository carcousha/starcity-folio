import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { whatsappService } from '@/services/whatsappService';
import { CheckCircle, AlertCircle, Loader2, Send } from 'lucide-react';

export default function TestSend() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('مرحبا! هذه رسالة اختبار من StarCity Folio');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      console.log('🔍 [TestSend] Loading WhatsApp settings...');
      const settingsData = await whatsappService.getSettings();
      console.log('📋 [TestSend] Settings loaded:', settingsData);
      setSettings(settingsData);
    } catch (error) {
      console.error('❌ [TestSend] Error loading settings:', error);
    }
  };

  const handleSendTest = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "رقم الهاتف مطلوب",
        description: "يرجى إدخال رقم الهاتف",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "الرسالة مطلوبة",
        description: "يرجى إدخال نص الرسالة",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      console.log('🚀 [TestSend] Starting test send...');
      const response = await whatsappService.sendWhatsAppMessage(phoneNumber, message);
      console.log('📥 [TestSend] Send response:', response);
      setResult(response);
      
      if (response.success) {
        toast({
          title: "تم الإرسال بنجاح!",
          description: response.message,
        });
      } else {
        toast({
          title: "فشل في الإرسال",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('💥 [TestSend] Error during send:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'خطأ غير معروف',
        error: error
      });
      toast({
        title: "خطأ في الإرسال",
        description: error instanceof Error ? error.message : 'خطأ غير معروف',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">اختبار إرسال WhatsApp</h1>
        <p className="text-gray-600">صفحة اختبار بسيطة لتشخيص مشاكل الإرسال</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* إعدادات WhatsApp */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              إعدادات WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">مفتاح API:</span>
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {settings.api_key ? `${settings.api_key.substring(0, 8)}...` : 'غير محدد'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">رقم المرسل:</span>
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {settings.sender_number || 'غير محدد'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">الحالة:</span>
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                    متصل
                  </span>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  جاري تحميل الإعدادات...
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* نموذج الاختبار */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              إرسال رسالة اختبار
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="971501234567"
              />
            </div>
            <div>
              <Label htmlFor="message">نص الرسالة</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>
            <Button
              onClick={handleSendTest}
              disabled={isLoading || !settings}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  إرسال رسالة اختبار
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* نتيجة الاختبار */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              نتيجة الاختبار
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">الحالة:</span>
                <span className={`text-sm px-2 py-1 rounded ${
                  result.success 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {result.success ? 'نجح' : 'فشل'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">الرسالة:</span>
                <span className="text-sm">{result.message}</span>
              </div>
              {result.error && (
                <div className="flex justify-between">
                  <span className="font-medium">الخطأ:</span>
                  <span className="text-sm text-red-600">{result.error}</span>
                </div>
              )}
            </div>
            
            <details className="mt-4">
              <summary className="cursor-pointer font-medium">تفاصيل الاستجابة الكاملة</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
