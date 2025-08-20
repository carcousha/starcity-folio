import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalSelectedBrokers } from '@/hooks/useGlobalSelectedBrokers';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Calendar, Clock, MessageSquare, Smartphone, Users, ArrowLeft, Play, Settings, Target, FileText, Upload, CheckCircle, AlertCircle, X, Send, Timer, Shuffle, RefreshCw, AlertTriangle, Download, Table } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { whatsappService } from '@/services/whatsappService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function AdvancedTasks() {
  const navigate = useNavigate();
  const { selectedBrokers, selectedCount, clearSelection } = useGlobalSelectedBrokers();
  
  // Campaign Configuration
  const [campaignName, setCampaignName] = useState('');
  const [campaignType, setCampaignType] = useState<'instant' | 'scheduled' | 'recurring'>('instant');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  
  // Improved timing options
  const [useRandomTiming, setUseRandomTiming] = useState(true);
  const [minIntervalSeconds, setMinIntervalSeconds] = useState(3);
  const [maxIntervalSeconds, setMaxIntervalSeconds] = useState(10);
  const [fixedIntervalMinutes, setFixedIntervalMinutes] = useState(5);
  
  const [recurringPattern, setRecurringPattern] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [attachments, setAttachments] = useState<File[]>([]);

  // Advanced Features
  const [personalizeMessages, setPersonalizeMessages] = useState(true);
  const [trackDelivery, setTrackDelivery] = useState(true);
  const [autoRetry, setAutoRetry] = useState(true);
  const [maxRetries, setMaxRetries] = useState(3);
  const [timezone, setTimezone] = useState('Asia/Dubai');

  // Campaign Status
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [sendingStatus, setSendingStatus] = useState('');
  const [sentCount, setSentCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [failedRecipients, setFailedRecipients] = useState<any[]>([]);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [useRealWhatsApp, setUseRealWhatsApp] = useState(false);
  const [currentBulkMessageId, setCurrentBulkMessageId] = useState<string | null>(null);

  // WhatsApp Settings
  const [whatsappSettings, setWhatsappSettings] = useState<any>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // File Upload States
  const [uploadedBrokers, setUploadedBrokers] = useState<any[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileUploadProgress, setFileUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreviewData, setFilePreviewData] = useState<any[]>([]);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Media Upload States
  const [uploadedMediaUrls, setUploadedMediaUrls] = useState<string[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaUploadProgress, setMediaUploadProgress] = useState(0);

  useEffect(() => {
    if (selectedCount === 0) {
      toast({
        title: "لا توجد وسطاء محددين",
        description: "يرجى اختيار وسطاء من صفحة الوسطاء أولاً",
        variant: "destructive",
      });
      navigate('/land-sales/brokers');
    }
  }, [selectedCount, navigate]);

  // تحميل إعدادات WhatsApp مع تحسينات التشخيص
  const loadWhatsAppSettings = async () => {
    try {
      console.log('Loading WhatsApp settings...');
      const settings = await whatsappService.getSettings();
      console.log('WhatsApp settings loaded:', settings);
      
      setWhatsappSettings(settings);
      setSettingsLoaded(true);
      
      if (!settings) {
        console.warn('No WhatsApp settings found in database');
        toast({
          title: "تحذير",
          description: "لم يتم العثور على إعدادات WhatsApp. يرجى إعدادها أولاً من صفحة إعدادات WhatsApp.",
          variant: "destructive",
        });
      } else {
        console.log('WhatsApp settings found:', {
          api_key: settings.api_key ? `${settings.api_key.substring(0, 8)}...` : 'NOT SET',
          sender_number: settings.sender_number || 'NOT SET',
          default_footer: settings.default_footer || 'NOT SET'
        });
      }
    } catch (error) {
      console.error('Error loading WhatsApp settings:', error);
      setSettingsLoaded(true);
      toast({
        title: "خطأ في تحميل الإعدادات",
        description: "حدث خطأ أثناء تحميل إعدادات WhatsApp",
        variant: "destructive",
      });
    }
  };

  // تحميل الإعدادات عند تحميل الصفحة
  useEffect(() => {
    loadWhatsAppSettings();
  }, []);

  // إعادة تحميل الإعدادات عند تغيير الحالة
  useEffect(() => {
    if (!whatsappSettings && settingsLoaded) {
      console.log('🔄 [AdvancedTasks] Settings not found, attempting to reload...');
      loadWhatsAppSettings();
    }
  }, [whatsappSettings, settingsLoaded]);

  // إضافة دالة لإنشاء إعدادات WhatsApp افتراضية
  const createDefaultWhatsAppSettings = async () => {
    try {
      const defaultSettings = {
        api_key: 'your_whatsapp_api_key_here',
        sender_number: '971501234567',
        default_footer: 'Sent via StarCity Folio',
        daily_limit: 1000,
        rate_limit_per_minute: 10,
        is_active: true
      };

      await whatsappService.updateSettings(defaultSettings);
      
      toast({
        title: "تم إنشاء الإعدادات الافتراضية",
        description: "تم إنشاء إعدادات WhatsApp الافتراضية. يرجى تحديثها من صفحة الإعدادات.",
      });

      // إعادة تحميل الإعدادات
      await loadWhatsAppSettings();
      
    } catch (error) {
      console.error('Error creating default settings:', error);
      toast({
        title: "خطأ في إنشاء الإعدادات",
        description: "حدث خطأ أثناء إنشاء إعدادات WhatsApp الافتراضية",
        variant: "destructive",
      });
    }
  };

  const handleAttachmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    setIsUploadingMedia(true);
    setMediaUploadProgress(0);

    try {
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = ((i + 1) / files.length) * 100;
        setMediaUploadProgress(progress);

        console.log(`📤 [AdvancedTasks] Uploading media file ${i + 1}/${files.length}:`, file.name);

        try {
          const mediaUrl = await whatsappService.uploadMediaFile(file);
          if (mediaUrl) {
            uploadedUrls.push(mediaUrl);
            console.log(`✅ [AdvancedTasks] Media uploaded successfully:`, mediaUrl);
          }
        } catch (error) {
          console.error(`❌ [AdvancedTasks] Failed to upload ${file.name}:`, error);
          toast({
            title: "فشل في رفع الملف",
            description: `فشل في رفع ${file.name}: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`,
            variant: "destructive",
          });
        }
      }

      // Add files to attachments list
      setAttachments(prev => [...prev, ...files]);
      
      // Add URLs to uploaded media
      setUploadedMediaUrls(prev => [...prev, ...uploadedUrls]);

      if (uploadedUrls.length > 0) {
        toast({
          title: "تم رفع المرفقات بنجاح",
          description: `تم رفع ${uploadedUrls.length} ملف بنجاح`,
        });
      }

    } catch (error) {
      console.error('💥 [AdvancedTasks] Media upload error:', error);
      toast({
        title: "خطأ في رفع المرفقات",
        description: "حدث خطأ أثناء رفع المرفقات",
        variant: "destructive",
      });
    } finally {
      setIsUploadingMedia(false);
      setMediaUploadProgress(0);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    setUploadedMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Function to get random interval
  const getRandomInterval = () => {
    if (useRandomTiming) {
      return Math.floor(Math.random() * (maxIntervalSeconds - minIntervalSeconds + 1)) + minIntervalSeconds;
    }
    return fixedIntervalMinutes * 60; // Convert minutes to seconds
  };

  // Send actual WhatsApp messages using whatsappService
  const sendActualWhatsAppMessages = async () => {
    if (!whatsappSettings) {
      toast({
        title: "خطأ في الإعدادات",
        description: "لم يتم العثور على إعدادات WhatsApp. يرجى إعدادها أولاً من صفحة إعدادات WhatsApp.",
        variant: "destructive",
      });
      return;
    }

    // التحقق من صحة الإعدادات
    if (!whatsappSettings.api_key || !whatsappSettings.sender_number) {
      toast({
        title: "إعدادات غير مكتملة",
        description: "API Key أو Sender Number غير محددين في إعدادات WhatsApp",
        variant: "destructive",
      });
      return;
    }

    console.log('🚀 [AdvancedTasks] Starting WhatsApp campaign with settings:', {
      api_key: `${whatsappSettings.api_key.substring(0, 8)}...`,
      sender: whatsappSettings.sender_number,
      total_brokers: selectedBrokers.length,
      message_template: messageTemplate.substring(0, 50) + '...',
      personalize_messages: personalizeMessages,
      use_random_timing: useRandomTiming
    });

    setIsSending(true);
    setSendingProgress(0);
    setSendingStatus('جاري إعداد الرسائل...');
    setSentCount(0);
    setFailedCount(0);
    setFailedRecipients([]);

    const totalBrokers = selectedBrokers.length;
    let sentCount = 0;
    let failedCount = 0;
    const failedList: any[] = [];

    for (let i = 0; i < totalBrokers; i++) {
      const broker = selectedBrokers[i];
      const progress = ((i + 1) / totalBrokers) * 100;
      
      setSendingProgress(progress);
      setSendingStatus(`جاري إرسال الرسالة إلى ${broker.name}...`);

      try {
        // Personalize message
        const personalizedMessage = personalizeMessages 
          ? messageTemplate
              .replace(/{name}/g, broker.name)
              .replace(/{short_name}/g, broker.name ? broker.name.split(' ')[0] : 'صديق')
              .replace(/{phone}/g, broker.phone)
              .replace(/{email}/g, broker.email || 'غير محدد')
          : messageTemplate;

        // Get WhatsApp number (prefer whatsapp_number, fallback to phone)
        const whatsappNumber = broker.whatsapp_number || broker.phone;
        
        if (!whatsappNumber) {
          console.error(`No WhatsApp number for ${broker.name}`);
          failedCount++;
          failedList.push({ ...broker, error: 'لا يوجد رقم واتساب' });
          setFailedCount(failedCount);
          setFailedRecipients([...failedList]);
          continue;
        }

        console.log(`Sending to ${broker.name} (${whatsappNumber}):`, {
          message: personalizedMessage.substring(0, 50) + '...',
          api_key: `${whatsappSettings.api_key.substring(0, 8)}...`,
          sender: whatsappSettings.sender_number
        });

        // استخدام whatsappService بدلاً من الاتصال المباشر
        const result = await whatsappService.sendWhatsAppMessage(
          whatsappNumber,
          personalizedMessage,
          whatsappSettings.default_footer || 'Sent via StarCity Folio'
        );

        console.log(`API Response for ${broker.name}:`, result);
        
        if (result && result.status) {
          sentCount++;
          setSentCount(sentCount);
          console.log(`✅ Sent to ${broker.name} (${whatsappNumber}): ${personalizedMessage}`);
        } else {
          failedCount++;
          failedList.push({ ...broker, error: result?.message || 'خطأ غير معروف' });
          setFailedCount(failedCount);
          setFailedRecipients([...failedList]);
          console.error(`❌ Failed to send to ${broker.name}: ${result?.message || 'Unknown error'}`);
        }
        
        // Add random delay between messages
        if (i < totalBrokers - 1) {
          const delay = getRandomInterval() * 1000; // Convert to milliseconds
          setSendingStatus(`انتظار ${delay / 1000} ثانية قبل الرسالة التالية...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
      } catch (error) {
        console.error(`Failed to send to ${broker.name}:`, error);
        failedCount++;
        failedList.push({ ...broker, error: error.message || 'خطأ في الإرسال' });
        setFailedCount(failedCount);
        setFailedRecipients([...failedList]);
      }
    }

    setSendingStatus('تم إرسال جميع الرسائل');
    setIsSending(false);
    
    console.log('🎉 [AdvancedTasks] Campaign completed:', { 
      sentCount, 
      failedCount, 
      totalBrokers,
      success_rate: `${Math.round((sentCount / totalBrokers) * 100)}%`
    });
    
    toast({
      title: sentCount > 0 ? "تم إرسال الحملة بنجاح" : "فشل في إرسال جميع الرسائل",
      description: `تم إرسال ${sentCount} رسالة، فشل ${failedCount} رسالة`,
      variant: sentCount > 0 ? "default" : "destructive",
    });
  };

  // إعادة الإرسال للرسائل الفاشلة
  const retryFailedMessages = async () => {
    if (failedRecipients.length === 0) {
      toast({
        title: "لا توجد رسائل فاشلة",
        description: "لا توجد رسائل فاشلة لإعادة إرسالها",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    setSendingProgress(0);
    setSendingStatus('جاري إعادة إرسال الرسائل الفاشلة...');

    const totalFailed = failedRecipients.length;
    let retrySentCount = 0;
    let retryFailedCount = 0;
    const newFailedList: any[] = [];

    for (let i = 0; i < totalFailed; i++) {
      const broker = failedRecipients[i];
      const progress = ((i + 1) / totalFailed) * 100;
      
      setSendingProgress(progress);
      setSendingStatus(`إعادة إرسال إلى ${broker.name}...`);

      try {
        const personalizedMessage = personalizeMessages 
          ? messageTemplate
              .replace(/{name}/g, broker.name)
              .replace(/{short_name}/g, broker.name ? broker.name.split(' ')[0] : 'صديق')
              .replace(/{phone}/g, broker.phone)
              .replace(/{email}/g, broker.email || 'غير محدد')
          : messageTemplate;

        const whatsappNumber = broker.whatsapp_number || broker.phone;
        
        if (!whatsappNumber) {
          retryFailedCount++;
          newFailedList.push({ ...broker, error: 'لا يوجد رقم واتساب' });
          continue;
        }

        const result = await whatsappService.sendWhatsAppMessage(
          whatsappNumber,
          personalizedMessage,
          whatsappSettings.default_footer || 'Sent via StarCity Folio'
        );
        
        if (result && result.status) {
          retrySentCount++;
          setSentCount(prev => prev + 1);
          console.log(`✅ Retry success for ${broker.name}`);
        } else {
          retryFailedCount++;
          newFailedList.push({ ...broker, error: result?.message || 'خطأ غير معروف' });
          console.error(`❌ Retry failed for ${broker.name}: ${result?.message || 'Unknown error'}`);
        }
        
        // تأخير بسيط
        if (i < totalFailed - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`Retry failed for ${broker.name}:`, error);
        retryFailedCount++;
        newFailedList.push({ ...broker, error: error.message || 'خطأ في الإرسال' });
      }
    }

    // تحديث قائمة الفاشلين
    setFailedRecipients(newFailedList);
    setFailedCount(prev => prev - retrySentCount);
    
    setSendingStatus('تم الانتهاء من إعادة الإرسال');
    setIsSending(false);
    
    toast({
      title: "تم إعادة الإرسال",
      description: `نجح إرسال ${retrySentCount} رسالة، فشل ${retryFailedCount} رسالة`,
      variant: retrySentCount > 0 ? "default" : "destructive",
    });
  };

  // Simulate sending messages with progress (for testing)
  const simulateSendingMessages = async () => {
    setIsSending(true);
    setSendingProgress(0);
    setSendingStatus('جاري إعداد الرسائل...');
    setSentCount(0);
    setFailedCount(0);
    setFailedRecipients([]);

    const totalBrokers = selectedBrokers.length;
    let sentCount = 0;
    let failedCount = 0;
    const failedList: any[] = [];

    for (let i = 0; i < totalBrokers; i++) {
      const broker = selectedBrokers[i];
      const progress = ((i + 1) / totalBrokers) * 100;
      
      setSendingProgress(progress);
      setSendingStatus(`جاري إرسال الرسالة إلى ${broker.name}...`);

      try {
        // Simulate message sending
        const personalizedMessage = personalizeMessages 
          ? messageTemplate
              .replace(/{name}/g, broker.name)
              .replace(/{short_name}/g, broker.name ? broker.name.split(' ')[0] : 'صديق')
              .replace(/{phone}/g, broker.phone)
              .replace(/{email}/g, broker.email || 'غير محدد')
          : messageTemplate;

        console.log(`Sending to ${broker.name} (${broker.phone}): ${personalizedMessage}`);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // محاكاة نسبة فشل عشوائية (10%)
        if (Math.random() < 0.1) {
          failedCount++;
          failedList.push({ ...broker, error: 'خطأ في الشبكة (محاكاة)' });
          setFailedCount(failedCount);
          setFailedRecipients([...failedList]);
        } else {
          sentCount++;
          setSentCount(sentCount);
        }
        
        // Add random delay between messages
        if (i < totalBrokers - 1) {
          const delay = getRandomInterval() * 1000; // Convert to milliseconds
          setSendingStatus(`انتظار ${delay / 1000} ثانية قبل الرسالة التالية...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
      } catch (error) {
        console.error(`Failed to send to ${broker.name}:`, error);
        failedCount++;
        failedList.push({ ...broker, error: error.message || 'خطأ في الإرسال' });
        setFailedCount(failedCount);
        setFailedRecipients([...failedList]);
      }
    }

    setSendingStatus('تم إرسال جميع الرسائل');
    setIsSending(false);
    
    toast({
      title: "تم إرسال الحملة بنجاح",
      description: `تم إرسال ${sentCount} رسالة، فشل ${failedCount} رسالة`,
    });
  };

  const handleCreateCampaign = async () => {
    if (!campaignName || !messageTemplate) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    try {
      const campaignData = {
        name: campaignName,
        type: campaignType,
        message: messageTemplate,
        brokers: selectedBrokers.map(b => b.id),
        scheduledDate: campaignType === 'scheduled' ? scheduledDate : null,
        scheduledTime: campaignType === 'scheduled' ? scheduledTime : null,
        useRandomTiming,
        minIntervalSeconds,
        maxIntervalSeconds,
        fixedIntervalMinutes,
        recurringPattern: campaignType === 'recurring' ? recurringPattern : null,
        personalizeMessages,
        trackDelivery,
        autoRetry,
        maxRetries,
        timezone,
        attachments: attachments.map(f => f.name)
      };

      console.log('Creating campaign:', campaignData);
      
      toast({
        title: "تم إنشاء الحملة بنجاح",
        description: `تم إنشاء حملة "${campaignName}" لـ ${selectedCount} وسيط`,
      });

      // Clear selection and navigate back
      clearSelection();
      navigate('/land-sales/tasks');
    } catch (error) {
      toast({
        title: "خطأ في إنشاء الحملة",
        description: "حدث خطأ أثناء إنشاء الحملة",
        variant: "destructive",
      });
    }
  };

  const handleSendNow = () => {
    if (!messageTemplate.trim()) {
      toast({
        title: "نص الرسالة مطلوب",
        description: "يرجى كتابة نص الرسالة أولاً",
        variant: "destructive",
      });
      return;
    }

    if (selectedBrokers.length === 0) {
      toast({
        title: "لا توجد وسطاء محددين",
        description: "يرجى اختيار وسطاء أولاً",
        variant: "destructive",
      });
      return;
    }

    // التحقق من إعدادات WhatsApp
    if (!whatsappSettings) {
      toast({
        title: "خطأ في الإعدادات",
        description: "لم يتم العثور على إعدادات WhatsApp. يرجى إعدادها أولاً من صفحة إعدادات WhatsApp.",
        variant: "destructive",
      });
      return;
    }

    // التحقق من صحة الإعدادات
    if (!whatsappSettings.api_key || !whatsappSettings.sender_number) {
      toast({
        title: "إعدادات غير مكتملة",
        description: "API Key أو Sender Number غير محددين في إعدادات WhatsApp",
        variant: "destructive",
      });
      return;
    }

    // إرسال فعلي دائماً (إزالة المحاكاة)
    sendActualWhatsAppMessages();
  };

  const canSendCampaign = () => {
    return (selectedCount > 0 || uploadedBrokers.length > 0) && 
           campaignName && 
           messageTemplate && 
           (campaignType === 'instant' || 
            (campaignType === 'scheduled' && scheduledDate && scheduledTime) ||
            (campaignType === 'recurring' && recurringPattern));
  };

  // File Upload Functions
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'text/csv' // .csv
    ];

    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      toast({
        title: "نوع ملف غير مدعوم",
        description: "يرجى رفع ملف Excel (.xlsx, .xls) أو CSV (.csv)",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    setIsProcessingFile(true);
    setFileUploadProgress(0);

    try {
      // Simulate file processing progress
      for (let i = 0; i <= 100; i += 10) {
        setFileUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Process the file
      const processedData = await processUploadedFile(file);
      setFilePreviewData(processedData);
      setShowPreviewDialog(true);
      
      toast({
        title: "تم تحميل الملف بنجاح",
        description: `تم العثور على ${processedData.length} سجل`,
      });

    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "خطأ في معالجة الملف",
        description: "حدث خطأ أثناء قراءة الملف",
        variant: "destructive",
      });
    } finally {
      setIsProcessingFile(false);
    }
  };

  const processUploadedFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          let data: any[] = [];

          if (file.name.endsWith('.csv')) {
            // Process CSV
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            
            for (let i = 1; i < lines.length; i++) {
              if (lines[i].trim()) {
                const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                const row: any = {};
                headers.forEach((header, index) => {
                  row[header] = values[index] || '';
                });
                data.push(row);
              }
            }
          } else {
            // For Excel files, we'll need a library like xlsx
            // For now, provide instructions for CSV format
            reject(new Error('يرجى تحويل الملف إلى CSV أولاً'));
            return;
          }

          // Validate and normalize data
          const normalizedData = data.map((row, index) => {
            const errors: string[] = [];
            
            // Map common field names
            const normalizedRow = {
              id: row.id || row.ID || `uploaded_${Date.now()}_${index}`,
              name: row.name || row.Name || row['الاسم'] || row['اسم'] || '',
              phone: row.phone || row.Phone || row['رقم الهاتف'] || row['الهاتف'] || '',
              whatsapp_number: row.whatsapp_number || row.whatsapp || row['واتساب'] || row.phone || row.Phone || '',
              email: row.email || row.Email || row['الإيميل'] || '',
              office_name: row.office_name || row.office || row['المكتب'] || row['الشركة'] || '',
              areas_specialization: row.areas || row.specialization || row['التخصص'] || '',
              source: 'file_upload'
            };

            // Validate required fields
            if (!normalizedRow.name) errors.push(`الصف ${index + 1}: الاسم مطلوب`);
            if (!normalizedRow.phone && !normalizedRow.whatsapp_number) {
              errors.push(`الصف ${index + 1}: رقم الهاتف أو واتساب مطلوب`);
            }

            return { ...normalizedRow, _errors: errors, _rowNumber: index + 1 };
          });

          // Collect all validation errors
          const allErrors = normalizedData.flatMap(row => row._errors || []);
          setValidationErrors(allErrors);

          resolve(normalizedData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('فشل في قراءة الملف'));
      reader.readAsText(file, 'UTF-8');
    });
  };

  const confirmImportData = () => {
    const validData = filePreviewData.filter(row => !row._errors || row._errors.length === 0);
    setUploadedBrokers(validData);
    setShowPreviewDialog(false);
    setShowFileUpload(false);
    
    toast({
      title: "تم استيراد البيانات",
      description: `تم استيراد ${validData.length} وسيط بنجاح`,
    });
  };

  const getMediaType = (file: File): 'image' | 'document' | 'video' | 'audio' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const downloadTemplate = () => {
    const csvContent = `name,phone,whatsapp_number,email,office_name,areas_specialization
"أحمد محمد","971501234567","971501234567","ahmed@example.com","مكتب العقارات المتميز","دبي، أبوظبي"
"سارة أحمد","971509876543","971509876543","sara@example.com","شركة الإمارات العقارية","الشارقة، عجمان"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'brokers_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "تم تحميل القالب",
      description: "تم تحميل قالب Excel للوسطاء",
    });
  };

  const navigateToBulkSend = () => {
    if (!messageTemplate.trim()) {
      toast({
        title: "نص الرسالة مطلوب",
        description: "يرجى كتابة نص الرسالة أولاً",
        variant: "destructive",
      });
      return;
    }

    if (selectedBrokers.length === 0) {
      toast({
        title: "لا توجد وسطاء محددين",
        description: "يرجى اختيار وسطاء أولاً",
        variant: "destructive",
      });
      return;
    }

    const bulkSendData = {
      messageContent: messageTemplate,
      recipients: selectedBrokers.map(broker => ({
        id: broker.id,
        name: broker.name,
        phone_number: broker.whatsapp_number || broker.phone,
        type: 'land_broker',
        company: broker.office_name || 'غير محدد',
        tags: broker.areas_specialization || []
      })),
      campaignName: campaignName || `حملة وسطاء - ${new Date().toLocaleDateString('ar-EG')}`,
      personalizationEnabled: personalizeMessages,
      timingSettings: {
        useRandomTiming,
        minIntervalSeconds,
        maxIntervalSeconds,
        fixedIntervalMinutes
      },
      advancedSettings: {
        trackDelivery,
        autoRetry,
        maxRetries,
        timezone
      }
    };

    // استخدام React Router State بدلاً من localStorage
    navigate('/whatsapp/bulk-send', {
      state: {
        bulkSendData,
        timestamp: Date.now(),
        source: 'advanced_tasks'
      }
    });
    
    console.log('📤 [AdvancedTasks] Data passed via router state:', {
      recipients: bulkSendData.recipients.length,
      messageLength: bulkSendData.messageContent.length,
      timestamp: new Date().toISOString()
    });
    
    toast({
      title: "تم التحويل بنجاح",
      description: `تم تحويل ${selectedCount} وسيط إلى صفحة الإرسال الجماعية.`,
    });
  };

  const handleSaveDraft = () => {
    // Save campaign as draft
    toast({
      title: "تم الحفظ",
      description: "تم حفظ الحملة كمسودة بنجاح",
    });
  };

  const handleSendCampaign = async () => {
    if (!canSendCampaign()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    // التحقق من إعدادات WhatsApp
    if (!whatsappSettings) {
      toast({
        title: "خطأ في الإعدادات",
        description: "لم يتم العثور على إعدادات WhatsApp. يرجى إعدادها أولاً من صفحة إعدادات WhatsApp.",
        variant: "destructive",
      });
      return;
    }

    // التحقق من صحة الإعدادات
    if (!whatsappSettings.api_key || !whatsappSettings.sender_number) {
      toast({
        title: "إعدادات غير مكتملة",
        description: "API Key أو Sender Number غير محددين في إعدادات WhatsApp",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    setSendingProgress(0);
    setSentCount(0);
    setFailedCount(0);

    try {
      // إرسال فعلي عبر WhatsApp
      const allBrokers = [...selectedBrokers, ...uploadedBrokers];
      const totalMessages = allBrokers.length;
      let sent = 0;
      let failed = 0;

      for (let i = 0; i < totalMessages; i++) {
        const broker = allBrokers[i];
        const progress = ((i + 1) / totalMessages) * 100;
        
        setSendingProgress(progress);
        setSendingStatus(`جاري إرسال الرسالة إلى ${broker.name}...`);

        try {
          // Personalize message
          const personalizedMessage = personalizeMessages 
            ? messageTemplate
                .replace(/{name}/g, broker.name)
                .replace(/{phone}/g, broker.phone)
                .replace(/{email}/g, broker.email || 'غير محدد')
            : messageTemplate;

          // Get WhatsApp number (prefer whatsapp_number, fallback to phone)
          const whatsappNumber = broker.whatsapp_number || broker.phone;
          
          if (!whatsappNumber) {
            console.error(`No WhatsApp number for ${broker.name}`);
            failed++;
            setFailedCount(failed);
            continue;
          }

          console.log(`📤 [AdvancedTasks] Sending to ${broker.name} (${whatsappNumber}):`, {
            message: personalizedMessage.substring(0, 50) + '...',
            api_key: `${whatsappSettings.api_key.substring(0, 8)}...`,
            sender: whatsappSettings.sender_number,
            broker_id: broker.id,
            broker_name: broker.name
          });

          // استخدام whatsappService للإرسال الفعلي
          let result;
          
          // إذا كان هناك مرفقات، أرسل أول مرفق مع الرسالة
          if (uploadedMediaUrls.length > 0) {
            const mediaUrl = uploadedMediaUrls[0]; // أرسل أول مرفق فقط
            const mediaType = getMediaType(attachments[0]);
            const caption = personalizedMessage; // استخدم الرسالة كـ caption
            
            console.log(`📎 [AdvancedTasks] Sending with media:`, {
              mediaUrl,
              mediaType,
              caption: caption.substring(0, 50) + '...'
            });

            result = await whatsappService.sendWhatsAppMessage(
              whatsappNumber,
              '', // رسالة فارغة لأن النص سيذهب كـ caption
              whatsappSettings.default_footer || 'Sent via StarCity Folio',
              mediaUrl,
              mediaType,
              caption
            );
          } else {
            // إرسال رسالة نصية عادية
            result = await whatsappService.sendWhatsAppMessage(
              whatsappNumber,
              personalizedMessage,
              whatsappSettings.default_footer || 'Sent via StarCity Folio'
            );
          }

          console.log(`📥 [AdvancedTasks] API Response for ${broker.name}:`, result);
          
          if (result && result.status) {
            sent++;
            console.log(`✅ [AdvancedTasks] Successfully sent to ${broker.name} (${whatsappNumber})`);
            console.log(`📝 [AdvancedTasks] Message content: ${personalizedMessage.substring(0, 100)}...`);
          } else {
            failed++;
            console.error(`❌ [AdvancedTasks] Failed to send to ${broker.name}: ${result?.message || 'Unknown error'}`);
            console.error(`🔍 [AdvancedTasks] Full error details:`, result);
          }
          
          setSentCount(sent);
          setFailedCount(failed);
          
          // Add random delay between messages
          if (i < totalMessages - 1) {
            const delay = useRandomTiming 
              ? Math.random() * (maxIntervalSeconds - minIntervalSeconds) + minIntervalSeconds
              : fixedIntervalMinutes * 60;
            
            setSendingStatus(`انتظار ${Math.round(delay)} ثانية قبل الرسالة التالية...`);
            await new Promise(resolve => setTimeout(resolve, delay * 1000)); // Convert to milliseconds
          }
          
        } catch (error) {
          console.error(`Failed to send to ${broker.name}:`, error);
          failed++;
          setFailedCount(failed);
        }
      }

      // Show success dialog
      setIsSending(false);
      setShowSuccessDialog(true);
      
      toast({
        title: sent > 0 ? "تم الإرسال بنجاح" : "فشل في إرسال جميع الرسائل",
        description: `تم إرسال ${sent} رسالة بنجاح، فشل ${failed} رسالة`,
        variant: sent > 0 ? "default" : "destructive",
      });

    } catch (error) {
      setIsSending(false);
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء إرسال الحملة",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="إنشاء حملة متقدمة"
        description={`إنشاء حملة جديدة لـ ${selectedCount} وسيط محدد`}
      >
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/land-sales/brokers')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة للوسطاء
          </Button>
          
                     <Button 
             onClick={handleSendNow}
             disabled={isSending || !messageTemplate.trim() || selectedCount === 0 || !whatsappSettings}
             className="bg-green-600 hover:bg-green-700"
           >
             <Send className="h-4 w-4 mr-2" />
             {isSending ? "جاري الإرسال..." : "إرسال فعلي عبر WhatsApp"}
           </Button>
          
          <Button onClick={handleCreateCampaign}>
            <Play className="h-4 w-4 mr-2" />
            إنشاء الحملة
          </Button>
          
          <Button 
            onClick={navigateToBulkSend}
            disabled={!messageTemplate.trim() || selectedCount === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Users className="h-4 w-4 mr-2" />
            تحويل للإرسال الجماعي
          </Button>
        </div>
      </PageHeader>

             {/* WhatsApp Settings Status */}
       {!whatsappSettings && settingsLoaded && (
         <Card className="border-orange-200 bg-orange-50">
           <CardContent className="p-4">
             <div className="flex items-center gap-2">
               <AlertTriangle className="h-5 w-5 text-orange-600" />
               <div>
                 <p className="text-sm font-medium text-orange-800">
                   إعدادات WhatsApp غير متوفرة
                 </p>
                 <p className="text-xs text-orange-600">
                   يرجى إعداد WhatsApp من صفحة الإعدادات أولاً
                 </p>
               </div>
               <div className="ml-auto flex gap-2">
                 <Button 
                   variant="outline" 
                   size="sm"
                   onClick={createDefaultWhatsAppSettings}
                 >
                   إنشاء إعدادات افتراضية
                 </Button>
                 <Button 
                   variant="outline" 
                   size="sm"
                   onClick={() => navigate('/whatsapp/settings')}
                 >
                   إعدادات WhatsApp
                 </Button>
               </div>
             </div>
           </CardContent>
         </Card>
       )}

       {/* WhatsApp Settings Info */}
       {whatsappSettings && (
         <Card className="border-green-200 bg-green-50">
           <CardContent className="p-4">
             <div className="flex items-center gap-2">
               <CheckCircle className="h-5 w-5 text-green-600" />
               <div>
                 <p className="text-sm font-medium text-green-800">
                   إعدادات WhatsApp متوفرة - جاهز للإرسال
                 </p>
                 <p className="text-xs text-green-600">
                   المرسل: {whatsappSettings.sender_number} | API Key: {whatsappSettings.api_key.substring(0, 8)}...
                 </p>
               </div>
             </div>
           </CardContent>
         </Card>
       )}

      {/* Sending Progress */}
      {isSending && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                <span className="text-sm font-medium">{sendingStatus}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${sendingProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600">
                التقدم: {Math.round(sendingProgress)}% ({Math.round(sendingProgress * selectedCount / 100)} من {selectedCount})
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selected Brokers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              الوسطاء المحددين ({selectedCount + uploadedBrokers.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFileUpload(true)}
                className="flex items-center gap-1"
              >
                <Upload className="h-4 w-4" />
                تحميل من ملف
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                تحميل القالب
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {/* Brokers from selection */}
              {selectedBrokers.map(broker => (
                <div key={broker.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div>
                    <p className="font-medium">{broker.name}</p>
                    <p className="text-sm text-muted-foreground">{broker.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">من القاعدة</Badge>
                    <Badge variant={broker.activity_status === 'active' ? 'default' : 'secondary'}>
                      {broker.activity_status}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {/* Brokers from file upload */}
              {uploadedBrokers.map((broker, index) => (
                <div key={`uploaded_${index}`} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                  <div>
                    <p className="font-medium">{broker.name}</p>
                    <p className="text-sm text-muted-foreground">{broker.whatsapp_number || broker.phone}</p>
                    <p className="text-xs text-muted-foreground">{broker.office_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">من الملف</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const filtered = uploadedBrokers.filter((_, i) => i !== index);
                        setUploadedBrokers(filtered);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {selectedCount === 0 && uploadedBrokers.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  لم يتم اختيار وسطاء بعد
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Campaign Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              إعدادات الحملة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Campaign Name */}
            <div>
              <Label htmlFor="campaignName">اسم الحملة</Label>
              <Input
                id="campaignName"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="أدخل اسم الحملة"
              />
            </div>

            {/* Campaign Type */}
            <div>
              <Label htmlFor="campaignType">نوع الحملة</Label>
              <Select value={campaignType} onValueChange={(value: 'instant' | 'scheduled' | 'recurring') => setCampaignType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">إرسال فوري</SelectItem>
                  <SelectItem value="scheduled">مجدولة</SelectItem>
                  <SelectItem value="recurring">متكررة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Scheduling Options */}
            {campaignType === 'scheduled' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduledDate">تاريخ الإرسال</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="scheduledTime">وقت الإرسال</Label>
                  <Input
                    id="scheduledTime"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Recurring Pattern */}
            {campaignType === 'recurring' && (
              <div>
                <Label htmlFor="recurringPattern">نمط التكرار</Label>
                <Select value={recurringPattern} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setRecurringPattern(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">يومياً</SelectItem>
                    <SelectItem value="weekly">أسبوعياً</SelectItem>
                    <SelectItem value="monthly">شهرياً</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Message Template */}
            <div>
              <Label htmlFor="messageTemplate">نص الرسالة *</Label>
              <Textarea
                id="messageTemplate"
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                placeholder="اكتب نص الرسالة هنا... يمكنك استخدام {name} لإدراج اسم الوسيط"
                rows={4}
              />
              <p className="text-sm text-muted-foreground mt-1">
                المتغيرات المتاحة: {"{name}"}, {"{short_name}"}, {"{phone}"}, {"{email}"}
              </p>
            </div>

            {/* Improved Timing Options */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                <Label className="text-base font-medium">إعدادات التوقيت بين الرسائل</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="useRandomTiming"
                  checked={useRandomTiming}
                  onChange={(e) => setUseRandomTiming(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="useRandomTiming" className="flex items-center gap-2">
                  <Shuffle className="h-4 w-4" />
                  استخدام توقيت عشوائي (طبيعي أكثر)
                </Label>
              </div>

              {useRandomTiming ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minInterval">الحد الأدنى (بالثواني)</Label>
                    <Input
                      id="minInterval"
                      type="number"
                      value={minIntervalSeconds}
                      onChange={(e) => setMinIntervalSeconds(Number(e.target.value))}
                      min={1}
                      max={60}
                      placeholder="مثال: 3"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxInterval">الحد الأقصى (بالثواني)</Label>
                    <Input
                      id="maxInterval"
                      type="number"
                      value={maxIntervalSeconds}
                      onChange={(e) => setMaxIntervalSeconds(Number(e.target.value))}
                      min={1}
                      max={60}
                      placeholder="مثال: 10"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <Label htmlFor="fixedInterval">الفترة الثابتة (بالدقائق)</Label>
                  <Input
                    id="fixedInterval"
                    type="number"
                    value={fixedIntervalMinutes}
                    onChange={(e) => setFixedIntervalMinutes(Number(e.target.value))}
                    min={1}
                    max={60}
                    placeholder="مثال: 5"
                  />
                </div>
              )}
              
              <div className="text-sm text-muted-foreground bg-background p-2 rounded">
                {useRandomTiming 
                  ? `سيتم إرسال الرسائل بفترات عشوائية بين ${minIntervalSeconds} و ${maxIntervalSeconds} ثانية`
                  : `سيتم إرسال الرسائل كل ${fixedIntervalMinutes} دقيقة`
                }
              </div>
            </div>

            {/* Timezone */}
            <div>
              <Label htmlFor="timezone">المنطقة الزمنية</Label>
              <Select value={timezone} onValueChange={(value: string) => setTimezone(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Dubai">دبي (GMT+4)</SelectItem>
                  <SelectItem value="Asia/Riyadh">الرياض (GMT+3)</SelectItem>
                  <SelectItem value="Asia/Kuwait">الكويت (GMT+3)</SelectItem>
                  <SelectItem value="Asia/Qatar">قطر (GMT+3)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File Attachments */}
            <div>
              <Label htmlFor="attachments">المرفقات (صور، فيديو، مستندات)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  id="attachments"
                  multiple
                  onChange={handleAttachmentUpload}
                  className="hidden"
                />
                <label htmlFor="attachments" className="cursor-pointer">
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">اضغط لإضافة مرفقات</p>
                    <p className="text-xs text-gray-500">صور، فيديو، مستندات (حد أقصى 16 ميجابايت)</p>
                  </div>
                </label>
              </div>
              
              {/* Media Upload Progress */}
              {isUploadingMedia && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">جاري رفع المرفقات...</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${mediaUploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Attachments List */}
              {attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <div>
                          <span className="text-sm font-medium">{file.name}</span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            {uploadedMediaUrls[index] && (
                              <Badge variant="default" className="text-xs">تم الرفع</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Media Info */}
              {uploadedMediaUrls.length > 0 && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800">
                    📎 سيتم إرسال أول مرفق مع الرسالة ({uploadedMediaUrls.length} مرفق جاهز)
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            خيارات متقدمة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="personalizeMessages"
                checked={personalizeMessages}
                onChange={(e) => setPersonalizeMessages(e.target.checked)}
              />
              <Label htmlFor="personalizeMessages">تخصيص الرسائل</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="trackDelivery"
                checked={trackDelivery}
                onChange={(e) => setTrackDelivery(e.target.checked)}
              />
              <Label htmlFor="trackDelivery">تتبع التسليم</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoRetry"
                checked={autoRetry}
                onChange={(e) => setAutoRetry(e.target.checked)}
              />
              <Label htmlFor="autoRetry">إعادة المحاولة التلقائية</Label>
            </div>
            
                         <div className="flex items-center space-x-2">
               <CheckCircle className="h-4 w-4 text-green-600" />
               <Label className="text-green-600 font-medium">
                 إرسال فعلي عبر WhatsApp (مفعل دائماً)
               </Label>
             </div>

            {autoRetry && (
              <div>
                <Label htmlFor="maxRetries">عدد المحاولات القصوى</Label>
                <Input
                  id="maxRetries"
                  type="number"
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(Number(e.target.value))}
                  min={1}
                  max={10}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Campaign Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            معاينة الحملة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>اسم الحملة</Label>
                <p className="text-sm text-muted-foreground">{campaignName || 'غير محدد'}</p>
              </div>
              <div>
                <Label>نوع الحملة</Label>
                <p className="text-sm text-muted-foreground">
                  {campaignType === 'instant' ? 'إرسال فوري' : 
                   campaignType === 'scheduled' ? 'مجدولة' : 'متكررة'}
                </p>
              </div>
            </div>
            
            <div>
              <Label>عدد الوسطاء</Label>
              <p className="text-sm text-muted-foreground">{selectedCount} وسيط</p>
            </div>
            
            <div>
              <Label>إعدادات التوقيت</Label>
              <p className="text-sm text-muted-foreground">
                {useRandomTiming 
                  ? `عشوائي: ${minIntervalSeconds}-${maxIntervalSeconds} ثانية`
                  : `ثابت: ${fixedIntervalMinutes} دقيقة`
                }
              </p>
            </div>
            
                         <div>
               <Label>نوع الإرسال</Label>
               <p className="text-sm text-muted-foreground">
                 <span className="text-green-600 font-medium">إرسال فعلي عبر WhatsApp</span>
               </p>
             </div>
            
            <div>
              <Label>نص الرسالة</Label>
              <div className="mt-1 p-3 bg-muted rounded text-sm">
                {messageTemplate || 'لم يتم تحديد نص الرسالة'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mt-6">
        <Button
          variant="outline"
          onClick={() => navigate('/land-sales/brokers')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          العودة للوسطاء
        </Button>
        
        <Button
          variant="outline"
          onClick={handleSaveDraft}
          disabled={!campaignName || !messageTemplate}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          حفظ كمسودة
        </Button>
        
                 <Button
           onClick={handleSendCampaign}
           disabled={!canSendCampaign() || isSending}
           className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
         >
           {isSending ? (
             <>
               <RefreshCw className="h-4 w-4 animate-spin" />
               جاري الإرسال...
             </>
           ) : (
             <>
               <Send className="h-4 w-4" />
               إرسال فعلي عبر WhatsApp
             </>
           )}
         </Button>

        <Button
          onClick={navigateToBulkSend}
          disabled={!messageTemplate.trim() || selectedCount === 0}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Users className="h-4 w-4" />
          تحويل للإرسال الجماعي
        </Button>
      </div>

      {/* Progress Section - عرض التقدم في الصفحة بدلاً من Pop up */}
      {isSending && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <RefreshCw className="h-5 w-5 animate-spin" />
              جاري إرسال الحملة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">التقدم العام</span>
                <span className="text-lg font-bold text-blue-600">{Math.round(sendingProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${sendingProgress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-xl font-bold text-blue-600">{selectedCount + uploadedBrokers.length}</div>
                <div className="text-sm text-gray-600">إجمالي المستلمين</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-xl font-bold text-green-600">{sentCount}</div>
                <div className="text-sm text-gray-600">تم الإرسال</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-xl font-bold text-red-600">{failedCount}</div>
                <div className="text-sm text-gray-600">فاشل</div>
              </div>
            </div>
            
            <div className="bg-white p-3 rounded border">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">الحالة الحالية:</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{sendingStatus}</p>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                لا تغلق هذه الصفحة أثناء عملية الإرسال لتجنب توقف العملية
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Failed Messages Retry Section */}
      {!isSending && failedRecipients.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              رسائل فاشلة ({failedRecipients.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-60 overflow-y-auto space-y-2">
              {failedRecipients.map((recipient, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <div className="font-medium">{recipient.name}</div>
                    <div className="text-sm text-gray-600">{recipient.phone}</div>
                    <div className="text-xs text-red-600">{recipient.error}</div>
                  </div>
                  <Badge variant="destructive">فاشل</Badge>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={retryFailedMessages}
                disabled={isSending}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
              >
                <RefreshCw className="h-4 w-4" />
                إعادة الإرسال ({failedRecipients.length})
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setFailedRecipients([])}
                disabled={isSending}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                مسح القائمة
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              تم إرسال الحملة بنجاح
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>تم إرسال الحملة بنجاح إلى {selectedCount + uploadedBrokers.length} وسيط</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">الرسائل المرسلة:</span>
                <p className="text-green-600">{sentCount}</p>
              </div>
              <div>
                <span className="font-medium">الرسائل الفاشلة:</span>
                <p className="text-red-600">{failedCount}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSuccessDialog(false)}
                className="flex-1"
              >
                إغلاق
              </Button>
              <Button
                onClick={() => {
                  setShowSuccessDialog(false);
                  navigate('/land-sales/brokers');
                }}
                className="flex-1"
              >
                العودة للوسطاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Upload Dialog */}
      <Dialog open={showFileUpload} onOpenChange={setShowFileUpload}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              تحميل وسطاء من ملف
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label 
                htmlFor="file-upload" 
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <FileText className="h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-lg font-medium">اختر ملف CSV أو Excel</p>
                  <p className="text-sm text-muted-foreground">
                    اسحب الملف هنا أو انقر للاختيار
                  </p>
                </div>
              </label>
            </div>

            {isProcessingFile && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">جاري معالجة الملف...</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${fileUploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">تنسيق الملف المطلوب:</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• <strong>name</strong>: اسم الوسيط (مطلوب)</p>
                <p>• <strong>phone</strong>: رقم الهاتف (مطلوب)</p>
                <p>• <strong>whatsapp_number</strong>: رقم الواتساب (اختياري)</p>
                <p>• <strong>email</strong>: البريد الإلكتروني (اختياري)</p>
                <p>• <strong>office_name</strong>: اسم المكتب (اختياري)</p>
                <p>• <strong>areas_specialization</strong>: مناطق التخصص (اختياري)</p>
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                تحميل قالب نموذجي
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFileUpload(false)}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Table className="h-5 w-5" />
              معاينة البيانات المحملة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {validationErrors.length > 0 && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">تم العثور على أخطاء في البيانات:</p>
                    <ul className="text-sm space-y-1">
                      {validationErrors.slice(0, 5).map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                      {validationErrors.length > 5 && (
                        <li>... و {validationErrors.length - 5} أخطاء أخرى</li>
                      )}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="max-h-96 overflow-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-2 text-right">الاسم</th>
                    <th className="p-2 text-right">الهاتف</th>
                    <th className="p-2 text-right">واتساب</th>
                    <th className="p-2 text-right">المكتب</th>
                    <th className="p-2 text-right">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {filePreviewData.map((row, index) => (
                    <tr 
                      key={index} 
                      className={row._errors && row._errors.length > 0 ? 'bg-red-50' : 'bg-white'}
                    >
                      <td className="p-2 border-b">{row.name}</td>
                      <td className="p-2 border-b">{row.phone}</td>
                      <td className="p-2 border-b">{row.whatsapp_number}</td>
                      <td className="p-2 border-b">{row.office_name}</td>
                      <td className="p-2 border-b">
                        {row._errors && row._errors.length > 0 ? (
                          <Badge variant="destructive">خطأ</Badge>
                        ) : (
                          <Badge variant="default">صحيح</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                إجمالي: {filePreviewData.length} | 
                صحيح: {filePreviewData.filter(row => !row._errors || row._errors.length === 0).length} | 
                خطأ: {filePreviewData.filter(row => row._errors && row._errors.length > 0).length}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPreviewDialog(false)}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={confirmImportData}
                  disabled={filePreviewData.filter(row => !row._errors || row._errors.length === 0).length === 0}
                >
                  استيراد البيانات الصحيحة
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
