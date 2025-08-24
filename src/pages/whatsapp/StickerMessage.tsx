// Sticker Message Campaign Page
// صفحة حملة رسائل الملصقات

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Sticker,
  Users,
  ArrowLeft,
  Send,
  CheckCircle,
  X,
  Eye,
  Upload,
  Image,
  Plus,
  Trash2,
  Settings,
  FileText
} from 'lucide-react';
import { whatsappService } from '@/services/whatsappService';
import { toast } from 'sonner';
import { defaultStickerCollections } from '@/data/defaultStickers';
import { AdvancedSendingSettings, AdvancedSendingConfig, defaultAdvancedSendingConfig } from '@/components/whatsapp/AdvancedSendingSettings';
import { TemplateSelector, WhatsAppTemplate } from '@/components/whatsapp/TemplateSelector';
import { LiveSendingScreen, SendingMessage, SendingStats } from '@/components/whatsapp/LiveSendingScreen';
import { CampaignReport, CampaignReportData } from '@/components/whatsapp/CampaignReport';
import { advancedCampaignService } from '@/services/advancedCampaignService';

interface StickerMessage {
  id: string;
  stickerUrl: string;
  customStickerFile: File | null;
  stickerPreview: string;
  category: string;
  description: string;
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error';
  errorMessage: string;
}

// استخدام مجموعة الملصقات الافتراضية من الملف المنفصل

