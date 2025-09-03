// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';
import { EnhancedContact } from '@/types/contact';
import { ContactSyncService } from './contactSyncService';

export interface SyncResult {
  success: boolean;
  message: string;
  syncedCount?: number;
  errors?: string[];
}

export class UnifiedContactService {
  /**
   * مزامنة العملاء من جدول clients إلى enhanced_contacts
   */
  static async syncClients(): Promise<SyncResult> {
    try {
      // جلب العملاء من جدول clients
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*');

      if (clientsError) {
        return { success: false, message: `خطأ في جلب العملاء: ${clientsError.message}` };
      }

      if (!clients || clients.length === 0) {
        return { success: true, message: 'لا توجد عملاء للمزامنة', syncedCount: 0 };
      }

      const contactsToSync = clients.map(client => ({
        name: client.name,
        short_name: client.name?.split(' ')[0] || '',
        email: client.email,
        address: client.address,
        nationality: client.nationality,
        roles: ['client'],
        status: client.client_status || 'active',
        source: client.source || 'manual',
        priority: 'medium' as const,
        rating: 3,
        tags: ['عميل'],
        notes: `تم المزامنة من صفحة العملاء - ID: ${client.id}`,
        original_table: 'clients',
        original_id: client.id,
        created_by: client.created_by || client.assigned_to,
        metadata: {}
      }));

      // إدراج أو تحديث جهات الاتصال
      const { data: syncedContacts, error: syncError } = await supabase
        .from('enhanced_contacts')
        .upsert(contactsToSync, {
          onConflict: 'original_table,original_id',
          ignoreDuplicates: false
        });

      if (syncError) {
        return { success: false, message: `خطأ في مزامنة العملاء: ${syncError.message}` };
      }

      return {
        success: true,
        message: `تم مزامنة ${clients.length} عميل بنجاح`,
        syncedCount: clients.length
      };
    } catch (error) {
      return {
        success: false,
        message: `خطأ غير متوقع في مزامنة العملاء: ${error}`
      };
    }
  }

  /**
   * مزامنة الوسطاء من جدول land_brokers إلى enhanced_contacts
   */
  static async syncBrokers(): Promise<SyncResult> {
    try {
      const { data: brokers, error: brokersError } = await supabase
        .from('land_brokers')
        .select('*');

      if (brokersError) {
        return { success: false, message: `خطأ في جلب الوسطاء: ${brokersError.message}` };
      }

      if (!brokers || brokers.length === 0) {
        return { success: true, message: 'لا توجد وسطاء للمزامنة', syncedCount: 0 };
      }

      const contactsToSync = brokers.map(broker => ({
        name: broker.name || broker.full_name,
        short_name: broker.short_name || broker.full_name?.split(' ')[0] || '',
        email: broker.email,
        nationality: broker.nationality,
        roles: ['broker'],
        status: broker.status || 'active',
        language: broker.language || 'ar',
        priority: 'high' as const,
        rating: broker.rating || 3,
        tags: ['وسيط', 'أراضي'],
        notes: `تم المزامنة من صفحة الوسطاء - ID: ${broker.id}`,
        original_table: 'land_brokers',
        original_id: broker.id,
        created_by: broker.created_by,
        metadata: {}
      }));

      const { data: syncedContacts, error: syncError } = await supabase
        .from('enhanced_contacts')
        .upsert(contactsToSync, {
          onConflict: 'original_table,original_id',
          ignoreDuplicates: false
        });

      if (syncError) {
        return { success: false, message: `خطأ في مزامنة الوسطاء: ${syncError.message}` };
      }

      return {
        success: true,
        message: `تم مزامنة ${brokers.length} وسيط بنجاح`,
        syncedCount: brokers.length
      };
    } catch (error) {
      return {
        success: false,
        message: `خطأ غير متوقع في مزامنة الوسطاء: ${error}`
      };
    }
  }

