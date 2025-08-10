import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

interface PreloadConfig {
  path: string;
  priority: 'high' | 'medium' | 'low';
  condition?: () => boolean;
}

interface SmartPreloaderProps {
  configs: PreloadConfig[];
  onPreload?: (path: string) => void;
  enabled?: boolean;
}

export const SmartPreloader: React.FC<SmartPreloaderProps> = ({
  configs,
  onPreload,
  enabled = true
}) => {
  const location = useLocation();
  const [preloadedPaths, setPreloadedPaths] = useState<Set<string>>(new Set());

  // تحميل مسبق للمسارات عالية الأولوية
  const preloadHighPriority = useCallback(() => {
    if (!enabled) return;

    const highPriorityConfigs = configs.filter(
      config => config.priority === 'high' && 
      config.condition?.() !== false &&
      !preloadedPaths.has(config.path)
    );

    highPriorityConfigs.forEach(config => {
      // محاكاة التحميل المسبق
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = config.path;
      document.head.appendChild(link);
      
      setPreloadedPaths(prev => new Set(prev).add(config.path));
      onPreload?.(config.path);
    });
  }, [configs, enabled, preloadedPaths, onPreload]);

  // تحميل مسبق للمسارات متوسطة الأولوية عند hover
  const preloadOnHover = useCallback((path: string) => {
    if (!enabled || preloadedPaths.has(path)) return;

    const config = configs.find(c => c.path === path);
    if (config?.priority === 'medium' && config.condition?.() !== false) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = path;
      document.head.appendChild(link);
      
      setPreloadedPaths(prev => new Set(prev).add(path));
      onPreload?.(path);
    }
  }, [configs, enabled, preloadedPaths, onPreload]);

  // تحميل مسبق للمسارات منخفضة الأولوية عند التمرير
  const preloadOnScroll = useCallback(() => {
    if (!enabled) return;

    const lowPriorityConfigs = configs.filter(
      config => config.priority === 'low' && 
      config.condition?.() !== false &&
      !preloadedPaths.has(config.path)
    );

    if (lowPriorityConfigs.length > 0) {
      const config = lowPriorityConfigs[0];
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = config.path;
      document.head.appendChild(link);
      
      setPreloadedPaths(prev => new Set(prev).add(config.path));
      onPreload?.(config.path);
    }
  }, [configs, enabled, preloadedPaths, onPreload]);

  useEffect(() => {
    // تحميل مسبق فوري للمسارات عالية الأولوية
    preloadHighPriority();

    // تحميل مسبق للمسارات متوسطة الأولوية بعد تأخير قصير
    const mediumPriorityTimer = setTimeout(() => {
      const mediumPriorityConfigs = configs.filter(
        config => config.priority === 'medium' && 
        config.condition?.() !== false &&
        !preloadedPaths.has(config.path)
      );

      mediumPriorityConfigs.forEach(config => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = config.path;
        document.head.appendChild(link);
        
        setPreloadedPaths(prev => new Set(prev).add(config.path));
        onPreload?.(config.path);
      });
    }, 2000);

    // إضافة مستمع للتمرير
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(preloadOnScroll, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(mediumPriorityTimer);
      clearTimeout(scrollTimeout);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [preloadHighPriority, preloadOnScroll, configs, preloadedPaths, onPreload]);

  // إضافة مستمعات hover للروابط
  useEffect(() => {
    const links = document.querySelectorAll('a[href]');
    
    const handleMouseEnter = (event: Event) => {
      const target = event.target as HTMLAnchorElement;
      const href = target.getAttribute('href');
      
      if (href && href.startsWith('/')) {
        preloadOnHover(href);
      }
    };

    links.forEach(link => {
      link.addEventListener('mouseenter', handleMouseEnter);
    });

    return () => {
      links.forEach(link => {
        link.removeEventListener('mouseenter', handleMouseEnter);
      });
    };
  }, [preloadOnHover]);

  // لا نعرض أي شيء في الواجهة
  return null;
};

export default SmartPreloader;
