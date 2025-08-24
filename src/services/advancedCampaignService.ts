// Advanced Campaign Service
// خدمة إدارة الحملات المتقدمة

import { whatsappService } from './whatsappService';
import { AdvancedSendingConfig } from '@/components/whatsapp/AdvancedSendingSettings';
import { SendingMessage, SendingStats } from '@/components/whatsapp/LiveSendingScreen';
import { CampaignReportData } from '@/components/whatsapp/CampaignReport';

export interface AdvancedCampaign {
  id: string;
  name: string;
  description: string;
  type: 'text' | 'media' | 'sticker';
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  
  // الرسائل والمستلمين
  messages: any[];
  recipients: any[];
  
  // الإعدادات المتقدمة
  config: AdvancedSendingConfig;
  
  // إحصائيات الحملة
  stats: SendingStats;
  
  // الأوقات
  createdAt: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  
  // بيانات الإرسال
  sendingMessages: SendingMessage[];
  
  // معرف القالب المستخدم
  templateId?: string;
}

export interface CampaignProgress {
  campaignId: string;
  currentMessage: number;
  totalMessages: number;
  successCount: number;
  failureCount: number;
  isRunning: boolean;
  isPaused: boolean;
  currentBatch: number;
  nextMessageTime?: string;
  pauseUntil?: string;
}

class AdvancedCampaignService {
  private campaigns: Map<string, AdvancedCampaign> = new Map();
  private runningCampaigns: Map<string, CampaignProgress> = new Map();
  private campaignTimers: Map<string, NodeJS.Timeout> = new Map();

  // إنشاء حملة جديدة
  async createCampaign(
    name: string,
    type: 'text' | 'media' | 'sticker',
    messages: any[],
    recipients: any[],
    config: AdvancedSendingConfig,
    templateId?: string
  ): Promise<string> {
    const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const sendingMessages: SendingMessage[] = [];
    let messageIndex = 0;
    
    // إنشاء قائمة الرسائل للإرسال
    for (const recipient of recipients) {
      for (const message of messages) {
        sendingMessages.push({
          id: `msg_${messageIndex++}`,
          recipientName: recipient.name || 'غير محدد',
          recipientNumber: recipient.phone,
          content: this.processMessageContent(message, recipient),
          status: 'pending',
          retryCount: 0
        });
      }
    }

    const campaign: AdvancedCampaign = {
      id: campaignId,
      name,
      description: '',
      type,
      status: 'draft',
      messages,
      recipients,
      config,
      templateId,
      sendingMessages,
      stats: {
        totalMessages: sendingMessages.length,
        sentMessages: 0,
        failedMessages: 0,
        pendingMessages: sendingMessages.length,
        pausedMessages: 0,
        currentBatch: 1,
        totalBatches: Math.ceil(sendingMessages.length / (config.batchPause.messagesPerBatch || 50)),
        elapsedTime: 0,
        averageMessageTime: 0,
        successRate: 0,
        messagesPerMinute: 0
      },
      createdAt: new Date().toISOString()
    };

    this.campaigns.set(campaignId, campaign);
    return campaignId;
  }

