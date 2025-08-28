import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ContactSyncOptions {
  enableAutoSync?: boolean;
  mergeDuplicates?: boolean;
}

export function useContactSync(options: ContactSyncOptions = {}) {
  const queryClient = useQueryClient();
  const { enableAutoSync = true, mergeDuplicates = true } = options;

  // دالة مزامنة جهة اتصال جديدة من جداول أخرى
  const syncContactFromOtherTables = async (source: string, data: any) => {
    try {
      console.log(`🔄 [ContactSync] Syncing from ${source}:`, data);

      // البحث عن جهة اتصال مشابهة
      const existingContact = await findSimilarContact(data);
      
      if (existingContact && mergeDuplicates) {
        // دمج البيانات مع جهة الاتصال الموجودة
        await mergeContactData(existingContact.id, data, source);
        toast({
          title: "تم دمج البيانات",
          description: `تم دمج بيانات ${data.name} مع جهة اتصال موجودة`
        });
      } else if (!existingContact) {
        // إنشاء جهة اتصال جديدة
        await createContactFromExternalSource(data, source);
        toast({
          title: "تم إضافة جهة اتصال جديدة",
          description: `تم إضافة ${data.name} إلى مركز جهات الاتصال`
        });
      }

      // تحديث الاستعلامات
      queryClient.invalidateQueries({ queryKey: ['enhanced-contacts'] });
      
    } catch (error) {
      console.error(`❌ [ContactSync] Error syncing from ${source}:`, error);
      toast({
        title: "خطأ في المزامنة",
        description: "حدث خطأ أثناء مزامنة جهة الاتصال",
        variant: "destructive"
      });
    }
  };

  // البحث عن جهة اتصال مشابهة
  const findSimilarContact = async (data: any) => {
    const searchTerms = [
      data.name,
      data.full_name,
      data.phone,
      data.mobile_numbers?.[0],
      data.email
    ].filter(Boolean);

    if (searchTerms.length === 0) return null;

    const { data: contacts, error } = await supabase
      .from('enhanced_contacts')
      .select(`
        *,
        enhanced_contact_channels(*)
      `)
      .or(
        searchTerms.map(term => 
          `name.ilike.%${term}%,enhanced_contact_channels.value.ilike.%${term}%`
        ).join(',')
      )
      .eq('is_duplicate', false)
      .limit(1);

    if (error) throw error;
    return contacts?.[0] || null;
  };

  // دمج البيانات مع جهة اتصال موجودة
  const mergeContactData = async (contactId: string, newData: any, source: string) => {
    const updates: any = {};
    
    // دمج الأدوار
    const { data: existingContact } = await supabase
      .from('enhanced_contacts')
      .select('roles, metadata')
      .eq('id', contactId)
      .single();

    if (existingContact) {
      const newRole = mapSourceToRole(source);
      const existingRoles = existingContact.roles || [];
      
      if (newRole && !existingRoles.includes(newRole)) {
        updates.roles = [...existingRoles, newRole];
      }

      // دمج البيانات الوصفية
      updates.metadata = {
        ...existingContact.metadata,
        [source]: {
          synced_at: new Date().toISOString(),
          original_data: newData
        }
      };
    }

    // تحديث جهة الاتصال
    const { error } = await supabase
      .from('enhanced_contacts')
      .update(updates)
      .eq('id', contactId);

    if (error) throw error;

    // إضافة قناة اتصال جديدة إذا لزم الأمر
    if (newData.phone || newData.mobile_numbers?.[0]) {
      await addContactChannel(contactId, {
        channel_type: 'phone',
        value: newData.phone || newData.mobile_numbers?.[0],
        label: `${source} - هاتف`,
        is_primary: false,
        is_active: true
      });
    }
  };

  // إنشاء جهة اتصال من مصدر خارجي
  const createContactFromExternalSource = async (data: any, source: string) => {
    const contactData = {
      name: data.name || data.full_name || 'جهة اتصال جديدة',
      short_name: data.short_name || data.name?.split(' ')[0] || '',
      company_name: data.company || data.company_name,
      office: data.office,
      bio: data.bio || data.notes,
      roles: [mapSourceToRole(source)].filter(Boolean),
      status: 'active' as const,
      follow_up_status: 'new' as const,
      priority: 'medium' as const,
      tags: [`sync-${source}`],
      metadata: {
        [source]: {
          synced_at: new Date().toISOString(),
          original_data: data,
          source_id: data.id
        }
      }
    };

    const { data: contact, error } = await supabase
      .from('enhanced_contacts')
      .insert(contactData)
      .select()
      .single();

    if (error) throw error;

    // إضافة قنوات الاتصال
    const channels = [];
    
    if (data.phone || data.mobile_numbers?.[0]) {
      channels.push({
        contact_id: contact.id,
        channel_type: 'phone',
        value: data.phone || data.mobile_numbers[0],
        label: 'هاتف رئيسي',
        is_primary: true,
        is_active: true,
        preferred_for_calls: true,
        preferred_for_messages: true
      });
    }

    if (data.email) {
      channels.push({
        contact_id: contact.id,
        channel_type: 'email',
        value: data.email,
        label: 'بريد إلكتروني',
        is_primary: false,
        is_active: true,
        preferred_for_emails: true
      });
    }

    if (channels.length > 0) {
      await supabase
        .from('enhanced_contact_channels')
        .insert(channels);
    }

    return contact;
  };

  // إضافة قناة اتصال
  const addContactChannel = async (contactId: string, channelData: any) => {
    // التحقق من عدم وجود قناة مماثلة
    const { data: existing } = await supabase
      .from('enhanced_contact_channels')
      .select('id')
      .eq('contact_id', contactId)
      .eq('channel_type', channelData.channel_type)
      .eq('value', channelData.value)
      .single();

    if (!existing) {
      await supabase
        .from('enhanced_contact_channels')
        .insert({ contact_id: contactId, ...channelData });
    }
  };

  // تحويل المصدر إلى دور
  const mapSourceToRole = (source: string): string => {
    const mapping: Record<string, string> = {
      'clients': 'client',
      'land_brokers': 'broker',
      'property_owners': 'landlord',
      'rental_property_owners': 'landlord',
      'land_clients': 'buyer',
      'tenants': 'tenant'
    };
    return mapping[source] || 'contact';
  };

  // مزامنة الاستعلامات عند التحديث
  useEffect(() => {
    if (!enableAutoSync) return;

    const channels = [
      supabase
        .channel('contact-sync-clients')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'clients'
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            syncContactFromOtherTables('clients', payload.new);
          }
        }),

      supabase
        .channel('contact-sync-brokers')
        .on('postgres_changes', {
          event: '*', 
          schema: 'public',
          table: 'land_brokers'
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            syncContactFromOtherTables('land_brokers', payload.new);
          }
        }),

      supabase
        .channel('contact-sync-owners')
        .on('postgres_changes', {
          event: '*',
          schema: 'public', 
          table: 'property_owners'
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            syncContactFromOtherTables('property_owners', payload.new);
          }
        })
    ];

    channels.forEach(channel => channel.subscribe());

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [enableAutoSync, mergeDuplicates]);

  return {
    syncContactFromOtherTables,
    findSimilarContact,
    mergeContactData,
    createContactFromExternalSource
  };
}