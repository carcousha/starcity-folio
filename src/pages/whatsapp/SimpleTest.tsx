import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, Loader2, Send } from 'lucide-react';
import { whatsappService } from '@/services/whatsappService';

export default function SimpleTest() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('مرحبا! هذه رسالة اختبار من StarCity Folio');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // تحميل إعدادات WhatsApp
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      console.log('🔍 [SimpleTest] Loading WhatsApp settings...');
      const settingsData = await whatsappService.getSettings();
      console.log('📋 [SimpleTest] Settings loaded:', settingsData);
      setSettings(settingsData);
    } catch (error) {
      console.error('❌ [SimpleTest] Error loading settings:', error);
    } finally {
      setSettingsLoading(false);
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
      console.log('🚀 [SimpleTest] Starting test send...');
      
      // التحقق من وجود الإعدادات
      if (!settings) {
        toast({
          title: "إعدادات WhatsApp غير متوفرة",
          description: "يرجى إعداد WhatsApp أولاً من صفحة الإعدادات",
          variant: "destructive",
        });
        return;
      }

      if (!settings.api_key || !settings.sender_number) {
        toast({
          title: "إعدادات WhatsApp غير مكتملة",
          description: "يرجى إدخال مفتاح API ورقم المرسل في إعدادات WhatsApp",
          variant: "destructive",
        });
        return;
      }

      // استخدام الإعدادات الفعلية من قاعدة البيانات
      const testData = {
        api_key: settings.api_key,
        sender: settings.sender_number,
        number: phoneNumber,
        message: message,
        footer: settings.default_footer || 'Sent via StarCity Folio'
      };

      console.log('📤 [SimpleTest] Sending to Edge Function:', {
        ...testData,
        api_key: `${testData.api_key.substring(0, 8)}...`
      });

      const response = await fetch('https://hrjyjemacsjoouobcgri.supabase.co/functions/v1/whatsapp-api-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyanlqZW1hY3Nqb291b2JjZ3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjgxOTIsImV4cCI6MjA2OTQ0NDE5Mn0.MVVJNBVlK-meXguUyO76HqjawbPgAAzhIvKG9oWKBlk`,
        },
        body: JSON.stringify(testData)
      });

      console.log('📥 [SimpleTest] Response status:', response.status);
      console.log('📥 [SimpleTest] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📥 [SimpleTest] Response data:', result);
      setResult(result);
      
      if (result.status === true) {
        toast({
          title: "تم الإرسال بنجاح!",
          description: result.message,
        });
      } else {
        toast({
          title: "فشل في الإرسال",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('💥 [SimpleTest] Error during send:', error);
      setResult({
        status: false,
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
        <h1 className="text-3xl font-bold">اختبار بسيط للإرسال</h1>
        <p className="text-gray-600">صفحة اختبار مباشرة للـ Edge Function</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* إعدادات WhatsApp */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              إعدادات WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {settingsLoading ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  جاري تحميل الإعدادات...
                </AlertDescription>
              </Alert>
            ) : settings ? (
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
                  إعدادات WhatsApp غير متوفرة
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
              disabled={isLoading || !settings || !settings.api_key || !settings.sender_number}
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

        {/* نتيجة الاختبار */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result ? (
                result.status ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400" />
              )}
              نتيجة الاختبار
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">الحالة:</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    result.status 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.status ? 'نجح' : 'فشل'}
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
                {result.data && (
                  <div className="flex justify-between">
                    <span className="font-medium">وقت الاستجابة:</span>
                    <span className="text-sm">{result.data.response_time_ms}ms</span>
                  </div>
                )}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  لم يتم إرسال أي رسالة بعد
                </AlertDescription>
              </Alert>
            )}
            
            {result && (
              <details className="mt-4">
                <summary className="cursor-pointer font-medium">تفاصيل الاستجابة الكاملة</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
