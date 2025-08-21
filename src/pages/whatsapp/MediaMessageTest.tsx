import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  X, 
  Image, 
  Video, 
  Music, 
  FileText, 
  Eye, 
  Download,
  AlertCircle,
  CheckCircle,
  MessageCircle
} from 'lucide-react';
import { whatsappService } from '@/services/whatsappService';
import { toast } from 'sonner';

const MediaMessageTest: React.FC = () => {
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | 'document'>('image');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // متغيرات إرسال الرسائل
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [sendErrorMessage, setSendErrorMessage] = useState('');

  const getMediaTypeLabel = () => {
    switch (mediaType) {
      case 'image': return 'صورة';
      case 'video': return 'فيديو';
      case 'audio': return 'ملف صوتي';
      case 'document': return 'مستند';
      default: return 'ملف';
    }
  };

  const getMediaIcon = () => {
    switch (mediaType) {
      case 'image': return <Image className="h-5 w-5 text-green-600" />;
      case 'video': return <Video className="h-5 w-5 text-blue-600" />;
      case 'audio': return <Music className="h-5 w-5 text-purple-600" />;
      case 'document': return <FileText className="h-5 w-5 text-orange-600" />;
      default: return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const fileType = file.type;
    const isValidType = 
      (mediaType === 'image' && fileType.startsWith('image/')) ||
      (mediaType === 'video' && fileType.startsWith('video/')) ||
      (mediaType === 'audio' && fileType.startsWith('audio/')) ||
      (mediaType === 'document' && (
        fileType === 'application/pdf' ||
        fileType === 'application/msword' ||
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileType === 'application/vnd.ms-excel' ||
        fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        fileType === 'text/plain' ||
        fileType === 'text/csv'
      ));

    if (!isValidType) {
      toast.error(`نوع الملف غير متوافق مع ${getMediaTypeLabel()}`);
      return;
    }

    setMediaFile(file);
    setUploadStatus('uploading');
    setErrorMessage('');

    // Create preview for images
    if (mediaType === 'image') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    try {
      setIsUploading(true);
      setErrorMessage('');
      
      console.log('🚀 بدء رفع الملف:', {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        type: file.type
      });
      
      const uploadedUrl = await whatsappService.uploadMediaFile(file);
      
      if (!uploadedUrl) {
        throw new Error('لم يتم الحصول على رابط الملف');
      }
      
      setMediaUrl(uploadedUrl);
      setUploadStatus('success');
      
      console.log('✅ تم رفع الملف بنجاح:', uploadedUrl);
      toast.success('تم رفع الملف بنجاح');
      
    } catch (error) {
      console.error('💥 خطأ في رفع الملف:', error);
      
      let errorMessage = 'خطأ غير معروف في رفع الملف';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // رسائل خطأ محددة
        if (error.message.includes('session')) {
          errorMessage = 'يجب تسجيل الدخول أولاً';
        } else if (error.message.includes('size')) {
          errorMessage = 'حجم الملف كبير جداً (الحد الأقصى 16MB)';
        } else if (error.message.includes('type')) {
          errorMessage = 'نوع الملف غير مدعوم';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'خطأ في الاتصال بالخادم. تحقق من الاتصال بالإنترنت';
        }
      }
      
      setErrorMessage(errorMessage);
      setUploadStatus('error');
      toast.error(errorMessage);
      
      // إرسال تفاصيل الخطأ لوحدة التحكم للمطور
      console.error('تفاصيل الخطأ للمطور:', {
        error,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        timestamp: new Date().toISOString()
      });
      
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const fakeEvent = {
        target: { files: [file] }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileUpload(fakeEvent);
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaUrl('');
    setMediaPreview('');
    setUploadStatus('idle');
    setErrorMessage('');
    setSendStatus('idle');
    setSendErrorMessage('');
  };

  // دالة إرسال رسالة واتساب
  const handleSendMessage = async (type: 'text' | 'media' = 'media') => {
    // التحقق من المتطلبات حسب نوع الإرسال
    if (!phoneNumber) {
      toast.error('يرجى إدخال رقم الهاتف');
      return;
    }

    if (type === 'text' && !message) {
      toast.error('يرجى كتابة نص الرسالة');
      return;
    }

    if (type === 'media' && !mediaUrl) {
      toast.error('يرجى رفع ملف وسائط أولاً');
      return;
    }

    try {
      setIsSending(true);
      setSendStatus('sending');
      setSendErrorMessage('');

      console.log('🚀 بدء إرسال رسالة واتساب:', {
        type: type,
        phone: phoneNumber,
        mediaUrl: type === 'media' ? mediaUrl : 'لا يوجد',
        mediaType: type === 'media' ? mediaType : 'لا يوجد',
        message: message
      });

      // تنظيف رقم الهاتف
      const cleanedPhone = phoneNumber.replace(/[^\d+]/g, '');
      
      // التحقق من صحة الرقم
      if (cleanedPhone.length < 10) {
        throw new Error('رقم الهاتف قصير جداً');
      }

      let result;

      if (type === 'text') {
        // إرسال رسالة نصية فقط
        result = await whatsappService.sendWhatsAppMessage(
          cleanedPhone,
          message,
          'Sent via StarCity Folio Media Test',
          undefined, // لا يوجد url
          undefined, // لا يوجد mediaType
          undefined  // لا يوجد caption
        );
      } else {
        // إرسال رسالة مع وسائط
        result = await whatsappService.sendWhatsAppMessage(
          cleanedPhone,
          message || 'رسالة وسائط من StarCity Folio',
          'Sent via StarCity Folio Media Test',
          mediaUrl,
          mediaType,
          message
        );
      }

      console.log('📥 نتيجة الإرسال:', result);

      if (result.success) {
        setSendStatus('success');
        toast.success('تم إرسال الرسالة بنجاح! 🎉');
        
        // إضافة معلومات إضافية للمطور
        console.log('✅ تم الإرسال بنجاح:', {
          type: type,
          status: result.status,
          messageId: result.message,
          phone: cleanedPhone,
          mediaType: type === 'media' ? mediaType : 'نص فقط',
          mediaUrl: type === 'media' ? mediaUrl : 'لا يوجد'
        });
      } else {
        throw new Error(result.message || 'فشل في إرسال الرسالة');
      }

    } catch (error) {
      console.error('💥 خطأ في إرسال الرسالة:', error);
      
      let errorMessage = 'خطأ غير معروف في إرسال الرسالة';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // رسائل خطأ محددة
        if (error.message.includes('phone') || error.message.includes('number')) {
          errorMessage = 'رقم الهاتف غير صحيح';
        } else if (error.message.includes('media') || error.message.includes('url')) {
          errorMessage = 'خطأ في ملف الوسائط';
        } else if (error.message.includes('api') || error.message.includes('API')) {
          errorMessage = 'خطأ في API الواتساب. تحقق من الإعدادات';
        } else if (error.message.includes('network')) {
          errorMessage = 'خطأ في الاتصال بالخادم';
        }
      }
      
      setSendStatus('error');
      setSendErrorMessage(errorMessage);
      toast.error(errorMessage);
      
      // إرسال تفاصيل الخطأ لوحدة التحكم للمطور
      console.error('تفاصيل خطأ الإرسال للمطور:', {
        error,
        phoneNumber,
        mediaUrl,
        mediaType,
        message,
        timestamp: new Date().toISOString()
      });
      
    } finally {
      setIsSending(false);
    }
  };

  const getAcceptTypes = () => {
    switch (mediaType) {
      case 'image': return 'image/*';
      case 'video': return 'video/*';
      case 'audio': return 'audio/*';
      case 'document': return 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv';
      default: return '';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">صفحة اختبار رسائل الوسائط</h1>
        <p className="text-gray-600">اختبار وظائف رفع الملفات وعرض الوسائط</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              رفع الملف
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Media Type Selection */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                نوع الوسائط
              </Label>
              <Select value={mediaType} onValueChange={(value: any) => setMediaType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">صورة</SelectItem>
                  <SelectItem value="video">فيديو</SelectItem>
                  <SelectItem value="audio">ملف صوتي</SelectItem>
                  <SelectItem value="document">مستند</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File Upload */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                رفع ملف {getMediaTypeLabel()}
              </Label>
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isUploading 
                    ? 'border-blue-300 bg-blue-50' 
                    : isDragOver
                    ? 'border-purple-500 bg-purple-100'
                    : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="mediaFile"
                  accept={getAcceptTypes()}
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <label htmlFor="mediaFile" className={`cursor-pointer ${isUploading ? 'pointer-events-none' : ''}`}>
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                      <p className="text-sm text-blue-600 font-medium">جاري الرفع...</p>
                      <p className="text-xs text-blue-500 mt-1">يرجى الانتظار</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        اضغط لرفع {getMediaTypeLabel()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        الحد الأقصى 16 ميجابايت
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {isDragOver ? 'أفلت الملف هنا' : 'أو اسحب الملف هنا'}
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Upload Status */}
            {uploadStatus !== 'idle' && (
              <div className="flex items-center gap-2 p-3 rounded-lg">
                {uploadStatus === 'uploading' && (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-blue-600">جاري الرفع...</span>
                  </>
                )}
                {uploadStatus === 'success' && (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">تم الرفع بنجاح</span>
                  </>
                )}
                {uploadStatus === 'error' && (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600">فشل في الرفع</span>
                  </>
                )}
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errorMessage}</p>
              </div>
            )}

            {/* Message Text */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                نص الرسالة
              </Label>
              <Textarea
                placeholder="اكتب نص الرسالة هنا..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getMediaIcon()}
              معاينة الرسالة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Info */}
            {mediaFile && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getMediaIcon()}
                    <div>
                      <p className="text-sm font-medium text-gray-700">{mediaFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(mediaFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={removeMedia}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Media Preview */}
            {mediaType === 'image' && (mediaPreview || mediaUrl) && (
              <div className="space-y-2">
                <img
                  src={mediaPreview || mediaUrl}
                  alt="معاينة"
                  className="max-w-full h-auto rounded-lg border"
                  onError={(e) => {
                    console.error('Error loading image preview');
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {mediaType === 'video' && mediaUrl && (
              <div className="space-y-2">
                <video 
                  controls 
                  className="w-full rounded-lg border"
                  onError={(e) => {
                    console.error('Error loading video preview');
                    e.currentTarget.style.display = 'none';
                  }}
                >
                  <source src={mediaUrl} type={mediaFile?.type || 'video/mp4'} />
                  متصفحك لا يدعم تشغيل الفيديو
                </video>
              </div>
            )}
            
            {mediaType === 'audio' && mediaUrl && (
              <div className="space-y-2">
                <audio 
                  controls 
                  className="w-full"
                  onError={(e) => {
                    console.error('Error loading audio preview');
                    e.currentTarget.style.display = 'none';
                  }}
                >
                  <source src={mediaUrl} type={mediaFile?.type || 'audio/mp3'} />
                  متصفحك لا يدعم تشغيل الصوت
                </audio>
              </div>
            )}

            {mediaType === 'document' && mediaUrl && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  {getMediaIcon()}
                  <div className="flex-1">
                    <span className="text-sm text-gray-700 font-medium">{getMediaTypeLabel()}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => window.open(mediaUrl, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = mediaUrl;
                        link.download = mediaFile?.name || 'file';
                        link.click();
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Message Preview */}
            {message && (
              <>
                <Separator />
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    نص الرسالة
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{message}</p>
                  </div>
                </div>
              </>
            )}

            {/* Send Message Section */}
            <Separator />
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">إرسال رسالة واتساب</Label>
              
              {/* Phone Number Input */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  رقم الهاتف
                </Label>
                <input
                  type="tel"
                  placeholder="971501234567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  أدخل الرقم مع كود الدولة (مثال: 971501234567)
                </p>
              </div>

              {/* File Upload Status */}
              {!mediaUrl && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    💡 يمكنك إرسال رسالة نصية فقط أو ارفع ملف وسائط
                  </p>
                </div>
              )}

              {mediaUrl && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✅ تم رفع الملف بنجاح - جاهز للإرسال مع الوسائط
                  </p>
                </div>
              )}

              {/* Send Type Selection */}
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSendMessage('text')}
                  disabled={!phoneNumber || !message || isSending}
                  className={`flex-1 ${
                    !phoneNumber || !message 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  {isSending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      إرسال نص فقط
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => handleSendMessage('media')}
                  disabled={!phoneNumber || !mediaUrl || isSending}
                  className={`flex-1 ${
                    !phoneNumber || !mediaUrl 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white`}
                >
                  {isSending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      إرسال مع وسائط
                    </>
                  )}
                </Button>
              </div>

              {/* Send Status */}
              {sendStatus !== 'idle' && (
                <div className={`p-3 rounded-lg ${
                  sendStatus === 'success' ? 'bg-green-50 border border-green-200' :
                  sendStatus === 'error' ? 'bg-red-50 border border-red-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                  {sendStatus === 'success' && (
                    <p className="text-sm text-green-600">✅ تم إرسال الرسالة بنجاح</p>
                  )}
                  {sendStatus === 'error' && (
                    <p className="text-sm text-red-600">❌ فشل في إرسال الرسالة</p>
                  )}
                  {sendErrorMessage && (
                    <p className="text-xs text-red-500 mt-1">{sendErrorMessage}</p>
                  )}
                </div>
              )}
            </div>

            {/* Test Actions */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">إجراءات الاختبار</Label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    console.log('Media File:', mediaFile);
                    console.log('Media URL:', mediaUrl);
                    console.log('Message:', message);
                    console.log('Phone Number:', phoneNumber);
                    toast.info('تم طباعة البيانات في وحدة التحكم');
                  }}
                >
                  طباعة البيانات
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    if (mediaUrl) {
                      navigator.clipboard.writeText(mediaUrl);
                      toast.success('تم نسخ رابط الملف');
                    } else {
                      toast.error('لا يوجد رابط ملف');
                    }
                  }}
                >
                  نسخ الرابط
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MediaMessageTest;