export default function StickerMessage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // بيانات الوسيط من الرابط
  const brokerId = searchParams.get('brokerId');
  const brokerName = searchParams.get('brokerName');
  const brokerPhone = searchParams.get('brokerPhone');
  
  // الوضع الجماعي
  const bulkMode = searchParams.get('bulkMode') === 'true';
  const brokerIds = searchParams.get('brokerIds')?.split(',') || [];
  const brokerNames = searchParams.get('brokerNames') ? decodeURIComponent(searchParams.get('brokerNames')!).split(',') : [];
  const brokerPhones = searchParams.get('brokerPhones')?.split(',') || [];
  
  // حالات الحملة
  const [campaignName, setCampaignName] = useState(() => {
    if (bulkMode && brokerNames.length > 0) {
      return `حملة ملصقات جماعية - ${brokerNames.length} وسيط`;
    }
    return brokerName ? `حملة ملصقات ${brokerName}` : '';
  });
  const [campaignDescription, setCampaignDescription] = useState('');
  
  // حالات الملصقات
  const [stickerMessages, setStickerMessages] = useState<StickerMessage[]>([
    {
      id: '1',
      stickerUrl: '',
      customStickerFile: null,
      stickerPreview: '',
      category: 'emotions',
      description: '',
      uploadStatus: 'idle',
      errorMessage: ''
    }
  ]);

  // حالات جهات الاتصال
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [contactsFilter, setContactsFilter] = useState('');

  // حالات إضافية
  const [selectedCategory, setSelectedCategory] = useState('emotions');
  const [previewMessage, setPreviewMessage] = useState<StickerMessage | null>(null);
  const [isDragOver, setIsDragOver] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // الإعدادات المتقدمة الجديدة
  const [advancedConfig, setAdvancedConfig] = useState<AdvancedSendingConfig>(defaultAdvancedSendingConfig);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [currentView, setCurrentView] = useState<'compose' | 'sending' | 'report'>('compose');
  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(null);
  const [sendingMessages, setSendingMessages] = useState<SendingMessage[]>([]);
  const [sendingStats, setSendingStats] = useState<SendingStats>({
    totalMessages: 0,
    sentMessages: 0,
    failedMessages: 0,
    pendingMessages: 0,
    pausedMessages: 0,
    currentBatch: 1,
    totalBatches: 1,
    elapsedTime: 0,
    averageMessageTime: 0,
    successRate: 0,
    messagesPerMinute: 0
  });
  const [campaignReport, setCampaignReport] = useState<CampaignReportData | null>(null);

  // تحميل جهات الاتصال عند بداية التحميل
  useEffect(() => {
    loadContacts();
  }, []);

  // تحديد الوسيط تلقائياً إذا كان موجوداً في الرابط
  useEffect(() => {
    if (brokerId && contacts.length > 0) {
      const brokerContact = contacts.find(contact => 
        contact.id === brokerId || contact.phone === brokerPhone
      );
      if (brokerContact) {
        setSelectedContacts([brokerContact.id]);
        toast.success(`تم تحديد الوسيط: ${brokerContact.name}`);
      }
    }
  }, [brokerId, brokerPhone, contacts]);

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

  // إضافة رسالة ملصق جديدة
  const addStickerMessage = () => {
    const newMessage: StickerMessage = {
      id: Date.now().toString(),
      stickerUrl: '',
      customStickerFile: null,
      stickerPreview: '',
      category: 'emotions',
      description: '',
      uploadStatus: 'idle',
      errorMessage: ''
    };
    setStickerMessages([...stickerMessages, newMessage]);
  };

  // حذف رسالة ملصق
  const removeStickerMessage = (id: string) => {
    if (stickerMessages.length > 1) {
      setStickerMessages(stickerMessages.filter(msg => msg.id !== id));
    } else {
      toast.error('يجب أن تحتوي الحملة على ملصق واحد على الأقل');
    }
  };

  // تحديث رسالة ملصق
  const updateStickerMessage = (id: string, updates: Partial<StickerMessage>) => {
    setStickerMessages(stickerMessages.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  };

  // اختيار ملصق جاهز
  const selectPresetSticker = (messageId: string, stickerUrl: string, stickerName: string) => {
    updateStickerMessage(messageId, {
      stickerUrl,
      stickerPreview: stickerUrl,
      description: stickerName,
      customStickerFile: null
    });
    toast.success(`تم اختيار ملصق: ${stickerName}`);
  };

  // رفع ملصق مخصص
  const handleCustomStickerUpload = async (messageId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار صورة صالحة للملصق');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast.error('حجم الملصق يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    updateStickerMessage(messageId, { uploadStatus: 'uploading' });

    try {
      // إنشاء معاينة محلية
      const preview = URL.createObjectURL(file);
      
      // هنا يمكن إضافة منطق رفع الملف إلى الخادم
      // في الوقت الحالي، سنستخدم المعاينة المحلية
      
      updateStickerMessage(messageId, {
        customStickerFile: file,
        stickerPreview: preview,
        stickerUrl: preview, // مؤقتاً
        description: `ملصق مخصص: ${file.name}`,
        uploadStatus: 'success',
        errorMessage: ''
      });

      toast.success('تم رفع الملصق بنجاح');
    } catch (error) {
      updateStickerMessage(messageId, {
        uploadStatus: 'error',
        errorMessage: 'فشل في رفع الملصق'
      });
      toast.error('فشل في رفع الملصق');
    }
  };

  // معالجة السحب والإفلات
  const handleDragOver = (e: React.DragEvent, messageId: string) => {
    e.preventDefault();
    setIsDragOver(messageId);
  };

  const handleDragLeave = () => {
    setIsDragOver('');
  };

  const handleDrop = (e: React.DragEvent, messageId: string) => {
    e.preventDefault();
    setIsDragOver('');
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleCustomStickerUpload(messageId, files[0]);
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

  // معاينة الملصق
  const previewStickerMessage = (message: StickerMessage) => {
    if (!message.stickerUrl) {
      toast.error('لا يوجد ملصق للمعاينة');
      return;
    }
    setPreviewMessage(message);
  };

  // إرسال حملة الملصقات بالنظام المتقدم الجديد
  const handleSendCampaign = async () => {
    // التحقق من صحة البيانات
    if (!campaignName.trim()) {
      toast.error('يرجى إدخال اسم الحملة');
      return;
    }

    // التحقق من وجود جهات اتصال
    const hasContacts = bulkMode 
      ? brokerPhones.length > 0 
      : selectedContacts.length > 0;
      
    if (!hasContacts) {
      toast.error(bulkMode 
        ? 'لا توجد أرقام هواتف للوسطاء المحددين' 
        : 'يرجى اختيار جهات اتصال على الأقل'
      );
      return;
    }

    const hasValidStickers = stickerMessages.some(msg => msg.stickerUrl.trim());
    if (!hasValidStickers) {
      toast.error('يرجى اختيار ملصق واحد على الأقل');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🚀 بدء إرسال حملة الملصقات بالنظام المتقدم:', {
        campaignName,
        stickerMessages,
        selectedContacts,
        advancedConfig
      });

      // تحضير قائمة جهات الاتصال
      const contactsToSend = bulkMode 
        ? brokerPhones.map((phone, index) => ({
            id: brokerIds[index] || `bulk_${index}`,
            name: brokerNames[index] || 'وسيط',
            phone: phone,
            company: 'وسيط عقاري',
            email: ''
          }))
        : await Promise.all(
            selectedContacts.map(async (contactId) => {
              const contact = await whatsappService.getContactById(contactId);
              return contact;
            })
          ).then(contacts => contacts.filter(Boolean));

      // تحضير الرسائل للإرسال
      const messagesToSend = stickerMessages
        .filter(msg => msg.stickerUrl.trim())
        .map(msg => ({
          stickerUrl: msg.stickerUrl,
          description: msg.description,
          content: msg.stickerUrl // للتوافق مع النظام
        }));

      // إنشاء حملة جديدة في النظام المتقدم
      const campaignId = await advancedCampaignService.createCampaign(
        campaignName,
        'sticker',
        messagesToSend,
        contactsToSend,
        advancedConfig,
        selectedTemplate?.id
      );

      setCurrentCampaignId(campaignId);
      
      // تحضير إحصائيات الإرسال
      const totalMessages = messagesToSend.length * contactsToSend.length;
      setSendingStats({
        totalMessages,
        sentMessages: 0,
        failedMessages: 0,
        pendingMessages: totalMessages,
        pausedMessages: 0,
        currentBatch: 1,
        totalBatches: Math.ceil(totalMessages / (advancedConfig.batchPause.messagesPerBatch || 50)),
        elapsedTime: 0,
        averageMessageTime: 0,
        successRate: 0,
        messagesPerMinute: 0
      });

      // إنشاء قائمة الرسائل للعرض
      const sendingMessagesList: SendingMessage[] = [];
      let messageIndex = 0;
      
      for (const contact of contactsToSend) {
        for (const message of messagesToSend) {
          sendingMessagesList.push({
            id: `sticker_msg_${messageIndex++}`,
            recipientName: contact.name,
            recipientNumber: contact.phone,
            content: message.description || 'ملصق',
            status: 'pending',
            retryCount: 0
          });
        }
      }
      
      setSendingMessages(sendingMessagesList);

      // التبديل إلى شاشة الإرسال المباشرة
      setCurrentView('sending');
      
      // بدء الحملة
      const started = await advancedCampaignService.startCampaign(campaignId);
      
      if (started) {
        toast.success('تم بدء حملة الملصقات بنجاح!');
        
        // تحديث الإحصائيات كل ثانية
        const statsInterval = setInterval(async () => {
          const campaign = advancedCampaignService.getCampaign(campaignId);
          const progress = advancedCampaignService.getCampaignProgress(campaignId);
          
          if (campaign && progress) {
            setSendingStats(campaign.stats);
            setSendingMessages([...campaign.sendingMessages]);
            
            // إذا انتهت الحملة، أوقف التحديث واعرض التقرير
            if (campaign.status === 'completed' || campaign.status === 'failed') {
              clearInterval(statsInterval);
              
              // تحضير التقرير النهائي
              const report = await advancedCampaignService.getCampaignReport(campaignId);
              if (report) {
                setCampaignReport(report);
                setCurrentView('report');
                
                if (campaign.status === 'completed') {
                  toast.success('تم إكمال الحملة بنجاح!');
                } else {
                  toast.error('فشلت الحملة أو تم إيقافها');
                }
              }
            }
          }
        }, 1000);
        
        // تنظيف الفاصل عند إلغاء الكومبوننت
        return () => clearInterval(statsInterval);
      } else {
        throw new Error('فشل في بدء الحملة');
      }
      
    } catch (error) {
      console.error('خطأ في إرسال الحملة:', error);
      toast.error(error instanceof Error ? error.message : 'حدث خطأ في إرسال الحملة');
    } finally {
      setIsLoading(false);
    }
  };

  // دوال التحكم في الحملة المتقدمة
  const handlePauseCampaign = async () => {
    if (currentCampaignId) {
      await advancedCampaignService.pauseCampaign(currentCampaignId);
      toast.info('تم إيقاف الحملة مؤقتاً');
    }
  };

  const handleResumeCampaign = async () => {
    if (currentCampaignId) {
      try {
        await advancedCampaignService.resumeCampaign(currentCampaignId);
        toast.success('تم استئناف الحملة');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'فشل في استئناف الحملة');
      }
    }
  };

  const handleStopCampaign = async () => {
    if (currentCampaignId) {
      await advancedCampaignService.stopCampaign(currentCampaignId);
      toast.info('تم إيقاف الحملة نهائياً');
      
      // إنشاء التقرير النهائي
      const report = await advancedCampaignService.getCampaignReport(currentCampaignId);
      if (report) {
        setCampaignReport(report);
        setCurrentView('report');
      }
    }
  };

  const handleRetryFailedMessages = async (messageIds?: string[]) => {
    if (currentCampaignId) {
      const success = await advancedCampaignService.retryFailedMessages(currentCampaignId, messageIds);
      if (success) {
        toast.success('تم إعادة جدولة الرسائل الفاشلة');
      } else {
        toast.error('فشل في إعادة جدولة الرسائل');
      }
    }
  };

  // معالجة اختيار القوالب
  const handleTemplateSelect = (template: WhatsAppTemplate) => {
    setSelectedTemplate(template);
    
    // إذا كان القالب يحتوي على ملصقات، يمكن معالجتها هنا
    if (template.content) {
      // البحث عن ملصق مناسب في المجموعة بناءً على محتوى القالب
      const suitableSticker = findSuitableStickerForTemplate(template);
      if (suitableSticker) {
        selectPresetSticker('1', suitableSticker.url, suitableSticker.name);
      }
    }
    
    toast.success(`تم اختيار القالب: ${template.name}`);
  };

  // العثور على ملصق مناسب للقالب
  const findSuitableStickerForTemplate = (template: WhatsAppTemplate) => {
    // منطق بسيط للربط بين القوالب والملصقات
    if (template.category === 'welcome') {
      return defaultStickerCollections.find(cat => cat.category === 'emotions')?.stickers[1]; // ابتسامة
    } else if (template.category === 'marketing') {
      return defaultStickerCollections.find(cat => cat.category === 'business')?.stickers[0]; // هدية
    } else if (template.category === 'real_estate') {
      return defaultStickerCollections.find(cat => cat.category === 'real_estate')?.stickers[0]; // منزل
    }
    return null;
  };

  // دوال تصدير التقرير
  const handleExportReport = (format: 'pdf' | 'excel' | 'csv') => {
    if (campaignReport) {
      // هنا يمكن إضافة منطق التصدير الفعلي
      toast.success(`سيتم تصدير التقرير بصيغة ${format.toUpperCase()}`);
    }
  };

  const handleCreateFollowupCampaign = () => {
    if (campaignReport) {
      // إنشاء حملة متابعة للرسائل الفاشلة
      const failedContactsList = Array.isArray(campaignReport.failedMessages) 
        ? campaignReport.failedMessages 
        : [];
      
      const failedContacts = failedContactsList.map(msg => ({
        name: msg.recipientName,
        phone: msg.recipientNumber
      }));
      
      // إعداد حملة جديدة بالرسائل الفاشلة
      setSelectedContacts([]); // مسح الاختيارات الحالية
      // يمكن إضافة منطق لإضافة جهات الاتصال الفاشلة تلقائياً
      
      toast.info(`سيتم إنشاء حملة متابعة لـ ${failedContacts.length} عميل`);
      setCurrentView('compose');
      setCampaignName(`${campaignReport.campaignName} - متابعة`);
    }
  };

  // التحكم في العرض الحالي
  const canStartCampaign = () => {
    return !isLoading && 
           campaignName.trim() && 
           (bulkMode ? brokerPhones.length > 0 : selectedContacts.length > 0) &&
           stickerMessages.some(msg => msg.stickerUrl.trim());
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/whatsapp/message-types')}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              رجوع
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center">
                <Sticker className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">حملة رسائل الملصقات</h1>
                <p className="text-gray-600">إرسال ملصقات تعبيرية وتفاعلية</p>
                {(brokerName || (bulkMode && brokerNames.length > 0)) && (
                  <div className="mt-2">
                    {bulkMode && brokerNames.length > 0 ? (
                      <div className="space-y-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          👥 وضع جماعي: {brokerNames.length} وسيط محدد
                        </Badge>
                        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                          {brokerNames.slice(0, 5).map((name, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {name}
                            </Badge>
                          ))}
                          {brokerNames.length > 5 && (
                            <Badge variant="outline" className="text-xs text-gray-500">
                              +{brokerNames.length - 5} المزيد
                            </Badge>
                          )}
                        </div>
                      </div>
                    ) : (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        🎯 مختار للوسيط: {brokerName}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* أزرار التنقل بين الشاشات */}
            {currentView !== 'compose' && (
              <Button
                variant="outline"
                onClick={() => setCurrentView('compose')}
              >
                العودة للتحرير
              </Button>
            )}
            
            {currentView === 'compose' && (
              <Button
                onClick={handleSendCampaign}
                disabled={!canStartCampaign()}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    بدء الحملة ({bulkMode ? brokerPhones.length : selectedContacts.length})
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* المحتوى الرئيسي حسب العرض الحالي */}
        {currentView === 'compose' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
            {/* معلومات الحملة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  معلومات الحملة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">اسم الحملة *</Label>
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

            {/* الملصقات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sticker className="h-5 w-5" />
                    الملصقات ({stickerMessages.length})
                  </div>
                  <Button
                    onClick={addStickerMessage}
                    size="sm"
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    إضافة ملصق
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {stickerMessages.map((message, index) => (
                  <div key={message.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-700">ملصق رقم {index + 1}</h4>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => previewStickerMessage(message)}
                          size="sm"
                          variant="ghost"
                          disabled={!message.stickerUrl}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {stickerMessages.length > 1 && (
                          <Button
                            onClick={() => removeStickerMessage(message.id)}
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* اختيار الملصق */}
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            اختيار فئة الملصق
                          </Label>
                          <div className="grid grid-cols-3 gap-2">
                            {defaultStickerCollections.map((category) => {
                              const IconComponent = category.icon;
                              return (
                                <Button
                                  key={category.category}
                                  onClick={() => setSelectedCategory(category.category)}
                                  variant={selectedCategory === category.category ? "default" : "outline"}
                                  size="sm"
                                  className="text-xs h-10 flex flex-col items-center gap-1"
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
                          <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
                            {defaultStickerCollections
                              .find(cat => cat.category === selectedCategory)
                              ?.stickers.map((sticker) => (
                                <button
                                  key={sticker.id}
                                  onClick={() => selectPresetSticker(message.id, sticker.url, sticker.name)}
                                  className={`p-2 rounded-lg border-2 transition-colors hover:bg-gray-50 ${
                                    message.stickerUrl === sticker.url 
                                      ? 'border-yellow-500 bg-yellow-50' 
                                      : 'border-gray-200'
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
                            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                              isDragOver === message.id
                                ? 'border-yellow-500 bg-yellow-50'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                            onDragOver={(e) => handleDragOver(e, message.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, message.id)}
                          >
                            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600 mb-2">
                              اسحب وأفلت صورة الملصق هنا أو
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = (e) => {
                                  const file = (e.target as HTMLInputElement).files?.[0];
                                  if (file) {
                                    handleCustomStickerUpload(message.id, file);
                                  }
                                };
                                input.click();
                              }}
                              disabled={message.uploadStatus === 'uploading'}
                            >
                              {message.uploadStatus === 'uploading' ? (
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
                            <p className="text-xs text-gray-500 mt-1">
                              أقصى حجم: 5 ميجابايت
                            </p>
                          </div>
                        </div>

                        {/* وصف الملصق */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            وصف الملصق
                          </Label>
                          <Input
                            value={message.description}
                            onChange={(e) => updateStickerMessage(message.id, { description: e.target.value })}
                            placeholder="وصف اختياري للملصق..."
                          />
                        </div>
                      </div>

                      {/* قسم المعاينة */}
                      <div className="space-y-4">
                        <Label className="text-sm font-medium text-gray-700">معاينة الملصق</Label>
                        
                        {/* معاينة الملصق */}
                        {message.stickerPreview ? (
                          <div className="p-4 bg-gray-50 rounded-lg text-center">
                            <img 
                              src={message.stickerPreview} 
                              alt="معاينة الملصق"
                              className="w-24 h-24 mx-auto rounded-lg shadow-sm"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<div class="w-24 h-24 mx-auto bg-gray-200 rounded-lg flex items-center justify-center"><span class="text-gray-500">لا يمكن تحميل الصورة</span></div>';
                                }
                              }}
                            />
                            {message.description && (
                              <p className="text-sm text-gray-600 mt-2">{message.description}</p>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-50 rounded-lg text-center">
                            <Sticker className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">اختر ملصق لعرض المعاينة</p>
                          </div>
                        )}

                        {/* حالة الرفع */}
                        {message.uploadStatus === 'error' && (
                          <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                            <p className="text-sm text-red-700">{message.errorMessage}</p>
                          </div>
                        )}

                        {message.uploadStatus === 'success' && message.customStickerFile && (
                          <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                            <p className="text-sm text-green-700">تم رفع الملصق بنجاح</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* قسم القوالب الجاهزة */}
            <TemplateSelector
              onTemplateSelect={handleTemplateSelect}
              selectedTemplateId={selectedTemplate?.id}
              messageType="sticker"
              disabled={isLoading}
            />

            {/* الإعدادات المتقدمة */}
            <AdvancedSendingSettings
              config={advancedConfig}
              onChange={setAdvancedConfig}
              disabled={isLoading}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* إحصائيات الحملة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  إحصائيات الحملة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">الملصقات</span>
                  <Badge variant="secondary">{stickerMessages.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">جهات الاتصال</span>
                  <Badge variant="secondary">{selectedContacts.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">إجمالي الإرسال</span>
                  <Badge className="bg-yellow-600">{stickerMessages.length * selectedContacts.length}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* اختيار جهات الاتصال */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    جهات الاتصال
                  </div>
                  <Badge variant="secondary">{selectedContacts.length} محدد</Badge>
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

                {/* أزرار التحكم */}
                <div className="flex gap-2">
                  <Button
                    onClick={selectAllContacts}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    اختيار الكل
                  </Button>
                  <Button
                    onClick={deselectAllContacts}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    إلغاء الكل
                  </Button>
                </div>

                {/* قائمة جهات الاتصال */}
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredContacts.length > 0 ? (
                    filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                          selectedContacts.includes(contact.id) ? 'bg-yellow-50 border-yellow-200' : ''
                        }`}
                        onClick={() => toggleContact(contact.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-700 text-sm">{contact.name}</p>
                            <p className="text-xs text-gray-500">{contact.phone}</p>
                            {contact.company && (
                              <p className="text-xs text-gray-400">{contact.company}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedContacts.includes(contact.id) && (
                              <CheckCircle className="h-4 w-4 text-yellow-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      لا توجد جهات اتصال متاحة
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        )}

        {/* شاشة الإرسال المباشرة */}
        {currentView === 'sending' && (
          <LiveSendingScreen
            messages={sendingMessages}
            stats={sendingStats}
            config={advancedConfig}
            onStart={handleSendCampaign}
            onPause={handlePauseCampaign}
            onResume={handleResumeCampaign}
            onStop={handleStopCampaign}
            onRetryFailed={handleRetryFailedMessages}
            isRunning={currentCampaignId !== null}
            isPaused={false} // يمكن تحديثها من حالة الحملة
            canStart={canStartCampaign()}
          />
        )}

        {/* شاشة تقرير الحملة */}
        {currentView === 'report' && campaignReport && (
          <CampaignReport
            reportData={campaignReport}
            onRetryFailed={handleRetryFailedMessages}
            onExportReport={handleExportReport}
            onCreateFollowupCampaign={handleCreateFollowupCampaign}
          />
        )}

        {/* معاينة الملصق المنبثقة */}
        {previewMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">معاينة الملصق</h3>
                <Button
                  onClick={() => setPreviewMessage(null)}
                  variant="ghost"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4 text-center">
                {previewMessage.stickerPreview && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <img 
                      src={previewMessage.stickerPreview} 
                      alt="معاينة الملصق"
                      className="w-32 h-32 mx-auto rounded-lg shadow-md"
                    />
                    {previewMessage.description && (
                      <p className="text-sm text-gray-600 mt-2">{previewMessage.description}</p>
                    )}
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  <p>سيتم إرسال هذا الملصق إلى {selectedContacts.length} عميل</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
