import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/database';

type Contact = Database['public']['Tables']['enhanced_contacts']['Row'];
type ContactInsert = Database['public']['Tables']['enhanced_contacts']['Insert'];
type ContactUpdate = Database['public']['Tables']['enhanced_contacts']['Update'];

/**
 * خدمة المزامنة التلقائية لجهات الاتصال
 * تضمن التحديث المتبادل بين جهات الاتصال والصفحات الأخرى
 */
export class ContactSyncService {
  /**
   * مزامنة جهة اتصال مع الصفحات الأخرى بناءً على الأدوار
   */
  static async syncContactToPages(contactId: string, contactData: Contact) {
    const roles = contactData.roles || [];
    
    try {
      // مزامنة مع صفحة الوسطاء
      if (roles.includes('broker')) {
        await this.syncToBrokers(contactId, contactData);
      }
      
      // مزامنة مع صفحة الملاك
      if (roles.includes('owner') || roles.includes('landlord')) {
        await this.syncToOwners(contactId, contactData);
      }
      
      // مزامنة مع صفحة المستأجرين
      if (roles.includes('tenant')) {
        await this.syncToTenants(contactId, contactData);
      }
      
      // مزامنة مع صفحة العملاء
      if (roles.includes('client') || roles.includes('customer')) {
        await this.syncToClients(contactId, contactData);
      }
      
      // مزامنة مع صفحة الموردين
      if (roles.includes('supplier')) {
        await this.syncToSuppliers(contactId, contactData);
      }
      
      return { success: true };
    } catch (error) {
      console.error('خطأ في مزامنة جهة الاتصال:', error);
      return { success: false, error };
    }
  }
  
  /**
   * مزامنة مع جدول الوسطاء
   */
  private static async syncToBrokers(contactId: string, contactData: Contact) {
    const brokerData = {
      contact_id: contactId,
      name: contactData.full_name,
      short_name: contactData.short_name,
      office_name: contactData.office_name,
      office_classification: contactData.office_classification,
      job_title: contactData.job_title,
      cr_number: contactData.cr_number,
      cr_expiry_date: contactData.cr_expiry_date,
      units_count: contactData.units_count,
      phone: this.extractChannelValue(contactData, 'mobile'),
      whatsapp: this.extractChannelValue(contactData, 'whatsapp'),
      email: this.extractChannelValue(contactData, 'email'),
      status: contactData.status,
      notes: contactData.notes,
      rating: contactData.rating_1_5,
      language: contactData.language,
      updated_at: new Date().toISOString()
    };
    
    // التحقق من وجود السجل
    const { data: existing } = await supabase
      .from('brokers')
      .select('id')
      .eq('contact_id', contactId)
      .single();
    
    if (existing) {
      // تحديث السجل الموجود
      await supabase
        .from('brokers')
        .update(brokerData)
        .eq('contact_id', contactId);
    } else {
      // إنشاء سجل جديد
      await supabase
        .from('brokers')
        .insert(brokerData);
    }
  }
  
  /**
   * مزامنة مع جدول الملاك
   */
  private static async syncToOwners(contactId: string, contactData: Contact) {
    const ownerData = {
      contact_id: contactId,
      name: contactData.full_name,
      short_name: contactData.short_name,
      nationality: contactData.nationality,
      id_type: contactData.id_type,
      id_number: contactData.id_number,
      id_expiry_date: contactData.id_expiry_date,
      bank_name: contactData.bank_name,
      account_number: contactData.account_number,
      iban: contactData.iban,
      phone: this.extractChannelValue(contactData, 'mobile'),
      whatsapp: this.extractChannelValue(contactData, 'whatsapp'),
      email: this.extractChannelValue(contactData, 'email'),
      status: contactData.status,
      notes: contactData.notes,
      rating: contactData.rating_1_5,
      language: contactData.language,
      updated_at: new Date().toISOString()
    };
    
    const { data: existing } = await supabase
      .from('owners')
      .select('id')
      .eq('contact_id', contactId)
      .single();
    
    if (existing) {
      await supabase
        .from('owners')
        .update(ownerData)
        .eq('contact_id', contactId);
    } else {
      await supabase
        .from('owners')
        .insert(ownerData);
    }
  }
  
