// Enhanced Media Message Tab Component
// مكون تاب الرسالة الوسائطية المحسن

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Image, 
  Video, 
  Music, 
  FileText, 
  Upload, 
  Users,
  MessageSquare,
  X,
  Eye,
  Download,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  Send
} from 'lucide-react';
import { whatsappService } from '@/services/whatsappService';
import { toast } from 'sonner';

interface EnhancedMediaMessageTabProps {
  data: any;
  onChange: (data: any) => void;
  isLoading: boolean;
}

interface MediaMessage {
  id: string;
  mediaType: 'image' | 'video' | 'audio' | 'document';
  mediaFile: File | null;
  mediaUrl: string;
  mediaPreview: string;
  message: string;
  caption: string;
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error';
  errorMessage: string;
}

export const EnhancedMediaMessageTab: React.FC<EnhancedMediaMessageTabProps> = ({ 
  data, 
  onChange, 
  isLoading 
}) => {
  // حالات الحملة
  const [campaignName, setCampaignName] = useState(data?.campaignName || '');
  const [campaignDescription, setCampaignDescription] = useState(data?.campaignDescription || '');
  
  // حالات الوسائط
  const [mediaMessages, setMediaMessages] = useState<MediaMessage[]>([
    {
      id: '1',
      mediaType: 'image',
      mediaFile: null,
      mediaUrl: '',
      mediaPreview: '',
      message: '',
      caption: '',
      uploadStatus: 'idle',
      errorMessage: ''
    }
  ]);

  // حالات جهات الاتصال
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [contactsFilter, setContactsFilter] = useState('');

  // حالات إضافية
  const [isDragOver, setIsDragOver] = useState<string>('');
  const [previewMessage, setPreviewMessage] = useState<MediaMessage | null>(null);

  // تحميل جهات الاتصال عند بداية التحميل
  useEffect(() => {
    loadContacts();
  }, []);

  // تحديث البيانات عند تغيير الحالة
  useEffect(() => {
    const updatedData = {
      ...data,
      campaignName,
      campaignDescription,
      mediaMessages,
      selectedContacts,
      messageType: 'media'
    };
    onChange(updatedData);
  }, [campaignName, campaignDescription, mediaMessages, selectedContacts]);

  // دوال مساعدة
  const getMediaTypeLabel = (type: string) => {
    switch (type) {
      case 'image': return 'صورة';
      case 'video': return 'فيديو';
      case 'audio': return 'ملف صوتي';
      case 'document': return 'مستند';
      default: return 'ملف';
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-5 w-5 text-green-600" />;
      case 'video': return <Video className="h-5 w-5 text-blue-600" />;
      case 'audio': return <Music className="h-5 w-5 text-purple-600" />;
      case 'document': return <FileText className="h-5 w-5 text-orange-600" />;
      default: return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getAcceptTypes = (type: string) => {
    switch (type) {
      case 'image': return 'image/*';
      case 'video': return 'video/*';
      case 'audio': return 'audio/*';
      case 'document': return 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv';
      default: return '';
    }
  };

  // تحميل جهات الاتصال
  const loadContacts = async () => {
    try {
      const contactsList = await whatsappService.getContacts();
      setContacts(contactsList || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error('فشل في تحميل جهات الاتصال');
    }
  };

  // إضافة رسالة وسائط جديدة
  const addMediaMessage = () => {
    const newMessage: MediaMessage = {
      id: Date.now().toString(),
      mediaType: 'image',
      mediaFile: null,
      mediaUrl: '',
      mediaPreview: '',
      message: '',
      caption: '',
      uploadStatus: 'idle',
      errorMessage: ''
    };
    setMediaMessages([...mediaMessages, newMessage]);
  };

  // حذف رسالة وسائط
  const removeMediaMessage = (id: string) => {
    if (mediaMessages.length > 1) {
      setMediaMessages(mediaMessages.filter(msg => msg.id !== id));
    } else {
      toast.error('يجب أن تحتوي الحملة على رسالة واحدة على الأقل');
    }
  };

  // تحديث رسالة وسائط
  const updateMediaMessage = (id: string, updates: Partial<MediaMessage>) => {
    setMediaMessages(mediaMessages.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  };

  // رفع ملف وسائط
  const handleFileUpload = async (id: string, file: File) => {
    const message = mediaMessages.find(msg => msg.id === id);
    if (!message) return;

    // التحقق من نوع الملف
    const fileType = file.type;
    const isValidType = 
      (message.mediaType === 'image' && fileType.startsWith('image/')) ||
      (message.mediaType === 'video' && fileType.startsWith('video/')) ||
      (message.mediaType === 'audio' && fileType.startsWith('audio/')) ||
      (message.mediaType === 'document' && (
        fileType === 'application/pdf' ||
        fileType === 'application/msword' ||
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileType === 'application/vnd.ms-excel' ||
        fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        fileType === 'text/plain' ||
        fileType === 'text/csv'
      ));

    if (!isValidType) {
      toast.error(`نوع الملف غير متوافق مع ${getMediaTypeLabel(message.mediaType)}`);
      return;
    }

    // التحقق من حجم الملف
    const maxSize = 16 * 1024 * 1024; // 16MB
    if (file.size > maxSize) {
      toast.error('حجم الملف كبير جداً. الحد الأقصى 16 ميجابايت');
      return;
    }

    updateMediaMessage(id, {
      mediaFile: file,
      uploadStatus: 'uploading',
      errorMessage: ''
    });

    // إنشاء معاينة للصور
    if (message.mediaType === 'image') {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateMediaMessage(id, {
          mediaPreview: e.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    }

    try {
      const uploadedUrl = await whatsappService.uploadMediaFile(file);
      
      if (!uploadedUrl) {
        throw new Error('لم يتم الحصول على رابط الملف');
      }

      updateMediaMessage(id, {
        mediaUrl: uploadedUrl,
        uploadStatus: 'success'
      });

      toast.success('تم رفع الملف بنجاح');
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ في رفع الملف';
      
      updateMediaMessage(id, {
        uploadStatus: 'error',
        errorMessage: errorMessage
      });

      toast.error(errorMessage);
    }
  };

  // معالجة السحب والإفلات
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setIsDragOver(id);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver('');
  };

  const handleDrop = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setIsDragOver('');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(id, files[0]);
    }
  };

  // تبديل اختيار جهة اتصال
  const toggleContact = (contactId: string) => {
    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(selectedContacts.filter(id => id !== contactId));
    } else {
      setSelectedContacts([...selectedContacts, contactId]);
    }
  };

  // اختيار جميع جهات الاتصال
  const selectAllContacts = () => {
    const filteredIds = filteredContacts.map(contact => contact.id);
    setSelectedContacts(filteredIds);
  };

  // إلغاء اختيار جميع جهات الاتصال
  const deselectAllContacts = () => {
    setSelectedContacts([]);
  };

  // تصفية جهات الاتصال
  const filteredContacts = contacts.filter(contact =>
    contact.name?.toLowerCase().includes(contactsFilter.toLowerCase()) ||
    contact.phone?.includes(contactsFilter) ||
    contact.company?.toLowerCase().includes(contactsFilter.toLowerCase())
  );

  // معاينة الرسالة
  const previewMediaMessage = (message: MediaMessage) => {
    if (!message.mediaUrl && !message.message) {
      toast.error('لا توجد بيانات للمعاينة');
      return;
    }
    setPreviewMessage(message);
  };

  return (
    <div className="space-y-6">
      {/* معلومات الحملة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            معلومات الحملة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">اسم الحملة</Label>
            <Input
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="اكتب اسم الحملة..."
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium">وصف الحملة</Label>
            <Textarea
              value={campaignDescription}
              onChange={(e) => setCampaignDescription(e.target.value)}
              placeholder="اكتب وصف للحملة..."
              rows={3}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* رسائل الوسائط */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              رسائل الوسائط ({mediaMessages.length})
            </div>
            <Button
              onClick={addMediaMessage}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              إضافة رسالة
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {mediaMessages.map((message, index) => (
            <div key={message.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-700">رسالة رقم {index + 1}</h4>
                {mediaMessages.length > 1 && (
                  <Button
                    onClick={() => removeMediaMessage(message.id)}
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* قسم رفع الملف */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      نوع الوسائط
                    </Label>
                    <Select 
                      value={message.mediaType} 
                      onValueChange={(value: any) => updateMediaMessage(message.id, { mediaType: value })}
                    >
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

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      رفع ملف {getMediaTypeLabel(message.mediaType)}
                    </Label>
                    <div 
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        message.uploadStatus === 'uploading' 
                          ? 'border-blue-300 bg-blue-50' 
                          : isDragOver === message.id
                          ? 'border-purple-500 bg-purple-100'
                          : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                      }`}
                      onDragOver={(e) => handleDragOver(e, message.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, message.id)}
                    >
                      <input
                        type="file"
                        id={`mediaFile-${message.id}`}
                        accept={getAcceptTypes(message.mediaType)}
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(message.id, e.target.files[0])}
                        className="hidden"
                        disabled={message.uploadStatus === 'uploading'}
                      />
                      <label 
                        htmlFor={`mediaFile-${message.id}`} 
                        className={`cursor-pointer ${message.uploadStatus === 'uploading' ? 'pointer-events-none' : ''}`}
                      >
                        {message.uploadStatus === 'uploading' ? (
                          <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                            <p className="text-sm text-blue-600 font-medium">جاري الرفع...</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-600">
                              اضغط لرفع {getMediaTypeLabel(message.mediaType)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              الحد الأقصى 16 ميجابايت
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {isDragOver === message.id ? 'أفلت الملف هنا' : 'أو اسحب الملف هنا'}
                            </p>
                          </>
                        )}
                      </label>
                    </div>

                    {/* حالة الرفع */}
                    {message.uploadStatus !== 'idle' && (
                      <div className="flex items-center gap-2 p-3 rounded-lg mt-2">
                        {message.uploadStatus === 'uploading' && (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-sm text-blue-600">جاري الرفع...</span>
                          </>
                        )}
                        {message.uploadStatus === 'success' && (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600">تم الرفع بنجاح</span>
                          </>
                        )}
                        {message.uploadStatus === 'error' && (
                          <>
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm text-red-600">فشل في الرفع</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* رسالة الخطأ */}
                    {message.errorMessage && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg mt-2">
                        <p className="text-sm text-red-600">{message.errorMessage}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      نص الرسالة
                    </Label>
                    <Textarea
                      placeholder="اكتب نص الرسالة هنا..."
                      value={message.message}
                      onChange={(e) => updateMediaMessage(message.id, { message: e.target.value })}
                      rows={4}
                    />
                  </div>
                </div>

                {/* قسم المعاينة */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-gray-700">معاينة الرسالة</Label>
                  
                  {/* معلومات الملف */}
                  {message.mediaFile && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {getMediaIcon(message.mediaType)}
                        <div>
                          <p className="text-sm font-medium text-gray-700">{message.mediaFile.name}</p>
                          <p className="text-xs text-gray-500">
                            {(message.mediaFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* معاينة الوسائط */}
                  {message.mediaType === 'image' && (message.mediaPreview || message.mediaUrl) && (
                    <div className="space-y-2">
                      <img
                        src={message.mediaPreview || message.mediaUrl}
                        alt="معاينة"
                        className="max-w-full h-auto rounded-lg border max-h-48 object-cover"
                        onError={(e) => {
                          console.error('Error loading image preview');
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {message.mediaType === 'video' && message.mediaUrl && (
                    <div className="space-y-2">
                      <video 
                        controls 
                        className="w-full rounded-lg border max-h-48"
                        onError={(e) => {
                          console.error('Error loading video preview');
                          e.currentTarget.style.display = 'none';
                        }}
                      >
                        <source src={message.mediaUrl} type={message.mediaFile?.type || 'video/mp4'} />
                        متصفحك لا يدعم تشغيل الفيديو
                      </video>
                    </div>
                  )}
                  
                  {message.mediaType === 'audio' && message.mediaUrl && (
                    <div className="space-y-2">
                      <audio 
                        controls 
                        className="w-full"
                        onError={(e) => {
                          console.error('Error loading audio preview');
                          e.currentTarget.style.display = 'none';
                        }}
                      >
                        <source src={message.mediaUrl} type={message.mediaFile?.type || 'audio/mp3'} />
                        متصفحك لا يدعم تشغيل الصوت
                      </audio>
                    </div>
                  )}

                  {message.mediaType === 'document' && message.mediaUrl && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        {getMediaIcon(message.mediaType)}
                        <div className="flex-1">
                          <span className="text-sm text-gray-700 font-medium">{getMediaTypeLabel(message.mediaType)}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(message.mediaUrl, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = message.mediaUrl;
                              link.download = message.mediaFile?.name || 'file';
                              link.click();
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* معاينة النص */}
                  {message.message && (
                    <>
                      <Separator />
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          نص الرسالة
                        </Label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.message}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* زر معاينة */}
                  <Button
                    onClick={() => previewMediaMessage(message)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={!message.mediaUrl && !message.message}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    معاينة كاملة
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* اختيار جهات الاتصال */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              جهات الاتصال ({selectedContacts.length} محدد)
            </div>
            <div className="flex gap-2">
              <Button
                onClick={selectAllContacts}
                size="sm"
                variant="outline"
              >
                اختيار الكل
              </Button>
              <Button
                onClick={deselectAllContacts}
                size="sm"
                variant="outline"
              >
                إلغاء الكل
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* فلتر البحث */}
          <div>
            <Input
              placeholder="البحث في جهات الاتصال..."
              value={contactsFilter}
              onChange={(e) => setContactsFilter(e.target.value)}
            />
          </div>

          {/* قائمة جهات الاتصال */}
          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedContacts.includes(contact.id) ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => toggleContact(contact.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700">{contact.name}</p>
                      <p className="text-sm text-gray-500">{contact.phone}</p>
                      {contact.company && (
                        <p className="text-xs text-gray-400">{contact.company}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedContacts.includes(contact.id) && (
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                لا توجد جهات اتصال متاحة
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* معاينة الرسالة المنبثقة */}
      {previewMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">معاينة الرسالة</h3>
              <Button
                onClick={() => setPreviewMessage(null)}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* معاينة الوسائط */}
              {previewMessage.mediaUrl && (
                <div>
                  {previewMessage.mediaType === 'image' && (
                    <img
                      src={previewMessage.mediaUrl}
                      alt="معاينة"
                      className="w-full rounded-lg border"
                    />
                  )}
                  {previewMessage.mediaType === 'video' && (
                    <video controls className="w-full rounded-lg border">
                      <source src={previewMessage.mediaUrl} />
                    </video>
                  )}
                  {previewMessage.mediaType === 'audio' && (
                    <audio controls className="w-full">
                      <source src={previewMessage.mediaUrl} />
                    </audio>
                  )}
                  {previewMessage.mediaType === 'document' && (
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">مستند</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* نص الرسالة */}
              {previewMessage.message && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {previewMessage.message}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
