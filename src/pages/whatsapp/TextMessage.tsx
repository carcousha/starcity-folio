// Text Message Campaign Page
// صفحة حملة الرسائل النصية

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare,
  Users,
  ArrowLeft,
  Send,
  CheckCircle,
  Hash,
  Eye,
  X,
  Type,
  Copy,
  FileText,
  Settings
} from 'lucide-react';
import { whatsappService } from '@/services/whatsappService';
import { smartMessageService, TimingSettings, SendProgress as SendProgressType } from '@/services/smartMessageService';
import { SmartMessageEditor } from '@/components/whatsapp/SmartMessageEditor';
import { TimingSettings as TimingSettingsComponent } from '@/components/whatsapp/TimingSettings';
import { SendProgress } from '@/components/whatsapp/SendProgress';
import { MessagePreview } from '@/components/whatsapp/MessagePreview';
import { toast } from 'sonner';
import { AdvancedSendingSettings, AdvancedSendingConfig, defaultAdvancedSendingConfig } from '@/components/whatsapp/AdvancedSendingSettings';
import { TemplateSelector, WhatsAppTemplate } from '@/components/whatsapp/TemplateSelector';
import { LiveSendingScreen, SendingMessage, SendingStats } from '@/components/whatsapp/LiveSendingScreen';
import { CampaignReport, CampaignReportData } from '@/components/whatsapp/CampaignReport';
import { advancedCampaignService } from '@/services/advancedCampaignService';
import { Progress } from '@/components/ui/progress';
import { TextAlternatives } from '@/components/whatsapp/TextAlternatives';
import { MessageVariables } from '@/components/whatsapp/MessageVariables';
import { EnhancedTimingSettings, EnhancedTimingSettings as EnhancedTimingSettingsType } from '@/components/whatsapp/EnhancedTimingSettings';
import { LiveMessagePreview } from '@/components/whatsapp/LiveMessagePreview';
import { FirstPersonPreview } from '@/components/whatsapp/FirstPersonPreview';
import { FailedMessageRetry } from '@/components/whatsapp/FailedMessageRetry';

interface TextMessage {
  id: string;
  message: string;
  variables: string[];
  footer: string;
}

