import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, AlertCircle, Upload } from 'lucide-react';

export default function TestBucket() {
  const [isChecking, setIsChecking] = useState(false);
  const [bucketExists, setBucketExists] = useState<boolean | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const { toast } = useToast();

  const checkBucket = async () => {
    setIsChecking(true);
    try {
      // محاولة الوصول إلى bucket
      const { data, error } = await supabase.storage
        .from('whatsapp-media')
        .list('', { limit: 1 });

      if (error) {
        console.error('Bucket check error:', error);
        setBucketExists(false);
        toast({
          title: "Bucket غير موجود",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setBucketExists(true);
        toast({
          title: "Bucket موجود",
          description: "bucket whatsapp-media موجود ويعمل بشكل صحيح",
        });
      }
    } catch (error) {
      console.error('Error checking bucket:', error);
      setBucketExists(false);
      toast({
        title: "خطأ في فحص Bucket",
        description: error instanceof Error ? error.message : "خطأ غير معروف",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const testUpload = async () => {
    setIsUploading(true);
    try {
      // إنشاء ملف اختبار بسيط
      const testContent = 'This is a test file for WhatsApp media bucket';
      const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });

      const timestamp = Date.now();
      const fileName = `test-${timestamp}.txt`;

      const { data, error } = await supabase.storage
        .from('whatsapp-media')
        .upload(fileName, testFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        setUploadResult({ success: false, error: error.message });
        toast({
          title: "فشل في رفع الملف",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // الحصول على الرابط العام
        const { data: urlData } = supabase.storage
          .from('whatsapp-media')
          .getPublicUrl(fileName);

        setUploadResult({ 
          success: true, 
          fileName,
          publicUrl: urlData.publicUrl 
        });
        toast({
          title: "تم رفع الملف بنجاح",
          description: `تم رفع ${fileName} بنجاح`,
        });
      }
    } catch (error) {
      console.error('Test upload error:', error);
      setUploadResult({ success: false, error: error instanceof Error ? error.message : "خطأ غير معروف" });
      toast({
        title: "خطأ في رفع الملف",
        description: error instanceof Error ? error.message : "خطأ غير معروف",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            اختبار Bucket WhatsApp Media
          </CardTitle>
          <CardDescription>
            التحقق من وجود bucket whatsapp-media واختبار رفع الملفات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* فحص Bucket */}
          <div className="space-y-4">
            <Button onClick={checkBucket} disabled={isChecking}>
              {isChecking ? "جاري الفحص..." : "فحص وجود Bucket"}
            </Button>

            {bucketExists !== null && (
              <Alert variant={bucketExists ? "default" : "destructive"}>
                {bucketExists ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertDescription>
                  {bucketExists 
                    ? "✅ bucket whatsapp-media موجود ويعمل بشكل صحيح" 
                    : "❌ bucket whatsapp-media غير موجود أو لا يمكن الوصول إليه"
                  }
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* اختبار رفع ملف */}
          {bucketExists && (
            <div className="space-y-4">
              <Button onClick={testUpload} disabled={isUploading}>
                {isUploading ? "جاري الرفع..." : "اختبار رفع ملف"}
              </Button>

              {uploadResult && (
                <Alert variant={uploadResult.success ? "default" : "destructive"}>
                  {uploadResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <AlertDescription>
                    {uploadResult.success ? (
                      <div>
                        <p>✅ تم رفع الملف بنجاح</p>
                        <p className="text-sm text-gray-600">اسم الملف: {uploadResult.fileName}</p>
                        <p className="text-sm text-gray-600">الرابط: {uploadResult.publicUrl}</p>
                      </div>
                    ) : (
                      <div>
                        <p>❌ فشل في رفع الملف</p>
                        <p className="text-sm text-gray-600">الخطأ: {uploadResult.error}</p>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* تعليمات إنشاء Bucket */}
          {bucketExists === false && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold">لإنشاء bucket whatsapp-media:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>اذهب إلى <a href="https://supabase.com/dashboard/project/hrjyjemacsjoouobcgri/storage" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase Storage</a></li>
                  <li>اضغط على "New bucket"</li>
                  <li>أدخل الاسم: <code>whatsapp-media</code></li>
                  <li>فعّل "Public bucket"</li>
                  <li>اضغط "Create bucket"</li>
                </ol>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
