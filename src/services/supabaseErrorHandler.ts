import { toast } from '@/hooks/use-toast';
import { handleApiError } from './apiErrorHandler';
import { connectionManager } from './connectionManager';

interface SupabaseErrorOptions {
  showToast?: boolean;
  customMessage?: string;
  retryCallback?: () => void;
}

/**
 * Handles Supabase specific errors
 */
export function handleSupabaseError(error: any, options: SupabaseErrorOptions = {}) {
  const { showToast = true, customMessage, retryCallback } = options;
  
  console.error('Supabase error:', error);
  
  // Check if it's a network error
  if (error instanceof TypeError && error.message?.includes('Failed to fetch')) {
    // Check connection status
    connectionManager.checkConnectionAndNotify();
    
    if (showToast) {
      toast({
        title: 'خطأ في الاتصال بـ Supabase',
        description: customMessage || 'فشل الاتصال بخدمة Supabase. يرجى التحقق من اتصالك بالإنترنت.',
        variant: 'destructive',
        action: retryCallback ? {
          label: 'إعادة المحاولة',
          onClick: retryCallback,
        } : undefined,
      });
    }
    
    return;
  }
  
  // Check for aborted requests
  if (error.message?.includes('net::ERR_ABORTED')) {
    if (showToast) {
      toast({
        title: 'تم إلغاء الطلب',
        description: customMessage || 'تم إلغاء الطلب إلى Supabase. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
        action: retryCallback ? {
          label: 'إعادة المحاولة',
          onClick: retryCallback,
        } : undefined,
      });
    }
    
    return;
  }
  
  // Check for Supabase specific errors
  if (error.code) {
    let title = 'خطأ في Supabase';
    let description = customMessage || 'حدث خطأ أثناء الاتصال بـ Supabase.';
    
    switch (error.code) {
      case 'PGRST301':
        title = 'خطأ في الاستعلام';
        description = 'استعلام غير صالح. يرجى التحقق من معلمات الاستعلام.';
        break;
      case 'PGRST302':
        title = 'خطأ في الاستعلام';
        description = 'تم تجاوز الحد الأقصى للصفوف.';
        break;
      case '23505':
        title = 'تكرار البيانات';
        description = 'هذا العنصر موجود بالفعل.';
        break;
      case '23503':
        title = 'خطأ في المرجع';
        description = 'لا يمكن العثور على العنصر المرجعي.';
        break;
      case '42501':
        title = 'خطأ في الصلاحيات';
        description = 'ليس لديك صلاحية للقيام بهذا الإجراء.';
        break;
      case '42P01':
        title = 'خطأ في الجدول';
        description = 'الجدول غير موجود.';
        break;
      case '23514':
        title = 'خطأ في التحقق';
        description = 'فشل التحقق من صحة البيانات.';
        break;
    }
    
    if (showToast) {
      toast({
        title,
        description,
        variant: 'destructive',
        action: retryCallback ? {
          label: 'إعادة المحاولة',
          onClick: retryCallback,
        } : undefined,
      });
    }
    
    return;
  }
  
  // For other errors, use the general API error handler
  handleApiError(error, { showToast, customMessage, retryCallback });
}

/**
 * Creates a wrapper function that handles Supabase errors
 */
export function withSupabaseErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: SupabaseErrorOptions = {}
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleSupabaseError(error, {
        ...options,
        retryCallback: options.retryCallback || (() => withSupabaseErrorHandling(fn, options)(...args)),
      });
      throw error;
    }
  };
}