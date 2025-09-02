// Network Error Handler Service
import { toast } from '@/hooks/use-toast';

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number, error: any) => void;
  shouldRetry?: (error: any) => boolean;
}

const defaultRetryOptions: RetryOptions = {
  maxRetries: 3,
  retryDelay: 1000,
  onRetry: (attempt, error) => {
    console.log(`Retry attempt ${attempt} after error:`, error);
  },
  shouldRetry: (error) => {
    // By default, retry on network errors and 5xx server errors
    return (
      error instanceof TypeError ||
      (error.status && error.status >= 500) ||
      error.message === 'Failed to fetch' ||
      error.message?.includes('network') ||
      error.message?.includes('net::ERR_ABORTED') ||
      error.message?.includes('Internal Server Error') ||
      error.code === 'ECONNREFUSED'
    );
  },
};

/**
 * Executes a fetch request with automatic retry logic for network errors
 */
export async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries, retryDelay, onRetry, shouldRetry } = {
    ...defaultRetryOptions,
    ...options,
  };

  let lastError: any;
  let attempt = 0;

  while (attempt <= maxRetries!) {
    try {
      if (attempt > 0) {
        // Only show toast on retry attempts, not the first try
        toast({
          title: `Retrying connection (${attempt}/${maxRetries})`,
          description: 'Network connection issue detected. Attempting to reconnect...',
          variant: 'default',
        });
      }

      return await fetchFn();
    } catch (error: any) {
      lastError = error;
      
      // Check if we should retry this error
      if (!shouldRetry!(error) || attempt >= maxRetries!) {
        break;
      }

      // Call the onRetry callback
      onRetry!(attempt + 1, error);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      attempt++;
    }
  }

  // If we've exhausted all retries, show an error toast
  if (attempt > 0) {
    toast({
      title: 'Connection failed',
      description: 'Unable to connect to the server after multiple attempts. Please check your internet connection.',
      variant: 'destructive',
    });
  }

  throw lastError;
}

/**
 * Handles network errors with user-friendly messages
 */
export function handleNetworkError(error: any, customMessage?: string): void {
  console.error('Network error:', error);

  let title = 'Connection Error';
  let description = customMessage || 'Unable to connect to the server. Please check your internet connection.';

  if (error.message === 'Failed to fetch' || error.message?.includes('Failed to fetch')) {
    description = 'فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.';
  } else if (error.name === 'AbortError' || error.message?.includes('net::ERR_ABORTED')) {
    title = 'تم إلغاء الطلب';
    description = 'تم إلغاء الطلب. يرجى التحقق من اتصالك بالإنترنت أو المحاولة مرة أخرى.';
  } else if (error.status === 429) {
    title = 'طلبات كثيرة جدًا';
    description = 'تم إرسال الكثير من الطلبات. يرجى الانتظار قليلاً والمحاولة مرة أخرى.';
  } else if (error.message?.includes('Internal Server Error') || error.status === 500) {
    title = 'خطأ في الخادم';
    description = 'حدث خطأ داخلي في الخادم. يرجى المحاولة مرة أخرى لاحقًا.';
  } else if (error.status >= 500) {
    title = 'Server Error';
    description = 'The server encountered an error. Please try again later.';
  }

  toast({
    title,
    description,
    variant: 'destructive',
  });
}

/**
 * Wraps a function with retry logic and error handling
 */
export function withErrorHandling<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  options: {
    retry?: RetryOptions;
    errorMessage?: string;
  } = {}
): (...args: Args) => Promise<T> {
  return async (...args: Args) => {
    try {
      return await fetchWithRetry(() => fn(...args), options.retry);
    } catch (error) {
      handleNetworkError(error, options.errorMessage);
      throw error;
    }
  };
}