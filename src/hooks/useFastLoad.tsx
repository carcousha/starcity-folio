import { useState, useEffect, useRef } from 'react';
import { performanceService } from '@/services/performanceService';

interface FastLoadOptions {
  preloadDelay?: number;
  enableMetrics?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

export function useFastLoad(
  componentName: string, 
  options: FastLoadOptions = {}
) {
  const { 
    preloadDelay = 1000, 
    enableMetrics = true, 
    priority = 'medium' 
  } = options;

  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [loadTime, setLoadTime] = useState<number>(0);
  const performanceRef = useRef<ReturnType<typeof performanceService.measurePageLoad> | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadComponent = async () => {
      try {
        // بدء قياس الأداء
        if (enableMetrics) {
          performanceRef.current = performanceService.measurePageLoad(componentName);
        }

        // تأخير التحميل حسب الأولوية
        const delay = priority === 'high' ? 0 : 
                     priority === 'medium' ? preloadDelay : 
                     preloadDelay * 2;

        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        // التحقق من أن المكون لا يزال مطلوباً
        if (!mounted) return;

        // تحميل المكون
        await performanceService.preloadComponent(componentName);

        if (mounted) {
          setIsLoaded(true);
          
          // إنهاء قياس الأداء
          if (enableMetrics && performanceRef.current) {
            const time = performanceRef.current.end();
            setLoadTime(time);
          }
        }

      } catch (err) {
        if (mounted) {
          setError(err as Error);
          console.error(`❌ useFastLoad error for ${componentName}:`, err);
        }
      }
    };

    loadComponent();

    // تنظيف
    return () => {
      mounted = false;
    };
  }, [componentName, preloadDelay, enableMetrics, priority]);

  const retry = () => {
    setError(null);
    setIsLoaded(false);
    setLoadTime(0);
  };

  return {
    isLoaded,
    error,
    loadTime,
    retry,
    isLoading: !isLoaded && !error
  };
}

// Hook للتحميل المؤجل
export function useLazyLoad<T>(
  loadFn: () => Promise<T>,
  deps: any[] = [],
  delay: number = 0
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);
      
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const result = await loadFn();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, deps);

  return { data, loading, error, reload: load };
}

// Hook لتحسين الاستعلامات
export function useOptimizedQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  options: {
    enabled?: boolean;
    cacheTime?: number;
    staleTime?: number;
  } = {}
) {
  const {
    enabled = true,
    cacheTime = 30000, // 30 ثانية
    staleTime = 5000    // 5 ثواني
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetched, setLastFetched] = useState<number>(0);

  const executeQuery = async (force = false) => {
    const now = Date.now();
    
    // تحقق من الcache
    if (!force && data && (now - lastFetched) < staleTime) {
      return data;
    }

    if (loading) return;

    try {
      setLoading(true);
      setError(null);

      const result = await performanceService.optimizeQuery(
        queryFn,
        queryKey,
        cacheTime
      );

      setData(result);
      setLastFetched(now);
      return result;

    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (enabled) {
      executeQuery();
    }
  }, [enabled]);

  return {
    data,
    loading,
    error,
    refetch: () => executeQuery(true),
    isStale: (Date.now() - lastFetched) > staleTime
  };
}

// Hook للتحميل التدريجي
export function useProgressiveLoad(
  items: any[],
  batchSize: number = 10,
  delay: number = 100
) {
  const [loadedItems, setLoadedItems] = useState<any[]>([]);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!items.length) return;

    const totalBatches = Math.ceil(items.length / batchSize);
    
    if (currentBatch >= totalBatches) {
      setIsComplete(true);
      return;
    }

    const timer = setTimeout(() => {
      const startIndex = currentBatch * batchSize;
      const endIndex = Math.min(startIndex + batchSize, items.length);
      const batch = items.slice(startIndex, endIndex);
      
      setLoadedItems(prev => [...prev, ...batch]);
      setCurrentBatch(prev => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [items, currentBatch, batchSize, delay]);

  const reset = () => {
    setLoadedItems([]);
    setCurrentBatch(0);
    setIsComplete(false);
  };

  return {
    loadedItems,
    isComplete,
    progress: items.length > 0 ? (loadedItems.length / items.length) * 100 : 0,
    reset
  };
}