  /**
   * مزامنة ملاك العقارات من جدول property_owners إلى enhanced_contacts
   */
  static async syncPropertyOwners(): Promise<SyncResult> {
    try {
      const { data: owners, error: ownersError } = await supabase
        .from('property_owners')
        .select('*');

      if (ownersError) {
        return { success: false, message: `خطأ في جلب الملاك: ${ownersError.message}` };
      }

      if (!owners || owners.length === 0) {
        return { success: true, message: 'لا توجد ملاك للمزامنة', syncedCount: 0 };
      }

      const contactsToSync = owners.map(owner => ({
        name: owner.full_name,
        short_name: owner.full_name?.split(' ')[0] || '',
        email: owner.email,
        nationality: owner.nationality,
        roles: ['owner'],
        status: 'active',
        priority: 'high' as const,
        rating: 4,
        tags: ['مالك', 'عقار'],
        notes: `تم المزامنة من صفحة الملاك - ID: ${owner.id}\n${owner.internal_notes || ''}`,
        original_table: 'property_owners',
        original_id: owner.id,
        created_by: owner.created_by || owner.assigned_employee,
        metadata: {}
      }));

      const { data: syncedContacts, error: syncError } = await supabase
        .from('enhanced_contacts')
        .upsert(contactsToSync, {
          onConflict: 'original_table,original_id',
          ignoreDuplicates: false
        });

      if (syncError) {
        return { success: false, message: `خطأ في مزامنة الملاك: ${syncError.message}` };
      }

      return {
        success: true,
        message: `تم مزامنة ${owners.length} مالك بنجاح`,
        syncedCount: owners.length
      };
    } catch (error) {
      return {
        success: false,
        message: `خطأ غير متوقع في مزامنة الملاك: ${error}`
      };
    }
  }

  /**
   * مزامنة المستأجرين من جدول rental_tenants إلى enhanced_contacts
   */
  static async syncTenants(): Promise<SyncResult> {
    try {
      const { data: tenants, error: tenantsError } = await supabase
        .from('rental_tenants')
        .select('*');

      if (tenantsError) {
        return { success: false, message: `خطأ في جلب المستأجرين: ${tenantsError.message}` };
      }

      if (!tenants || tenants.length === 0) {
        return { success: true, message: 'لا توجد مستأجرين للمزامنة', syncedCount: 0 };
      }

      const contactsToSync = tenants.map(tenant => ({
        name: tenant.full_name,
        short_name: tenant.full_name?.split(' ')[0] || '',
        email: tenant.email,
        nationality: tenant.nationality,
        roles: ['tenant'],
        status: tenant.status || 'active',
        priority: 'medium' as const,
        rating: 3,
        tags: ['مستأجر'],
        notes: `تم المزامنة من صفحة المستأجرين - ID: ${tenant.id}`,
        original_table: 'rental_tenants',
        original_id: tenant.id,
        created_by: tenant.created_by,
        metadata: {}
      }));

      const { data: syncedContacts, error: syncError } = await supabase
        .from('enhanced_contacts')
        .upsert(contactsToSync, {
          onConflict: 'original_table,original_id',
          ignoreDuplicates: false
        });

      if (syncError) {
        return { success: false, message: `خطأ في مزامنة المستأجرين: ${syncError.message}` };
      }

      return {
        success: true,
        message: `تم مزامنة ${tenants.length} مستأجر بنجاح`,
        syncedCount: tenants.length
      };
    } catch (error) {
      return {
        success: false,
        message: `خطأ غير متوقع في مزامنة المستأجرين: ${error}`
      };
    }
  }

  /**
   * مزامنة جميع البيانات من كافة الصفحات
   */
  static async syncAllContacts(): Promise<SyncResult> {
    try {
      const results = await Promise.all([
        UnifiedContactService.syncClients(),
        UnifiedContactService.syncBrokers(),
        UnifiedContactService.syncPropertyOwners(),
        UnifiedContactService.syncTenants()
      ]);

      const errors: string[] = [];
      let totalSynced = 0;

      results.forEach((result, index) => {
        const sources = ['العملاء', 'الوسطاء', 'الملاك', 'المستأجرين'];
        if (!result.success) {
          errors.push(`${sources[index]}: ${result.message}`);
        } else {
          totalSynced += result.syncedCount || 0;
        }
      });

      if (errors.length > 0) {
        return {
          success: false,
          message: 'حدثت أخطاء أثناء المزامنة',
          errors,
          syncedCount: totalSynced
        };
      }

      return {
        success: true,
        message: `تم مزامنة ${totalSynced} جهة اتصال بنجاح من جميع الصفحات`,
        syncedCount: totalSynced
      };
    } catch (error) {
      return {
        success: false,
        message: `خطأ غير متوقع في المزامنة الشاملة: ${error}`
      };
    }
  }

  /**
   * إضافة جهة اتصال جديدة إلى enhanced_contacts
   */
  static async addContact(contact: Partial<EnhancedContact>): Promise<SyncResult> {
    try {
      // التأكد من إضافة created_by إذا لم يكن موجوداً
      const { data: { user } } = await supabase.auth.getUser();
      const contactData = {
        ...contact,
        created_by: contact.created_by || user?.id,
        metadata: contact.metadata || {}
      };

      const { data, error } = await supabase
        .from('enhanced_contacts')
        .insert([contactData])
        .select();

      if (error) {
        return { success: false, message: `خطأ في إضافة جهة الاتصال: ${error.message}` };
      }

      return {
        success: true,
        message: 'تم إضافة جهة الاتصال بنجاح',
        syncedCount: 1
      };
    } catch (error) {
      return {
        success: false,
        message: `خطأ غير متوقع في إضافة جهة الاتصال: ${error}`
      };
    }
  }