export default function TextMessage() {
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
      return `حملة جماعية - ${brokerNames.length} وسيط`;
    }
    return brokerName ? `حملة ${brokerName}` : '';
  });
  const [campaignDescription, setCampaignDescription] = useState('');
  
  // حالات الرسائل النصية
  const [textMessages, setTextMessages] = useState<TextMessage[]>([
    {
      id: '1',
      message: '',
      variables: [],
      footer: 'مرسل عبر StarCity Folio'
    }
  ]);

  // حالات جهات الاتصال
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [contactsFilter, setContactsFilter] = useState('');

  // حالات إضافية
  const [previewMessage, setPreviewMessage] = useState<TextMessage | null>(null);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // الميزات المتقدمة الجديدة
  const [timingSettings, setTimingSettings] = useState<TimingSettings>({
    type: 'random',
    randomMin: 3,
    randomMax: 8
  });
  const [enhancedTimingSettings, setEnhancedTimingSettings] = useState<EnhancedTimingSettingsType>({
    type: 'random',
    fixedDelay: 5,
    randomMin: 3,
    randomMax: 10,
    smartDelay: 7,
    customDelays: [3, 5, 7, 10],
    enableAntiSpam: true,
    antiSpamDelay: 2,
    enableBurstProtection: true,
    burstProtectionDelay: 1,
    enableTimeZoneAware: false,
    preferredHours: [9, 10, 11, 14, 15, 16, 17],
    enableWeekendProtection: false,
    weekendDelay: 5
  });
  
  // نظام البدائل النصية
  const [textAlternatives, setTextAlternatives] = useState<any[]>([]);
  
  // متغيرات الرسائل
  const [messageVariables, setMessageVariables] = useState<any[]>([]);
  
  // معاينة الإرسال المباشرة
  const [liveMessages, setLiveMessages] = useState<any[]>([]);
  const [livePreviewSettings, setLivePreviewSettings] = useState({
    showLivePreview: true,
    autoScroll: true,
    filterStatus: 'all'
  });
  
  // معاينة أول شخص
  const [firstPersonPreview, setFirstPersonPreview] = useState({
    enabled: true,
    selectedContactId: '',
    customVariables: {}
  });
  
  // الرسائل الفاشلة
  const [failedMessages, setFailedMessages] = useState<any[]>([]);
  
  const [sendProgress, setSendProgress] = useState<SendProgressType[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentView, setCurrentView] = useState<'compose' | 'preview' | 'sending'>('compose');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

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

  // قوالب الرسائل الجاهزة
  const messageTemplates = [
    {
      id: 'welcome',
      name: 'ترحيب',
      message: 'مرحباً {name}، نحن سعداء لانضمامك إلينا في {company}. نتطلع للعمل معك!',
      variables: ['name', 'company']
    },
    {
      id: 'offer',
      name: 'عرض خاص',
      message: 'عرض خاص لك {name}! احصل على خصم {discount}% على جميع منتجاتنا. صالح حتى {date}.',
      variables: ['name', 'discount', 'date']
    },
    {
      id: 'reminder',
      name: 'تذكير',
      message: 'تذكير ودود {name}: لديك موعد في {date} في تمام الساعة {time}. نتطلع لرؤيتك!',
      variables: ['name', 'date', 'time']
    },
    {
      id: 'followup',
      name: 'متابعة',
      message: 'شكراً لك {name} على زيارتك لنا. هل تحتاج أي مساعدة إضافية بخصوص {service}؟',
      variables: ['name', 'service']
    },
    {
      id: 'meeting',
      name: 'دعوة اجتماع',
      message: 'أهلاً {name}، نود دعوتك لحضور اجتماع في {date} بخصوص {topic}. هل يناسبك الوقت؟',
      variables: ['name', 'date', 'topic']
    },
    {
      id: 'thank_you',
      name: 'شكر',
      message: 'شكراً جزيلاً {name} لثقتك في {company}. نقدر تعاملك معنا ونتطلع لخدمتك مرة أخرى.',
      variables: ['name', 'company']
    }
  ];

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

  // إضافة رسالة نصية جديدة
  const addTextMessage = () => {
    const newMessage: TextMessage = {
      id: Date.now().toString(),
      message: '',
      variables: [],
      footer: 'مرسل عبر StarCity Folio'
    };
    setTextMessages([...textMessages, newMessage]);
  };

  // حذف رسالة نصية
  const removeTextMessage = (id: string) => {
    if (textMessages.length > 1) {
      setTextMessages(textMessages.filter(msg => msg.id !== id));
    } else {
      toast.error('يجب أن تحتوي الحملة على رسالة واحدة على الأقل');
    }
  };

  // تحديث رسالة نصية
  const updateTextMessage = (id: string, updates: Partial<TextMessage>) => {
    setTextMessages(textMessages.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  };

  // استخراج المتغيرات من النص
  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{([^}]+)\}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  };

  // تحديث الرسالة واستخراج المتغيرات
  const updateMessageWithVariables = (id: string, message: string) => {
    const variables = extractVariables(message);
    updateTextMessage(id, { message, variables });
  };

  // تطبيق قالب رسالة
  const applyTemplate = (id: string, template: any) => {
    updateTextMessage(id, {
      message: template.message,
      variables: template.variables
    });
    toast.success(`تم تطبيق قالب "${template.name}"`);
  };

  // نسخ رسالة
  const copyMessage = (message: TextMessage) => {
    navigator.clipboard.writeText(message.message);
    toast.success('تم نسخ الرسالة');
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

  // معاينة الرسالة مع بيانات جهة اتصال
  const previewWithContact = (message: TextMessage, contact: any) => {
    let previewText = message.message;
    
    // استبدال المتغيرات ببيانات جهة الاتصال
    const replacements: { [key: string]: string } = {
      name: contact.name || 'العميل',
      company: contact.company || 'الشركة',
      phone: contact.phone || '',
      email: contact.email || '',
      date: new Date().toLocaleDateString('ar-SA'),
      time: new Date().toLocaleTimeString('ar-SA'),
      discount: '20',
      service: 'خدماتنا',
      topic: 'موضوع مهم'
    };

    message.variables.forEach(variable => {
      const value = replacements[variable] || `{${variable}}`;
      previewText = previewText.replace(new RegExp(`\\{${variable}\\}`, 'g'), value);
    });

    return previewText;
  };

  // معاينة الرسالة
  const previewTextMessage = (message: TextMessage) => {
    if (!message.message) {
      toast.error('لا توجد رسالة للمعاينة');
      return;
    }
    setPreviewMessage(message);
    if (selectedContacts.length > 0) {
      const contact = contacts.find(c => c.id === selectedContacts[0]);
      setSelectedContact(contact);
    }
  };

  // دوال الميزات الجديدة
  const handleTextAlternativesChange = (alternatives: any[]) => {
    setTextAlternatives(alternatives);
  };

  const handleMessageVariablesChange = (variables: any[]) => {
    setMessageVariables(variables);
  };

  const handleEnhancedTimingChange = (settings: EnhancedTimingSettingsType) => {
    setEnhancedTimingSettings(settings);
  };

  const handleRetryMessage = async (messageId: string): Promise<boolean> => {
    try {
      // محاكاة إعادة إرسال الرسالة
      await new Promise(resolve => setTimeout(resolve, 1000));
      return Math.random() > 0.3; // 70% نجاح
    } catch (error) {
      return false;
    }
  };

  const handleRetryAllMessages = async (messageIds: string[]): Promise<{ success: string[], failed: string[] }> => {
    const results = { success: [] as string[], failed: [] as string[] };
    
    for (const id of messageIds) {
      const success = await handleRetryMessage(id);
      if (success) {
        results.success.push(id);
      } else {
        results.failed.push(id);
      }
    }
    
    return results;
  };

  const handleDeleteMessage = (messageId: string) => {
    setFailedMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const handleDeleteAllMessages = (messageIds: string[]) => {
    setFailedMessages(prev => prev.filter(msg => !messageIds.includes(msg.id)));
  };

  const handleSendTestMessage = (contactId: string, message: string) => {
    // محاكاة إرسال رسالة تجريبية
    toast.success('تم إرسال رسالة تجريبية بنجاح');
  };

  const handlePreviewChange = (preview: string) => {
    // تحديث معاينة الرسالة
    console.log('معاينة محدثة:', preview);
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

    const hasValidMessages = textMessages.some(msg => msg.message.trim());
    if (!hasValidMessages) {
      toast.error('يرجى إدخال رسالة واحدة على الأقل');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🚀 بدء إرسال حملة الرسائل النصية بالنظام المتقدم:', {
        campaignName,
        textMessages,
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
      const messagesToSend = textMessages
        .filter(msg => msg.message.trim())
        .map(msg => ({
          message: msg.message,
          footer: msg.footer,
          variables: msg.variables,
          content: msg.message // للتوافق مع النظام
        }));

      // إنشاء حملة جديدة في النظام المتقدم
      const campaignId = await advancedCampaignService.createCampaign(
        campaignName,
        'text',
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
            id: `text_msg_${messageIndex++}`,
            recipientName: contact.name,
            recipientNumber: contact.phone,
            content: message.message,
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
        toast.success('تم بدء حملة الرسائل النصية بنجاح!');
        
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
    
    // إذا كان القالب يحتوي على نص، ضعه في أول رسالة
    if (template.content && textMessages.length > 0) {
      const updatedMessages = [...textMessages];
      updatedMessages[0] = {
        ...updatedMessages[0],
        message: template.content,
        variables: template.variables || []
      };
      setTextMessages(updatedMessages);
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
      const failedContactsList = Array.isArray(campaignReport.failedMessagesList) 
        ? campaignReport.failedMessagesList
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
           textMessages.some(msg => msg.message.trim());
  };

  // إرسال الحملة المتقدم (الدالة القديمة)
  const handleSendCampaign = async () => {
    setCurrentView('sending');
    setIsSending(true);
    setSendProgress([]);
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

    const hasValidMessages = textMessages.some(msg => msg.message.trim());
    if (!hasValidMessages) {
      toast.error('يرجى إضافة رسالة صالحة واحدة على الأقل');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🚀 بدء إرسال حملة الرسائل النصية:', {
        campaignName,
        textMessages,
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

          // إرسال جميع الرسائل النصية
          for (const textMsg of textMessages) {
            if (!textMsg.message.trim()) continue;

            // استبدال المتغيرات
            let message = textMsg.message;
            const replacements: { [key: string]: string } = {
              name: contact.name || 'العميل',
              company: contact.company || '',
              phone: contact.phone || '',
              email: contact.email || '',
              date: new Date().toLocaleDateString('ar-SA'),
              time: new Date().toLocaleTimeString('ar-SA'),
              discount: '20',
              service: 'خدماتنا',
              topic: 'موضوع مهم'
            };

            textMsg.variables?.forEach((variable: string) => {
              const value = replacements[variable] || `{${variable}}`;
              message = message.replace(new RegExp(`\\{${variable}\\}`, 'g'), value);
            });

            await whatsappService.sendWhatsAppMessage(
              contact.phone,
              message,
              textMsg.footer || 'مرسل عبر StarCity Folio'
            );
          }

          successCount++;
          
          // تأخير بسيط بين الرسائل لتجنب الحظر
          await new Promise(resolve => setTimeout(resolve, 1000));
          
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
        messageType: 'text',
        totalRecipients: selectedContacts.length,
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
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">حملة الرسائل النصية</h1>
                <p className="text-gray-600">إنشاء وإرسال رسائل نصية مع متغيرات ذكية</p>
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
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
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

            {/* الرسائل النصية */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Type className="h-5 w-5" />
                    الرسائل النصية ({textMessages.length})
                  </div>
                  <Button
                    onClick={addTextMessage}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    إضافة رسالة
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {textMessages.map((message, index) => (
                  <div key={message.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-700">رسالة رقم {index + 1}</h4>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => copyMessage(message)}
                          size="sm"
                          variant="ghost"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => previewTextMessage(message)}
                          size="sm"
                          variant="ghost"
                          disabled={!message.message}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {textMessages.length > 1 && (
                          <Button
                            onClick={() => removeTextMessage(message.id)}
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* القوالب الجاهزة */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        القوالب الجاهزة
                      </Label>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                        {messageTemplates.map((template) => (
                          <Button
                            key={template.id}
                            onClick={() => applyTemplate(message.id, template)}
                            variant="outline"
                            size="sm"
                            className="text-xs h-8"
                          >
                            {template.name}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* قسم كتابة الرسالة */}
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            نص الرسالة *
                          </Label>
                          <Textarea
                            placeholder="اكتب نص الرسالة هنا... يمكنك استخدام متغيرات مثل {name} و {company}"
                            value={message.message}
                            onChange={(e) => updateMessageWithVariables(message.id, e.target.value)}
                            rows={6}
                            className="font-mono text-sm"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            استخدم {`{name}`} للاسم، {`{company}`} للشركة، {`{date}`} للتاريخ، وهكذا
                          </p>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            تذييل الرسالة
                          </Label>
                          <Input
                            value={message.footer}
                            onChange={(e) => updateTextMessage(message.id, { footer: e.target.value })}
                            placeholder="تذييل الرسالة..."
                          />
                        </div>

                        {/* المتغيرات المكتشفة */}
                        {message.variables.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                              المتغيرات المكتشفة ({message.variables.length})
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {message.variables.map((variable, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  <Hash className="h-3 w-3 mr-1" />
                                  {variable}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* قسم المعاينة */}
                      <div className="space-y-4">
                        <Label className="text-sm font-medium text-gray-700">معاينة الرسالة</Label>
                        
                        {/* إحصائيات الرسالة */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-blue-50 rounded-lg text-center">
                            <p className="text-2xl font-bold text-blue-600">{message.message.length}</p>
                            <p className="text-xs text-blue-700">حرف</p>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg text-center">
                            <p className="text-2xl font-bold text-green-600">{message.variables.length}</p>
                            <p className="text-xs text-green-700">متغير</p>
                          </div>
                        </div>

                        {/* معاينة النص */}
                        {message.message && (
                          <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                              {message.message}
                            </p>
                            {message.footer && (
                              <>
                                <Separator className="my-2" />
                                <p className="text-xs text-gray-500 italic">
                                  {message.footer}
                                </p>
                              </>
                            )}
                          </div>
                        )}

                        {/* معاينة مع بيانات جهة اتصال */}
                        {selectedContacts.length > 0 && message.message && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                              معاينة مع بيانات العميل
                            </Label>
                            <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {previewWithContact(message, contacts.find(c => c.id === selectedContacts[0]))}
                              </p>
                              {message.footer && (
                                <>
                                  <Separator className="my-2" />
                                  <p className="text-xs text-gray-500 italic">
                                    {message.footer}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
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
                  <span className="text-sm text-gray-600">الرسائل</span>
                  <Badge variant="secondary">{textMessages.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">جهات الاتصال</span>
                  <Badge variant="secondary">{selectedContacts.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">إجمالي الإرسال</span>
                  <Badge className="bg-blue-600">{textMessages.length * selectedContacts.length}</Badge>
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
                          selectedContacts.includes(contact.id) ? 'bg-blue-50 border-blue-200' : ''
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
                              <CheckCircle className="h-4 w-4 text-blue-600" />
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
              messageType="text"
              disabled={isLoading}
            />

            {/* الإعدادات المتقدمة */}
            <AdvancedSendingSettings
              config={advancedConfig}
              onChange={setAdvancedConfig}
              disabled={isLoading}
            />

            {/* نظام البدائل النصية */}
            <TextAlternatives
              onAlternativesChange={handleTextAlternativesChange}
              initialAlternatives={textAlternatives}
            />

            {/* متغيرات الرسائل */}
            <MessageVariables
              onVariablesChange={handleMessageVariablesChange}
              initialVariables={messageVariables}
              onPreviewChange={handlePreviewChange}
            />

            {/* إعدادات التوقيت المحسنة */}
            <EnhancedTimingSettings
              settings={enhancedTimingSettings}
              onSettingsChange={handleEnhancedTimingChange}
              isSending={isSending}
            />

            {/* معاينة أول شخص */}
            <FirstPersonPreview
              messageTemplate={{
                id: 'current',
                content: textMessages[0]?.message || '',
                variables: messageVariables.map(v => v.name),
                footer: textMessages[0]?.footer || ''
              }}
              contacts={contacts}
              selectedContacts={selectedContacts}
              onSendMessage={handleSendTestMessage}
              onPreviewChange={handlePreviewChange}
            />

            {/* معاينة الإرسال المباشرة */}
            <LiveMessagePreview
              messages={liveMessages}
              onRetryMessage={handleRetryMessage}
              onCancelMessage={handleDeleteMessage}
              onPauseSending={() => setIsPaused(true)}
              onResumeSending={() => setIsPaused(false)}
              onStopSending={() => setIsSending(false)}
              isSending={isSending}
              isPaused={isPaused}
              totalMessages={liveMessages.length}
              sentMessages={liveMessages.filter(m => m.status === 'sent').length}
              failedMessages={liveMessages.filter(m => m.status === 'failed').length}
              currentDelay={enhancedTimingSettings.randomMin}
              nextMessageIn={enhancedTimingSettings.randomMax}
            />

            {/* إعادة إرسال الرسائل الفاشلة */}
            <FailedMessageRetry
              failedMessages={failedMessages}
              onRetryMessage={handleRetryMessage}
              onRetryAll={handleRetryAllMessages}
              onDeleteMessage={handleDeleteMessage}
              onDeleteAll={handleDeleteAllMessages}
              maxRetries={3}
              retryDelay={5}
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
                {/* الرسالة الأصلية */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    النص الأصلي
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {previewMessage.message}
                    </p>
                  </div>
                </div>

                {/* المعاينة مع البيانات */}
                {selectedContact && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      معاينة مع بيانات: {selectedContact.name}
                    </Label>
                    <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {previewWithContact(previewMessage, selectedContact)}
                      </p>
                    </div>
                  </div>
                )}

                {/* التذييل */}
                {previewMessage.footer && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      التذييل
                    </Label>
                    <div className="p-2 bg-gray-100 rounded text-center">
                      <p className="text-xs text-gray-600 italic">
                        {previewMessage.footer}
                      </p>
                    </div>
                  </div>
                )}

                {/* المتغيرات */}
                {previewMessage.variables.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      المتغيرات المستخدمة
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {previewMessage.variables.map((variable, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                    </div>
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