  /**
   * مزامنة مع جدول المستأجرين
   */
  private static async syncToTenants(contactId: string, contactData: Contact) {
    const tenantData = {
      contact_id: contactId,
      name: contactData.full_name,
      short_name: contactData.short_name,
      phone: this.extractChannelValue(contactData, 'mobile'),
      whatsapp: this.extractChannelValue(contactData, 'whatsapp'),
      email: this.extractChannelValue(contactData, 'email'),
      status: contactData.status,
      notes: contactData.notes,
      rating: contactData.rating_1_5,
      language: contactData.language,
      updated_at: new Date().toISOString()
    };
    
    const { data: existing } = await supabase
      .from('tenants')
      .select('id')
      .eq('contact_id', contactId)
      .single();
    
    if (existing) {
      await supabase
        .from('tenants')
        .update(tenantData)
        .eq('contact_id', contactId);
    } else {
      await supabase
        .from('tenants')
        .insert(tenantData);
    }
  }
  
  /**
   * مزامنة مع جدول العملاء
   */
  private static async syncToClients(contactId: string, contactData: Contact) {
    const clientData = {
      contact_id: contactId,
      name: contactData.full_name,
      short_name: contactData.short_name,
      phone: this.extractChannelValue(contactData, 'mobile'),
      whatsapp: this.extractChannelValue(contactData, 'whatsapp'),
      email: this.extractChannelValue(contactData, 'email'),
      status: contactData.status,
      notes: contactData.notes,
      rating: contactData.rating_1_5,
      language: contactData.language,
      preferred_contact_method: contactData.preferred_contact_method,
      updated_at: new Date().toISOString()
    };
    
    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .eq('contact_id', contactId)
      .single();
    
    if (existing) {
      await supabase
        .from('clients')
        .update(clientData)
        .eq('contact_id', contactId);
    } else {
      await supabase
        .from('clients')
        .insert(clientData);
    }
  }
  
  /**
   * مزامنة مع جدول الموردين
   */
  private static async syncToSuppliers(contactId: string, contactData: Contact) {
    const supplierData = {
      contact_id: contactId,
      name: contactData.full_name,
      short_name: contactData.short_name,
      phone: this.extractChannelValue(contactData, 'mobile'),
      whatsapp: this.extractChannelValue(contactData, 'whatsapp'),
      email: this.extractChannelValue(contactData, 'email'),
      status: contactData.status,
      notes: contactData.notes,
      rating: contactData.rating_1_5,
      language: contactData.language,
      updated_at: new Date().toISOString()
    };
    
    const { data: existing } = await supabase
      .from('suppliers')
      .select('id')
      .eq('contact_id', contactId)
      .single();
    
    if (existing) {
      await supabase
        .from('suppliers')
        .update(supplierData)
        .eq('contact_id', contactId);
    } else {
      await supabase
        .from('suppliers')
        .insert(supplierData);
    }
  }
  
  /**
   * استخراج قيمة قناة اتصال معينة
   */
  private static extractChannelValue(contactData: Contact, channelType: string): string | null {
    if (!contactData.channels) return null;
    
    const channels = Array.isArray(contactData.channels) 
      ? contactData.channels 
      : JSON.parse(contactData.channels as string);
    
    const channel = channels.find((ch: any) => ch.type === channelType);
    return channel?.value || null;
  }
  
  /**
   * مزامنة عكسية: تحديث جهة الاتصال من الصفحات الأخرى
   */
  static async syncFromPageToContact(pageType: string, pageData: any, contactId?: string) {
    try {
      let existingContactId = contactId;
      
      // البحث عن جهة الاتصال إذا لم يتم توفير المعرف
      if (!existingContactId && pageData.contact_id) {
        existingContactId = pageData.contact_id;
      }
      
      // إنشاء أو تحديث جهة الاتصال
      const contactData: ContactInsert = {
        full_name: pageData.name,
        short_name: pageData.short_name || pageData.name,
        language: pageData.language || 'ar',
        notes: pageData.notes,
        rating_1_5: pageData.rating,
        status: pageData.status || 'active',
        preferred_contact_method: pageData.preferred_contact_method || 'phone',
        roles: this.getRolesForPageType(pageType),
        channels: this.buildChannelsFromPageData(pageData),
        ...this.getPageSpecificFields(pageType, pageData)
      };
      
      if (existingContactId) {
        // تحديث جهة الاتصال الموجودة
        const { data, error } = await supabase
          .from('enhanced_contacts')
          .update(contactData)
          .eq('id', existingContactId)
          .select()
          .single();
        
        if (error) throw error;
        return { success: true, contactId: existingContactId, data };
      } else {
        // إنشاء جهة اتصال جديدة
        const { data, error } = await supabase
          .from('enhanced_contacts')
          .insert(contactData)
          .select()
          .single();
        
        if (error) throw error;
        
        // تحديث الصفحة الأصلية بمعرف جهة الاتصال الجديد
        await this.updatePageWithContactId(pageType, pageData.id, data.id);
        
        return { success: true, contactId: data.id, data };
      }
    } catch (error) {
      console.error('خطأ في المزامنة العكسية:', error);
      return { success: false, error };
    }
  }
  
