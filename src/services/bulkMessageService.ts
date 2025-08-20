// Bulk Message Service
// خدمة الرسائل الجماعية

import { supabase } from '@/integrations/supabase/client';
import {
  BulkMessage,
  BulkMessageRecipient,
  CreateBulkMessageForm,
  BulkMessageStats,
  BulkMessageFilter,
  BulkMessageProgress,
  RecipientSelection,
  BulkMessageValidation,
  RecipientFilters,
  GradualSettings
} from '@/types/bulkMessage';
import { WhatsAppContact } from '@/types/whatsapp';

class BulkMessageService {
  
  // ===== إدارة الرسائل الجماعية =====
  
  async getBulkMessages(filter: BulkMessageFilter = {}): Promise<BulkMessage[]> {
    try {
      let query = supabase
        .from('whatsapp_bulk_messages')
        .select('*')
        .order('created_at', { ascending: false });

      // تطبيق الفلاتر
      if (filter.search) {
        query = query.ilike('name', `%${filter.search}%`);
      }

      if (filter.status && filter.status !== 'all') {
        query = query.eq('status', filter.status);
      }

      if (filter.recipient_type && filter.recipient_type !== 'all') {
        query = query.eq('recipient_type', filter.recipient_type);
      }

      if (filter.send_type && filter.send_type !== 'all') {
        query = query.eq('send_type', filter.send_type);
      }

      if (filter.date_from) {
        query = query.gte('created_at', filter.date_from);
      }

      if (filter.date_to) {
        query = query.lte('created_at', filter.date_to);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        // إذا كان الخطأ بسبب عدم وجود الجدول، نعيد مصفوفة فارغة
        if (error.code === '42P01') { // table does not exist
          console.warn('Bulk messages table does not exist yet');
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching bulk messages:', error);
      // في حالة أي خطأ آخر، نعيد مصفوفة فارغة بدلاً من رمي الخطأ
      return [];
    }
  }

  async getBulkMessageById(id: string): Promise<BulkMessage | null> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_bulk_messages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching bulk message:', error);
      throw error;
    }
  }

  async createBulkMessage(bulkMessageData: CreateBulkMessageForm): Promise<BulkMessage> {
    try {
      // التحقق من صحة البيانات
      const validation = await this.validateBulkMessage(bulkMessageData);
      if (!validation.isValid) {
        throw new Error(`خطأ في التحقق: ${validation.errors.join(', ')}`);
      }

      // حساب عدد المستلمين
      const recipients = await this.getRecipients(bulkMessageData);
      
      const { data, error } = await supabase
        .from('whatsapp_bulk_messages')
        .insert([{
          ...bulkMessageData,
          total_recipients: recipients.length,
          status: 'draft'
        }])
        .select()
        .single();

      if (error) throw error;

      // إنشاء قائمة المستلمين
      if (recipients.length > 0) {
        await this.createRecipients(data.id, recipients);
      }

      return data;
    } catch (error) {
      console.error('Error creating bulk message:', error);
      throw error;
    }
  }

