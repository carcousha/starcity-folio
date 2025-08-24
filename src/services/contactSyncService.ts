// Contact Synchronization Service
// خدمة مزامنة جهات الاتصال بين جميع الوحدات

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ContactSyncResult {
  success: boolean;
  message: string;
  action: 'created' | 'updated' | 'merged' | 'skipped';
  contactId?: string;
  mergedData?: any;
}

export class ContactSyncService {
  // دمج البيانات الذكي - يحتفظ بالبيانات الأفضل
  private static mergeContactData(existingData: any, newData: any): any {
    const merged = { ...existingData };
    
    // دمج الأسماء - الاحتفاظ بالأطول والأكثر اكتمالاً
    if (newData.name && (!existingData.name || newData.name.length > existingData.name.length)) {
      merged.name = newData.name;
    }
    
    // دمج البريد الإلكتروني - الاحتفاظ بالصحيح
    if (newData.email && (!existingData.email || newData.email.includes('@'))) {
      merged.email = newData.email;
    }
    
    // دمج الشركة - الاحتفاظ بالأطول
    if (newData.company && (!existingData.company || newData.company.length > existingData.company.length)) {
      merged.company = newData.company;
    }
    
    // دمج الملاحظات - إضافة الجديد للقديم
    if (newData.notes) {
      if (existingData.notes) {
        merged.notes = `${existingData.notes} | ${newData.notes}`;
      } else {
        merged.notes = newData.notes;
      }
    }
    
    // دمج نوع الاتصال - الاحتفاظ بالأكثر تحديداً
    if (newData.contact_type && newData.contact_type !== 'general') {
      merged.contact_type = newData.contact_type;
    }
    
    return merged;
  }

  // البحث عن المكررات وحذفها تلقائياً
  private static async findAndRemoveDuplicates(phone: string, excludeId?: string): Promise<{
    primaryContact: any;
    duplicatesToDelete: any[];
    mergedData: any;
  }> {
    try {
      // البحث عن جميع جهات الاتصال بنفس الرقم
      const { data: allContacts, error } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .eq('phone', phone);

      if (error) throw error;

      if (!allContacts || allContacts.length <= 1) {
        return { primaryContact: null, duplicatesToDelete: [], mergedData: null };
      }

      // ترتيب حسب الأولوية: الأقدم أولاً (أول من تم إنشاؤه)
      allContacts.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      // الجهة الأساسية (الأقدم)
      const primaryContact = allContacts[0];
      
      // المكررات للحذف (الأحدث)
      const duplicatesToDelete = allContacts.slice(1);
      
      // دمج البيانات من جميع المكررات
      let mergedData = { ...primaryContact };
      
      for (const duplicate of duplicatesToDelete) {
        mergedData = this.mergeContactData(mergedData, duplicate);
      }

      return { primaryContact, duplicatesToDelete, mergedData };
    } catch (error) {
      console.error('Error finding duplicates:', error);
      return { primaryContact: null, duplicatesToDelete: [], mergedData: null };
    }
  }

