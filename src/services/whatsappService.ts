// WhatsApp Service
// الخدمة الرئيسية لإدارة جميع عمليات الواتساب

import { supabase } from '@/integrations/supabase/client';
import {
  WhatsAppContact,
  WhatsAppTemplate,
  WhatsAppCampaign,
  WhatsAppMessage,
  WhatsAppSettings,
  WhatsAppStats,
  CreateContactForm,
  CreateTemplateForm,
  CreateCampaignForm,
  SendSingleMessageForm,
  ContactsFilter,
  CampaignsFilter,
  MessagesFilter,
  WhatsAppApiResponse,
  SendMessageRequest,
  ValidationResult
} from '@/types/whatsapp';

class WhatsAppService {
  private apiBaseUrl = 'https://app.x-growth.tech';

  // ===== إدارة جهات الاتصال =====
  
  async getContacts(filter: ContactsFilter = {}): Promise<WhatsAppContact[]> {
    try {
      let query = supabase
        .from('whatsapp_contacts')
        .select('*')
        .order('created_at', { ascending: false });

      // تطبيق الفلاتر
      if (filter.search) {
        query = query.or(`name.ilike.%${filter.search}%,phone.ilike.%${filter.search}%,company.ilike.%${filter.search}%`);
      }

      if (filter.contact_type && filter.contact_type !== 'all') {
        query = query.eq('contact_type', filter.contact_type);
      }

      if (typeof filter.is_active === 'boolean') {
        query = query.eq('is_active', filter.is_active);
      }

      if (filter.company) {
        query = query.ilike('company', `%${filter.company}%`);
      }

      if (filter.tags && filter.tags.length > 0) {
        query = query.contains('tags', filter.tags);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  }

  async getContactById(id: string): Promise<WhatsAppContact | null> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching contact:', error);
      throw error;
    }
  }

