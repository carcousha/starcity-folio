import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

interface BundleConfig {
  name: string;
  paths: string[];
  priority: number;
  preload?: boolean;
}

interface PerformanceOptimizerProps {
  bundles: BundleConfig[];
  onBundleLoad?: (bundleName: string) => void;
  enableCodeSplitting?: boolean;
  enableBundlePreloading?: boolean;
}

export const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({
  bundles,
  onBundleLoad,
  enableCodeSplitting = true,
  enableBundlePreloading = true
}) => {
  const location = useLocation();
  const [loadedBundles, setLoadedBundles] = useState<Set<string>>(new Set());
  const [bundleStats, setBundleStats] = useState<Record<string, {
    loadTime: number;
    size: number;
    lastAccessed: Date;
  }>>({});

  // تحميل bundle مع قياس الأداء
  const loadBundle = useCallback(async (bundleName: string) => {
    if (loadedBundles.has(bundleName)) return;

    const startTime = performance.now();
    
    try {
      // محاكاة تحميل bundle
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
      
      const loadTime = performance.now() - startTime;
      
      setLoadedBundles(prev => new Set(prev).add(bundleName));
      setBundleStats(prev => ({
        ...prev,
        [bundleName]: {
          loadTime,
          size: Math.floor(Math.random() * 100) + 50, // محاكاة حجم bundle
          lastAccessed: new Date()
        }
      }));
      
      onBundleLoad?.(bundleName);
      
      // تسجيل إحصائيات الأداء
      console.log(`Bundle ${bundleName} loaded in ${loadTime.toFixed(2)}ms`);
      
    } catch (error) {
      console.error(`Failed to load bundle ${bundleName}:`, error);
    }
  }, [loadedBundles, onBundleLoad]);

  // تحديد bundle المطلوب للمسار الحالي
  const getRequiredBundle = useCallback((path: string): string | null => {
    for (const bundle of bundles) {
      if (bundle.paths.some(bundlePath => path.startsWith(bundlePath))) {
        return bundle.name;
      }
    }
    return null;
  }, [bundles]);

  // تحميل bundle للمسار الحالي
  useEffect(() => {
    const currentBundle = getRequiredBundle(location.pathname);
    
    if (currentBundle && !loadedBundles.has(currentBundle)) {
      loadBundle(currentBundle);
    }
  }, [location.pathname, getRequiredBundle, loadBundle, loadedBundles]);

  // تحميل مسبق للbundles عالية الأولوية
  useEffect(() => {
    if (!enableBundlePreloading) return;

    const highPriorityBundles = bundles
      .filter(bundle => bundle.preload && bundle.priority > 5)
      .sort((a, b) => b.priority - a.priority);

    highPriorityBundles.forEach(bundle => {
      if (!loadedBundles.has(bundle.name)) {
        // تأخير متدرج لتجنب التأثير على الأداء
        setTimeout(() => loadBundle(bundle.name), bundle.priority * 100);
      }
    });
  }, [enableBundlePreloading, bundles, loadedBundles, loadBundle]);

  // تحسين الذاكرة - إزالة bundles غير المستخدمة
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = new Date();
      const unusedBundles = Object.entries(bundleStats)
        .filter(([bundleName, stats]) => {
          const timeSinceLastAccess = now.getTime() - stats.lastAccessed.getTime();
          return timeSinceLastAccess > 5 * 60 * 1000; // 5 دقائق
        });

      if (unusedBundles.length > 0) {
        console.log('Cleaning up unused bundles:', unusedBundles.map(([name]) => name));
        
        setLoadedBundles(prev => {
          const newSet = new Set(prev);
          unusedBundles.forEach(([bundleName]) => newSet.delete(bundleName));
          return newSet;
        });
        
        setBundleStats(prev => {
          const newStats = { ...prev };
          unusedBundles.forEach(([bundleName]) => delete newStats[bundleName]);
          return newStats;
        });
      }
    }, 60000); // كل دقيقة

    return () => clearInterval(cleanupInterval);
  }, [bundleStats]);

  // تحديث آخر وصول للbundle
  const updateBundleAccess = useCallback((bundleName: string) => {
    setBundleStats(prev => ({
      ...prev,
      [bundleName]: {
        ...prev[bundleName],
        lastAccessed: new Date()
      }
    }));
  }, []);

  // إعادة تحميل bundle
  const reloadBundle = useCallback(async (bundleName: string) => {
    setLoadedBundles(prev => {
      const newSet = new Set(prev);
      newSet.delete(bundleName);
      return newSet;
    });
    
    await loadBundle(bundleName);
  }, [loadBundle]);

  // لا نعرض أي شيء في الواجهة
  return null;
};

// Hook لاستخدام PerformanceOptimizer
export const usePerformanceOptimizer = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [bundleStats, setBundleStats] = useState<Record<string, any>>({});

  const toggleOptimizer = useCallback(() => {
    setIsEnabled(prev => !prev);
  }, []);

  const getBundleStats = useCallback(() => {
    return bundleStats;
  }, [bundleStats]);

  return {
    isEnabled,
    toggleOptimizer,
    getBundleStats
  };
};

export default PerformanceOptimizer;