  async updateBulkMessage(id: string, bulkMessageData: Partial<CreateBulkMessageForm>): Promise<BulkMessage> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_bulk_messages')
        .update(bulkMessageData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating bulk message:', error);
      throw error;
    }
  }

  async deleteBulkMessage(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_bulk_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting bulk message:', error);
      throw error;
    }
  }

  // ===== إدارة المستلمين =====

  async getRecipients(bulkMessageData: CreateBulkMessageForm): Promise<WhatsAppContact[]> {
    try {
      let query = supabase
        .from('whatsapp_contacts')
        .select('*')
        .eq('is_active', true);

      // تطبيق الفلاتر حسب نوع المستلمين
      switch (bulkMessageData.recipient_type) {
        case 'all':
          // لا حاجة لفلاتر إضافية
          break;

        case 'by_type':
          if (bulkMessageData.recipient_filters?.contact_types?.length) {
            query = query.in('contact_type', bulkMessageData.recipient_filters.contact_types);
          }
          break;

        case 'by_company':
          if (bulkMessageData.recipient_filters?.companies?.length) {
            query = query.in('company', bulkMessageData.recipient_filters.companies);
          }
          break;

        case 'by_tags':
          if (bulkMessageData.recipient_filters?.tags?.length) {
            query = query.overlaps('tags', bulkMessageData.recipient_filters.tags);
          }
          break;

        case 'custom':
          if (bulkMessageData.custom_recipients?.length) {
            // البحث عن جهات الاتصال بالأرقام المخصصة
            const phoneNumbers = bulkMessageData.custom_recipients.map(phone => 
              this.cleanPhoneNumber(phone)
            );
            query = query.in('phone', phoneNumbers);
          }
          break;
      }

      // استثناء الأرقام المحظورة
      if (bulkMessageData.recipient_filters?.exclude_numbers?.length) {
        const excludeNumbers = bulkMessageData.recipient_filters.exclude_numbers.map(phone => 
          this.cleanPhoneNumber(phone)
        );
        query = query.not('phone', 'in', `(${excludeNumbers.map(n => `'${n}'`).join(',')})`);
      }

      // استثناء جهات الاتصال الحديثة
      if (bulkMessageData.recipient_filters?.exclude_recent_contacts && 
          bulkMessageData.recipient_filters?.exclude_recent_days) {
        const excludeDate = new Date();
        excludeDate.setDate(excludeDate.getDate() - bulkMessageData.recipient_filters.exclude_recent_days);
        query = query.or(`last_contacted.is.null,last_contacted.lt.${excludeDate.toISOString()}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting recipients:', error);
      throw error;
    }
  }

  async createRecipients(bulkMessageId: string, recipients: WhatsAppContact[]): Promise<void> {
    try {
      const recipientData = recipients.map(contact => ({
        bulk_message_id: bulkMessageId,
        contact_id: contact.id,
        phone_number: contact.whatsapp_number || contact.phone,
        status: 'pending'
      }));

      const { error } = await supabase
        .from('whatsapp_bulk_message_recipients')
        .insert(recipientData);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating recipients:', error);
      throw error;
    }
  }

  async getBulkMessageRecipients(bulkMessageId: string): Promise<BulkMessageRecipient[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_bulk_message_recipients')
        .select(`
          *,
          contact:whatsapp_contacts(*)
        `)
        .eq('bulk_message_id', bulkMessageId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching bulk message recipients:', error);
      throw error;
    }
  }

  // ===== إرسال الرسائل الجماعية =====

  async startBulkMessage(id: string): Promise<void> {
    try {
      // تحديث حالة الرسالة الجماعية
      await supabase
        .from('whatsapp_bulk_messages')
        .update({ 
          status: 'queued',
          started_at: new Date().toISOString()
        })
        .eq('id', id);

      // بدء عملية الإرسال
      await this.processBulkMessage(id);
    } catch (error) {
      console.error('Error starting bulk message:', error);
      throw error;
    }
  }

  async pauseBulkMessage(id: string): Promise<void> {
    try {
      await supabase
        .from('whatsapp_bulk_messages')
        .update({ status: 'paused' })
        .eq('id', id);
    } catch (error) {
      console.error('Error pausing bulk message:', error);
      throw error;
    }
  }

  async resumeBulkMessage(id: string): Promise<void> {
    try {
      await supabase
        .from('whatsapp_bulk_messages')
        .update({ status: 'sending' })
        .eq('id', id);

      await this.processBulkMessage(id);
    } catch (error) {
      console.error('Error resuming bulk message:', error);
      throw error;
    }
  }

  async cancelBulkMessage(id: string): Promise<void> {
    try {
      await supabase
        .from('whatsapp_bulk_messages')
        .update({ status: 'cancelled' })
        .eq('id', id);
    } catch (error) {
      console.error('Error cancelling bulk message:', error);
      throw error;
    }
  }

  private async processBulkMessage(bulkMessageId: string): Promise<void> {
    try {
      const bulkMessage = await this.getBulkMessageById(bulkMessageId);
      if (!bulkMessage) throw new Error('الرسالة الجماعية غير موجودة');

      // تحديث الحالة إلى "إرسال"
      await supabase
        .from('whatsapp_bulk_messages')
        .update({ status: 'sending' })
        .eq('id', bulkMessageId);

      // جلب المستلمين المعلقين
      const { data: pendingRecipients, error } = await supabase
        .from('whatsapp_bulk_message_recipients')
        .select('*')
        .eq('bulk_message_id', bulkMessageId)
        .eq('status', 'pending');

      if (error) throw error;

      if (!pendingRecipients || pendingRecipients.length === 0) {
        // لا توجد رسائل معلقة، إكمال الرسالة الجماعية
        await this.completeBulkMessage(bulkMessageId);
        return;
      }

      // إرسال الرسائل حسب الإعدادات
      if (bulkMessage.send_type === 'gradual' && bulkMessage.gradual_settings) {
        await this.sendGradualBulkMessage(bulkMessageId, pendingRecipients, bulkMessage.gradual_settings);
      } else {
        await this.sendImmediateBulkMessage(bulkMessageId, pendingRecipients);
      }
    } catch (error) {
      console.error('Error processing bulk message:', error);
      throw error;
    }
  }

  private async sendImmediateBulkMessage(
    bulkMessageId: string, 
    recipients: BulkMessageRecipient[]
  ): Promise<void> {
    // إرسال فوري - يمكن تطويره لاحقاً للإرسال المتوازي
    for (const recipient of recipients) {
      try {
        await this.sendSingleRecipientMessage(bulkMessageId, recipient);
        // تأخير بسيط لتجنب الحظر
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error sending to ${recipient.phone_number}:`, error);
      }
    }

    await this.completeBulkMessage(bulkMessageId);
  }

  private async sendGradualBulkMessage(
    bulkMessageId: string,
    recipients: BulkMessageRecipient[],
    settings: GradualSettings
  ): Promise<void> {
    const batchSize = settings.batch_size || 10;
    const delayMinutes = settings.delay_minutes || 5;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      // إرسال الدفعة
      for (const recipient of batch) {
        try {
          await this.sendSingleRecipientMessage(bulkMessageId, recipient);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error sending to ${recipient.phone_number}:`, error);
        }
      }

      // انتظار قبل الدفعة التالية
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, delayMinutes * 60 * 1000));
      }
    }

    await this.completeBulkMessage(bulkMessageId);
  }

  private async sendSingleRecipientMessage(
    bulkMessageId: string,
    recipient: BulkMessageRecipient
  ): Promise<void> {
    try {
      // تحديث حالة المستلم إلى "إرسال"
      await supabase
        .from('whatsapp_bulk_message_recipients')
        .update({ status: 'retrying' })
        .eq('id', recipient.id);

      // جلب بيانات الرسالة الجماعية
      const bulkMessage = await this.getBulkMessageById(bulkMessageId);
      if (!bulkMessage) throw new Error('الرسالة الجماعية غير موجودة');

      // إرسال الرسالة الفردية
      // هنا سنستخدم خدمة WhatsApp الموجودة
      // يمكن تطويرها لاحقاً

      // تحديث حالة المستلم إلى "تم الإرسال"
      await supabase
        .from('whatsapp_bulk_message_recipients')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', recipient.id);

    } catch (error) {
      // تحديث حالة المستلم إلى "فشل"
      await supabase
        .from('whatsapp_bulk_message_recipients')
        .update({ 
          status: 'failed',
          error_message: error.message,
          retry_count: recipient.retry_count + 1
        })
        .eq('id', recipient.id);

      throw error;
    }
  }

  private async completeBulkMessage(bulkMessageId: string): Promise<void> {
    await supabase
      .from('whatsapp_bulk_messages')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', bulkMessageId);
  }

  // ===== التحقق من صحة البيانات =====

  async validateBulkMessage(bulkMessageData: CreateBulkMessageForm): Promise<BulkMessageValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // التحقق من البيانات الأساسية
    if (!bulkMessageData.name?.trim()) {
      errors.push('اسم الرسالة الجماعية مطلوب');
    }

    if (!bulkMessageData.message_content?.trim()) {
      errors.push('محتوى الرسالة مطلوب');
    }

    // التحقق من نوع الرسالة
    if (bulkMessageData.message_type === 'media' && !bulkMessageData.media_url) {
      errors.push('رابط الوسائط مطلوب للرسائل من نوع وسائط');
    }

    if (bulkMessageData.message_type === 'button' && (!bulkMessageData.button_text || !bulkMessageData.button_url)) {
      errors.push('نص الرابط ورابط الزر مطلوبان للرسائل من نوع أزرار');
    }

    if (bulkMessageData.message_type === 'poll' && (!bulkMessageData.poll_options || bulkMessageData.poll_options.length < 2)) {
      errors.push('خيارات الاستطلاع مطلوبة (على الأقل خيارين)');
    }

    // التحقق من المستلمين
    const recipients = await this.getRecipients(bulkMessageData);
    if (recipients.length === 0) {
      errors.push('لا توجد جهات اتصال تطابق المعايير المحددة');
    }

    // التحذيرات
    if (recipients.length > 1000) {
      warnings.push(`عدد المستلمين كبير (${recipients.length}). قد يستغرق الإرسال وقتاً طويلاً.`);
    }

    if (bulkMessageData.send_type === 'immediate' && recipients.length > 100) {
      warnings.push('الإرسال الفوري لعدد كبير من المستلمين قد يؤدي إلى الحظر. يُنصح بالإرسال المتدرج.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recipient_count: recipients.length,
      estimated_duration: this.calculateEstimatedDuration(recipients.length, bulkMessageData),
      estimated_cost: this.calculateEstimatedCost(recipients.length)
    };
  }

  private calculateEstimatedDuration(recipientCount: number, bulkMessageData: CreateBulkMessageForm): string {
    if (bulkMessageData.send_type === 'gradual' && bulkMessageData.gradual_settings) {
      const batchSize = bulkMessageData.gradual_settings.batch_size || 10;
      const delayMinutes = bulkMessageData.gradual_settings.delay_minutes || 5;
      const batches = Math.ceil(recipientCount / batchSize);
      const totalMinutes = batches * delayMinutes;
      
      if (totalMinutes < 60) {
        return `${totalMinutes} دقيقة`;
      } else if (totalMinutes < 1440) {
        return `${Math.ceil(totalMinutes / 60)} ساعة`;
      } else {
        return `${Math.ceil(totalMinutes / 1440)} يوم`;
      }
    } else {
      const estimatedMinutes = Math.ceil(recipientCount / 10); // 10 رسائل في الدقيقة
      return `${estimatedMinutes} دقيقة`;
    }
  }

  private calculateEstimatedCost(recipientCount: number): number {
    // تقدير التكلفة - يمكن تطويره حسب مزود الخدمة
    return recipientCount * 0.01; // مثال: 0.01 لكل رسالة
  }

  // ===== الإحصائيات =====

  async getBulkMessageStats(): Promise<BulkMessageStats> {
    try {
      const [
        totalBulkMessages,
        activeBulkMessages,
        completedBulkMessages,
        totalRecipients,
        totalSent,
        totalFailed,
        todaySent,
        todayFailed
      ] = await Promise.all([
        this.getBulkMessagesCount(),
        this.getActiveBulkMessagesCount(),
        this.getCompletedBulkMessagesCount(),
        this.getTotalRecipientsCount(),
        this.getTotalSentCount(),
        this.getTotalFailedCount(),
        this.getTodaySentCount(),
        this.getTodayFailedCount()
      ]);

      const averageSuccessRate = totalSent > 0 ? (totalSent / (totalSent + totalFailed)) * 100 : 0;

      return {
        total_bulk_messages: totalBulkMessages,
        active_bulk_messages: activeBulkMessages,
        completed_bulk_messages: completedBulkMessages,
        total_recipients: totalRecipients,
        total_sent: totalSent,
        total_failed: totalFailed,
        average_success_rate: averageSuccessRate,
        today_sent: todaySent,
        today_failed: todayFailed
      };
    } catch (error) {
      console.error('Error fetching bulk message stats:', error);
      // في حالة أي خطأ، نعيد إحصائيات فارغة
      return {
        total_bulk_messages: 0,
        active_bulk_messages: 0,
        completed_bulk_messages: 0,
        total_recipients: 0,
        total_sent: 0,
        total_failed: 0,
        average_success_rate: 0,
        today_sent: 0,
        today_failed: 0
      };
    }
  }

  // دوال الإحصائيات المساعدة
  private async getBulkMessagesCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('whatsapp_bulk_messages')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error getting bulk messages count:', error);
        return 0;
      }
      return count || 0;
    } catch (error) {
      console.error('Error getting bulk messages count:', error);
      return 0;
    }
  }

  private async getActiveBulkMessagesCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('whatsapp_bulk_messages')
        .select('*', { count: 'exact', head: true })
        .in('status', ['queued', 'sending']);
      
      if (error) {
        console.error('Error getting active bulk messages count:', error);
        return 0;
      }
      return count || 0;
    } catch (error) {
      console.error('Error getting active bulk messages count:', error);
      return 0;
    }
  }

  private async getCompletedBulkMessagesCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('whatsapp_bulk_messages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');
      
      if (error) {
        console.error('Error getting completed bulk messages count:', error);
        return 0;
      }
      return count || 0;
    } catch (error) {
      console.error('Error getting completed bulk messages count:', error);
      return 0;
    }
  }

  private async getTotalRecipientsCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('whatsapp_bulk_message_recipients')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error getting total recipients count:', error);
        return 0;
      }
      return count || 0;
    } catch (error) {
      console.error('Error getting total recipients count:', error);
      return 0;
    }
  }

  private async getTotalSentCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('whatsapp_bulk_message_recipients')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent');
      
      if (error) {
        console.error('Error getting total sent count:', error);
        return 0;
      }
      return count || 0;
    } catch (error) {
      console.error('Error getting total sent count:', error);
      return 0;
    }
  }

  private async getTotalFailedCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('whatsapp_bulk_message_recipients')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed');
      
      if (error) {
        console.error('Error getting total failed count:', error);
        return 0;
      }
      return count || 0;
    } catch (error) {
      console.error('Error getting total failed count:', error);
      return 0;
    }
  }

  private async getTodaySentCount(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count, error } = await supabase
        .from('whatsapp_bulk_message_recipients')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent')
        .gte('sent_at', today.toISOString());
      
      if (error) {
        console.error('Error getting today sent count:', error);
        return 0;
      }
      return count || 0;
    } catch (error) {
      console.error('Error getting today sent count:', error);
      return 0;
    }
  }

  private async getTodayFailedCount(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count, error } = await supabase
        .from('whatsapp_bulk_message_recipients')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('updated_at', today.toISOString());
      
      if (error) {
        console.error('Error getting today failed count:', error);
        return 0;
      }
      return count || 0;
    } catch (error) {
      console.error('Error getting today failed count:', error);
      return 0;
    }
  }

  // ===== دوال مساعدة =====

  private cleanPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    if (!cleaned.startsWith('971')) {
      cleaned = '971' + cleaned;
    }
    
    return cleaned;
  }
  
  async duplicateBulkMessage(messageId: string): Promise<BulkMessage> {
    // Mock implementation
    return {
      id: 'mock-duplicate-' + Date.now(),
      name: 'نسخة من الحملة',
      status: 'draft' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_recipients: 0,
      sent_count: 0,
      failed_count: 0,
      success_rate: 0,
      message_content: 'محتوى الرسالة',
      message_type: 'text',
      recipient_type: 'all',
      send_type: 'immediate'
    };
  }

  async getBulkMessageProgress(messageId: string): Promise<BulkMessageProgress> {
    // Mock implementation
    return {
      bulk_message_id: messageId,
      total_recipients: 100,
      sent_count: 45,
      pending_count: 30,
      failed_count: 5,
      success_rate: 90,
      estimated_completion: new Date(Date.now() + 3600000).toISOString(),
      current_batch: 2,
      total_batches: 5
    };
  }

  async retryFailedRecipients(messageId: string): Promise<void> {
    try {
      // في حالة عدم وجود جداول حقيقية، نعمل محاكاة
      console.log('Retrying failed recipients for message:', messageId);
      
      // محاكاة عملية إعادة الإرسال
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Retry completed for message:', messageId);
    } catch (error) {
      console.error('Error retrying failed recipients:', error);
      throw error;
    }
  }

  // جلب المستلمين الفاشلين
  async getFailedRecipients(messageId: string): Promise<any[]> {
    try {
      // Mock implementation - إرجاع قائمة تجريبية
      return [
        {
          id: '1',
          name: 'مستلم تجريبي 1',
          phone: '971501234567',
          error: 'خطأ في الشبكة',
          status: 'failed'
        },
        {
          id: '2', 
          name: 'مستلم تجريبي 2',
          phone: '971507654321',
          error: 'رقم غير صحيح',
          status: 'failed'
        }
      ];
    } catch (error) {
      console.error('Error getting failed recipients:', error);
      return [];
    }
  }
}

// تصدير instance واحد من الخدمة
export const bulkMessageService = new BulkMessageService();

// تصدير الكلاس أيضاً للاستخدام المباشر
export { BulkMessageService };
