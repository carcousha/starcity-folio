import { toast } from '@/hooks/use-toast';
import { connectionManager } from './connectionManager';
import { appErrorHandler } from './appErrorHandler';

interface ApiErrorOptions {
  showToast?: boolean;
  customMessage?: string;
  retryCallback?: () => void;
}

/**
 * Handles API errors with appropriate user feedback and logging
 */
export function handleApiError(error: any, options: ApiErrorOptions = {}) {
  const { showToast = true, customMessage, retryCallback } = options;
  
  console.error('API Error:', error);
  
  // Check if it's a network error
  if (error instanceof TypeError && error.message?.includes('Failed to fetch')) {
    // Check connection status
    connectionManager.checkConnectionAndNotify();
    
    if (showToast) {
      toast({
        title: 'خطأ في الاتصال',
        description: customMessage || 'فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.',
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
  if (error.name === 'AbortError' || error.message?.includes('net::ERR_ABORTED')) {
    if (showToast) {
      toast({
        title: 'تم إلغاء الطلب',
        description: customMessage || 'تم إلغاء الطلب. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
        action: retryCallback ? {
          label: 'إعادة المحاولة',
          onClick: retryCallback,
        } : undefined,
      });
    }
    
    return;
  }
  
  // Check for server errors
  if (error.status >= 500 || error.message?.includes('Internal Server Error')) {
    if (showToast) {
      toast({
        title: 'خطأ في الخادم',
        description: customMessage || 'حدث خطأ داخلي في الخادم. يرجى المحاولة مرة أخرى لاحقًا.',
        variant: 'destructive',
        action: retryCallback ? {
          label: 'إعادة المحاولة',
          onClick: retryCallback,
        } : undefined,
      });
    }
    
    // Log to app error handler for tracking
    appErrorHandler.handleError(error, customMessage);
    
    return;
  }
  
  // Check for rate limiting
  if (error.status === 429) {
    if (showToast) {
      toast({
        title: 'طلبات كثيرة جدًا',
        description: customMessage || 'تم إرسال الكثير من الطلبات. يرجى الانتظار قليلاً والمحاولة مرة أخرى.',
        variant: 'destructive',
      });
    }
    
    return;
  }
  
  // Check for authentication errors
  if (error.status === 401) {
    if (showToast) {
      toast({
        title: 'خطأ في المصادقة',
        description: customMessage || 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.',
        variant: 'destructive',
      });
    }
    
    // Redirect to login page after a short delay
    setTimeout(() => {
      window.location.href = '/auth/login';
    }, 2000);
    
    return;
  }
  
  // Check for permission errors
  if (error.status === 403) {
    if (showToast) {
      toast({
        title: 'غير مصرح',
        description: customMessage || 'ليس لديك صلاحية للوصول إلى هذا المورد.',
        variant: 'destructive',
      });
    }
    
    return;
  }
  
  // Check for not found errors
  if (error.status === 404) {
    if (showToast) {
      toast({
        title: 'غير موجود',
        description: customMessage || 'المورد المطلوب غير موجود.',
        variant: 'destructive',
      });
    }
    
    return;
  }
  
  // Default error handling
  if (showToast) {
    toast({
      title: 'خطأ',
      description: customMessage || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
      variant: 'destructive',
      action: retryCallback ? {
        label: 'إعادة المحاولة',
        onClick: retryCallback,
      } : undefined,
    });
  }
  
  // Log to app error handler for tracking
  appErrorHandler.handleError(error, customMessage);
}

/**
 * Creates a wrapper function that handles API errors
 */
export function withApiErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: ApiErrorOptions = {}
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleApiError(error, {
        ...options,
        retryCallback: options.retryCallback || (() => withApiErrorHandling(fn, options)(...args)),
      });
      throw error;
    }
  };
}