import { supabase } from '@/integrations/supabase/client';
import { format, addHours, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

export interface SmartTask {
  id: string;
  title: string;
  description: string | null;
  task_type: 'whatsapp_message' | 'follow_up' | 'meeting' | 'other';
  target_suppliers: string[];
  target_count: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date: string;
  reminder_time: string | null;
  completed_at: string | null;
}

export interface SmartSupplier {
  id: string;
  name: string; // الاسم الكامل (للعرض)
  first_name: string; // الاسم الأول
  last_name: string; // الاسم الأخير
  contact_name: string; // اسم التواصل (nickname)
  phone: string;
  company_name: string | null;
  category: 'broker' | 'land_owner' | 'developer';
  last_contact_date: string | null;
  last_contact_type: 'call' | 'whatsapp' | 'email' | null;
  notes: string | null;
  priority: 'low' | 'medium' | 'high';
  is_active: boolean;
}

export interface SmartSettings {
  daily_message_limit: number;
  message_cooldown_hours: number;
  target_categories: string[];
  daily_reminder_time: string | null;
  auto_send_enabled: boolean;
  message_template_ar: string;
  message_template_en: string;
}

export interface MessageLog {
  id: string;
  supplier_id: string | null;
  task_id: string | null;
  message_template: string;
  message_sent: string;
  phone_number: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  whatsapp_message_id: string | null;
  sent_at: string;
  sent_by: string;
}

class WhatsAppSmartService {
  private userId: string | null = null;

  setUserId(userId: string) {
    this.userId = userId;
  }

  // تحميل المهام اليومية
  async loadDailyTasks(): Promise<SmartTask[]> {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .gte('due_date', today)
        .order('due_date', { ascending: true });

      if (error) throw error;

      const tasks: SmartTask[] = (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        task_type: (row.task_type as SmartTask['task_type']) || 'other',
        target_suppliers: row.target_suppliers || [],
        target_count: row.target_count || 0,
        status: row.status,
        scheduled_date: row.due_date,
        reminder_time: row.due_time || null,
        completed_at: row.completed_at || null,
      }));

      return tasks;
    } catch (error) {
      console.error('Error loading daily tasks:', error);
      return [];
    }
  }

  // تحميل الموردين الخارجيين
  async loadSuppliers(filters?: {
    category?: string;
    priority?: string;
    search?: string;
  }): Promise<SmartSupplier[]> {
    try {
      let query = supabase
        .from('external_suppliers')
        .select('*')
        .eq('is_active', true);

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      if (filters?.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      // إضافة الحقول المفقودة للتوافق مع الواجهة
      const suppliersWithFields = (data || []).map(supplier => ({
        ...supplier,
        first_name: supplier.first_name || supplier.name?.split(' ')[0] || '',
        last_name: supplier.last_name || supplier.name?.split(' ')[1] || '',
        contact_name: supplier.contact_name || supplier.name || ''
      }));
      
      return suppliersWithFields;
    } catch (error) {
      console.error('Error loading suppliers:', error);
      return [];
    }
  }

  // تحميل الإعدادات
  async loadSettings(): Promise<SmartSettings | null> {
    if (!this.userId) return null;

    try {
      const { data, error } = await supabase
        .from('whatsapp_smart_settings')
        .select('*')
        .eq('user_id', this.userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        return data;
      } else {
        // إنشاء إعدادات افتراضية
        const defaultSettings: SmartSettings = {
          daily_message_limit: 50,
          message_cooldown_hours: 24,
          target_categories: ['broker', 'land_owner', 'developer'],
          daily_reminder_time: '09:00',
          auto_send_enabled: false,
          message_template_ar: 'مرحباً {supplier_name}، نود التواصل معكم بخصوص الفرص المتاحة في السوق العقاري.',
          message_template_en: 'Hello {supplier_name}, we would like to connect regarding available opportunities in the real estate market.'
        };

        await this.saveSettings(defaultSettings);
        return defaultSettings;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      return null;
    }
  }

  // حفظ الإعدادات
  async saveSettings(settings: SmartSettings): Promise<boolean> {
    if (!this.userId) return false;

    try {
      const { error } = await supabase
        .from('whatsapp_smart_settings')
        .upsert({
          user_id: this.userId,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }

  // إضافة مورد جديد
  async addSupplier(supplier: Omit<SmartSupplier, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
    if (!this.userId) {
      throw new Error('User not authenticated');
    }

    try {
      // التأكد من وجود القيم المطلوبة
      if (!supplier.phone) {
        throw new Error('رقم الهاتف مطلوب');
      }
      if (!supplier.category) {
        throw new Error('يجب تحديد فئة المورد');
      }

      // إنشاء الاسم الكامل من الحقول الجديدة إذا كانت متوفرة
      const fullName = (supplier.first_name && supplier.last_name) 
        ? `${supplier.first_name} ${supplier.last_name}`.trim()
        : supplier.name || '';

      // البيانات الأساسية المتوافقة مع الجدول
      const supplierData: any = {
        name: fullName,
        first_name: supplier.first_name || '',
        last_name: supplier.last_name || '',
        contact_name: supplier.contact_name || '',
        phone: supplier.phone,
        company_name: supplier.company_name || null,
        category: supplier.category,
        priority: supplier.priority || 'medium',
        notes: supplier.notes || null,
        last_contact_date: null,
        last_contact_type: null,
        is_active: true,
        created_by: this.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Adding supplier with data:', JSON.stringify(supplierData, null, 2));

      const { data, error } = await supabase
        .from('external_suppliers')
        .insert(supplierData)
        .select('id')
        .single();

      if (error) {
        console.error('Supabase error details:', {
          code: error.code,
          details: error.details,
          hint: error.hint,
          message: error.message
        });
        throw new Error(`خطأ في قاعدة البيانات: ${error.message}`);
      }

      if (!data?.id) {
        throw new Error('No data returned from insert operation');
      }

      console.log('Supplier added successfully with ID:', data.id);
      return data.id;
    } catch (error) {
      console.error('Error adding supplier:', error);
      throw error; // إعادة رمي الخطأ بدلاً من إرجاع null
    }
  }

  // تحديث مورد
  async updateSupplier(id: string, updates: Partial<SmartSupplier>): Promise<boolean> {
    try {
      // إنشاء الاسم الكامل من الحقول الجديدة إذا كانت متوفرة
      const updateData: any = { ...updates };
      
      if (updates.first_name || updates.last_name) {
        const fullName = `${updates.first_name || ''} ${updates.last_name || ''}`.trim();
        if (fullName) {
          updateData.name = fullName;
        }
        // إزالة الحقول التي لا توجد في الجدول الحالي
        delete updateData.first_name;
        delete updateData.last_name;
        delete updateData.contact_name;
      }

      const { error } = await supabase
        .from('external_suppliers')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating supplier:', error);
      return false;
    }
  }

  // حذف مورد (تعطيل)
  async deleteSupplier(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('external_suppliers')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting supplier:', error);
      return false;
    }
  }

  // إضافة مهمة جديدة
  async addTask(task: Omit<SmartTask, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
    if (!this.userId) return null;

    try {
      const { data, error } = await supabase
        .from('daily_tasks')
        .insert({
          ...task,
          created_by: this.userId
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error adding task:', error);
      return null;
    }
  }

  // تحديث حالة المهمة
  async updateTaskStatus(id: string, status: SmartTask['status']): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('daily_tasks')
        .update({ 
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating task status:', error);
      return false;
    }
  }

  // حذف مهمة
  async deleteTask(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('daily_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }

  // تسجيل رسالة مرسلة
  async logMessage(messageData: Omit<MessageLog, 'id' | 'created_at'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_smart_logs')
        .insert(messageData)
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error logging message:', error);
      return null;
    }
  }

  // التحقق من إمكانية إرسال رسالة لمورد معين
  async canSendMessage(supplierId: string): Promise<boolean> {
    try {
      const settings = await this.loadSettings();
      if (!settings) return false;

      // البحث عن آخر رسالة مرسلة للمورد
      const { data: lastMessage, error } = await supabase
        .from('whatsapp_smart_logs')
        .select('sent_at')
        .eq('supplier_id', supplierId)
        .order('sent_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!lastMessage) return true;

      // التحقق من انقضاء فترة الانتظار
      const lastMessageTime = new Date(lastMessage.sent_at);
      const cooldownEnd = addHours(lastMessageTime, settings.message_cooldown_hours);
      
      return isAfter(new Date(), cooldownEnd);
    } catch (error) {
      console.error('Error checking message eligibility:', error);
      return false;
    }
  }

  // الحصول على الموردين المؤهلين للإرسال اليوم
  async getEligibleSuppliers(): Promise<SmartSupplier[]> {
    try {
      const settings = await this.loadSettings();
      if (!settings) return [];

      // الحصول على عدد الرسائل المرسلة اليوم
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);

      const { data: todayMessages, error: messagesError } = await supabase
        .from('whatsapp_smart_logs')
        .select('id')
        .gte('sent_at', startOfToday.toISOString())
        .lte('sent_at', endOfToday.toISOString())
        .eq('sent_by', this.userId);

      if (messagesError) throw messagesError;

      const messagesSentToday = todayMessages?.length || 0;
      if (messagesSentToday >= settings.daily_message_limit) {
        return [];
      }

      // الحصول على الموردين المؤهلين
      const { data: suppliers, error: suppliersError } = await supabase
        .from('external_suppliers')
        .select('*')
        .eq('is_active', true)
        .in('category', settings.target_categories)
        .order('priority', { ascending: false })
        .order('last_contact_date', { ascending: true })
        .limit(settings.daily_message_limit - messagesSentToday);

      if (suppliersError) throw suppliersError;

      // فلترة الموردين المؤهلين للإرسال
      const eligibleSuppliers: SmartSupplier[] = [];
      for (const supplier of suppliers || []) {
        if (await this.canSendMessage(supplier.id)) {
          eligibleSuppliers.push(supplier);
        }
      }

      return eligibleSuppliers;
    } catch (error) {
      console.error('Error getting eligible suppliers:', error);
      return [];
    }
  }

  // إرسال رسائل تلقائية
  async sendAutoMessages(): Promise<number> {
    if (!this.userId) return 0;

    try {
      const settings = await this.loadSettings();
      if (!settings?.auto_send_enabled) return 0;

      const eligibleSuppliers = await this.getEligibleSuppliers();
      let messagesSent = 0;

      for (const supplier of eligibleSuppliers) {
        try {
          // تنسيق الرسالة
          const message = this.formatMessage(settings.message_template_ar, supplier.name);
          
          // إرسال الرسالة عبر WhatsApp
          const success = await this.sendWhatsAppMessage(supplier.phone, message);
          
          if (success) {
            // تسجيل الرسالة
            await this.logMessage({
              supplier_id: supplier.id,
              task_id: null,
              message_template: settings.message_template_ar,
              message_sent: message,
              phone_number: supplier.phone,
              status: 'sent',
              whatsapp_message_id: null,
              sent_at: new Date().toISOString(),
              sent_by: this.userId
            });

            // تحديث آخر تواصل
            await this.updateSupplier(supplier.id, {
              last_contact_date: new Date().toISOString(),
              last_contact_type: 'whatsapp'
            });

            messagesSent++;
          }
        } catch (error) {
          console.error(`Error sending message to supplier ${supplier.id}:`, error);
        }
      }

      return messagesSent;
    } catch (error) {
      console.error('Error sending auto messages:', error);
      return 0;
    }
  }

  // تنسيق الرسالة
  private formatMessage(template: string, supplierName: string): string {
    return template.replace('{supplier_name}', supplierName);
  }

  // إرسال رسالة WhatsApp
  private async sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
    try {
      // هنا يمكن إضافة منطق إرسال الرسالة عبر WhatsApp Business API
      // حالياً نستخدم الرابط المباشر
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
      
      // في التطبيق الحقيقي، يمكن استخدام window.open أو إرسال عبر API
      console.log('Sending WhatsApp message:', { phone, message, url: whatsappUrl });
      
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  // الحصول على إحصائيات الوحدة
  async getStats(): Promise<{
    totalSuppliers: number;
    totalTasks: number;
    messagesSentToday: number;
    pendingTasks: number;
    completedTasks: number;
  }> {
    try {
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);

      const [
        { count: totalSuppliers },
        { count: totalTasks },
        { count: messagesSentToday },
        { count: pendingTasks },
        { count: completedTasks }
      ] = await Promise.all([
        supabase.from('external_suppliers').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('daily_tasks').select('*', { count: 'exact', head: true }),
        supabase.from('whatsapp_smart_logs').select('*', { count: 'exact', head: true })
          .gte('sent_at', startOfToday.toISOString())
          .lte('sent_at', endOfToday.toISOString())
          .eq('sent_by', this.userId),
        supabase.from('daily_tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('daily_tasks').select('*', { count: 'exact', head: true }).eq('status', 'completed')
      ]);

      return {
        totalSuppliers: totalSuppliers || 0,
        totalTasks: totalTasks || 0,
        messagesSentToday: messagesSentToday || 0,
        pendingTasks: pendingTasks || 0,
        completedTasks: completedTasks || 0
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalSuppliers: 0,
        totalTasks: 0,
        messagesSentToday: 0,
        pendingTasks: 0,
        completedTasks: 0
      };
    }
  }
}

export const whatsappSmartService = new WhatsAppSmartService();
export default whatsappSmartService;
