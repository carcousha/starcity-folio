import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { whatsappService } from '@/services/whatsappService';
import { WhatsAppSettings } from '@/types/whatsapp';
import { Upload, Send, FileImage, AlertCircle, CheckCircle } from 'lucide-react';

export default function TestMediaSimple() {
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null);
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('اختبار إرسال رسالة مع مرفق');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await whatsappService.getSettings();
      setSettings(settings);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "خطأ في تحميل الإعدادات",
        description: "فشل في تحميل إعدادات WhatsApp",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadedUrl(null);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const url = await whatsappService.uploadMediaFile(selectedFile);
      if (url) {
        setUploadedUrl(url);
        toast({
          title: "تم رفع الملف بنجاح",
          description: "تم رفع المرفق إلى Storage",
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "خطأ في رفع الملف",
        description: error instanceof Error ? error.message : "فشل في رفع الملف",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getMediaType = (file: File): 'image' | 'document' | 'video' | 'audio' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const sendMessage = async () => {
    if (!phone || !message) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال رقم الهاتف والرسالة",
        variant: "destructive",
      });
      return;
    }

    if (!settings?.api_key || !settings?.sender_number) {
      toast({
        title: "إعدادات ناقصة",
        description: "يرجى إعداد مفتاح API ورقم المرسل في إعدادات WhatsApp",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      let response;
      
      if (uploadedUrl) {
        // إرسال مع مرفق
        const mediaType = selectedFile ? getMediaType(selectedFile) : 'image';
        console.log('🔍 [TestMediaSimple] Sending with media:', { 
          uploadedUrl, 
          mediaType, 
          message,
          phone,
          apiKey: `${settings.api_key.substring(0, 8)}...`,
          sender: settings.sender_number
        });
        
        response = await whatsappService.sendWhatsAppMessage(
          phone,
          '', // رسالة فارغة لأن النص سيذهب كـ caption
          settings.default_footer || 'Sent via StarCity Folio',
          uploadedUrl,
          mediaType,
          message // استخدم الرسالة كـ caption
        );
      } else {
        // إرسال رسالة نصية عادية
        response = await whatsappService.sendWhatsAppMessage(
          phone,
          message,
          settings.default_footer || 'Sent via StarCity Folio'
        );
      }

      setResult(response);
      console.log('📥 [TestMediaSimple] Response:', response);
      
      if (response.status) {
        toast({
          title: "تم الإرسال بنجاح",
          description: uploadedUrl ? "تم إرسال الرسالة مع المرفق بنجاح" : "تم إرسال الرسالة النصية بنجاح",
        });
      } else {
        toast({
          title: "فشل في الإرسال",
          description: response.message || "حدث خطأ أثناء الإرسال",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Send error:', error);
      setResult({
        status: false,
        message: error instanceof Error ? error.message : "خطأ غير معروف"
      });
      toast({
        title: "خطأ في الإرسال",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء الإرسال",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            اختبار إرسال رسائل مع مرفقات (مبسط)
          </CardTitle>
          <CardDescription>
            اختبار مبسط لإرسال رسائل WhatsApp مع مرفقات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* إعدادات WhatsApp */}
          <div className="space-y-2">
            <Label>إعدادات WhatsApp</Label>
            {settings ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  API Key: {settings.api_key ? `${settings.api_key.substring(0, 8)}...` : 'غير محدد'} | 
                  المرسل: {settings.sender_number || 'غير محدد'}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>إعدادات WhatsApp غير متوفرة</AlertDescription>
              </Alert>
            )}
          </div>

          {/* رقم الهاتف */}
          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="971501234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* الرسالة */}
          <div className="space-y-2">
            <Label htmlFor="message">الرسالة</Label>
            <Textarea
              id="message"
              placeholder="أدخل نص الرسالة هنا..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* اختيار المرفق */}
          <div className="space-y-2">
            <Label>المرفق (اختياري)</Label>
            <div className="flex gap-2">
              <Input
                type="file"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="flex-1"
              />
              {selectedFile && !uploadedUrl && (
                <Button onClick={uploadFile} disabled={isUploading}>
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? "جاري الرفع..." : "رفع الملف"}
                </Button>
              )}
            </div>
            {selectedFile && (
              <div className="text-sm text-gray-600">
                الملف المحدد: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
            {uploadedUrl && (
              <Alert>
                <FileImage className="h-4 w-4" />
                <AlertDescription>
                  تم رفع الملف بنجاح: {uploadedUrl.substring(0, 50)}...
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* زر الإرسال */}
          <Button 
            onClick={sendMessage} 
            disabled={isLoading || !phone || !message || !settings?.api_key}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? "جاري الإرسال..." : uploadedUrl ? "إرسال مع مرفق" : "إرسال رسالة نصية"}
          </Button>

          {/* نتيجة الإرسال */}
          {result && (
            <Alert variant={result.status ? "default" : "destructive"}>
              {result.status ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>
                <strong>النتيجة:</strong> {result.message}
                {result.data && (
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
