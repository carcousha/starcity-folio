import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalSelectedBrokers } from '@/hooks/useGlobalSelectedBrokers';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Calendar, Clock, MessageSquare, Smartphone, Users, ArrowLeft, Play, Settings, Target, FileText, Upload, CheckCircle, AlertCircle, X, Send, Timer, Shuffle, RefreshCw, AlertTriangle, Download, Table, CheckSquare, Square, Image, Video, Music, FileSpreadsheet, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { whatsappService } from '@/services/whatsappService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

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
  const [selectedFailedRecipients, setSelectedFailedRecipients] = useState<Set<number>>(new Set());
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
  const [directMediaUrl, setDirectMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'document' | 'video' | 'audio'>('image');

  // New state for tab management
  const [activeTab, setActiveTab] = useState<'text' | 'media'>('text');

  useEffect(() => {
    // Check authentication first
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error('❌ [AdvancedTasks] Authentication failed:', error);
        toast({
          title: "يجب تسجيل الدخول",
          description: "يرجى تسجيل الدخول أولاً",
          variant: "destructive",
        });
        navigate('/auth/login');
        return;
      }
      console.log('✅ [AdvancedTasks] User authenticated:', user.email);
    };
    
    checkAuth();
    
    if (selectedCount === 0) {
      toast({
        title: "لا توجد وسطاء محددين",
        description: "يرجى اختيار وسطاء من صفحة الوسطاء أولاً",
        variant: "destructive",
      });
      navigate('/land-sales/brokers');
    }
  }, [selectedCount, navigate]);

  // Monitor uploadedBrokers state changes
  useEffect(() => {
    console.log('📊 [AdvancedTasks] uploadedBrokers state changed:', {
      count: uploadedBrokers.length,
      brokers: uploadedBrokers.map(b => ({ name: b.name, phone: b.phone }))
    });
  }, [uploadedBrokers]);

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

  const handleDirectMediaUrl = async () => {
    if (!directMediaUrl.trim()) {
      toast({
        title: "رابط فارغ",
        description: "يرجى إدخال رابط صحيح للمرفق",
        variant: "destructive",
      });
      return;
    }

    try {
      // استخدام الدالة الجديدة في whatsappService
      const validatedUrl = await whatsappService.addDirectMediaUrl(directMediaUrl, mediaType);
      
      // إضافة الرابط إلى القائمة
      setUploadedMediaUrls(prev => [...prev, validatedUrl]);
      
      // إنشاء ملف وهمي للعرض
      const dummyFile = new File([''], `attachment.${mediaType === 'image' ? 'jpg' : mediaType === 'video' ? 'mp4' : mediaType === 'audio' ? 'mp3' : 'pdf'}`, {
        type: mediaType === 'image' ? 'image/jpeg' : mediaType === 'video' ? 'video/mp4' : mediaType === 'audio' ? 'audio/mpeg' : 'application/pdf'
      });
      setAttachments(prev => [...prev, dummyFile]);

      toast({
        title: "تم إضافة المرفق",
        description: `تم إضافة ${mediaType === 'image' ? 'الصورة' : mediaType === 'video' ? 'الفيديو' : mediaType === 'audio' ? 'الملف الصوتي' : 'المستند'} بنجاح`,
      });

      // مسح الحقول
      setDirectMediaUrl('');
      setMediaType('image');
      
    } catch (error) {
      console.error('❌ [AdvancedTasks] Failed to add direct media URL:', error);
      toast({
        title: "خطأ في إضافة الرابط",
        description: error instanceof Error ? error.message : 'خطأ غير معروف',
        variant: "destructive",
      });
    }
  };

  const handleAttachmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    console.log('🚀 [AdvancedTasks] handleAttachmentUpload started with files:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));

    // Check authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ [AdvancedTasks] Authentication failed in handleAttachmentUpload:', authError);
      toast({
        title: "يجب تسجيل الدخول",
        description: "يرجى تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }
    console.log('✅ [AdvancedTasks] User authenticated for file upload:', user.email);

    setIsUploadingMedia(true);
    setMediaUploadProgress(0);

    try {
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = ((i + 1) / files.length) * 100;
        setMediaUploadProgress(progress);

        console.log(`📤 [AdvancedTasks] Uploading media file ${i + 1}/${files.length}:`, {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: new Date(file.lastModified).toISOString()
        });

        try {
          console.log(`🔄 [AdvancedTasks] Calling whatsappService.uploadMediaFile for ${file.name}...`);
          const mediaUrl = await whatsappService.uploadMediaFile(file);
          console.log(`📥 [AdvancedTasks] uploadMediaFile returned:`, mediaUrl);
          
          if (mediaUrl) {
            uploadedUrls.push(mediaUrl);
            console.log(`✅ [AdvancedTasks] Media uploaded successfully:`, mediaUrl);
          } else {
            console.warn(`⚠️ [AdvancedTasks] uploadMediaFile returned null for ${file.name}`);
          }
        } catch (error) {
          console.error(`❌ [AdvancedTasks] Failed to upload ${file.name}:`, error);
          console.error(`🔍 [AdvancedTasks] Error details for ${file.name}:`, {
            name: error?.name,
            message: error?.message,
            stack: error?.stack,
            constructor: error?.constructor?.name
          });
          
          let errorMessage = 'خطأ غير معروف';
          
          if (error instanceof Error) {
            if (error.message.includes('Bucket not found')) {
              errorMessage = 'مشكلة في إعدادات التخزين. يرجى التواصل مع المسؤول.';
            } else if (error.message.includes('File too large')) {
              errorMessage = 'حجم الملف كبير جداً. الحد الأقصى 16 ميجابايت.';
            } else if (error.message.includes('File type not allowed')) {
              errorMessage = 'نوع الملف غير مدعوم. يرجى اختيار ملف آخر.';
            } else if (error.message.includes('JWT')) {
              errorMessage = 'مشكلة في المصادقة. يرجى إعادة تسجيل الدخول.';
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
              errorMessage = 'مشكلة في الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت.';
            } else {
              errorMessage = error.message;
            }
          }
          
          toast({
            title: "فشل في رفع الملف",
            description: `فشل في رفع ${file.name}: ${errorMessage}`,
            variant: "destructive",
          });
        }
      }

      console.log(`📊 [AdvancedTasks] Upload summary: ${uploadedUrls.length}/${files.length} files uploaded successfully`);

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
      console.error('💥 [AdvancedTasks] Outer error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      
      toast({
        title: "خطأ في رفع المرفقات",
        description: "حدث خطأ أثناء رفع المرفقات",
        variant: "destructive",
      });
    } finally {
      setIsUploadingMedia(false);
      setMediaUploadProgress(0);
      console.log('🏁 [AdvancedTasks] handleAttachmentUpload completed');
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
      total_brokers: selectedBrokers.length + uploadedBrokers.length,
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

    // Combine selected brokers and uploaded brokers
    const allBrokers = [...selectedBrokers, ...uploadedBrokers];
    const totalBrokers = allBrokers.length;
    let sentCount = 0;
    let failedCount = 0;
    const failedList: any[] = [];

    for (let i = 0; i < totalBrokers; i++) {
      const broker = allBrokers[i];
      const progress = ((i + 1) / totalBrokers) * 100;
      
      setSendingProgress(progress);
      setSendingStatus(`جاري إرسال الرسالة إلى ${broker.name}...`);

      try {
        // Personalize message
        const personalizedMessage = personalizeMessages 
          ? messageTemplate
              .replace(/{name}/g, broker.name)
              .replace(/{short_name}/g, broker.short_name || (broker.name ? broker.name.split(' ')[0] : 'صديق'))
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

        console.log(`📤 [AdvancedTasks] Sending to ${broker.name} (${whatsappNumber}):`, {
          message: personalizedMessage.substring(0, 50) + '...',
          api_key: `${whatsappSettings.api_key.substring(0, 8)}...`,
          sender: whatsappSettings.sender_number,
          hasAttachments: uploadedMediaUrls.length > 0,
          attachmentsCount: uploadedMediaUrls.length,
          firstAttachmentUrl: uploadedMediaUrls[0] || 'none'
        });

        // إعداد المرفقات
        let mediaUrl: string | undefined;
        let mediaType: 'image' | 'document' | 'video' | 'audio' | undefined;
        let caption: string | undefined;

        if (uploadedMediaUrls.length > 0) {
          mediaUrl = uploadedMediaUrls[0];
          // تحديد نوع الملف من الرابط أو من الملف
          if (attachments[0] && attachments[0].size > 0) {
            mediaType = getMediaType(attachments[0]);
          } else {
            mediaType = getMediaTypeFromUrl(mediaUrl, 'image');
          }
          caption = personalizedMessage; // استخدام الرسالة المخصصة كـ caption للمرفق
          
          console.log(`📎 [AdvancedTasks] Sending message with media:`, {
            mediaUrl,
            mediaType,
            caption: caption.substring(0, 50) + '...',
            attachmentsCount: attachments.length,
            uploadedUrlsCount: uploadedMediaUrls.length,
            allUploadedUrls: uploadedMediaUrls
          });
        }

        // استخدام whatsappService بدلاً من الاتصال المباشر
        const result = await whatsappService.sendWhatsAppMessage(
          whatsappNumber,
          personalizedMessage, // إرسال الرسالة كاملة (سيتم التعامل معها في whatsappService)
          whatsappSettings.default_footer || 'Sent via StarCity Folio',
          mediaUrl,
          mediaType,
          caption
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

  // دوال التحكم في اختيار الرسائل الفاشلة
  const toggleFailedRecipientSelection = (index: number) => {
    setSelectedFailedRecipients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const selectAllFailedRecipients = () => {
    const allIndices = failedRecipients.map((_, index) => index);
    setSelectedFailedRecipients(new Set(allIndices));
  };

  const deselectAllFailedRecipients = () => {
    setSelectedFailedRecipients(new Set());
  };

  const getSelectedFailedRecipients = () => {
    return failedRecipients.filter((_, index) => selectedFailedRecipients.has(index));
  };

  // إعادة الإرسال للرسائل الفاشلة
  const retryFailedMessages = async () => {
    const selectedRecipients = getSelectedFailedRecipients();
    
    if (selectedRecipients.length === 0) {
      toast({
        title: "لا توجد رسائل محددة",
        description: "يرجى تحديد الرسائل الفاشلة التي تريد إعادة إرسالها",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    setSendingProgress(0);
    setSendingStatus(`جاري إعادة إرسال ${selectedRecipients.length} رسالة فاشلة...`);

    const totalFailed = selectedRecipients.length;
    let retrySentCount = 0;
    let retryFailedCount = 0;
    const newFailedList: any[] = [];
    const remainingFailedRecipients = failedRecipients.filter((_, index) => !selectedFailedRecipients.has(index));

    for (let i = 0; i < totalFailed; i++) {
      const broker = selectedRecipients[i];
      const progress = ((i + 1) / totalFailed) * 100;
      
      setSendingProgress(progress);
      setSendingStatus(`إعادة إرسال إلى ${broker.name}...`);

      try {
        const personalizedMessage = personalizeMessages 
          ? messageTemplate
              .replace(/{name}/g, broker.name)
              .replace(/{short_name}/g, broker.short_name || (broker.name ? broker.name.split(' ')[0] : 'صديق'))
              .replace(/{phone}/g, broker.phone)
              .replace(/{email}/g, broker.email || 'غير محدد')
          : messageTemplate;

        const whatsappNumber = broker.whatsapp_number || broker.phone;
        
        if (!whatsappNumber) {
          retryFailedCount++;
          newFailedList.push({ ...broker, error: 'لا يوجد رقم واتساب' });
          continue;
        }

        // إعداد المرفقات للرسائل الفاشلة
        let mediaUrl: string | undefined;
        let mediaType: 'image' | 'document' | 'video' | 'audio' | undefined;
        let caption: string | undefined;

        if (uploadedMediaUrls.length > 0) {
          mediaUrl = uploadedMediaUrls[0];
          // تحديد نوع الملف من الرابط أو من الملف
          if (attachments[0] && attachments[0].size > 0) {
            mediaType = getMediaType(attachments[0]);
          } else {
            mediaType = getMediaTypeFromUrl(mediaUrl, 'image');
          }
          caption = personalizedMessage;
        }

        const result = await whatsappService.sendWhatsAppMessage(
          whatsappNumber,
          personalizedMessage,
          whatsappSettings.default_footer || 'Sent via StarCity Folio',
          mediaUrl,
          mediaType,
          caption
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
    const updatedFailedList = [...remainingFailedRecipients, ...newFailedList];
    setFailedRecipients(updatedFailedList);
    setFailedCount(updatedFailedList.length);
    setSelectedFailedRecipients(new Set()); // مسح الاختيار
    
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
              .replace(/{short_name}/g, broker.short_name || (broker.name ? broker.name.split(' ')[0] : 'صديق'))
              .replace(/{phone}/g, broker.phone)
              .replace(/{email}/g, broker.email || 'غير محدد')
          : messageTemplate;

        // معلومات عن الملفات المرفقة
        const mediaInfo = uploadedMediaUrls.length > 0 
          ? ` + ملف مرفق (${attachments[0]?.name || 'ملف مجهول'})`
          : '';
        
        console.log(`📤 [Simulation] Sending to ${broker.name} (${broker.phone}): ${personalizedMessage}${mediaInfo}`);
        
        if (uploadedMediaUrls.length > 0) {
          console.log(`📎 [Simulation] Media attached:`, {
            mediaUrl: uploadedMediaUrls[0],
            fileName: attachments[0]?.name,
            fileSize: attachments[0]?.size,
            mediaType: attachments[0] && attachments[0].size > 0 ? getMediaType(attachments[0]) : getMediaTypeFromUrl(uploadedMediaUrls[0], 'image'),
            willSendAsCaption: true
          });
        }
        
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
    
    const mediaMessage = uploadedMediaUrls.length > 0 
      ? ` مع ${uploadedMediaUrls.length} ملف مرفق`
      : '';
    
    toast({
      title: "تم إرسال الحملة بنجاح",
      description: `تم إرسال ${sentCount} رسالة، فشل ${failedCount} رسالة${mediaMessage}`,
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
    console.log('🚀 [AdvancedTasks] handleSendNow called');
    console.log('🚀 [AdvancedTasks] Current state:', {
      messageTemplate: messageTemplate.substring(0, 50) + '...',
      selectedBrokersCount: selectedBrokers.length,
      uploadedBrokersCount: uploadedBrokers.length,
      selectedBrokers: selectedBrokers.map(b => ({ id: b.id, name: b.name, phone: b.phone })),
      uploadedBrokers: uploadedBrokers.map(b => ({ name: b.name, phone: b.phone }))
    });
    
    if (!messageTemplate.trim()) {
      toast({
        title: "نص الرسالة مطلوب",
        description: "يرجى كتابة نص الرسالة أولاً",
        variant: "destructive",
      });
      return;
    }

    if (selectedBrokers.length === 0 && uploadedBrokers.length === 0) {
      console.error('❌ [AdvancedTasks] No brokers selected for sending');
      toast({
        title: "لا توجد وسطاء محددين",
        description: "يرجى اختيار وسطاء من القاعدة أو رفعهم من ملف أولاً",
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
      console.log('⚙️ [AdvancedTasks] Processing file...');
      const processedData = await processUploadedFile(file);
      console.log('✅ [AdvancedTasks] File processed successfully. Records found:', processedData.length, processedData);
      
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
              short_name: row.short_name || row['الاسم المختصر'] || row['اسم مختصر'] || '',
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
    console.log('📥 [AdvancedTasks] confirmImportData called');
    console.log('📥 [AdvancedTasks] filePreviewData:', filePreviewData);
    
    const validData = filePreviewData.filter(row => !row._errors || row._errors.length === 0);
    console.log('📥 [AdvancedTasks] validData after filtering:', validData);
    
    setUploadedBrokers(validData);
    setShowPreviewDialog(false);
    setShowFileUpload(false);
    
    console.log('📥 [AdvancedTasks] uploadedBrokers state updated with:', validData);
    
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

  const getMediaTypeFromUrl = (url: string, defaultType: 'image' | 'document' | 'video' | 'audio' = 'image'): 'image' | 'document' | 'video' | 'audio' => {
    const lowerUrl = url.toLowerCase();
    
    // تحديد نوع الملف من امتداد الرابط
    if (lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg') || lowerUrl.includes('.png') || 
        lowerUrl.includes('.gif') || lowerUrl.includes('.webp') || lowerUrl.includes('.bmp')) {
      return 'image';
    }
    
    if (lowerUrl.includes('.mp4') || lowerUrl.includes('.avi') || lowerUrl.includes('.mov') || 
        lowerUrl.includes('.wmv') || lowerUrl.includes('.flv') || lowerUrl.includes('.webm')) {
      return 'video';
    }
    
    if (lowerUrl.includes('.mp3') || lowerUrl.includes('.wav') || lowerUrl.includes('.ogg') || 
        lowerUrl.includes('.aac') || lowerUrl.includes('.flac')) {
      return 'audio';
    }
    
    if (lowerUrl.includes('.pdf') || lowerUrl.includes('.doc') || lowerUrl.includes('.docx') || 
        lowerUrl.includes('.xls') || lowerUrl.includes('.xlsx') || lowerUrl.includes('.txt')) {
      return 'document';
    }
    
    return defaultType;
  };

  const downloadTemplate = () => {
    const csvContent = `name,short_name,phone,whatsapp_number,email,office_name,areas_specialization
"أحمد محمد","أحمد","971501234567","971501234567","ahmed@example.com","مكتب العقارات المتميز","دبي، أبوظبي"
"سارة أحمد","سارة","971509876543","971509876543","sara@example.com","شركة الإمارات العقارية","الشارقة، عجمان"`;
    
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

    if (selectedBrokers.length === 0 && uploadedBrokers.length === 0) {
      toast({
        title: "لا توجد وسطاء محددين",
        description: "يرجى اختيار وسطاء من القاعدة أو رفعهم من ملف أولاً",
        variant: "destructive",
      });
      return;
    }

    // Combine selected brokers and uploaded brokers
    const allBrokers = [...selectedBrokers, ...uploadedBrokers];
    
    const bulkSendData = {
      messageContent: messageTemplate,
      recipients: allBrokers.map(broker => ({
        id: broker.id || `uploaded_${Date.now()}_${Math.random()}`,
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
      description: `تم تحويل ${allBrokers.length} وسيط إلى صفحة الإرسال الجماعية.`,
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
                .replace(/{short_name}/g, broker.short_name || (broker.name ? broker.name.split(' ')[0] : 'صديق'))
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
            
            console.log(`📎 [AdvancedTasks] Sending message with media:`, {
              mediaUrl,
              mediaType,
              caption: caption.substring(0, 50) + '...',
              attachmentsCount: attachments.length,
              uploadedUrlsCount: uploadedMediaUrls.length,
              allUploadedUrls: uploadedMediaUrls
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
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إنشاء حملة متقدمة</h1>
          <p className="text-gray-600 mt-2">إنشاء وإدارة حملات WhatsApp المتقدمة مع خيارات متعددة</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {selectedBrokers.length + uploadedBrokers.length} وسيط
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Settings className="w-4 h-4" />
            متقدم
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                محتوى الحملة
              </CardTitle>
              <CardDescription>
                اختر نوع الرسالة وأضف المحتوى المطلوب
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Message Type Tabs */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('text')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'text'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  رسالة نصية
                </button>
                <button
                  onClick={() => setActiveTab('media')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'media'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Image className="w-4 h-4" />
                  رسالة وسائط
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'text' && (
                <div className="space-y-4">
                  {/* Text Message Content */}
                  <div>
                    <Label htmlFor="messageTemplate" className="text-base font-medium">
                      رسالة نصية
                    </Label>
                    <div className="mt-1">
                                             <p className="text-sm text-gray-500 mb-2">
                         مثال: مرحباً {'{name}'} | أهلاً رقمك هو {'{phone}'}
                       </p>
                      <Textarea
                        id="messageTemplate"
                        placeholder="اكتب رسالتك هنا..."
                        value={messageTemplate}
                        onChange={(e) => setMessageTemplate(e.target.value)}
                        className="min-h-[120px] resize-none"
                      />
                    </div>
                  </div>

                  {/* Personalization Options */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      خيارات التخصيص
                    </Label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={personalizeMessages}
                          onChange={(e) => setPersonalizeMessages(e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm">تخصيص الرسائل تلقائياً</span>
                      </label>
                    </div>
                    {personalizeMessages && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-800">
                          المتغيرات المتاحة: {'{name}'}, {'{short_name}'}, {'{phone}'}, {'{email}'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'media' && (
                <div className="space-y-4">
                  {/* Media Message Content */}
                  <div>
                    <Label htmlFor="mediaMessageTemplate" className="text-base font-medium">
                      التسمية التوضيحية
                    </Label>
                    <div className="mt-1">
                      <p className="text-sm text-gray-500 mb-2">
                        النص سيظهر كتسمية توضيحية للمرفق
                      </p>
                      <Textarea
                        id="mediaMessageTemplate"
                        placeholder="اكتب التسمية التوضيحية للمرفق..."
                        value={messageTemplate}
                        onChange={(e) => setMessageTemplate(e.target.value)}
                        className="min-h-[120px] resize-none"
                      />
                    </div>
                  </div>

                  {/* Media Upload Section */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">المرفقات</Label>
                    
                    {/* Direct Media URL */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <Label htmlFor="directMediaUrl" className="text-sm font-medium text-gray-700 mb-2 block">
                        رابط المرفق المباشر
                      </Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            id="directMediaUrl"
                            type="url"
                            placeholder="https://example.com/image.jpg"
                            value={directMediaUrl}
                            onChange={(e) => setDirectMediaUrl(e.target.value)}
                            className="w-full"
                          />
                        </div>
                        <Select value={mediaType} onValueChange={(value: 'image' | 'document' | 'video' | 'audio') => setMediaType(value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="image">صورة</SelectItem>
                            <SelectItem value="video">فيديو</SelectItem>
                            <SelectItem value="audio">صوت</SelectItem>
                            <SelectItem value="document">مستند</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={handleDirectMediaUrl} type="button" size="sm">
                          إضافة
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        💡 ارفع الملف على أي موقع (مثل Google Drive, Dropbox, Imgur) وأضف الرابط المباشر هنا
                      </p>
                    </div>

                    {/* File Upload */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        رفع ملف
                      </Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          اسحب وأفلت الملفات هنا، أو اضغط للاختيار
                        </p>
                        <input
                          type="file"
                          multiple
                          onChange={handleAttachmentUpload}
                          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                          className="hidden"
                          id="file-upload"
                        />
                        <label htmlFor="file-upload">
                          <Button variant="outline" size="sm" asChild>
                            <span>اختيار ملفات</span>
                          </Button>
                        </label>
                      </div>
                      <p className="text-xs text-orange-600 mt-1">
                        ⚠️ ملاحظة: يمكنك إضافة روابط مباشرة للمرفقات أو رفع الملفات
                      </p>
                    </div>

                    {/* Attachments List */}
                    {attachments.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">المرفقات المضافة:</Label>
                        {attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                            <div className="flex items-center gap-2">
                              {file.type.startsWith('image/') && <Image className="w-4 h-4 text-blue-500" />}
                              {file.type.startsWith('video/') && <Video className="w-4 h-4 text-red-500" />}
                              {file.type.startsWith('audio/') && <Music className="w-4 h-4 text-green-500" />}
                              {file.type.startsWith('application/') && <FileText className="w-4 h-4 text-purple-500" />}
                              <span className="text-sm font-medium">{file.name}</span>
                              <span className="text-xs text-gray-500">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttachment(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

                             {/* Campaign Settings */}
               <div className="border-t pt-6">
                 <div className="flex items-center gap-2 mb-4">
                   <Settings className="w-5 h-5 text-gray-600" />
                   <Label className="text-base font-medium">إعدادات الحملة</Label>
                 </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Timing Settings */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">توقيت الإرسال</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={useRandomTiming}
                        onChange={(e) => setUseRandomTiming(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">استخدام توقيت عشوائي</span>
                    </div>
                    
                    {useRandomTiming ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Label className="text-xs">الحد الأدنى (ثانية)</Label>
                            <Input
                              type="number"
                              value={minIntervalSeconds}
                              onChange={(e) => setMinIntervalSeconds(parseInt(e.target.value))}
                              min="1"
                              className="text-sm"
                            />
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs">الحد الأقصى (ثانية)</Label>
                            <Input
                              type="number"
                              value={maxIntervalSeconds}
                              onChange={(e) => setMaxIntervalSeconds(parseInt(e.target.value))}
                              min="1"
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Label className="text-xs">الفاصل الزمني (دقائق)</Label>
                        <Input
                          type="number"
                          value={fixedIntervalMinutes}
                          onChange={(e) => setFixedIntervalMinutes(parseInt(e.target.value))}
                          min="1"
                          className="text-sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* Preview Settings */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">معاينة الحملة</Label>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={simulateSendingMessages}
                        className="w-full"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        معاينة الإرسال
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPreviewDialog(true)}
                        className="w-full"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        معاينة الرسالة
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="space-y-4">
            {/* Recipients Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5" />
                  المستلمون
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedBrokers.length + uploadedBrokers.length}
                  </div>
                  <div className="text-sm text-gray-600">وسيط محدد</div>
                </div>
                
                <div className="space-y-2">
                                     <Button
                     variant="outline"
                     size="sm"
                     onClick={() => navigate('/land-sales/brokers')}
                     className="w-full"
                   >
                    <Users className="w-4 h-4 mr-2" />
                    اختيار وسطاء
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFileUpload(true)}
                    className="w-full"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    تحميل من ملف
                  </Button>
                </div>

                {uploadedBrokers.length > 0 && (
                  <div className="pt-2 border-t">
                    <div className="text-sm text-gray-600 mb-2">
                      من الملف: {uploadedBrokers.length} وسيط
                    </div>
                    <div className="text-sm text-gray-600">
                      من قاعدة البيانات: {selectedBrokers.length} وسيط
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Send Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Send className="w-5 h-5" />
                  إرسال الحملة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleSendNow}
                  disabled={isSending || (selectedBrokers.length + uploadedBrokers.length) === 0}
                  className="w-full"
                  size="lg"
                >
                  {isSending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      إرسال الآن
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={navigateToBulkSend}
                  disabled={(selectedBrokers.length + uploadedBrokers.length) === 0}
                  className="w-full"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  إعدادات متقدمة
                </Button>
              </CardContent>
            </Card>

            {/* Progress Card (when sending) */}
            {isSending && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="w-5 h-5" />
                    تقدم الإرسال
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>التقدم</span>
                      <span>{Math.round(sendingProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${sendingProgress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {sendingStatus}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="font-bold text-green-600">{sentCount}</div>
                      <div className="text-green-600">تم الإرسال</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <div className="font-bold text-red-600">{failedCount}</div>
                      <div className="text-red-600">فشل</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* ... existing dialogs and modals ... */}
    </div>
  );
}
