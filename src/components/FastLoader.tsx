import React, { Suspense, lazy, useState, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import LoadingSpinner from '@/components/LoadingSpinner';

interface FastLoaderProps {
  componentPath: string;
  fallbackText?: string;
  preload?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

// كاش للمكونات المحملة
const componentCache = new Map<string, React.ComponentType>();

// نظام أولويات التحميل
const loadingQueue = {
  high: [] as string[],
  medium: [] as string[],
  low: [] as string[]
};

const FastLoader: React.FC<FastLoaderProps> = ({ 
  componentPath, 
  fallbackText = 'جاري التحميل...', 
  preload = false,
  priority = 'medium'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // تحميل المكون بشكل ذكي
  const loadComponent = async (path: string) => {
    try {
      // تحقق من الكاش أولاً
      if (componentCache.has(path)) {
        const CachedComponent = componentCache.get(path)!;
        setComponent(() => CachedComponent);
        setIsLoading(false);
        return;
      }

      // تحميل المكون
      let LazyComponent;
      
      // مسارات محددة للوحدات الرئيسية
      switch (path) {
        case 'whatsapp/dashboard':
          LazyComponent = lazy(() => import('@/pages/whatsapp/WhatsAppDashboard'));
          break;
        case 'whatsapp/contacts':
          LazyComponent = lazy(() => import('@/pages/whatsapp/Contacts'));
          break;
        case 'whatsapp/text-message':
          LazyComponent = lazy(() => import('@/pages/whatsapp/TextMessage'));
          break;
        case 'whatsapp/media-message':
          LazyComponent = lazy(() => import('@/pages/whatsapp/MediaMessage'));
          break;
        case 'whatsapp/sticker-message':
          LazyComponent = lazy(() => import('@/pages/whatsapp/StickerMessage'));
          break;
        case 'whatsapp/advanced-campaign':
          LazyComponent = lazy(() => import('@/pages/whatsapp/AdvancedCampaign'));
          break;
        case 'whatsapp/contact-deduplication':
          LazyComponent = lazy(() => import('@/pages/whatsapp/ContactDeduplication'));
          break;
        case 'land-sales/brokers':
          LazyComponent = lazy(() => import('@/pages/land-sales/LandBrokers'));
          break;
        case 'land-sales/clients':
          LazyComponent = lazy(() => import('@/pages/land-sales/LandClients'));
          break;
        default:
          // تحميل ديناميكي للمسارات الأخرى
          LazyComponent = lazy(() => import(`@/pages/${path}`));
      }

      // حفظ في الكاش
      componentCache.set(path, LazyComponent);
      setComponent(() => LazyComponent);
      setIsLoading(false);

      console.log(`✅ FastLoader: ${path} loaded successfully`);

    } catch (err) {
      console.error(`❌ FastLoader: Failed to load ${path}:`, err);
      setError(err as Error);
      setIsLoading(false);
    }
  };

  // تحميل مسبق حسب الأولوية
  const preloadComponent = (path: string, priority: 'high' | 'medium' | 'low') => {
    if (!loadingQueue[priority].includes(path)) {
      loadingQueue[priority].push(path);
    }

    // معالجة طابور التحميل
    const processQueue = async () => {
      // تحميل المكونات عالية الأولوية أولاً
      for (const priorityLevel of ['high', 'medium', 'low'] as const) {
        for (const queuedPath of loadingQueue[priorityLevel]) {
          if (!componentCache.has(queuedPath)) {
            try {
              await loadComponent(queuedPath);
              await new Promise(resolve => setTimeout(resolve, 50)); // تأخير صغير
            } catch (error) {
              console.warn(`⚠️ FastLoader: Preload failed for ${queuedPath}`);
            }
          }
        }
        // تنظيف الطابور
        loadingQueue[priorityLevel] = [];
      }
    };

    // تشغيل المعالجة مع تأخير
    setTimeout(processQueue, priorityLevel === 'high' ? 100 : 1000);
  };

  useEffect(() => {
    if (preload) {
      preloadComponent(componentPath, priority);
    } else {
      loadComponent(componentPath);
    }
  }, [componentPath, preload, priority]);

  // معالجة الأخطاء
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <div className="text-red-500 text-center">
          <h3 className="text-lg font-semibold mb-2">خطأ في التحميل</h3>
          <p className="text-sm text-gray-600 mb-4">
            فشل في تحميل المكون: {componentPath}
          </p>
          <button 
            onClick={() => {
              setError(null);
              setIsLoading(true);
              loadComponent(componentPath);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  // عرض المكون المحمل
  if (!isLoading && Component) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner text={fallbackText} />}>
          <Component />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // عرض شاشة التحميل
  return <LoadingSpinner text={fallbackText} />;
};

export default FastLoader;
