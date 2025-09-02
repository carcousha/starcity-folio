// App Error Handler Service
import { toast } from '@/hooks/use-toast';

interface ErrorHandlerOptions {
  maxErrors?: number;
  resetInterval?: number;
  shouldReload?: (error: any) => boolean;
}

class AppErrorHandler {
  private errorCount: number = 0;
  private networkErrorCount: number = 0;
  private serverErrorCount: number = 0;
  private chunkLoadErrorCount: number = 0;
  private lastErrorTime: number = 0;
  private options: Required<ErrorHandlerOptions>;
  private isReloading: boolean = false;

  constructor(options: ErrorHandlerOptions = {}) {
    this.options = {
      maxErrors: options.maxErrors ?? 3,
      resetInterval: options.resetInterval ?? 60000, // 1 minute
      shouldReload: options.shouldReload ?? this.defaultShouldReload,
    };

    // Listen for unhandled errors
    window.addEventListener('error', this.handleGlobalError);
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  private defaultShouldReload(error: any): boolean {
    // Default logic for determining if app should reload
    const errorMessage = error?.message || error?.toString() || '';
    
    return (
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('Network Error') ||
      errorMessage.includes('ERR_ABORTED') ||
      errorMessage.includes('Internal Server Error') ||
      errorMessage.includes('ChunkLoadError') ||
      errorMessage.includes('Loading chunk') ||
      errorMessage.includes('dynamically imported module')
    );
  }

  private handleGlobalError = (event: ErrorEvent) => {
    this.processError(event.error || event.message);
  }

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    this.processError(event.reason);
  }

  public handleError = (error: any, customMessage?: string) => {
    // Categorize the error
    if (error instanceof TypeError && error.message?.includes('Failed to fetch')) {
      this.networkErrorCount++;
      customMessage = customMessage || 'فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.';
    } else if (error?.status >= 500 || (error?.message && error.message.includes('500'))) {
      this.serverErrorCount++;
      customMessage = customMessage || 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقًا.';
    } else if (error?.message && error.message.includes('Loading chunk')) {
      this.chunkLoadErrorCount++;
      customMessage = customMessage || 'فشل تحميل جزء من التطبيق. سيتم إعادة التحميل تلقائيًا.';
    } else if (error?.message && error.message.includes('net::ERR_ABORTED')) {
      this.networkErrorCount++;
      customMessage = customMessage || 'تم إلغاء الطلب. يرجى التحقق من اتصالك بالإنترنت.';
    } else if (error?.message && error.message.includes('Internal Server Error')) {
      this.serverErrorCount++;
      customMessage = customMessage || 'خطأ داخلي في الخادم. يرجى المحاولة مرة أخرى لاحقًا.';
    }
    
    this.processError(error, customMessage);
  }

  private processError(error: any, customMessage?: string) {
    const now = Date.now();
    const timeSinceLastError = now - this.lastErrorTime;

    // Reset error count if it's been a while since the last error
    if (timeSinceLastError > this.options.resetInterval) {
      this.errorCount = 0;
    }

    this.lastErrorTime = now;
    this.errorCount++;

    // Log the error
    console.error('Application error:', error);

    // Show toast notification for all errors
    if (!this.isReloading) {
      toast({
        title: 'خطأ',
        description: customMessage || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    }

    // Check if we should reload
    if (
      !this.isReloading &&
      this.errorCount >= this.options.maxErrors &&
      this.options.shouldReload(error)
    ) {
      this.prepareForReload(customMessage);
    }
  }

  private prepareForReload(customMessage?: string) {
    this.isReloading = true;

    // Show toast notification
    toast({
      title: 'إعادة تحميل التطبيق',
      description: 'سيتم إعادة تحميل التطبيق تلقائيًا بعد 5 ثوانٍ لحل المشكلة.',
      variant: 'default',
    });

    // Reload after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 5000);
  }

  public dispose() {
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }
}

// Create a singleton instance
export const appErrorHandler = new AppErrorHandler();

// Utility function for components to use
export function handleAppError(error: any, customMessage?: string) {
  appErrorHandler.handleError(error, customMessage);
}