import { useState, useCallback } from 'react';
import { ContactSyncService } from '@/services/contactSyncService';
import { Database } from '@/integrations/supabase/types';

type Contact = Database['public']['Tables']['enhanced_contacts']['Row'];

interface SyncResult {
  success: boolean;
  error?: any;
  contactId?: string;
  data?: any;
}

/**
 * Hook مخصص لإدارة مزامنة جهات الاتصال
 */
export const useContactSync = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * مزامنة جهة اتصال مع الصفحات الأخرى
   */
  const syncContactToPages = useCallback(async (contactId: string, contactData: Contact): Promise<SyncResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await ContactSyncService.syncContactToPages(contactId, contactData);
      
      if (!result.success) {
        setError('فشل في مزامنة جهة الاتصال');
      }
      
      return result;
    } catch (err) {
      const errorMessage = 'حدث خطأ أثناء المزامنة';
      setError(errorMessage);
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * مزامنة عكسية من الصفحات إلى جهات الاتصال
   */
  const syncFromPageToContact = useCallback(async (
    pageType: string, 
    pageData: any, 
    contactId?: string
  ): Promise<SyncResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await ContactSyncService.syncFromPageToContact(pageType, pageData, contactId);
      
      if (!result.success) {
        setError('فشل في المزامنة العكسية');
      }
      
      return result;
    } catch (err) {
      const errorMessage = 'حدث خطأ أثناء المزامنة العكسية';
      setError(errorMessage);
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * حذف السجلات المزامنة
   */
  const deleteSyncedRecords = useCallback(async (contactId: string): Promise<SyncResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await ContactSyncService.deleteSyncedRecords(contactId);
      
      if (!result.success) {
        setError('فشل في حذف السجلات المزامنة');
      }
      
      return result;
    } catch (err) {
      const errorMessage = 'حدث خطأ أثناء حذف السجلات';
      setError(errorMessage);
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * إعداد المزامنة في الوقت الفعلي
   */
  const setupRealtimeSync = useCallback(() => {
    ContactSyncService.setupRealtimeSync();
  }, []);

  /**
   * مسح الأخطاء
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // دالة مبسطة للمزامنة العامة
  const syncContact = useCallback(async (contactId: string) => {
    return await syncContactToPages(contactId, {} as Contact);
  }, [syncContactToPages]);

  return {
    isLoading,
    error,
    syncContact,
    syncContactToPages,
    syncFromPageToContact,
    deleteSyncedRecords,
    setupRealtimeSync,
    clearError
  };
};

export default useContactSync;