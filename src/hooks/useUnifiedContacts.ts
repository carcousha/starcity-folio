import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UnifiedContactService, SyncResult } from '../services/unifiedContactService';
import { EnhancedContact } from '@/types/contact';
import { toast } from 'sonner';
import { handleNetworkError, withErrorHandling } from '@/services/networkErrorHandler';

export interface ContactFilters {
  role?: string;
  status?: string;
  search?: string;
  source?: string;
}

/**
 * Hook لإدارة جهات الاتصال الموحدة
 */
export const useUnifiedContacts = (filters?: ContactFilters) => {
  const queryClient = useQueryClient();

  // جلب جهات الاتصال
  const {
    data: contactsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['unified-contacts', filters],
    queryFn: withErrorHandling(
      () => UnifiedContactService.getContacts(filters),
      {
        retry: { maxRetries: 3, retryDelay: 2000 },
        errorMessage: 'فشل في جلب جهات الاتصال. يرجى التحقق من اتصالك بالإنترنت.'
      }
    ),
    staleTime: 5 * 60 * 1000, // 5 دقائق
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      handleNetworkError(error, 'فشل في جلب جهات الاتصال');
    }
  });

  const contacts = contactsData?.data || [];

  // مزامنة جميع البيانات
  const syncAllMutation = useMutation({
    mutationFn: withErrorHandling(
      UnifiedContactService.syncAllContacts,
      {
        retry: { maxRetries: 3, retryDelay: 2000 },
        errorMessage: 'فشل في مزامنة جهات الاتصال. يرجى المحاولة مرة أخرى.'
      }
    ),
    onSuccess: (result: SyncResult) => {
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ['unified-contacts'] });
      } else {
        toast.error(result.message);
        if (result.errors) {
          result.errors.forEach(error => toast.error(error));
        }
      }
    },
    onError: (error) => {
      handleNetworkError(error, 'خطأ في مزامنة جميع جهات الاتصال');
    },
    retry: 2
  });

  // مزامنة العملاء
  const syncClientsMutation = useMutation({
    mutationFn: withErrorHandling(
      UnifiedContactService.syncClients,
      {
        retry: { maxRetries: 3, retryDelay: 2000 },
        errorMessage: 'فشل في مزامنة العملاء. يرجى المحاولة مرة أخرى.'
      }
    ),
    onSuccess: (result: SyncResult) => {
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ['unified-contacts'] });
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      handleNetworkError(error, 'خطأ في مزامنة العملاء');
    },
    retry: 2
  });

  // مزامنة الوسطاء
  const syncBrokersMutation = useMutation({
    mutationFn: withErrorHandling(
      UnifiedContactService.syncBrokers,
      {
        retry: { maxRetries: 3, retryDelay: 2000 },
        errorMessage: 'فشل في مزامنة الوسطاء. يرجى المحاولة مرة أخرى.'
      }
    ),
    onSuccess: (result: SyncResult) => {
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ['unified-contacts'] });
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      handleNetworkError(error, 'خطأ في مزامنة الوسطاء');
    },
    retry: 2
  });

  // مزامنة الملاك
  const syncOwnersMutation = useMutation({
    mutationFn: withErrorHandling(
      UnifiedContactService.syncPropertyOwners,
      {
        retry: { maxRetries: 3, retryDelay: 2000 },
        errorMessage: 'فشل في مزامنة الملاك. يرجى المحاولة مرة أخرى.'
      }
    ),
    onSuccess: (result: SyncResult) => {
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ['unified-contacts'] });
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      handleNetworkError(error, 'خطأ في مزامنة الملاك');
    },
    retry: 2
  });

  // مزامنة المستأجرين
  const syncTenantsMutation = useMutation({
    mutationFn: withErrorHandling(
      UnifiedContactService.syncTenants,
      {
        retry: { maxRetries: 3, retryDelay: 2000 },
        errorMessage: 'فشل في مزامنة المستأجرين. يرجى المحاولة مرة أخرى.'
      }
    ),
    onSuccess: (result: SyncResult) => {
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ['unified-contacts'] });
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      handleNetworkError(error, 'خطأ في مزامنة المستأجرين');
    },
    retry: 2
  });

  // إضافة جهة اتصال جديدة
  const addContactMutation = useMutation({
    mutationFn: (contact: Partial<EnhancedContact>) => 
      UnifiedContactService.addContact(contact),
    onSuccess: (result: SyncResult) => {
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ['unified-contacts'] });
      } else {
        toast.error(result.message);
      }
    }
  });

  // تحديث جهة اتصال
  const updateContactMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<EnhancedContact> }) => 
      UnifiedContactService.updateContact(id, updates),
    onSuccess: (result: SyncResult) => {
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ['unified-contacts'] });
      } else {
        toast.error(result.message);
      }
    }
  });

  // حذف جهة اتصال
  const deleteContactMutation = useMutation({
    mutationFn: (id: string) => UnifiedContactService.deleteContact(id),
    onSuccess: (result: SyncResult) => {
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ['unified-contacts'] });
      } else {
        toast.error(result.message);
      }
    }
  });

  return {
    // البيانات
    contacts,
    isLoading,
    error,
    refetch,
    
    // وظائف المزامنة
    syncAll: syncAllMutation.mutate,
    syncClients: syncClientsMutation.mutate,
    syncBrokers: syncBrokersMutation.mutate,
    syncOwners: syncOwnersMutation.mutate,
    syncTenants: syncTenantsMutation.mutate,
    
    // حالات المزامنة
    isSyncing: syncAllMutation.isPending || 
               syncClientsMutation.isPending || 
               syncBrokersMutation.isPending || 
               syncOwnersMutation.isPending || 
               syncTenantsMutation.isPending,
    
    // وظائف إدارة جهات الاتصال
    addContact: addContactMutation.mutate,
    updateContact: updateContactMutation.mutate,
    deleteContact: deleteContactMutation.mutate,
    
    // حالات العمليات
    isAdding: addContactMutation.isPending,
    isUpdating: updateContactMutation.isPending,
    isDeleting: deleteContactMutation.isPending,
  };
};

/**
 * Hook للحصول على إحصائيات جهات الاتصال
 */
export const useContactStats = () => {
  const { contacts } = useUnifiedContacts();
  
  const stats = {
    total: contacts.length,
    clients: contacts.filter(c => c.roles?.includes('client')).length,
    brokers: contacts.filter(c => c.roles?.includes('broker')).length,
    owners: contacts.filter(c => c.roles?.includes('owner')).length,
    tenants: contacts.filter(c => c.roles?.includes('tenant')).length,
    active: contacts.filter(c => c.status === 'active').length,
    inactive: contacts.filter(c => c.status === 'inactive').length,
  };
  
  return stats;
};

/**
 * Hook للمزامنة التلقائية عند تحميل الصفحة
 */
export const useAutoSync = (enabled: boolean = true) => {
  const [hasAutoSynced, setHasAutoSynced] = useState(false);
  const { syncAll, isSyncing } = useUnifiedContacts();
  
  useEffect(() => {
    if (enabled && !hasAutoSynced && !isSyncing) {
      // تأخير المزامنة لثانيتين بعد تحميل الصفحة
      const timer = setTimeout(() => {
        syncAll();
        setHasAutoSynced(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [enabled, hasAutoSynced, isSyncing, syncAll]);
  
  return { hasAutoSynced, isSyncing };
};