  // بدء تشغيل الحملة
  async startCampaign(campaignId: string): Promise<boolean> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign || campaign.status !== 'draft') {
      throw new Error('الحملة غير موجودة أو لا يمكن تشغيلها');
    }

    // التحقق من أوقات الحظر
    if (this.isInDoNotDisturbWindow(campaign.config)) {
      throw new Error('لا يمكن بدء الحملة خلال أوقات الحظر');
    }

    // التحقق من السقف اليومي
    if (await this.isDailyCapReached(campaign.config)) {
      throw new Error('تم الوصول للسقف اليومي للرسائل');
    }

    campaign.status = 'running';
    campaign.startedAt = new Date().toISOString();
    
    const progress: CampaignProgress = {
      campaignId,
      currentMessage: 0,
      totalMessages: campaign.sendingMessages.length,
      successCount: 0,
      failureCount: 0,
      isRunning: true,
      isPaused: false,
      currentBatch: 1
    };

    this.runningCampaigns.set(campaignId, progress);
    
    // بدء معالجة الرسائل
    this.processNextMessage(campaignId);
    
    return true;
  }

  // إيقاف الحملة مؤقتاً
  async pauseCampaign(campaignId: string): Promise<boolean> {
    const campaign = this.campaigns.get(campaignId);
    const progress = this.runningCampaigns.get(campaignId);
    
    if (!campaign || !progress || !progress.isRunning) {
      return false;
    }

    progress.isPaused = true;
    campaign.status = 'paused';
    
    // إلغاء المؤقت الحالي
    const timer = this.campaignTimers.get(campaignId);
    if (timer) {
      clearTimeout(timer);
      this.campaignTimers.delete(campaignId);
    }

    return true;
  }

  // استئناف الحملة
  async resumeCampaign(campaignId: string): Promise<boolean> {
    const campaign = this.campaigns.get(campaignId);
    const progress = this.runningCampaigns.get(campaignId);
    
    if (!campaign || !progress || !progress.isPaused) {
      return false;
    }

    // التحقق من أوقات الحظر
    if (this.isInDoNotDisturbWindow(campaign.config)) {
      throw new Error('لا يمكن استئناف الحملة خلال أوقات الحظر');
    }

    progress.isPaused = false;
    campaign.status = 'running';
    
    // استئناف معالجة الرسائل
    this.processNextMessage(campaignId);
    
    return true;
  }

  // إيقاف الحملة نهائياً
  async stopCampaign(campaignId: string): Promise<boolean> {
    const campaign = this.campaigns.get(campaignId);
    const progress = this.runningCampaigns.get(campaignId);
    
    if (!campaign || !progress) {
      return false;
    }

    // إلغاء المؤقت
    const timer = this.campaignTimers.get(campaignId);
    if (timer) {
      clearTimeout(timer);
      this.campaignTimers.delete(campaignId);
    }

    // تحديث الحالة
    campaign.status = 'cancelled';
    campaign.completedAt = new Date().toISOString();
    
    // تحديث رسائل معلقة إلى ملغية
    campaign.sendingMessages.forEach(msg => {
      if (msg.status === 'pending') {
        msg.status = 'paused';
      }
    });

    this.runningCampaigns.delete(campaignId);
    this.campaignTimers.delete(campaignId);
    
    return true;
  }

  // معالجة الرسالة التالية
  private async processNextMessage(campaignId: string): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    const progress = this.runningCampaigns.get(campaignId);
    
    if (!campaign || !progress || progress.isPaused || !progress.isRunning) {
      return;
    }

    // التحقق من أوقات الحظر
    if (this.isInDoNotDisturbWindow(campaign.config)) {
      console.log('🌙 دخول وقت الحظر - إيقاف مؤقت للحملة');
      await this.pauseCampaign(campaignId);
      
      // جدولة الاستئناف بعد انتهاء وقت الحظر
      const resumeTime = this.getDoNotDisturbEndTime(campaign.config);
      const now = new Date();
      const delay = resumeTime.getTime() - now.getTime();
      
      if (delay > 0) {
        setTimeout(() => {
          this.resumeCampaign(campaignId);
        }, delay);
      }
      return;
    }

    // التحقق من السقف اليومي
    if (await this.isDailyCapReached(campaign.config)) {
      console.log('📊 تم الوصول للسقف اليومي - إيقاف الحملة');
      await this.pauseCampaign(campaignId);
      
      // جدولة الاستئناف في اليوم التالي
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const delay = tomorrow.getTime() - Date.now();
      setTimeout(() => {
        this.resumeCampaign(campaignId);
      }, delay);
      return;
    }

    // العثور على الرسالة التالية
    const nextMessage = campaign.sendingMessages.find(msg => msg.status === 'pending');
    
    if (!nextMessage) {
      // انتهت جميع الرسائل
      await this.completeCampaign(campaignId);
      return;
    }

    // التحقق من التوقف الدفعي
    if (this.shouldPauseBatch(campaign, progress)) {
      console.log('⏸️ توقف دفعي - إيقاف مؤقت');
      progress.isPaused = true;
      campaign.status = 'paused';
      
      const pauseDuration = campaign.config.batchPause.pauseDurationMinutes * 60 * 1000;
      progress.pauseUntil = new Date(Date.now() + pauseDuration).toISOString();
      
      setTimeout(() => {
        this.resumeCampaign(campaignId);
      }, pauseDuration);
      return;
    }

    // إرسال الرسالة
    await this.sendMessage(campaignId, nextMessage);
    
    // حساب التأخير للرسالة التالية
    const delay = this.calculateNextMessageDelay(campaign.config);
    
    // جدولة الرسالة التالية
    const timer = setTimeout(() => {
      this.processNextMessage(campaignId);
    }, delay);
    
    this.campaignTimers.set(campaignId, timer);
  }

  // إرسال رسالة واحدة
  private async sendMessage(campaignId: string, message: SendingMessage): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    const progress = this.runningCampaigns.get(campaignId);
    
    if (!campaign || !progress) return;

    try {
      // تحديث حالة الرسالة
      message.status = 'sending';
      
      // محاكاة خطأ إذا كان مفعلاً
      if (this.shouldSimulateError(campaign.config)) {
        throw new Error('خطأ محاكى: انقطاع الشبكة');
      }

      // إرسال الرسالة حسب النوع
      let result;
      switch (campaign.type) {
        case 'text':
          result = await whatsappService.sendWhatsAppMessage(
            message.recipientNumber,
            message.content
          );
          break;
        case 'sticker':
          // استخراج رابط الملصق من المحتوى
          const stickerUrl = this.extractStickerUrl(message.content);
          result = await whatsappService.sendStickerMessage(
            message.recipientNumber,
            stickerUrl
          );
          break;
        case 'media':
          // معالجة رسالة الوسائط
          result = await this.sendMediaMessage(message);
          break;
        default:
          throw new Error(`نوع الرسالة غير مدعوم: ${campaign.type}`);
      }

      if (result.success) {
        message.status = 'sent';
        message.sentAt = new Date().toISOString();
        progress.successCount++;
        campaign.stats.sentMessages++;
      } else {
        throw new Error(result.message || 'فشل في الإرسال');
      }

    } catch (error) {
      console.error('خطأ في إرسال الرسالة:', error);
      
      message.status = 'failed';
      message.failureReason = error instanceof Error ? error.message : 'خطأ غير محدد';
      message.retryCount++;
      
      progress.failureCount++;
      campaign.stats.failedMessages++;

      // إعادة الجدولة إذا كانت مفعلة
      if (campaign.config.autoRescheduling.enabled && 
          message.retryCount < campaign.config.autoRescheduling.maxRetryAttempts) {
        
        setTimeout(() => {
          message.status = 'pending';
          message.estimatedSendTime = new Date(
            Date.now() + (campaign.config.autoRescheduling.failedMessageRetryDelay * 60 * 1000)
          ).toISOString();
        }, campaign.config.autoRescheduling.failedMessageRetryDelay * 60 * 1000);
      }
    }

    // تحديث الإحصائيات
    progress.currentMessage++;
    campaign.stats.pendingMessages = campaign.sendingMessages.filter(m => m.status === 'pending').length;
    this.updateCampaignStats(campaign, progress);
  }

  // إكمال الحملة
  private async completeCampaign(campaignId: string): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    const progress = this.runningCampaigns.get(campaignId);
    
    if (!campaign || !progress) return;

    campaign.status = 'completed';
    campaign.completedAt = new Date().toISOString();
    progress.isRunning = false;

    // حساب الإحصائيات النهائية
    this.updateCampaignStats(campaign, progress);
    
    // تنظيف الذاكرة
    this.runningCampaigns.delete(campaignId);
    const timer = this.campaignTimers.get(campaignId);
    if (timer) {
      clearTimeout(timer);
      this.campaignTimers.delete(campaignId);
    }

    console.log(`✅ تم إكمال الحملة ${campaignId} بنجاح`);
  }

  // إعادة محاولة الرسائل الفاشلة
  async retryFailedMessages(campaignId: string, messageIds?: string[]): Promise<boolean> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return false;

    const messagesToRetry = messageIds 
      ? campaign.sendingMessages.filter(msg => messageIds.includes(msg.id) && msg.status === 'failed')
      : campaign.sendingMessages.filter(msg => msg.status === 'failed');

    messagesToRetry.forEach(msg => {
      msg.status = 'pending';
      msg.retryCount = 0;
      msg.failureReason = undefined;
    });

    // إعادة بدء الحملة إذا كانت متوقفة
    if (campaign.status === 'completed' || campaign.status === 'failed') {
      return this.startCampaign(campaignId);
    }

    return true;
  }

  // الحصول على تقرير الحملة
  async getCampaignReport(campaignId: string): Promise<CampaignReportData | null> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return null;

    const failedMessages = campaign.sendingMessages
      .filter(msg => msg.status === 'failed')
      .map(msg => ({
        id: msg.id,
        recipientName: msg.recipientName,
        recipientNumber: msg.recipientNumber,
        failureReason: msg.failureReason || 'غير محدد',
        failureTime: msg.sentAt || new Date().toISOString(),
        retryCount: msg.retryCount,
        canRetry: msg.retryCount < (campaign.config.autoRescheduling.maxRetryAttempts || 3)
      }));

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      campaignType: campaign.type,
      status: campaign.status as any,
      startTime: campaign.startedAt || campaign.createdAt,
      endTime: campaign.completedAt || new Date().toISOString(),
      duration: campaign.completedAt && campaign.startedAt 
        ? Math.floor((new Date(campaign.completedAt).getTime() - new Date(campaign.startedAt).getTime()) / 1000)
        : campaign.stats.elapsedTime,
      
      totalMessages: campaign.stats.totalMessages,
      sentMessages: campaign.stats.sentMessages,
      failedMessagesCount: campaign.stats.failedMessages,
      deliveredMessages: campaign.stats.sentMessages, // تقدير
      readMessages: Math.floor(campaign.stats.sentMessages * 0.8), // تقدير
      
      estimatedCost: campaign.stats.totalMessages * 0.05,
      actualCost: campaign.stats.sentMessages * 0.05,
      costPerMessage: 0.05,
      
      successRate: campaign.stats.successRate,
      deliveryRate: campaign.stats.sentMessages / campaign.stats.totalMessages * 100,
      readRate: 80, // تقدير
      averageResponseTime: campaign.stats.averageMessageTime,
      
      recipientStats: {
        totalRecipients: campaign.recipients.length,
        successfulRecipients: new Set(campaign.sendingMessages.filter(m => m.status === 'sent').map(m => m.recipientNumber)).size,
        failedRecipients: new Set(campaign.sendingMessages.filter(m => m.status === 'failed').map(m => m.recipientNumber)).size,
        duplicateNumbers: 0,
        invalidNumbers: 0
      },
      
      errors: {
        networkErrors: failedMessages.filter(m => m.failureReason.includes('network') || m.failureReason.includes('شبكة')).length,
        apiErrors: failedMessages.filter(m => m.failureReason.includes('API')).length,
        rateLimitErrors: failedMessages.filter(m => m.failureReason.includes('rate limit')).length,
        invalidNumberErrors: failedMessages.filter(m => m.failureReason.includes('invalid')).length,
        otherErrors: failedMessages.filter(m => !m.failureReason.includes('network') && !m.failureReason.includes('API')).length
      },
      
      peakTimes: [],
      failedMessages: failedMessages
    };
  }

  // الحصول على حالة الحملة
  getCampaignProgress(campaignId: string): CampaignProgress | null {
    return this.runningCampaigns.get(campaignId) || null;
  }

  // الحصول على الحملة
  getCampaign(campaignId: string): AdvancedCampaign | null {
    return this.campaigns.get(campaignId) || null;
  }

  // قائمة جميع الحملات
  getAllCampaigns(): AdvancedCampaign[] {
    return Array.from(this.campaigns.values());
  }

  // دوال مساعدة خاصة
  private processMessageContent(message: any, recipient: any): string {
    let content = message.message || message.content || '';
    
    // استبدال المتغيرات
    const replacements: { [key: string]: string } = {
      name: recipient.name || 'العميل',
      company: recipient.company || '',
      phone: recipient.phone || '',
      email: recipient.email || ''
    };

    Object.entries(replacements).forEach(([key, value]) => {
      content = content.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });

    return content;
  }

  private isInDoNotDisturbWindow(config: AdvancedSendingConfig): boolean {
    if (!config.doNotDisturb.enabled) return false;
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return currentTime >= config.doNotDisturb.startTime && currentTime <= config.doNotDisturb.endTime;
  }

  private getDoNotDisturbEndTime(config: AdvancedSendingConfig): Date {
    const now = new Date();
    const [hours, minutes] = config.doNotDisturb.endTime.split(':').map(Number);
    const endTime = new Date(now);
    endTime.setHours(hours, minutes, 0, 0);
    
    if (endTime <= now) {
      endTime.setDate(endTime.getDate() + 1);
    }
    
    return endTime;
  }

  private async isDailyCapReached(config: AdvancedSendingConfig): Promise<boolean> {
    if (!config.dailyCap.enabled) return false;
    
    // هنا يجب فحص عدد الرسائل المرسلة اليوم من قاعدة البيانات
    // في الوقت الحالي نرجع false
    return false;
  }

  private shouldPauseBatch(campaign: AdvancedCampaign, progress: CampaignProgress): boolean {
    if (!campaign.config.batchPause.enabled) return false;
    
    const messagesInCurrentBatch = progress.currentMessage % campaign.config.batchPause.messagesPerBatch;
    return messagesInCurrentBatch === 0 && progress.currentMessage > 0;
  }

  private calculateNextMessageDelay(config: AdvancedSendingConfig): number {
    if (!config.messageInterval.enabled) return 1000; // افتراضي ثانية واحدة
    
    if (config.messageInterval.type === 'fixed') {
      return config.messageInterval.fixedSeconds * 1000;
    } else {
      const min = config.messageInterval.randomMin * 1000;
      const max = config.messageInterval.randomMax * 1000;
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
  }

  private shouldSimulateError(config: AdvancedSendingConfig): boolean {
    if (!config.errorSimulation.enabled) return false;
    
    return Math.random() * 100 < config.errorSimulation.errorRate;
  }

  private extractStickerUrl(content: string): string {
    // استخراج رابط الملصق من المحتوى
    // يمكن تحسين هذا لاحقاً
    return content;
  }

  private async sendMediaMessage(message: SendingMessage): Promise<any> {
    // معالجة رسالة الوسائط
    // يجب تنفيذ هذا حسب بنية الرسالة
    return { success: true, message: 'تم الإرسال' };
  }

  private updateCampaignStats(campaign: AdvancedCampaign, progress: CampaignProgress): void {
    const totalProcessed = progress.successCount + progress.failureCount;
    
    campaign.stats.successRate = totalProcessed > 0 
      ? (progress.successCount / totalProcessed) * 100 
      : 0;
    
    if (campaign.startedAt) {
      const elapsedMs = Date.now() - new Date(campaign.startedAt).getTime();
      campaign.stats.elapsedTime = Math.floor(elapsedMs / 1000);
      
      if (totalProcessed > 0) {
        campaign.stats.averageMessageTime = elapsedMs / totalProcessed / 1000;
        campaign.stats.messagesPerMinute = (totalProcessed / (elapsedMs / 1000)) * 60;
      }
    }
  }
}

export const advancedCampaignService = new AdvancedCampaignService();
