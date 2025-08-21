// Media Message Tab Component
// مكون تاب الرسالة الوسائطية

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Image, 
  Video, 
  Music, 
  File, 
  Upload, 
  Link, 
  Users,
  Phone,
  MessageSquare,
  X,
  Eye,
  Download
} from 'lucide-react';
import { whatsappService } from '@/services/whatsappService';

interface MediaMessageTabProps {
  data: any;
  onChange: (data: any) => void;
  isLoading: boolean;
}

export const MediaMessageTab: React.FC<MediaMessageTabProps> = ({ 
  data, 
  onChange, 
  isLoading 
}) => {
  const [senderNumber, setSenderNumber] = useState('971522001189');
  const [recipientNumbers, setRecipientNumbers] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | 'document'>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const contactsData = await whatsappService.getContacts();
      setContacts(contactsData);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const handleSenderChange = (value: string) => {
    setSenderNumber(value);
    onChange({
      ...data,
      sender: value
    });
  };

  const handleRecipientsChange = (value: string) => {
    setRecipientNumbers(value);
    onChange({
      ...data,
      recipients: value
    });
  };

  const handleMessageChange = (value: string) => {
    setMessageContent(value);
    onChange({
      ...data,
      messageContent: value
    });
  };

  const handleMediaTypeChange = (value: string) => {
    setMediaType(value as any);
    onChange({
      ...data,
      mediaType: value
    });
  };

  const handleMediaUrlChange = (value: string) => {
    setMediaUrl(value);
    onChange({
      ...data,
      mediaUrl: value
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // التحقق من نوع الملف
      const allowedTypes = {
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        video: ['video/mp4', 'video/avi', 'video/mov'],
        audio: ['audio/mp3', 'audio/wav', 'audio/ogg'],
        document: ['application/pdf', 'application/doc', 'application/docx']
      };

      if (!allowedTypes[mediaType].includes(file.type)) {
        throw new Error(`نوع الملف غير مدعوم لـ ${mediaType}`);
      }

      // التحقق من حجم الملف (16MB للواتساب)
      if (file.size > 16 * 1024 * 1024) {
        throw new Error('حجم الملف كبير جداً. الحد الأقصى 16 ميجابايت');
      }

      setMediaFile(file);

      // إنشاء معاينة للملف
      if (mediaType === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          setMediaPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }

      // رفع الملف
      const uploadedUrl = await whatsappService.uploadMediaFile(file);
      setMediaUrl(uploadedUrl || '');
      
      onChange({
        ...data,
        mediaFile: file,
        mediaUrl: uploadedUrl
      });

    } catch (error) {
      console.error('Error uploading file:', error);
      alert(error instanceof Error ? error.message : 'خطأ في رفع الملف');
    } finally {
      setIsUploading(false);
    }
  };

  const handleContactSelect = (contactId: string) => {
    const newSelected = selectedContacts.includes(contactId)
      ? selectedContacts.filter(id => id !== contactId)
      : [...selectedContacts, contactId];
    
    setSelectedContacts(newSelected);
    
    const selectedContactNumbers = contacts
      .filter(contact => newSelected.includes(contact.id))
      .map(contact => contact.phone || contact.whatsapp_number)
      .join('|');
    
    setRecipientNumbers(selectedContactNumbers);
    onChange({
      ...data,
      recipients: selectedContactNumbers,
      selectedContacts: newSelected
    });
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaUrl('');
    setMediaPreview('');
    onChange({
      ...data,
      mediaFile: null,
      mediaUrl: ''
    });
  };

  const getMediaIcon = () => {
    switch (mediaType) {
      case 'image': return <Image className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'audio': return <Music className="h-5 w-5" />;
      case 'document': return <File className="h-5 w-5" />;
      default: return <File className="h-5 w-5" />;
    }
  };

  const getMediaTypeLabel = () => {
    switch (mediaType) {
      case 'image': return 'صورة';
      case 'video': return 'فيديو';
      case 'audio': return 'صوت';
      case 'document': return 'مستند';
      default: return 'ملف';
    }
  };

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="text-right">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">رسالة وسائط</h2>
        <p className="text-gray-600">إنشاء رسالة مع صورة أو فيديو أو ملف صوتي</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* العمود الأيسر - إعدادات الرسالة */}
        <div className="lg:col-span-2 space-y-6">
          {/* المرسل والمستلم */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="sender" className="text-sm font-medium text-gray-700 mb-2 block">
                  المرسل
                </Label>
                <Input
                  id="sender"
                  value={senderNumber}
                  onChange={(e) => handleSenderChange(e.target.value)}
                  placeholder="971522001189"
                  className="text-left"
                />
              </div>

              <div>
                <Label htmlFor="recipients" className="text-sm font-medium text-gray-700 mb-2 block">
                  رقم المستلم *
                </Label>
                <Textarea
                  id="recipients"
                  value={recipientNumbers}
                  onChange={(e) => handleRecipientsChange(e.target.value)}
                  placeholder="628xxx|628xxx|628xxx"
                  className="text-left resize-none"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  يمكنك إضافة عدة أرقام مفصولة بـ | أو اختيار من جهات الاتصال
                </p>
              </div>
            </CardContent>
          </Card>

          {/* إعدادات الوسائط */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                {getMediaIcon()}
                <h3 className="font-semibold text-gray-900">إعدادات الوسائط</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mediaType" className="text-sm font-medium text-gray-700 mb-2 block">
                    نوع الوسائط
                  </Label>
                  <Select value={mediaType} onValueChange={handleMediaTypeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">صورة</SelectItem>
                      <SelectItem value="video">فيديو</SelectItem>
                      <SelectItem value="audio">صوت</SelectItem>
                      <SelectItem value="document">مستند</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="mediaUrl" className="text-sm font-medium text-gray-700 mb-2 block">
                    رابط الوسائط
                  </Label>
                  <Input
                    id="mediaUrl"
                    value={mediaUrl}
                    onChange={(e) => handleMediaUrlChange(e.target.value)}
                    placeholder="https://example.com/media.jpg"
                    className="text-left"
                  />
                </div>
              </div>

              {/* رفع الملف */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  رفع ملف {getMediaTypeLabel()}
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="mediaFile"
                    accept={mediaType === 'image' ? 'image/*' : 
                           mediaType === 'video' ? 'video/*' : 
                           mediaType === 'audio' ? 'audio/*' : 
                           'application/pdf,application/doc,application/docx'}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="mediaFile" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      {isUploading ? 'جاري الرفع...' : `اضغط لرفع ${getMediaTypeLabel()}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      الحد الأقصى 16 ميجابايت
                    </p>
                  </label>
                </div>
              </div>

              {/* معاينة الوسائط */}
              {(mediaPreview || mediaUrl) && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">معاينة الوسائط</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeMedia}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {mediaType === 'image' && mediaPreview && (
                    <div className="relative">
                      <img
                        src={mediaPreview}
                        alt="معاينة"
                        className="max-w-full h-auto rounded-lg"
                      />
                    </div>
                  )}
                  
                  {mediaType !== 'image' && mediaUrl && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      {getMediaIcon()}
                      <span className="text-sm text-gray-700">{getMediaTypeLabel()}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* محرر الرسالة */}
          <Card>
            <CardContent className="p-6">
              <Label htmlFor="message" className="text-sm font-medium text-gray-700 mb-2 block">
                نص الرسالة (اختياري)
              </Label>
              <Textarea
                id="message"
                value={messageContent}
                onChange={(e) => handleMessageChange(e.target.value)}
                placeholder="اكتب نص الرسالة هنا (سيظهر كـ caption للوسائط)..."
                className="text-right resize-none"
                rows={4}
              />
              <div className="mt-2 text-xs text-gray-500">
                <p>متغيرات التخصيص المتاحة:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Badge variant="secondary" className="text-xs">{'{name}'}</Badge>
                  <Badge variant="secondary" className="text-xs">{'{phone}'}</Badge>
                  <Badge variant="secondary" className="text-xs">{'{company}'}</Badge>
                  <Badge variant="secondary" className="text-xs">{'{type}'}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* العمود الأيمن - جهات الاتصال */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">جهات الاتصال</h3>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {contacts.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Phone className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">لا توجد جهات اتصال</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={`p-3 cursor-pointer transition-colors ${
                          selectedContacts.includes(contact.id)
                            ? 'bg-purple-50 border-r-2 border-purple-500'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleContactSelect(contact.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-right">
                            <div className="font-medium text-gray-900">
                              {contact.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {contact.phone || contact.whatsapp_number}
                            </div>
                            {contact.company && (
                              <div className="text-xs text-gray-400">
                                {contact.company}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={contact.contact_type === 'client' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {contact.contact_type === 'client' ? 'عميل' : 
                               contact.contact_type === 'owner' ? 'مالك' : 'مسوق'}
                            </Badge>
                            {selectedContacts.includes(contact.id) && (
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* إحصائيات سريعة */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">جهات الاتصال المحددة:</span>
                  <Badge variant="secondary">{selectedContacts.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">إجمالي جهات الاتصال:</span>
                  <Badge variant="outline">{contacts.length}</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">نوع الوسائط:</span>
                  <Badge variant="outline">{getMediaTypeLabel()}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">طول النص:</span>
                  <Badge variant="outline">{messageContent.length} حرف</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
