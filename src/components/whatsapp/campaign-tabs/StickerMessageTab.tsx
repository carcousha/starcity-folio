// Sticker Message Tab Component
// مكون تاب رسالة الملصق

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Sticker,
  Upload,
  Image,
  Users,
  X,
  Eye,
  Phone
} from 'lucide-react';
import { whatsappService } from '@/services/whatsappService';
import { toast } from 'sonner';
import { defaultStickerCollections, StickerCategory } from '@/data/defaultStickers';

interface StickerMessageTabProps {
  data: any;
  onChange: (data: any) => void;
  isLoading: boolean;
}

// استخدام مجموعة الملصقات الافتراضية
const quickStickers = defaultStickerCollections.slice(0, 3); // أول 3 فئات للتاب

export const StickerMessageTab: React.FC<StickerMessageTabProps> = ({ 
  data, 
  onChange, 
  isLoading 
}) => {
  const [senderNumber, setSenderNumber] = useState('971522001189');
  const [recipientNumbers, setRecipientNumbers] = useState('');
  const [selectedStickerUrl, setSelectedStickerUrl] = useState('');
  const [customStickerFile, setCustomStickerFile] = useState<File | null>(null);
  const [stickerPreview, setStickerPreview] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('emotions');
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

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

  const handleStickerSelect = (stickerUrl: string, stickerName: string) => {
    setSelectedStickerUrl(stickerUrl);
    setStickerPreview(stickerUrl);
    setCustomStickerFile(null);
    onChange({
      ...data,
      stickerUrl,
      stickerName,
      stickerType: 'preset'
    });
    toast.success(`تم اختيار ملصق: ${stickerName}`);
  };

  const handleCustomStickerUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار صورة صالحة للملصق');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast.error('حجم الملصق يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setUploadStatus('uploading');

    try {
      // إنشاء معاينة محلية
      const preview = URL.createObjectURL(file);
      
      setCustomStickerFile(file);
      setStickerPreview(preview);
      setSelectedStickerUrl(preview);
      setUploadStatus('success');
      
      onChange({
        ...data,
        stickerUrl: preview,
        stickerName: `ملصق مخصص: ${file.name}`,
        stickerType: 'custom',
        customFile: file
      });

      toast.success('تم رفع الملصق بنجاح');
    } catch (error) {
      setUploadStatus('error');
      toast.error('فشل في رفع الملصق');
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleCustomStickerUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleCustomStickerUpload(files[0]);
    }
  };

  const handleContactSelect = (contactId: string) => {
    const newSelected = selectedContacts.includes(contactId)
      ? selectedContacts.filter(id => id !== contactId)
      : [...selectedContacts, contactId];
    
    setSelectedContacts(newSelected);
    
    // تحديث أرقام المستلمين
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

  const clearSticker = () => {
    setSelectedStickerUrl('');
    setStickerPreview('');
    setCustomStickerFile(null);
    setUploadStatus('idle');
    onChange({
      ...data,
      stickerUrl: '',
      stickerName: '',
      stickerType: null,
      customFile: null
    });
  };

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="text-right">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">رسالة ملصق</h2>
        <p className="text-gray-600">إرسال ملصقات تعبيرية وتفاعلية</p>
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

          {/* اختيار الملصق */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sticker className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-semibold text-gray-900">اختيار الملصق</h3>
                </div>
                {stickerPreview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSticker}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    مسح
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* معاينة الملصق المختار */}
              {stickerPreview && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-4">
                    <img 
                      src={stickerPreview} 
                      alt="معاينة الملصق"
                      className="w-16 h-16 rounded-lg shadow-sm"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div>
                      <p className="font-medium text-gray-900">الملصق المختار</p>
                      <p className="text-sm text-gray-600">
                        {data.stickerName || 'ملصق مخصص'}
                      </p>
                      <Badge variant="secondary" className="mt-1">
                        {data.stickerType === 'custom' ? 'مخصص' : 'جاهز'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* فئات الملصقات */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  فئات الملصقات
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {quickStickers.map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <Button
                        key={category.category}
                        onClick={() => setSelectedCategory(category.category)}
                        variant={selectedCategory === category.category ? "default" : "outline"}
                        size="sm"
                        className="h-12 flex items-center gap-2"
                      >
                        <IconComponent className="h-4 w-4" />
                        {category.name}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* الملصقات الجاهزة */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  الملصقات الجاهزة
                </Label>
                <div className="grid grid-cols-6 gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  {quickStickers
                    .find(cat => cat.category === selectedCategory)
                    ?.stickers.map((sticker) => (
                      <button
                        key={sticker.id}
                        onClick={() => handleStickerSelect(sticker.url, sticker.name)}
                        className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                          selectedStickerUrl === sticker.url 
                            ? 'border-yellow-500 bg-yellow-100 shadow-md' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        title={sticker.name}
                      >
                        <img 
                          src={sticker.url} 
                          alt={sticker.name}
                          className="w-8 h-8 mx-auto"
                          onError={(e) => {
                            // استخدام emoji كبديل إذا فشل تحميل الصورة
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              parent.innerHTML = `<span class="text-2xl">${sticker.preview}</span>`;
                            }
                          }}
                        />
                      </button>
                    ))}
                </div>
              </div>

              {/* رفع ملصق مخصص */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  رفع ملصق مخصص
                </Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragOver
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 mb-3">
                    اسحب وأفلت صورة الملصق هنا أو
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.addEventListener('change', (e) => handleFileInput(e as any));
                      input.click();
                    }}
                    disabled={uploadStatus === 'uploading'}
                  >
                    {uploadStatus === 'uploading' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                        جاري الرفع...
                      </>
                    ) : (
                      <>
                        <Image className="h-4 w-4 mr-2" />
                        اختيار صورة
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    أقصى حجم: 5 ميجابايت • أنواع مدعومة: JPG, PNG, GIF
                  </p>
                </div>

                {/* حالة الرفع */}
                {uploadStatus === 'error' && (
                  <div className="mt-2 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                    <p className="text-sm text-red-700">فشل في رفع الملصق</p>
                  </div>
                )}

                {uploadStatus === 'success' && customStickerFile && (
                  <div className="mt-2 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <p className="text-sm text-green-700">تم رفع الملصق بنجاح</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* العمود الأيمن - جهات الاتصال ومعاينة */}
        <div className="space-y-4">
          {/* معاينة سريعة */}
          {stickerPreview && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">المعاينة</h3>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="bg-gradient-to-b from-green-400 to-green-600 rounded-lg p-4 text-white">
                  <div className="bg-white rounded-lg p-3 text-right">
                    <div className="flex justify-center mb-2">
                      <img 
                        src={stickerPreview} 
                        alt="معاينة الملصق"
                        className="w-20 h-20 rounded-lg"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-green-100 mt-2 text-center">
                    معاينة في واتساب
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* جهات الاتصال */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">جهات الاتصال</h3>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-80 overflow-y-auto">
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
                            ? 'bg-yellow-50 border-r-2 border-yellow-500'
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
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
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
                  <span className="text-sm text-gray-600">نوع الملصق:</span>
                  <Badge variant="outline">
                    {data.stickerType === 'custom' ? 'مخصص' : 
                     data.stickerType === 'preset' ? 'جاهز' : 'غير محدد'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};