  // مزامنة وسيط إلى WhatsApp مع حذف المكررات التلقائي
  static async syncBrokerToWhatsApp(brokerData: any): Promise<ContactSyncResult> {
    try {
      // التحقق من وجود الرقم في WhatsApp
      const { data: existingContact, error: searchError } = await supabase
        .from('whatsapp_contacts')
        .select('id, name, phone, email, company, notes, contact_type, created_at')
        .eq('phone', brokerData.phone)
        .single();

      if (existingContact) {
        // البحث عن المكررات وحذفها
        const { duplicatesToDelete, mergedData } = await this.findAndRemoveDuplicates(brokerData.phone, existingContact.id);
        
        if (duplicatesToDelete.length > 0) {
          // حذف المكررات
          for (const duplicate of duplicatesToDelete) {
            await supabase
              .from('whatsapp_contacts')
              .delete()
              .eq('id', duplicate.id);
          }
          
          // تحديث الجهة الأساسية بالبيانات المدمجة
          const { error: updateError } = await supabase
            .from('whatsapp_contacts')
            .update({
              name: mergedData.name || brokerData.name || `${brokerData.first_name} ${brokerData.last_name}`,
              email: mergedData.email || brokerData.email || existingContact.email,
              company: mergedData.company || brokerData.company || existingContact.company,
              notes: mergedData.notes || brokerData.notes || existingContact.notes,
              contact_type: 'broker',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingContact.id);

          if (updateError) {
            console.error('Error updating merged contact:', updateError);
            return {
              success: false,
              message: 'فشل في تحديث جهة الاتصال المدمجة',
              action: 'skipped'
            };
          }

          // ربط الوسيط بجهة الاتصال المحدثة
          const { error: linkError } = await supabase
            .from('land_brokers')
            .update({ whatsapp_contact_id: existingContact.id })
            .eq('id', brokerData.id);

          if (linkError) {
            console.error('Error linking broker to contact:', linkError);
          }

          return {
            success: true,
            message: `تم دمج ${duplicatesToDelete.length} مكرر وتحديث البيانات`,
            action: 'merged',
            contactId: existingContact.id,
            mergedData: {
              deletedDuplicates: duplicatesToDelete.length,
              mergedFields: Object.keys(mergedData).filter(key => 
                mergedData[key] !== existingContact[key]
              )
            }
          };
        } else {
          // تحديث البيانات الموجودة فقط
          const { error: updateError } = await supabase
            .from('whatsapp_contacts')
            .update({
              name: brokerData.name || `${brokerData.first_name} ${brokerData.last_name}`,
              email: brokerData.email || existingContact.email,
              company: brokerData.company || existingContact.company,
              notes: brokerData.notes || existingContact.notes,
              contact_type: 'broker',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingContact.id);

          if (updateError) {
            console.error('Error updating existing contact:', updateError);
            return {
              success: false,
              message: 'فشل في تحديث جهة الاتصال الموجودة',
              action: 'skipped'
            };
          }

          // ربط الوسيط بجهة الاتصال الموجودة
          const { error: linkError } = await supabase
            .from('land_brokers')
            .update({ whatsapp_contact_id: existingContact.id })
            .eq('id', brokerData.id);

          if (linkError) {
            console.error('Error linking broker to contact:', linkError);
          }

          return {
            success: true,
            message: 'تم تحديث جهة الاتصال الموجودة بنجاح',
            action: 'updated',
            contactId: existingContact.id
          };
        }
      } else {
        // إنشاء جهة اتصال جديدة
        const { data: newContact, error: createError } = await supabase
          .from('whatsapp_contacts')
          .insert({
            name: brokerData.name || `${brokerData.first_name} ${brokerData.last_name}`,
            phone: brokerData.phone,
            email: brokerData.email,
            company: brokerData.company,
            notes: brokerData.notes,
            contact_type: 'broker',
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating new contact:', createError);
          return {
            success: false,
            message: 'فشل في إنشاء جهة اتصال جديدة',
            action: 'skipped'
          };
        }

        // ربط الوسيط بجهة الاتصال الجديدة
        const { error: linkError } = await supabase
          .from('land_brokers')
          .update({ whatsapp_contact_id: newContact.id })
          .eq('id', brokerData.id);

        if (linkError) {
          console.error('Error linking broker to contact:', linkError);
        }

        return {
          success: true,
          message: 'تم إنشاء جهة اتصال جديدة بنجاح',
          action: 'created',
          contactId: newContact.id
        };
      }
    } catch (error) {
      console.error('Error syncing broker to WhatsApp:', error);
      return {
        success: false,
        message: 'فشل في مزامنة الوسيط',
        action: 'skipped'
      };
    }
  }

  // مزامنة عميل إلى WhatsApp مع حذف المكررات التلقائي
  static async syncClientToWhatsApp(clientData: any): Promise<ContactSyncResult> {
    try {
      // التحقق من وجود الرقم في WhatsApp
      const { data: existingContact, error: searchError } = await supabase
        .from('whatsapp_contacts')
        .select('id, name, phone, email, company, notes, contact_type, created_at')
        .eq('phone', clientData.phone)
        .single();

      if (existingContact) {
        // البحث عن المكررات وحذفها
        const { duplicatesToDelete, mergedData } = await this.findAndRemoveDuplicates(clientData.phone, existingContact.id);
        
        if (duplicatesToDelete.length > 0) {
          // حذف المكررات
          for (const duplicate of duplicatesToDelete) {
            await supabase
              .from('whatsapp_contacts')
              .delete()
              .eq('id', duplicate.id);
          }
          
          // تحديث الجهة الأساسية بالبيانات المدمجة
          const { error: updateError } = await supabase
            .from('whatsapp_contacts')
            .update({
              name: mergedData.name || clientData.name || `${clientData.first_name} ${clientData.last_name}`,
              email: mergedData.email || clientData.email || existingContact.email,
              company: mergedData.company || clientData.company || existingContact.company,
              notes: mergedData.notes || clientData.notes || existingContact.notes,
              contact_type: 'client',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingContact.id);

          if (updateError) {
            console.error('Error updating merged contact:', updateError);
            return {
              success: false,
              message: 'فشل في تحديث جهة الاتصال المدمجة',
              action: 'skipped'
            };
          }

          // ربط العميل بجهة الاتصال المحدثة
          const { error: linkError } = await supabase
            .from('land_clients')
            .update({ whatsapp_contact_id: existingContact.id })
            .eq('id', clientData.id);

          if (linkError) {
            console.error('Error linking client to contact:', linkError);
          }

          return {
            success: true,
            message: `تم دمج ${duplicatesToDelete.length} مكرر وتحديث البيانات`,
            action: 'merged',
            contactId: existingContact.id,
            mergedData: {
              deletedDuplicates: duplicatesToDelete.length,
              mergedFields: Object.keys(mergedData).filter(key => 
                mergedData[key] !== existingContact[key]
              )
            }
          };
        } else {
          // تحديث البيانات الموجودة فقط
          const { error: updateError } = await supabase
            .from('whatsapp_contacts')
            .update({
              name: clientData.name || `${clientData.first_name} ${clientData.last_name}`,
              email: clientData.email || existingContact.email,
              company: clientData.company || existingContact.company,
              notes: clientData.notes || existingContact.notes,
              contact_type: 'client',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingContact.id);

          if (updateError) {
            console.error('Error updating existing contact:', updateError);
            return {
              success: false,
              message: 'فشل في تحديث جهة الاتصال الموجودة',
              action: 'skipped'
            };
          }

          // ربط العميل بجهة الاتصال الموجودة
          const { error: linkError } = await supabase
            .from('land_clients')
            .update({ whatsapp_contact_id: existingContact.id })
            .eq('id', clientData.id);

          if (linkError) {
            console.error('Error linking client to contact:', linkError);
          }

          return {
            success: true,
            message: 'تم تحديث جهة الاتصال الموجودة بنجاح',
            action: 'updated',
            contactId: existingContact.id
          };
        }
      } else {
        // إنشاء جهة اتصال جديدة
        const { data: newContact, error: createError } = await supabase
          .from('whatsapp_contacts')
          .insert({
            name: clientData.name || `${clientData.first_name} ${clientData.last_name}`,
            phone: clientData.phone,
            email: clientData.email,
            company: clientData.company,
            notes: clientData.notes,
            contact_type: 'client',
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating new contact:', createError);
          return {
            success: false,
            message: 'فشل في إنشاء جهة اتصال جديدة',
            action: 'skipped'
          };
        }

        // ربط العميل بجهة الاتصال الجديدة
        const { error: linkError } = await supabase
          .from('land_clients')
          .update({ whatsapp_contact_id: newContact.id })
          .eq('id', clientData.id);

        if (linkError) {
          console.error('Error linking client to contact:', linkError);
        }

        return {
          success: true,
          message: 'تم إنشاء جهة اتصال جديدة بنجاح',
          action: 'created',
          contactId: newContact.id
        };
      }
    } catch (error) {
      console.error('Error syncing client to WhatsApp:', error);
      return {
        success: false,
        message: 'فشل في مزامنة العميل',
        action: 'skipped'
      };
    }
  }

  // مزامنة مالك العقار إلى WhatsApp مع حذف المكررات التلقائي
  static async syncOwnerToWhatsApp(ownerData: any): Promise<ContactSyncResult> {
    try {
      // التحقق من وجود الرقم في WhatsApp
      const { data: existingContact, error: searchError } = await supabase
        .from('whatsapp_contacts')
        .select('id, name, phone, email, company, notes, contact_type, created_at')
        .eq('phone', ownerData.phone)
        .single();

      if (existingContact) {
        // البحث عن المكررات وحذفها
        const { duplicatesToDelete, mergedData } = await this.findAndRemoveDuplicates(ownerData.phone, existingContact.id);
        
        if (duplicatesToDelete.length > 0) {
          // حذف المكررات
          for (const duplicate of duplicatesToDelete) {
            await supabase
              .from('whatsapp_contacts')
              .delete()
              .eq('id', duplicate.id);
          }
          
          // تحديث الجهة الأساسية بالبيانات المدمجة
          const { error: updateError } = await supabase
            .from('whatsapp_contacts')
            .update({
              name: mergedData.name || ownerData.name || `${ownerData.first_name} ${ownerData.last_name}`,
              email: mergedData.email || ownerData.email || existingContact.email,
              company: mergedData.company || ownerData.company || existingContact.company,
              notes: mergedData.notes || ownerData.notes || existingContact.notes,
              contact_type: 'owner',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingContact.id);

          if (updateError) {
            console.error('Error updating merged contact:', updateError);
            return {
              success: false,
              message: 'فشل في تحديث جهة الاتصال المدمجة',
              action: 'skipped'
            };
          }

          // ربط المالك بجهة الاتصال المحدثة
          const { error: linkError } = await supabase
            .from('property_owners')
            .update({ whatsapp_contact_id: existingContact.id })
            .eq('id', ownerData.id);

          if (linkError) {
            console.error('Error linking owner to contact:', linkError);
          }

          return {
            success: true,
            message: `تم دمج ${duplicatesToDelete.length} مكرر وتحديث البيانات`,
            action: 'merged',
            contactId: existingContact.id,
            mergedData: {
              deletedDuplicates: duplicatesToDelete.length,
              mergedFields: Object.keys(mergedData).filter(key => 
                mergedData[key] !== existingContact[key]
              )
            }
          };
        } else {
          // تحديث البيانات الموجودة فقط
          const { error: updateError } = await supabase
            .from('whatsapp_contacts')
            .update({
              name: ownerData.name || `${ownerData.first_name} ${ownerData.last_name}`,
              email: ownerData.email || existingContact.email,
              company: ownerData.company || existingContact.company,
              notes: ownerData.notes || existingContact.notes,
              contact_type: 'owner',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingContact.id);

          if (updateError) {
            console.error('Error updating existing contact:', updateError);
            return {
              success: false,
              message: 'فشل في تحديث جهة الاتصال الموجودة',
              action: 'skipped'
            };
          }

          // ربط المالك بجهة الاتصال الموجودة
          const { error: linkError } = await supabase
            .from('property_owners')
            .update({ whatsapp_contact_id: existingContact.id })
            .eq('id', ownerData.id);

          if (linkError) {
            console.error('Error linking owner to contact:', linkError);
          }

          return {
            success: true,
            message: 'تم تحديث جهة الاتصال الموجودة بنجاح',
            action: 'updated',
            contactId: existingContact.id
          };
        }
      } else {
        // إنشاء جهة اتصال جديدة
        const { data: newContact, error: createError } = await supabase
          .from('whatsapp_contacts')
          .insert({
            name: ownerData.name || `${ownerData.first_name} ${ownerData.last_name}`,
            phone: ownerData.phone,
            email: ownerData.email,
            company: ownerData.company,
            notes: ownerData.notes,
            contact_type: 'owner',
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating new contact:', createError);
          return {
            success: false,
            message: 'فشل في إنشاء جهة اتصال جديدة',
            action: 'skipped'
          };
        }

        // ربط المالك بجهة الاتصال الجديدة
        const { error: linkError } = await supabase
          .from('property_owners')
          .update({ whatsapp_contact_id: newContact.id })
          .eq('id', ownerData.id);

        if (linkError) {
          console.error('Error linking owner to contact:', linkError);
        }

        return {
          success: true,
          message: 'تم إنشاء جهة اتصال جديدة بنجاح',
          action: 'created',
          contactId: newContact.id
        };
      }
    } catch (error) {
      console.error('Error syncing owner to WhatsApp:', error);
      return {
        success: false,
        message: 'فشل في مزامنة المالك',
        action: 'skipped'
      };
    }
  }

  // مزامنة مستأجر إلى WhatsApp مع حذف المكررات التلقائي
  static async syncTenantToWhatsApp(tenantData: any): Promise<ContactSyncResult> {
    try {
      // التحقق من وجود الرقم في WhatsApp
      const { data: existingContact, error: searchError } = await supabase
        .from('whatsapp_contacts')
        .select('id, name, phone, email, company, notes, contact_type, created_at')
        .eq('phone', tenantData.phone)
        .single();

      if (existingContact) {
        // البحث عن المكررات وحذفها
        const { duplicatesToDelete, mergedData } = await this.findAndRemoveDuplicates(tenantData.phone, existingContact.id);
        
        if (duplicatesToDelete.length > 0) {
          // حذف المكررات
          for (const duplicate of duplicatesToDelete) {
            await supabase
              .from('whatsapp_contacts')
              .delete()
              .eq('id', duplicate.id);
          }
          
          // تحديث الجهة الأساسية بالبيانات المدمجة
          const { error: updateError } = await supabase
            .from('whatsapp_contacts')
            .update({
              name: mergedData.name || tenantData.name || `${tenantData.first_name} ${tenantData.last_name}`,
              email: mergedData.email || tenantData.email || existingContact.email,
              company: mergedData.company || tenantData.company || existingContact.company,
              notes: mergedData.notes || tenantData.notes || existingContact.notes,
              contact_type: 'tenant',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingContact.id);

          if (updateError) {
            console.error('Error updating merged contact:', updateError);
            return {
              success: false,
              message: 'فشل في تحديث جهة الاتصال المدمجة',
              action: 'skipped'
            };
          }

          // ربط المستأجر بجهة الاتصال المحدثة
          const { error: linkError } = await supabase
            .from('rental_tenants')
            .update({ whatsapp_contact_id: existingContact.id })
            .eq('id', tenantData.id);

          if (linkError) {
            console.error('Error linking tenant to contact:', linkError);
          }

          return {
            success: true,
            message: `تم دمج ${duplicatesToDelete.length} مكرر وتحديث البيانات`,
            action: 'merged',
            contactId: existingContact.id,
            mergedData: {
              deletedDuplicates: duplicatesToDelete.length,
              mergedFields: Object.keys(mergedData).filter(key => 
                mergedData[key] !== existingContact[key]
              )
            }
          };
        } else {
          // تحديث البيانات الموجودة فقط
          const { error: updateError } = await supabase
            .from('whatsapp_contacts')
            .update({
              name: tenantData.name || `${tenantData.first_name} ${tenantData.last_name}`,
              email: tenantData.email || existingContact.email,
              company: tenantData.company || existingContact.company,
              notes: tenantData.notes || existingContact.notes,
              contact_type: 'tenant',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingContact.id);

          if (updateError) {
            console.error('Error updating existing contact:', updateError);
            return {
              success: false,
              message: 'فشل في تحديث جهة الاتصال الموجودة',
              action: 'skipped'
            };
          }

          // ربط المستأجر بجهة الاتصال الموجودة
          const { error: linkError } = await supabase
            .from('rental_tenants')
            .update({ whatsapp_contact_id: existingContact.id })
            .eq('id', tenantData.id);

          if (linkError) {
            console.error('Error linking tenant to contact:', linkError);
          }

          return {
            success: true,
            message: 'تم تحديث جهة الاتصال الموجودة بنجاح',
            action: 'updated',
            contactId: existingContact.id
          };
        }
      } else {
        // إنشاء جهة اتصال جديدة
        const { data: newContact, error: createError } = await supabase
          .from('whatsapp_contacts')
          .insert({
            name: tenantData.name || `${tenantData.first_name} ${tenantData.last_name}`,
            phone: tenantData.phone,
            email: tenantData.email,
            company: tenantData.company,
            notes: tenantData.notes,
            contact_type: 'tenant',
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating new contact:', createError);
          return {
            success: false,
            message: 'فشل في إنشاء جهة الاتصال الجديدة',
            action: 'skipped'
          };
        }

        // ربط المستأجر بجهة الاتصال الجديدة
        const { error: linkError } = await supabase
          .from('rental_tenants')
          .update({ whatsapp_contact_id: newContact.id })
          .eq('id', tenantData.id);

        if (linkError) {
          console.error('Error linking tenant to contact:', linkError);
        }

        return {
          success: true,
          message: 'تم إنشاء جهة اتصال جديدة بنجاح',
          action: 'created',
          contactId: newContact.id
        };
      }
    } catch (error) {
      console.error('Error syncing tenant to WhatsApp:', error);
      return {
        success: false,
        message: 'فشل في مزامنة المستأجر',
        action: 'skipped'
      };
    }
  }

  // مزامنة WhatsApp إلى الجداول الأخرى
  static async syncWhatsAppToOthers(whatsappContact: any): Promise<ContactSyncResult> {
    try {
      // البحث عن الأرقام المطابقة في الجداول الأخرى
      const phone = whatsappContact.phone;
      
      // تحديث وسطاء الأرض
      const { data: brokers, error: brokersError } = await supabase
        .from('land_brokers')
        .select('id, whatsapp_contact_id')
        .eq('phone', phone);

      if (brokers && brokers.length > 0) {
        for (const broker of brokers) {
          if (!broker.whatsapp_contact_id) {
            await supabase
              .from('land_brokers')
              .update({ whatsapp_contact_id: whatsappContact.id })
              .eq('id', broker.id);
          }
        }
      }

      // تحديث عملاء الأرض
      const { data: clients, error: clientsError } = await supabase
        .from('land_clients')
        .select('id, whatsapp_contact_id')
        .eq('phone', phone);

      if (clients && clients.length > 0) {
        for (const client of clients) {
          if (!client.whatsapp_contact_id) {
            await supabase
              .from('land_clients')
              .update({ whatsapp_contact_id: whatsappContact.id })
              .eq('id', client.id);
          }
        }
      }

      // تحديث ملاك العقارات
      const { data: owners, error: ownersError } = await supabase
        .from('property_owners')
        .select('id, whatsapp_contact_id')
        .eq('phone', phone);

      if (owners && owners.length > 0) {
        for (const owner of owners) {
          if (!owner.whatsapp_contact_id) {
            await supabase
              .from('property_owners')
              .update({ whatsapp_contact_id: whatsappContact.id })
              .eq('id', owner.id);
          }
        }
      }

      // تحديث المستأجرين
      const { data: tenants, error: tenantsError } = await supabase
        .from('rental_tenants')
        .select('id, whatsapp_contact_id')
        .eq('phone', phone);

      if (tenants && tenants.length > 0) {
        for (const tenant of tenants) {
          if (!tenant.whatsapp_contact_id) {
            await supabase
              .from('rental_tenants')
              .update({ whatsapp_contact_id: whatsappContact.id })
              .eq('id', tenant.id);
          }
        }
      }

      return {
        success: true,
        message: 'تم مزامنة جهة الاتصال مع جميع الجداول بنجاح',
        action: 'updated',
        contactId: whatsappContact.id
      };

    } catch (error) {
      console.error('Error syncing WhatsApp to others:', error);
      return {
        success: false,
        message: 'فشل في مزامنة جهة الاتصال',
        action: 'skipped'
      };
    }
  }

  // مزامنة WhatsApp مع الوسطاء
  static async syncWhatsAppToBroker(): Promise<{ total_contacts: number; synced_contacts: number; pending_sync: number; sync_errors: number; brokers: number }> {
    try {
      const result = await this.getSyncStats();
      return { ...result, brokers: result.synced_contacts };
    } catch (error) {
      console.error('خطأ في مزامنة الوسطاء:', error);
      throw error;
    }
  }

  // مزامنة WhatsApp مع العملاء
  static async syncWhatsAppToClient(): Promise<{ total_contacts: number; synced_contacts: number; pending_sync: number; sync_errors: number; clients: number }> {
    try {
      const result = await this.getSyncStats();
      return { ...result, clients: result.synced_contacts };
    } catch (error) {
      console.error('خطأ في مزامنة العملاء:', error);
      throw error;
    }
  }

  // مزامنة WhatsApp مع الملاك
  static async syncWhatsAppToOwner(): Promise<{ total_contacts: number; synced_contacts: number; pending_sync: number; sync_errors: number; owners: number }> {
    try {
      const result = await this.getSyncStats();
      return { ...result, owners: result.synced_contacts };
    } catch (error) {
      console.error('خطأ في مزامنة الملاك:', error);
      throw error;
    }
  }

  // مزامنة WhatsApp مع المستأجرين
  static async syncWhatsAppToTenant(): Promise<{ total_contacts: number; synced_contacts: number; pending_sync: number; sync_errors: number; tenants: number }> {
    try {
      const result = await this.getSyncStats();
      return { ...result, tenants: result.synced_contacts };
    } catch (error) {
      console.error('خطأ في مزامنة المستأجرين:', error);
      throw error;
    }
  }

  // الحصول على إحصائيات المزامنة
  static async getSyncStats(): Promise<{
    total_contacts: number;
    synced_contacts: number;
    pending_sync: number;
    sync_errors: number;
  }> {
    try {
      // إجمالي جهات الاتصال
      const { count: totalContacts } = await supabase
        .from('whatsapp_contacts')
        .select('*', { count: 'exact', head: true });

      // جهات الاتصال المزامنة
      const { count: syncedContacts } = await supabase
        .from('whatsapp_contacts')
        .select('*', { count: 'exact', head: true })
        .not('whatsapp_contact_id', 'is', null);

      // جهات الاتصال التي تحتاج مزامنة
      const { count: pendingSync } = await supabase
        .from('whatsapp_contacts')
        .select('*', { count: 'exact', head: true })
        .is('whatsapp_contact_id', null);

      return {
        total_contacts: totalContacts || 0,
        synced_contacts: syncedContacts || 0,
        pending_sync: pendingSync || 0,
        sync_errors: 0
      };

    } catch (error) {
      console.error('Error getting sync stats:', error);
      return {
        total_contacts: 0,
        synced_contacts: 0,
        pending_sync: 0,
        sync_errors: 0
      };
    }
  }
}

// تصدير service كـ default export
const contactSyncService = new ContactSyncService();
export default contactSyncService;
