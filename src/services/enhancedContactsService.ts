import { supabase } from '@/integrations/supabase/client';
import { EnhancedContact, ContactInteraction, ContactFormData, ContactFilters } from '@/types/enhancedContacts';

export class EnhancedContactsService {
  // جلب جهات الاتصال مع البحث والفلترة
  static async getContacts(filters: ContactFilters = {}, limit = 50): Promise<EnhancedContact[]> {
    try {
      let query = supabase
        .from('enhanced_contacts')
        .select(`
          *,
          interaction_count:contact_interactions(count)
        `)
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(limit);

      // تطبيق الفلاتر
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,office_name.ilike.%${filters.search}%`);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.minRating) {
        query = query.gte('rating', filters.minRating);
      }

      if (filters.maxRating) {
        query = query.lte('rating', filters.maxRating);
      }

      if (filters.officeFilter) {
        query = query.ilike('office_name', `%${filters.officeFilter}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // تحويل البيانات وحساب عدد التفاعلات
      return (data || []).map(contact => ({
        ...contact,
        interaction_count: Array.isArray(contact.interaction_count) 
          ? contact.interaction_count.length 
          : 0
      }));
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  }

  // إضافة جهة اتصال جديدة
  static async createContact(contactData: ContactFormData): Promise<EnhancedContact> {
    try {
      const { data, error } = await supabase
        .from('enhanced_contacts')
        .insert([{
          ...contactData,
          created_by: (await supabase.auth.getUser()).data.user?.id
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

  // تحديث جهة اتصال
  static async updateContact(id: string, contactData: Partial<ContactFormData>): Promise<EnhancedContact> {
    try {
      const { data, error } = await supabase
        .from('enhanced_contacts')
        .update(contactData)
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

  // حذف جهة اتصال (deactivate)
  static async deleteContact(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('enhanced_contacts')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }

  // جلب جهة اتصال واحدة
  static async getContact(id: string): Promise<EnhancedContact | null> {
    try {
      const { data, error } = await supabase
        .from('enhanced_contacts')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching contact:', error);
      throw error;
    }
  }

  // إضافة تفاعل جديد
  static async addInteraction(
    contactId: string, 
    type: string, 
    notes?: string
  ): Promise<ContactInteraction> {
    try {
      const { data, error } = await supabase
        .from('contact_interactions')
        .insert([{
          contact_id: contactId,
          interaction_type: type,
          notes,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      // تحديث تاريخ آخر تواصل
      await supabase
        .from('enhanced_contacts')
        .update({ last_contact_date: new Date().toISOString() })
        .eq('id', contactId);

      return data;
    } catch (error) {
      console.error('Error adding interaction:', error);
      throw error;
    }
  }

  // جلب تفاعلات جهة اتصال
  static async getContactInteractions(contactId: string): Promise<ContactInteraction[]> {
    try {
      const { data, error } = await supabase
        .from('contact_interactions')
        .select('*')
        .eq('contact_id', contactId)
        .order('interaction_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching interactions:', error);
      throw error;
    }
  }

  // إحصائيات جهات الاتصال
  static async getContactStats() {
    try {
      const { data: totalContacts, error: totalError } = await supabase
        .from('enhanced_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (totalError) throw totalError;

      const { data: categoryStats, error: categoryError } = await supabase
        .from('enhanced_contacts')
        .select('category')
        .eq('is_active', true);

      if (categoryError) throw categoryError;

      const { data: ratingStats, error: ratingError } = await supabase
        .from('enhanced_contacts')
        .select('rating')
        .eq('is_active', true);

      if (ratingError) throw ratingError;

      // تجميع الإحصائيات
      const categoryCounts = (categoryStats || []).reduce((acc: Record<string, number>, contact) => {
        acc[contact.category] = (acc[contact.category] || 0) + 1;
        return acc;
      }, {});

      const ratingCounts = (ratingStats || []).reduce((acc: Record<number, number>, contact) => {
        acc[contact.rating] = (acc[contact.rating] || 0) + 1;
        return acc;
      }, {});

      const averageRating = ratingStats && ratingStats.length > 0
        ? ratingStats.reduce((sum, contact) => sum + contact.rating, 0) / ratingStats.length
        : 0;

      return {
        totalContacts: totalContacts?.length || 0,
        categoryCounts,
        ratingCounts,
        averageRating: Math.round(averageRating * 10) / 10
      };
    } catch (error) {
      console.error('Error fetching contact stats:', error);
      throw error;
    }
  }

  // البحث المتقدم باستخدام دالة قاعدة البيانات
  static async searchAdvanced(
    searchTerm = '',
    category?: string,
    minRating = 1,
    maxRating = 5,
    officeFilter = '',
    limitCount = 50
  ): Promise<EnhancedContact[]> {
    try {
      const { data, error } = await supabase.rpc('search_enhanced_contacts', {
        search_term: searchTerm,
        contact_category: category || null,
        min_rating: minRating,
        max_rating: maxRating,
        office_filter: officeFilter,
        limit_count: limitCount
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in advanced search:', error);
      throw error;
    }
  }

  // تصدير جهات الاتصال
  static async exportContacts(format: 'csv' | 'json' = 'csv'): Promise<string> {
    try {
      const contacts = await this.getContacts({}, 1000); // جلب أول 1000 جهة اتصال

      if (format === 'json') {
        return JSON.stringify(contacts, null, 2);
      }

      // تصدير CSV
      const headers = [
        'الاسم', 'الهاتف', 'الواتساب', 'التصنيف', 'التقييم', 
        'اسم المكتب', 'نبذة', 'البريد الإلكتروني', 'العنوان', 
        'تاريخ الإنشاء', 'آخر تواصل'
      ];

      const csvData = contacts.map(contact => [
        contact.name,
        contact.phone,
        contact.whatsapp_number || '',
        contact.category,
        contact.rating,
        contact.office_name || '',
        contact.about || '',
        contact.email || '',
        contact.address || '',
        new Date(contact.created_at).toLocaleDateString('ar-SA'),
        contact.last_contact_date 
          ? new Date(contact.last_contact_date).toLocaleDateString('ar-SA')
          : ''
      ]);

      return [headers, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    } catch (error) {
      console.error('Error exporting contacts:', error);
      throw error;
    }
  }
}