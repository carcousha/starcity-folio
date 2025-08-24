// مكون سريع لتحسين الأداء
import React, { useEffect } from 'react';
import { performanceService } from '@/services/performanceService';

export const QuickPerformanceFix: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // تطبيق تحسينات الأداء فور التحميل
    console.log('🚀 Applying quick performance fixes...');
    
    // تحسين تحميل الصفحة
    performanceService.optimizePageLoad();
    
    // تحسين الرندرنغ
    performanceService.optimizeRendering();
    
    // تحميل مسبق للمكونات المهمة
    const preloadComponents = async () => {
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      // تحميل مؤجل للمكونات الثقيلة
      await delay(1000);
      performanceService.preloadComponent('ContactDeduplication');
      
      await delay(2000);
      performanceService.preloadComponent('AdvancedCampaign');
    };
    
    preloadComponents();
    
    return () => {
      // تنظيف عند إلغاء التحميل
      console.log('🧹 Cleaning up performance optimizations');
    };
  }, []);

  return <>{children}</>;
};

export default QuickPerformanceFix;
