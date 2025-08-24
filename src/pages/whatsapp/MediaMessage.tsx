// Media Message Campaign Page
// صفحة حملة رسائل الوسائط

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Image,
  Video,
  Music,
  FileText,
  Upload,
  Users,
  ArrowLeft,
  Send,
  CheckCircle,
  X,
  Eye,
  Download,
  AlertCircle,
  Plus,
  Trash2,
  Settings
} from 'lucide-react';
import { whatsappService } from '@/services/whatsappService';
import { toast } from 'sonner';
import { AdvancedSendingSettings, AdvancedSendingConfig, defaultAdvancedSendingConfig } from '@/components/whatsapp/AdvancedSendingSettings';
import { TemplateSelector, WhatsAppTemplate } from '@/components/whatsapp/TemplateSelector';
import { LiveSendingScreen, SendingMessage, SendingStats } from '@/components/whatsapp/LiveSendingScreen';
import { CampaignReport, CampaignReportData } from '@/components/whatsapp/CampaignReport';
import { advancedCampaignService } from '@/services/advancedCampaignService';
import { Progress } from '@/components/ui/progress';

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

export default function MediaMessage() {
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
      return `حملة وسائط جماعية - ${brokerNames.length} وسيط`;
    }
    return brokerName ? `حملة وسائط ${brokerName}` : '';
  });
  const [campaignDescription, setCampaignDescription] = useState('');
  
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
  const [isLoading, setIsLoading] = useState(false);

  // الإعدادات المتقدمة الجديدة
  const [advancedConfig, setAdvancedConfig] = useState<AdvancedSendingConfig>(defaultAdvancedSendingConfig);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [currentAdvancedView, setCurrentAdvancedView] = useState<'compose' | 'sending' | 'report'>('compose');
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
      console.log('🔄 بدء رفع الملف:', file.name);
      const uploadedUrl = await whatsappService.uploadMediaFile(file);
      
      if (!uploadedUrl) {
        throw new Error('لم يتم الحصول على رابط الملف');
      }

      updateMediaMessage(id, {
        mediaUrl: uploadedUrl,
        uploadStatus: 'success'
      });

      toast.success('تم رفع الملف بنجاح');
      console.log('✅ تم رفع الملف بنجاح:', uploadedUrl);
    } catch (error) {
      console.error('❌ خطأ في رفع الملف:', error);
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

  // إرسال الحملة بالنظام المتقدم الجديد
  const handleAdvancedSendCampaign = async () => {
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

    const hasValidMessages = mediaMessages.some(msg => msg.mediaUrl && msg.uploadStatus === 'success');
    if (!hasValidMessages) {
      toast.error('يرجى رفع ملف وسائط صالح واحد على الأقل');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🚀 بدء إرسال حملة رسائل الوسائط بالنظام المتقدم:', {
        campaignName,
        mediaMessages,
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
      const messagesToSend = mediaMessages
        .filter(msg => msg.mediaUrl && msg.uploadStatus === 'success')
        .map(msg => ({
          mediaType: msg.mediaType,
          mediaUrl: msg.mediaUrl,
          caption: msg.caption,
          message: msg.message,
          content: msg.caption || msg.message || 'وسائط' // للتوافق مع النظام
        }));

      // إنشاء حملة جديدة في النظام المتقدم
      const campaignId = await advancedCampaignService.createCampaign(
        campaignName,
        'media',
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
            id: `media_msg_${messageIndex++}`,
            recipientName: contact.name,
            recipientNumber: contact.phone,
            content: message.caption || message.message || `${message.mediaType} ملف`,
            status: 'pending',
            retryCount: 0
          });
        }
      }
      
      setSendingMessages(sendingMessagesList);

      // التبديل إلى شاشة الإرسال المباشرة
      setCurrentAdvancedView('sending');
      
      // بدء الحملة
      const started = await advancedCampaignService.startCampaign(campaignId);
      
      if (started) {
        toast.success('تم بدء حملة رسائل الوسائط بنجاح!');
        
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
                setCurrentAdvancedView('report');
                
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
        setCurrentAdvancedView('report');
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
    
    // إذا كان القالب يحتوي على نص، ضعه في أول رسالة وسائط
    if (template.content && mediaMessages.length > 0) {
      const updatedMessages = [...mediaMessages];
      updatedMessages[0] = {
        ...updatedMessages[0],
        caption: template.content,
        message: template.content
      };
      setMediaMessages(updatedMessages);
    }
    
    toast.success(`تم اختيار القالب: ${template.name}`);
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
      setCurrentAdvancedView('compose');
      setCampaignName(`${campaignReport.campaignName} - متابعة`);
    }
  };

  // التحكم في العرض الحالي
  const canStartAdvancedCampaign = () => {
    return !isLoading && 
           campaignName.trim() && 
           (bulkMode ? brokerPhones.length > 0 : selectedContacts.length > 0) &&
           mediaMessages.some(msg => msg.mediaUrl && msg.uploadStatus === 'success');
  };

  // إرسال الحملة (الدالة القديمة)
  const handleSendCampaign = async () => {
    // التحقق من صحة البيانات
    if (!campaignName.trim()) {
      toast.error('يرجى إدخال اسم الحملة');
      return;
    }

    // التحقق من وجود جهات اتصال (في الوضع العادي أو الجماعي)
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

    const hasValidMessages = mediaMessages.some(msg => msg.mediaUrl && msg.uploadStatus === 'success');
    if (!hasValidMessages) {
      toast.error('يرجى رفع ملف وسائط صالح واحد على الأقل');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🚀 بدء إرسال حملة رسائل الوسائط:', {
        campaignName,
        mediaMessages,
        selectedContacts
      });
      
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // تحديد قائمة جهات الاتصال بناءً على الوضع
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

      // إرسال الرسائل لكل جهة اتصال
      for (const contact of contactsToSend) {
        try {
          if (!contact) {
            errors.push(`لم يتم العثور على جهة اتصال`);
            errorCount++;
            continue;
          }

          // إرسال جميع رسائل الوسائط
          for (const mediaMsg of mediaMessages) {
            if (!mediaMsg.mediaUrl || mediaMsg.uploadStatus !== 'success') continue;

            await whatsappService.sendWhatsAppMessage(
              contact.phone,
              mediaMsg.message || mediaMsg.caption || 'رسالة وسائط من StarCity Folio',
              'مرسل عبر StarCity Folio',
              mediaMsg.mediaUrl,
              mediaMsg.mediaType,
              mediaMsg.message || mediaMsg.caption
            );
          }

          successCount++;
          
          // تأخير بسيط بين الرسائل لتجنب الحظر
          await new Promise(resolve => setTimeout(resolve, 1500));
          
        } catch (error) {
          console.error(`خطأ في إرسال رسالة للعميل ${contact.name}:`, error);
          errors.push(`فشل الإرسال للعميل ${contact.name}: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
          errorCount++;
        }
      }

      // عرض النتائج
      if (successCount > 0) {
        toast.success(`تم إرسال الحملة بنجاح إلى ${successCount} عميل!`);
      }
      
      if (errorCount > 0) {
        console.error('أخطاء الإرسال:', errors);
        toast.error(`فشل إرسال ${errorCount} رسالة`);
      }

      console.log('📊 تقرير الحملة:', {
        campaignName,
        messageType: 'media',
        totalRecipients: bulkMode ? brokerPhones.length : selectedContacts.length,
        successCount,
        errorCount,
        errors,
        sentAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('خطأ عام في إرسال الحملة:', error);
      toast.error('حدث خطأ في إرسال الحملة');
    } finally {
      setIsLoading(false);
    }
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
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                <Image className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">حملة رسائل الوسائط</h1>
                <p className="text-gray-600">إنشاء وإرسال رسائل بالصور والفيديو والملفات</p>
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
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">
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
            {currentAdvancedView !== 'compose' && (
              <Button
                variant="outline"
                onClick={() => setCurrentAdvancedView('compose')}
              >
                العودة للتحرير
              </Button>
            )}
            
            {/* أزرار الإرسال */}
            {currentAdvancedView === 'compose' && (
              <>
                <Button
                  onClick={handleAdvancedSendCampaign}
                  disabled={!canStartAdvancedCampaign()}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      إرسال متقدم ({bulkMode ? brokerPhones.length : selectedContacts.length})
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleSendCampaign}
                  disabled={isLoading || (!bulkMode && selectedContacts.length === 0) || (bulkMode && brokerPhones.length === 0) || !campaignName.trim()}
                  variant="outline"
                  className="border-purple-500 text-purple-600 hover:bg-purple-50"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      إرسال عادي ({bulkMode ? brokerPhones.length : selectedContacts.length})
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* المحتوى الرئيسي حسب العرض الحالي */}
        {currentAdvancedView === 'compose' && (
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
                    className="bg-purple-600 hover:bg-purple-700"
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
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => previewMediaMessage(message)}
                          size="sm"
                          variant="ghost"
                          disabled={!message.mediaUrl && !message.message}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
                            رفع ملف {getMediaTypeLabel(message.mediaType)} *
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
                            placeholder="اكتب نص الرسالة هنا... (اختياري)"
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
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
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
                  <span className="text-sm text-gray-600">رسائل الوسائط</span>
                  <Badge variant="secondary">{mediaMessages.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">ملفات مرفوعة</span>
                  <Badge variant="secondary">{mediaMessages.filter(msg => msg.uploadStatus === 'success').length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">جهات الاتصال</span>
                  <Badge variant="secondary">{selectedContacts.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">إجمالي الإرسال</span>
                  <Badge className="bg-purple-600">{mediaMessages.filter(msg => msg.uploadStatus === 'success').length * selectedContacts.length}</Badge>
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
                          selectedContacts.includes(contact.id) ? 'bg-purple-50 border-purple-200' : ''
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
                              <CheckCircle className="h-4 w-4 text-purple-600" />
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

            {/* قسم القوالب الجاهزة */}
            <TemplateSelector
              onTemplateSelect={handleTemplateSelect}
              selectedTemplateId={selectedTemplate?.id}
              messageType="media"
              disabled={isLoading}
            />

            {/* الإعدادات المتقدمة */}
            <AdvancedSendingSettings
              config={advancedConfig}
              onChange={setAdvancedConfig}
              disabled={isLoading}
            />
          </div>
        </div>
        )}

        {/* شاشة الإرسال المباشرة */}
        {currentAdvancedView === 'sending' && (
          <LiveSendingScreen
            messages={sendingMessages}
            stats={sendingStats}
            config={advancedConfig}
            onStart={handleAdvancedSendCampaign}
            onPause={handlePauseCampaign}
            onResume={handleResumeCampaign}
            onStop={handleStopCampaign}
            onRetryFailed={handleRetryFailedMessages}
            isRunning={currentCampaignId !== null}
            isPaused={false} // يمكن تحديثها من حالة الحملة
            canStart={canStartAdvancedCampaign()}
          />
        )}

        {/* شاشة تقرير الحملة */}
        {currentAdvancedView === 'report' && campaignReport && (
          <CampaignReport
            reportData={campaignReport}
            onRetryFailed={handleRetryFailedMessages}
            onExportReport={handleExportReport}
            onCreateFollowupCampaign={handleCreateFollowupCampaign}
          />
        )}

        {/* معاينة الرسالة المنبثقة */}
        {previewMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">معاينة رسالة الوسائط</h3>
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
    </div>
  );
}