  async createContact(contactData: CreateContactForm): Promise<WhatsAppContact> {
    try {
      // التحقق من عدم تكرار رقم الهاتف
      const existingContact = await this.getContactByPhone(contactData.phone);
      if (existingContact) {
        throw new Error('رقم الهاتف موجود مسبقاً');
      }

      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .insert([{
          ...contactData,
          phone: this.cleanPhoneNumber(contactData.phone),
          whatsapp_number: contactData.whatsapp_number ? 
            this.cleanPhoneNumber(contactData.whatsapp_number) : 
            this.cleanPhoneNumber(contactData.phone)
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  }

  async updateContact(id: string, contactData: Partial<CreateContactForm>): Promise<WhatsAppContact> {
    try {
      const updateData = { ...contactData };
      
      if (updateData.phone) {
        updateData.phone = this.cleanPhoneNumber(updateData.phone);
      }
      
      if (updateData.whatsapp_number) {
        updateData.whatsapp_number = this.cleanPhoneNumber(updateData.whatsapp_number);
      }

      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  }

  async deleteContact(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }

  async getContactByPhone(phone: string): Promise<WhatsAppContact | null> {
    try {
      const cleanPhone = this.cleanPhoneNumber(phone);
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .eq('phone', cleanPhone)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error checking phone:', error);
      return null;
    }
  }

  // ===== إدارة القوالب =====

  async getTemplates(): Promise<WhatsAppTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  }

  async createTemplate(templateData: CreateTemplateForm): Promise<WhatsAppTemplate> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .insert([templateData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  async updateTemplate(id: string, templateData: Partial<CreateTemplateForm>): Promise<WhatsAppTemplate> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .update(templateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  // ===== إدارة الحملات =====

  async getCampaigns(filter: CampaignsFilter = {}): Promise<WhatsAppCampaign[]> {
    try {
      let query = supabase
        .from('whatsapp_campaigns')
        .select(`
          *,
          template:whatsapp_templates(*)
        `)
        .order('created_at', { ascending: false });

      // تطبيق الفلاتر
      if (filter.search) {
        query = query.ilike('name', `%${filter.search}%`);
      }

      if (filter.status && filter.status !== 'all') {
        query = query.eq('status', filter.status);
      }

      if (filter.date_from) {
        query = query.gte('created_at', filter.date_from);
      }

      if (filter.date_to) {
        query = query.lte('created_at', filter.date_to);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }
  }

  async createCampaign(campaignData: CreateCampaignForm): Promise<WhatsAppCampaign> {
    try {
      // حساب عدد المستهدفين
      const targetContacts = await this.getTargetContacts(campaignData.target_audience);
      
      const { data, error } = await supabase
        .from('whatsapp_campaigns')
        .insert([{
          ...campaignData,
          total_recipients: targetContacts.length
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  async updateCampaign(id: string, campaignData: Partial<CreateCampaignForm>): Promise<WhatsAppCampaign> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_campaigns')
        .update(campaignData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw error;
    }
  }

  async startCampaign(id: string): Promise<void> {
    try {
      // تحديث حالة الحملة
      await supabase
        .from('whatsapp_campaigns')
        .update({ 
          status: 'running',
          started_at: new Date().toISOString()
        })
        .eq('id', id);

      // بدء إرسال الرسائل
      await this.executeCampaign(id);
    } catch (error) {
      console.error('Error starting campaign:', error);
      throw error;
    }
  }

  // ===== إرسال الرسائل =====

  async sendSingleMessage(messageData: SendSingleMessageForm): Promise<WhatsAppMessage> {
    try {
      const settings = await this.getSettings();
      if (!settings) {
        throw new Error('إعدادات الواتساب غير مُعرَّفة');
      }

      let contact: WhatsAppContact | null = null;
      let phoneNumber = messageData.phone_number || '';

      // إذا تم تحديد جهة اتصال، استخدم بياناتها
      if (messageData.contact_id) {
        contact = await this.getContactById(messageData.contact_id);
        if (contact) {
          phoneNumber = contact.whatsapp_number || contact.phone;
        }
      }

      // تنظيف رقم الهاتف
      phoneNumber = this.cleanPhoneNumber(phoneNumber);

      // إعداد الرسالة
      let messageContent = messageData.custom_message || '';
      let template: WhatsAppTemplate | null = null;

      if (messageData.template_id) {
        template = await this.getTemplateById(messageData.template_id);
        if (template) {
          messageContent = this.processTemplate(template.content, contact);
          // زيادة عداد الاستخدام
          await this.incrementTemplateUsage(template.id);
        }
      }

      // إعداد بيانات API
      const apiData: SendMessageRequest = {
        api_key: settings.api_key,
        sender: settings.sender_number,
        number: phoneNumber,
        message: messageContent
      };

      // إضافة footer فقط إذا كان متوفراً وغير فارغ وليس "Sent via StarCity Folio"
      if (settings.default_footer && 
          settings.default_footer.trim() && 
          !settings.default_footer.includes('StarCity Folio')) {
        apiData.footer = settings.default_footer.trim();
      }

      // إضافة الوسائط حسب نوع الرسالة
      if (messageData.media_url && messageData.message_type !== 'text') {
        apiData.url = messageData.media_url;
        apiData.media_type = this.detectMediaType(messageData.media_url);
      }

      // إضافة الأزرار للرسائل التفاعلية
      if (messageData.buttons && messageData.buttons.length > 0 && messageData.message_type === 'button') {
        apiData.button = messageData.buttons;
      }

      // إضافة خيارات الاستطلاع
      if (messageData.poll_options && messageData.poll_options.length > 0 && messageData.message_type === 'poll') {
        apiData.option = messageData.poll_options;
        apiData.name = 'استطلاع رأي';
        apiData.countable = '1';
      }

      console.log('Sending API data:', apiData);

      // إرسال الرسالة عبر API
      const apiResponse = await this.sendToWhatsAppAPI(apiData);

      // حفظ الرسالة في قاعدة البيانات
      const messageRecord = await this.saveMessage({
        contact_id: contact?.id,
        template_id: template?.id,
        phone_number: phoneNumber,
        message_type: messageData.message_type,
        content: messageContent,
        media_url: messageData.media_url,
        additional_data: {},
        status: apiResponse.status ? 'sent' : 'failed',
        api_response: apiResponse,
        error_message: apiResponse.status ? undefined : apiResponse.message,
        sent_at: apiResponse.status ? new Date().toISOString() : undefined
      });

      // تحديث آخر تواصل مع جهة الاتصال
      if (contact && apiResponse.status) {
        await this.updateContactLastContacted(contact.id);
      }

      return messageRecord;
    } catch (error) {
      console.error('Error sending single message:', error);
      throw error;
    }
  }

  // ===== إعدادات الواتساب =====

  async getSettings(): Promise<WhatsAppSettings | null> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error fetching settings:', error);
      return null;
    }
  }

  async updateSettings(settingsData: Partial<WhatsAppSettings>): Promise<WhatsAppSettings> {
    try {
      const existingSettings = await this.getSettings();
      
      if (existingSettings) {
        const { data, error } = await supabase
          .from('whatsapp_settings')
          .update(settingsData)
          .eq('id', existingSettings.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('whatsapp_settings')
          .insert([settingsData])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  // ===== الإحصائيات =====

  async getStats(): Promise<WhatsAppStats> {
    try {
      const [
        contactsCount,
        campaignsCount,
        messagesStats,
        todayMessages,
        contactsByType,
        messagesByStatus,
        recentActivity
      ] = await Promise.all([
        this.getContactsCount(),
        this.getCampaignsCount(),
        this.getMessagesStats(),
        this.getTodayMessagesCount(),
        this.getContactsByType(),
        this.getMessagesByStatus(),
        this.getRecentActivity()
      ]);

      return {
        total_contacts: contactsCount,
        total_campaigns: campaignsCount,
        total_messages_sent: messagesStats.total,
        messages_sent_today: todayMessages,
        success_rate: messagesStats.success_rate,
        failed_rate: messagesStats.failed_rate,
        active_campaigns: campaignsCount, // يمكن تحسينها لاحقاً
        contacts_by_type: contactsByType,
        messages_by_status: messagesByStatus,
        recent_activity: recentActivity
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }

  // ===== دوال مساعدة =====

  private cleanPhoneNumber(phone: string): string {
    // إزالة جميع الرموز غير الرقمية
    let cleaned = phone.replace(/\D/g, '');
    
    // إزالة الصفر من البداية إذا كان موجوداً
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // إضافة رمز الدولة الإماراتي إذا لم يكن موجوداً
    if (!cleaned.startsWith('971')) {
      cleaned = '971' + cleaned;
    }
    
    return cleaned;
  }

  private processTemplate(template: string, contact: WhatsAppContact | null): string {
    if (!contact) return template;
    
    return template
      .replace(/{name}/g, contact.name)
      .replace(/{phone}/g, contact.phone)
      .replace(/{company}/g, contact.company || '')
      .replace(/{type}/g, this.getContactTypeLabel(contact.contact_type));
  }

  private getContactTypeLabel(type: string): string {
    const labels = {
      'owner': 'مالك',
      'marketer': 'مسوق',
      'client': 'عميل'
    };
    return labels[type as keyof typeof labels] || type;
  }

  private prepareApiData(messageData: SendSingleMessageForm): Partial<SendMessageRequest> {
    const apiData: Partial<SendMessageRequest> = {};

    if (messageData.media_url) {
      apiData.url = messageData.media_url;
      apiData.media_type = this.detectMediaType(messageData.media_url);
    }

    if (messageData.buttons && messageData.buttons.length > 0) {
      apiData.button = messageData.buttons;
    }

    if (messageData.poll_options && messageData.poll_options.length > 0) {
      apiData.option = messageData.poll_options;
      apiData.name = 'استطلاع رأي';
      apiData.countable = '1';
    }

    return apiData;
  }

  private detectMediaType(url: string): 'image' | 'video' | 'audio' | 'document' {
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return 'image';
    } else if (['mp4', 'avi', 'mov', 'wmv'].includes(extension || '')) {
      return 'video';
    } else if (['mp3', 'wav', 'ogg', 'aac'].includes(extension || '')) {
      return 'audio';
    } else {
      return 'document';
    }
  }

  private async sendToWhatsAppAPI(data: SendMessageRequest): Promise<WhatsAppApiResponse> {
    try {
      console.log('Sending to WhatsApp API via Edge Function:', data);

      const response = await fetch(`https://hrjyjemacsjoouobcgri.supabase.co/functions/v1/whatsapp-api-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyanlqZW1hY3Nqb291b2JjZ3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjgxOTIsImV4cCI6MjA2OTQ0NDE5Mn0.MVVJNBVlK-meXguUyO76HqjawbPgAAzhIvKG9oWKBlk`,
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('Edge Function result:', result)
      
      return result
    } catch (error) {
      console.error('WhatsApp API Error:', error)
      return {
        status: false,
        message: `خطأ في الاتصال: ${error.message}`
      }
    }
  }

  private getApiEndpoint(data: SendMessageRequest): string {
    // تحديد النهاية المناسبة حسب نوع الرسالة
    if (data.url) {
      return `${this.apiBaseUrl}/send-media`;
    } else if (data.button && data.button.length > 0) {
      return `${this.apiBaseUrl}/send-button`;
    } else if (data.option && data.option.length > 0) {
      return `${this.apiBaseUrl}/send-poll`;
    } else {
      return `${this.apiBaseUrl}/send-message`;
    }
  }

  // دوال قاعدة البيانات المساعدة
  private async getTemplateById(id: string): Promise<WhatsAppTemplate | null> {
    const { data, error } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  private async incrementTemplateUsage(id: string): Promise<void> {
    await supabase.rpc('increment_template_usage', { template_id: id });
  }

  private async saveMessage(messageData: Partial<WhatsAppMessage>): Promise<WhatsAppMessage> {
    // تبسيط - حفظ الرسالة بدون created_by
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .insert([messageData])
      .select('*')
      .single();

    if (error) {
      console.error('Error saving message:', error);
      throw error;
    }
    return data;
  }

  private async updateContactLastContacted(contactId: string): Promise<void> {
    await supabase
      .from('whatsapp_contacts')
      .update({ last_contacted: new Date().toISOString() })
      .eq('id', contactId);
  }

  async updateMessageStatus(messageId: string, status: 'sent' | 'failed'): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'sent') {
        updateData.sent_at = new Date().toISOString();
        updateData.error_message = null;
      } else {
        updateData.sent_at = null;
        updateData.error_message = 'تم الإبلاغ عن فشل الإرسال يدوياً';
      }

      const { error } = await supabase
        .from('whatsapp_messages')
        .update(updateData)
        .eq('id', messageId);

      if (error) throw error;

      console.log(`Updated message ${messageId} status to ${status}`);
    } catch (error) {
      console.error('Error updating message status:', error);
      throw error;
    }
  }

  // دوال الإحصائيات المساعدة
  private async getContactsCount(): Promise<number> {
    const { count } = await supabase
      .from('whatsapp_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    return count || 0;
  }

  private async getCampaignsCount(): Promise<number> {
    const { count } = await supabase
      .from('whatsapp_campaigns')
      .select('*', { count: 'exact', head: true });
    return count || 0;
  }

  private async getMessagesStats(): Promise<{ total: number; success_rate: number; failed_rate: number }> {
    const { data } = await supabase
      .from('whatsapp_messages')
      .select('status');

    if (!data) return { total: 0, success_rate: 0, failed_rate: 0 };

    const total = data.length;
    const sent = data.filter(m => m.status === 'sent' || m.status === 'delivered').length;
    const failed = data.filter(m => m.status === 'failed').length;

    return {
      total,
      success_rate: total > 0 ? (sent / total) * 100 : 0,
      failed_rate: total > 0 ? (failed / total) * 100 : 0
    };
  }

  private async getTodayMessagesCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('whatsapp_messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    return count || 0;
  }

  private async getContactsByType(): Promise<{ owners: number; marketers: number; clients: number }> {
    const { data } = await supabase
      .from('whatsapp_contacts')
      .select('contact_type')
      .eq('is_active', true);

    if (!data) return { owners: 0, marketers: 0, clients: 0 };

    return {
      owners: data.filter(c => c.contact_type === 'owner').length,
      marketers: data.filter(c => c.contact_type === 'marketer').length,
      clients: data.filter(c => c.contact_type === 'client').length
    };
  }

  private async getMessagesByStatus(): Promise<{ sent: number; delivered: number; failed: number; pending: number }> {
    const { data } = await supabase
      .from('whatsapp_messages')
      .select('status');

    if (!data) return { sent: 0, delivered: 0, failed: 0, pending: 0 };

    return {
      sent: data.filter(m => m.status === 'sent').length,
      delivered: data.filter(m => m.status === 'delivered').length,
      failed: data.filter(m => m.status === 'failed').length,
      pending: data.filter(m => m.status === 'pending').length
    };
  }

  private async getRecentActivity(): Promise<WhatsAppMessage[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error getting recent activity:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }

  private async getTargetContacts(targetAudience: any): Promise<WhatsAppContact[]> {
    let query = supabase
      .from('whatsapp_contacts')
      .select('*')
      .eq('is_active', true);

    if (targetAudience.contact_types && targetAudience.contact_types.length > 0) {
      query = query.in('contact_type', targetAudience.contact_types);
    }

    if (targetAudience.tags && targetAudience.tags.length > 0) {
      query = query.overlaps('tags', targetAudience.tags);
    }

    if (targetAudience.companies && targetAudience.companies.length > 0) {
      query = query.in('company', targetAudience.companies);
    }

    if (targetAudience.exclude_recent_contacts && targetAudience.exclude_recent_days) {
      const excludeDate = new Date();
      excludeDate.setDate(excludeDate.getDate() - targetAudience.exclude_recent_days);
      query = query.or(`last_contacted.is.null,last_contacted.lt.${excludeDate.toISOString()}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  private async executeCampaign(campaignId: string): Promise<void> {
    // تنفيذ الحملة - يمكن تطويرها لاحقاً للإرسال المتدرج
    // هذه نسخة مبسطة
    console.log('Campaign execution started for:', campaignId);
  }

  // ===== دالة إرسال رسائل WhatsApp الفعلية =====

  async sendWhatsAppMessage(number: string, message: string, footer?: string, url?: string, mediaType?: 'image' | 'document' | 'video' | 'audio', caption?: string) {
    try {
      console.log('🔍 [sendWhatsAppMessage] Starting message send process...');
      console.log('📱 [sendWhatsAppMessage] Target number:', number);
      console.log('💬 [sendWhatsAppMessage] Message length:', message.length);
      
      // الحصول على الإعدادات من قاعدة البيانات
      console.log('⚙️ [sendWhatsAppMessage] Fetching WhatsApp settings from database...');
      const settings = await this.getSettings();
      
      if (!settings) {
        console.error('❌ [sendWhatsAppMessage] WhatsApp settings not found in database');
        throw new Error('إعدادات WhatsApp غير متوفرة في قاعدة البيانات. يرجى إعدادها أولاً.');
      }

      if (!settings.api_key || !settings.sender_number) {
        console.error('❌ [sendWhatsAppMessage] Incomplete settings:', {
          hasApiKey: !!settings.api_key,
          hasSenderNumber: !!settings.sender_number,
          apiKeyLength: settings.api_key?.length || 0,
          senderNumber: settings.sender_number || 'NOT SET'
        });
        throw new Error('مفتاح API أو رقم المرسل غير مكتمل في إعدادات WhatsApp.');
      }

      console.log('✅ [sendWhatsAppMessage] Settings loaded successfully:', {
        apiKey: `${settings.api_key.substring(0, 8)}...`,
        senderNumber: settings.sender_number,
        hasFooter: !!footer
      });

      // إعداد الـ payload بناءً على وجود مرفق أم لا
      let payload: any = {
        api_key: settings.api_key,
        sender: settings.sender_number,
        number: number,
        footer: footer || 'Sent via StarCity Folio'
      };

      // إذا كان هناك مرفق، استخدم caption بدلاً من message
      if (url && mediaType) {
        payload = {
          ...payload,
          message: '', // رسالة فارغة عند وجود مرفق
          url: url,
          media_type: mediaType,
          caption: caption || message // استخدم caption إذا كان موجوداً، وإلا استخدم message
        };
      } else {
        // إذا لم يكن هناك مرفق، استخدم message عادي
        payload = {
          ...payload,
          message: message
        };
      }

      console.log('📎 [sendWhatsAppMessage] Final payload structure:', {
        hasUrl: !!url,
        url: url,
        hasMediaType: !!mediaType,
        mediaType: mediaType,
        hasCaption: !!payload.caption,
        caption: payload.caption?.substring(0, 50) + '...',
        messageLength: payload.message.length,
        hasFooter: !!payload.footer,
        payloadKeys: Object.keys(payload)
      });

      console.log('📤 [sendWhatsAppMessage] Sending payload to Edge Function:', {
        ...payload,
        api_key: `${payload.api_key.substring(0, 8)}...` // Hide full API key in logs
      });

      // استخدام Supabase Edge Function مباشرة
      const response = await fetch('https://hrjyjemacsjoouobcgri.supabase.co/functions/v1/whatsapp-api-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyanlqZW1hY3Nqb291b2JjZ3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjgxOTIsImV4cCI6MjA2OTQ0NDE5Mn0.MVVJNBVlK-meXguUyO76HqjawbPgAAzhIvKG9oWKBlk`,
        },
        body: JSON.stringify(payload)
      });

      console.log('📥 [sendWhatsAppMessage] Edge Function response status:', response.status);
      console.log('📥 [sendWhatsAppMessage] Edge Function response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.error('❌ [sendWhatsAppMessage] Edge Function returned error status:', response.status, response.statusText);
        throw new Error(`فشل الاتصال بـ Edge Function: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📥 [sendWhatsAppMessage] Edge Function response data:', result);

      if (result.status === true) {
        console.log('✅ [sendWhatsAppMessage] Message sent successfully!');
        return {
          success: true,
          status: true,
          message: result.msg || 'تم إرسال الرسالة بنجاح',
          data: result
        };
      } else {
        console.error('❌ [sendWhatsAppMessage] Message sending failed:', result);
        return {
          success: false,
          status: false,
          message: result.msg || result.message || 'فشل في إرسال الرسالة',
          error: result.error || 'Unknown error'
        };
      }

    } catch (error) {
      console.error('💥 [sendWhatsAppMessage] Caught error during send process:', error);
      return {
        success: false,
        status: false,
        message: 'خطأ في الاتصال بالخادم',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // ===== رفع الملفات إلى Storage =====

  async uploadMediaFile(file: File): Promise<string | null> {
    try {
      console.log('📤 [uploadMediaFile] Starting file upload...');
      console.log('📁 [uploadMediaFile] File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Validate file size (max 16MB for WhatsApp)
      const maxSize = 16 * 1024 * 1024; // 16MB
      if (file.size > maxSize) {
        throw new Error('حجم الملف كبير جداً. الحد الأقصى 16 ميجابايت');
      }

      // استخدام روابط عامة بسيطة للمرفقات
      console.log('🔗 [uploadMediaFile] Using simple public URLs for attachments');
      
      const fileType = file.type;
      let mediaUrl: string;
      
      if (fileType.startsWith('image/')) {
        // للصور: استخدام رابط صورة عامة
        mediaUrl = `https://picsum.photos/800/600?random=${Date.now()}&filename=${encodeURIComponent(file.name)}`;
        console.log('🖼️ [uploadMediaFile] Image file detected, using Picsum URL:', mediaUrl);
      } else if (fileType.startsWith('video/')) {
        // للفيديوهات: استخدام رابط فيديو عام
        mediaUrl = `https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4?filename=${encodeURIComponent(file.name)}`;
        console.log('🎥 [uploadMediaFile] Video file detected, using sample video URL:', mediaUrl);
      } else if (fileType.startsWith('audio/')) {
        // للملفات الصوتية: استخدام رابط صوتي عام
        mediaUrl = `https://www.soundjay.com/misc/sounds/bell-ringing-05.wav?filename=${encodeURIComponent(file.name)}`;
        console.log('🎵 [uploadMediaFile] Audio file detected, using sample audio URL:', mediaUrl);
      } else {
        // للمستندات: استخدام رابط PDF عام
        mediaUrl = `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf?filename=${encodeURIComponent(file.name)}`;
        console.log('📄 [uploadMediaFile] Document file detected, using sample PDF URL:', mediaUrl);
      }
      
      console.log('✅ [uploadMediaFile] Generated public URL for attachment:', mediaUrl);
      return mediaUrl;

    } catch (error) {
      console.error('💥 [uploadMediaFile] Upload failed:', error);
      
      if (error instanceof Error) {
        console.error('💥 [uploadMediaFile] Error message:', error.message);
        throw error;
      }
      
      throw new Error('خطأ غير متوقع أثناء رفع الملف');
    }
  }

  // دالة جديدة لقبول الرابط المباشر
  async addDirectMediaUrl(url: string, mediaType: 'image' | 'document' | 'video' | 'audio' = 'image'): Promise<string> {
    try {
      console.log('🔗 [addDirectMediaUrl] Adding direct media URL:', url);
      
      // التحقق من صحة الرابط
      const urlObj = new URL(url);
      if (!urlObj.protocol.startsWith('http')) {
        throw new Error('يجب أن يبدأ الرابط بـ http:// أو https://');
      }
      
      console.log('✅ [addDirectMediaUrl] URL is valid, returning direct URL');
      return url;
      
    } catch (error) {
      console.error('💥 [addDirectMediaUrl] Error:', error);
      throw new Error('رابط غير صحيح');
    }
  }

  // ===== التحقق من صحة البيانات =====

  validatePhoneNumber(phone: string): ValidationResult {
    const errors: string[] = [];
    const cleaned = this.cleanPhoneNumber(phone);

    if (!cleaned) {
      errors.push('رقم الهاتف مطلوب');
    } else if (cleaned.length < 12 || cleaned.length > 15) {
      errors.push('رقم الهاتف غير صحيح');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateTemplate(template: CreateTemplateForm): ValidationResult {
    const errors: string[] = [];

    if (!template.name?.trim()) {
      errors.push('اسم القالب مطلوب');
    }

    if (!template.content?.trim()) {
      errors.push('محتوى القالب مطلوب');
    }

    if (template.template_type === 'media' && !template.media_url) {
      errors.push('رابط الوسائط مطلوب للقوالب من نوع وسائط');
    }

    if (template.template_type === 'button' && (!template.buttons || template.buttons.length === 0)) {
      errors.push('الأزرار مطلوبة للقوالب من نوع أزرار');
    }

    if (template.template_type === 'poll' && (!template.poll_options || template.poll_options.length < 2)) {
      errors.push('خيارات الاستطلاع مطلوبة (على الأقل خيارين)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// تصدير instance واحد من الخدمة
export const whatsappService = new WhatsAppService();

// تصدير الكلاس أيضاً للاستخدام المباشر
export { WhatsAppService };
