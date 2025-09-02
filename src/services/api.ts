import { handleApiError, withApiErrorHandling } from './apiErrorHandler';
import { connectionManager } from './connectionManager';

interface ApiOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  handleError?: boolean;
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY = 1000; // 1 second

/**
 * Enhanced fetch function with timeout, retries, and error handling
 */
async function enhancedFetch(
  url: string,
  options: ApiOptions = {}
): Promise<Response> {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    handleError = true,
    ...fetchOptions
  } = options;

  // Create abort controller for timeout
  const controller = new AbortController();
  const { signal } = controller;

  // Set timeout
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Check connection before making request
    if (!connectionManager.isOnline()) {
      await connectionManager.checkConnectionAndNotify();
    }

    // Try to fetch with retries
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= retries) {
      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal,
        });

        // Check if response is ok
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error: any) {
        lastError = error;

        // Don't retry if aborted or if we've reached max retries
        if (error.name === 'AbortError' || attempt >= retries) {
          throw error;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        attempt++;
      }
    }

    throw lastError;
  } catch (error) {
    if (handleError) {
      handleApiError(error);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * API client with enhanced fetch and error handling
 */
export const api = {
  /**
   * Performs a GET request
   */
  get: withApiErrorHandling(async <T>(url: string, options: ApiOptions = {}): Promise<T> => {
    const response = await enhancedFetch(url, {
      method: 'GET',
      ...options,
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
    });
    return await response.json();
  }),

  /**
   * Performs a POST request
   */
  post: withApiErrorHandling(async <T>(url: string, data: any, options: ApiOptions = {}): Promise<T> => {
    const response = await enhancedFetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });
    return await response.json();
  }),

  /**
   * Performs a PUT request
   */
  put: withApiErrorHandling(async <T>(url: string, data: any, options: ApiOptions = {}): Promise<T> => {
    const response = await enhancedFetch(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });
    return await response.json();
  }),

  /**
   * Performs a PATCH request
   */
  patch: withApiErrorHandling(async <T>(url: string, data: any, options: ApiOptions = {}): Promise<T> => {
    const response = await enhancedFetch(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });
    return await response.json();
  }),

  /**
   * Performs a DELETE request
   */
  delete: withApiErrorHandling(async <T>(url: string, options: ApiOptions = {}): Promise<T> => {
    const response = await enhancedFetch(url, {
      method: 'DELETE',
      ...options,
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
    });
    return await response.json();
  }),
};