  /**
   * الحصول على الأدوار بناءً على نوع الصفحة
   */
  private static getRolesForPageType(pageType: string): string[] {
    const roleMap: { [key: string]: string[] } = {
      'brokers': ['broker'],
      'owners': ['owner'],
      'tenants': ['tenant'],
      'clients': ['client'],
      'suppliers': ['supplier']
    };
    
    return roleMap[pageType] || [];
  }
  
  /**
   * بناء قنوات الاتصال من بيانات الصفحة
   */
  private static buildChannelsFromPageData(pageData: any) {
    const channels = [];
    
    if (pageData.phone) {
      channels.push({
        type: 'mobile',
        value: pageData.phone,
        is_primary: false,
        label: 'الجوال'
      });
    }
    
    if (pageData.whatsapp) {
      channels.push({
        type: 'whatsapp',
        value: pageData.whatsapp,
        is_primary: true,
        label: 'الواتساب'
      });
    }
    
    if (pageData.email) {
      channels.push({
        type: 'email',
        value: pageData.email,
        is_primary: false,
        label: 'البريد الإلكتروني'
      });
    }
    
    return channels;
  }
  
  /**
   * الحصول على الحقول الخاصة بكل نوع صفحة
   */
  private static getPageSpecificFields(pageType: string, pageData: any) {
    switch (pageType) {
      case 'brokers':
        return {
          office_name: pageData.office_name,
          office_classification: pageData.office_classification,
          job_title: pageData.job_title,
          cr_number: pageData.cr_number,
          cr_expiry_date: pageData.cr_expiry_date,
          units_count: pageData.units_count
        };
      
      case 'owners':
        return {
          nationality: pageData.nationality,
          id_type: pageData.id_type,
          id_number: pageData.id_number,
          id_expiry_date: pageData.id_expiry_date,
          bank_name: pageData.bank_name,
          account_number: pageData.account_number,
          iban: pageData.iban
        };
      
      default:
        return {};
    }
  }
  
  /**
   * تحديث الصفحة بمعرف جهة الاتصال
   */
  private static async updatePageWithContactId(pageType: string, pageId: string, contactId: string) {
    const tableMap: { [key: string]: string } = {
      'brokers': 'brokers',
      'owners': 'owners',
      'tenants': 'tenants',
      'clients': 'clients',
      'suppliers': 'suppliers'
    };
    
    const tableName = tableMap[pageType];
    if (!tableName) return;
    
    await supabase
      .from(tableName)
      .update({ contact_id: contactId })
      .eq('id', pageId);
  }
  
  /**
   * حذف المزامنة عند حذف جهة اتصال
   */
  static async deleteSyncedRecords(contactId: string) {
    try {
      // حذف من جميع الجداول المرتبطة
      const tables = ['brokers', 'owners', 'tenants', 'clients', 'suppliers'];
      
      for (const table of tables) {
        await supabase
          .from(table)
          .delete()
          .eq('contact_id', contactId);
      }
      
      return { success: true };
    } catch (error) {
      console.error('خطأ في حذف السجلات المزامنة:', error);
      return { success: false, error };
    }
  }
  
  /**
   * إعداد المستمعين للتغييرات في الوقت الفعلي
   */
  static setupRealtimeSync() {
    // مستمع لتغييرات جهات الاتصال
    supabase
      .channel('enhanced_contacts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'enhanced_contacts'
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            await this.syncContactToPages(payload.new.id, payload.new as Contact);
          } else if (payload.eventType === 'DELETE') {
            await this.deleteSyncedRecords(payload.old.id);
          }
        }
      )
      .subscribe();
  }
}

// تصدير الخدمة كافتراضي
export default ContactSyncService;