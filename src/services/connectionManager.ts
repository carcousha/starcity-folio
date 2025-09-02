import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export enum ConnectionStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  RECONNECTING = 'reconnecting',
}

export class ConnectionManager {
  private status: ConnectionStatus = navigator.onLine ? ConnectionStatus.ONLINE : ConnectionStatus.OFFLINE;
  private listeners: ((status: ConnectionStatus) => void)[] = [];
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 5000; // 5 seconds
  private reconnectTimeoutId: number | null = null;
  private healthCheckEndpoint: string = '/';
  private lastToastTime: number = 0;
  private lastReconnectAttempt: number = 0;
  private toastCooldown: number = 10000; // 10 seconds between similar toasts
  private isInitialCheck: boolean = true;

  private static instance: ConnectionManager | null = null;
  
  public static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }
  
  private constructor() {
    // Set up event listeners for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Add event listener for fetch errors
    this.interceptFetchErrors();

    // Initial check
    this.checkConnection();
  }

  private interceptFetchErrors(): void {
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      // إذا كنا نعلم بالفعل أننا غير متصلين، فلا داعي لمحاولة الطلب
      if (this.status === ConnectionStatus.OFFLINE) {
        // إظهار رسالة للمستخدم إذا لم يتم عرض رسالة مؤخرًا
        this.showToastWithCooldown('أنت غير متصل بالإنترنت. يرجى التحقق من اتصالك.', 'error');
        return Promise.reject(new TypeError('No internet connection'));
      }

      try {
        const response = await originalFetch(input, init);
        return response;
      } catch (error: any) {
        // Check if it's a network error
        if (
          error instanceof TypeError && 
          (error.message.includes('Failed to fetch') || 
           error.message.includes('net::ERR_ABORTED') ||
           error.message.includes('NetworkError'))
        ) {
          // Silently handle network errors without showing toast
          console.log('Network error detected:', error.message);
          if (this.status === ConnectionStatus.ONLINE) {
            this.checkConnection();
          }
        }
        throw error;
      }
    };
  }

  private checkConnection = async (): Promise<boolean> => {
    try {
      // التحقق من حالة الاتصال بالإنترنت أولاً
      if (!navigator.onLine) {
        console.log('المتصفح يشير إلى أن الاتصال غير متوفر');
        if (this.status !== ConnectionStatus.OFFLINE) {
          this.setStatus(ConnectionStatus.OFFLINE);
          // إظهار رسالة للمستخدم فقط إذا لم يكن هذا هو التحقق الأولي
          if (!this.isInitialCheck) {
            this.showToastWithCooldown('أنت غير متصل بالإنترنت. يرجى التحقق من اتصالك.', 'error');
          }
        }
        return false;
      }
      
      // إذا كان المتصفح يشير إلى أن الاتصال متوفر، نعتبر أن الاتصال متاح
      // هذا يتجنب محاولة إجراء طلبات شبكة إضافية قد تفشل
      if (this.status !== ConnectionStatus.ONLINE) {
        this.setStatus(ConnectionStatus.ONLINE);
        // إظهار رسالة للمستخدم فقط إذا كان الاتصال قد انقطع سابقًا وليس التحقق الأولي
        if (this.reconnectAttempts > 0 && !this.isInitialCheck) {
          this.showToastWithCooldown('تم استعادة الاتصال بالإنترنت.', 'success');
          this.reconnectAttempts = 0; // إعادة تعيين عدد المحاولات
        }
      }
      
      // تعيين isInitialCheck إلى false بعد التحقق الأولي
      if (this.isInitialCheck) {
        this.isInitialCheck = false;
      }
      
      return true;
    } catch (error) {
      console.log('فشل عام في فحص الاتصال:', error);
      return false;
    }
  };

  private handleOnline = (): void => {
    // When the browser detects we're online, verify with an actual request
    this.setStatus(ConnectionStatus.RECONNECTING);
    this.reconnectAttempts = 0;
    this.attemptReconnect();
  };

  private handleOffline = (): void => {
    this.setStatus(ConnectionStatus.OFFLINE);
    this.showToast({
      title: 'انقطع الاتصال',
      description: 'تم فقدان الاتصال بالإنترنت. سيتم إعادة المحاولة تلقائيًا عند استعادة الاتصال.',
      variant: 'destructive',
    });
  };

  private attemptReconnect = async (): Promise<void> => {
    if (this.reconnectTimeoutId) {
      window.clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    // التحقق من حالة الاتصال بالإنترنت أولاً
    if (!navigator.onLine) {
      console.log('المتصفح يشير إلى أن الاتصال غير متوفر، تأجيل محاولة إعادة الاتصال');
      // جدولة محاولة أخرى بعد فترة
      this.reconnectTimeoutId = window.setTimeout(
        this.attemptReconnect,
        this.reconnectInterval
      );
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setStatus(ConnectionStatus.OFFLINE);
      this.showToast({
        title: 'فشل إعادة الاتصال',
        description: 'تعذر إعادة الاتصال بعد عدة محاولات. يرجى التحقق من اتصالك بالإنترنت أو تحديث الصفحة يدويًا.',
        variant: 'destructive',
      });
      // إعادة تعيين عدد المحاولات بعد فترة للسماح بمحاولات جديدة
      setTimeout(() => {
        this.reconnectAttempts = 0;
      }, 30000); // 30 ثانية
      return;
    }

    this.reconnectAttempts++;
    console.log(`محاولة إعادة الاتصال ${this.reconnectAttempts} من ${this.maxReconnectAttempts}`);
    
    const isConnected = await this.checkConnection();
    
    if (isConnected) {
      this.reconnectAttempts = 0; // إعادة تعيين العداد عند نجاح الاتصال
      this.setStatus(ConnectionStatus.ONLINE);
      this.showToast({
        title: 'تم استعادة الاتصال',
        description: 'تم استعادة الاتصال بالإنترنت بنجاح.',
        variant: 'default',
      });
      
      // لا نقوم بإعادة تحميل الصفحة تلقائيًا لمنع حلقات التحميل اللانهائية
      console.log('تم استعادة الاتصال بنجاح.');
    } else {
      // جدولة محاولة أخرى مع زيادة الفاصل الزمني تدريجيًا
      const backoffInterval = this.reconnectInterval * (1 + (this.reconnectAttempts * 0.5));
      console.log(`جدولة محاولة إعادة اتصال جديدة بعد ${backoffInterval}ms`);
      
      this.reconnectTimeoutId = window.setTimeout(
        this.attemptReconnect,
        backoffInterval
      );
    }
  };

  private showToast(toastOptions: {
    title: string;
    description: string;
    variant: 'default' | 'destructive';
  }): void {
    const now = Date.now();
    if (now - this.lastToastTime > this.toastCooldown) {
      toast(toastOptions);
      this.lastToastTime = now;
    }
  }

  private showToastWithCooldown(message: string, type: 'default' | 'error' | 'success' = 'default'): void {
    const now = Date.now();
    if (now - this.lastToastTime > this.toastCooldown) {
      const variant = type === 'error' ? 'destructive' : type === 'success' ? 'default' : 'default';
      toast({
        title: type === 'error' ? 'خطأ في الاتصال' : type === 'success' ? 'تم استعادة الاتصال' : 'إشعار',
        description: message,
        variant: variant,
      });
      this.lastToastTime = now;
    }
  }

  public setStatus(newStatus: ConnectionStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      // Notify all listeners
      this.listeners.forEach(listener => listener(newStatus));
      
      // If connection is lost, start auto-reconnect
      if (newStatus === ConnectionStatus.OFFLINE) {
        this.startAutoReconnect();
      } else if (newStatus === ConnectionStatus.ONLINE) {
        // If connection is restored, clear auto-reconnect
        this.stopAutoReconnect();
      }
    }
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public isOnline(): boolean {
    return this.status === ConnectionStatus.ONLINE;
  }
  
  private autoReconnectInterval: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  
  private startAutoReconnect(): void {
    // Clear any existing interval
    this.stopAutoReconnect();
    
    // Reset reconnect attempts if it's been a while since last attempt
    const now = Date.now();
    if (now - this.lastReconnectAttempt > 60000) { // 1 minute
      this.reconnectAttempts = 0;
    }
    
    // Calculate backoff time (exponential backoff with max of 30 seconds)
    const backoffTime = Math.min(Math.pow(1.5, this.reconnectAttempts) * 1000, 30000);
    
    // Start auto-reconnect interval
    this.autoReconnectInterval = window.setInterval(() => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect();
        this.reconnectAttempts++;
      } else {
        // Stop trying after max attempts
        this.stopAutoReconnect();
        this.showToastWithCooldown('فشلت محاولات إعادة الاتصال. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.', 'error');
      }
    }, backoffTime);
  }
  
  private stopAutoReconnect(): void {
    if (this.autoReconnectInterval !== null) {
      window.clearInterval(this.autoReconnectInterval);
      this.autoReconnectInterval = null;
    }
  }

  public subscribe(listener: (status: ConnectionStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Immediately notify the new listener of the current status
    listener(this.status);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public checkConnectionAndNotify = async (): Promise<boolean> => {
    try {
      const isConnected = await this.checkConnection();
      
      // فقط إظهار إشعار إذا لم يكن هذا هو التحقق الأولي وكان الاتصال غير متوفر
      if (!isConnected && !this.isInitialCheck) {
        this.showToast({
          title: 'مشكلة في الاتصال',
          description: 'يبدو أن هناك مشكلة في الاتصال بالإنترنت. يرجى التحقق من اتصالك.',
          variant: 'destructive',
        });
      }
      
      // تعيين isInitialCheck إلى false بعد التحقق الأولي
      if (this.isInitialCheck) {
        console.log('تم الانتهاء من التحقق الأولي من الاتصال');
        this.isInitialCheck = false;
      }
      
      return isConnected;
    } catch (error) {
      console.log('خطأ في checkConnectionAndNotify:', error);
      // تجاهل الأخطاء أثناء التحقق الأولي لتجنب إظهار رسائل الخطأ للمستخدم
      if (this.isInitialCheck) {
        this.isInitialCheck = false;
        return navigator.onLine; // استخدام حالة الاتصال من المتصفح كبديل
      }
      return false;
    }
  };
  
  // Method to manually set the health check endpoint
  public setHealthCheckEndpoint(endpoint: string): void {
    this.healthCheckEndpoint = endpoint;
  }
}

// Create a singleton instance
export const connectionManager = new ConnectionManager();

// React hook for components to subscribe to connection status
export function useConnectionStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>(connectionManager.getStatus());
  
  useEffect(() => {
    // Subscribe to connection status changes
    const unsubscribe = connectionManager.subscribe(setStatus);
    
    // Unsubscribe when the component unmounts
    return unsubscribe;
  }, []);
  
  return status;
}