  /**
   * تحديث جهة اتصال موجودة
   */
  static async updateContact(id: string, updates: Partial<EnhancedContact>): Promise<SyncResult> {
    try {
      // إزالة خاصية channels و follow_up_status و priority و full_name من البيانات المرسلة إلى جدول enhanced_contacts
      // لأن قنوات الاتصال مخزنة في جدول منفصل وقد تكون هناك مشكلة في الكاش مع بعض الأعمدة
      // full_name يجب تحويلها إلى name لأن الجدول يستخدم عمود name وليس full_name
      const { channels, follow_up_status, priority, full_name, ...contactUpdates } = updates as any;
      
      // إذا كان full_name موجود، نحوله إلى name
      if (full_name) {
        contactUpdates.name = full_name;
      }
      
      const { data, error } = await supabase
        .from('enhanced_contacts')
        .update(contactUpdates)
        .eq('id', id)
        .select();

      if (error) {
        return { success: false, message: `خطأ في تحديث جهة الاتصال: ${error.message}` };
      }

      return {
        success: true,
        message: 'تم تحديث جهة الاتصال بنجاح',
        syncedCount: 1
      };
    } catch (error) {
      return {
        success: false,
        message: `خطأ غير متوقع في تحديث جهة الاتصال: ${error}`
      };
    }
  }

  /**
   * حذف جهة اتصال
   */
  static async deleteContact(id: string): Promise<SyncResult> {
    try {
      // أولاً: الحصول على معلومات جهة الاتصال لمعرفة الجدول الأصلي والمعرف الأصلي
      const { data: contactData, error: fetchError } = await supabase
        .from('enhanced_contacts')
        .select('original_table, original_id')
        .eq('id', id)
        .single();

      if (fetchError) {
        return { success: false, message: `خطأ في جلب معلومات جهة الاتصال: ${fetchError.message}` };
      }

      // ثانياً: حذف السجل من الجدول الأصلي إذا كان موجوداً
      if (contactData?.original_table && contactData?.original_id) {
        const { error: originalDeleteError } = await supabase
          .from(contactData.original_table)
          .delete()
          .eq('id', contactData.original_id);

        if (originalDeleteError) {
          console.error(`خطأ في حذف السجل الأصلي: ${originalDeleteError.message}`);
          // نستمر في الحذف حتى لو فشل حذف السجل الأصلي
        }
      }

      // ثالثاً: حذف السجلات المرتبطة في الجداول الأخرى باستخدام ContactSyncService
      // مع تحديد الجدول الأصلي لتجنب حذفه مرة أخرى
      await ContactSyncService.deleteSyncedRecords(id, contactData?.original_table);

      // وضع علامة أن جهة الاتصال قيد الحذف لمنع المزامنة العكسية
      const { error: updateError } = await supabase
        .from('enhanced_contacts')
        .update({ is_being_deleted: true })
        .eq('id', id);

      if (updateError) {
        console.error(`خطأ في تحديث حالة الحذف: ${updateError.message}`);
      }

      // أخيراً: حذف جهة الاتصال نفسها
      const { error } = await supabase
        .from('enhanced_contacts')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, message: `خطأ في حذف جهة الاتصال: ${error.message}` };
      }

      return {
        success: true,
        message: 'تم حذف جهة الاتصال والسجلات المرتبطة بنجاح'
      };
    } catch (error) {
      return {
        success: false,
        message: `خطأ غير متوقع في حذف جهة الاتصال: ${error}`
      };
    }
  }

  /**
   * جلب جميع جهات الاتصال مع الفلترة
   */
  static async getContacts(filters?: {
    role?: string;
    status?: string;
    search?: string;
  }) {
    try {
      let query = supabase.from('enhanced_contacts').select(`
        *,
        enhanced_contact_channels(*)
      `);

      if (filters?.role) {
        query = query.contains('roles', [filters.role]);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        return { success: false, message: `خطأ في جلب جهات الاتصال: ${error.message}`, data: [] };
      }

      return { success: true, message: 'تم جلب جهات الاتصال بنجاح', data: data || [] };
    } catch (error) {
      return {
        success: false,
        message: `خطأ غير متوقع في جلب جهات الاتصال: ${error}`,
        data: []
      };
    }
  }
}