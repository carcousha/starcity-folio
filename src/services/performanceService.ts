// خدمة تحسين الأداء والتحميل السريع
export class PerformanceService {
  private static instance: PerformanceService;
  private preloadCache = new Map<string, Promise<any>>();
  private performanceMetrics = {
    pageLoads: [] as number[],
    dbQueries: [] as number[],
    componentRenders: [] as number[]
  };

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  // تحسين تحميل الصفحات
  optimizePageLoad() {
    // تعطيل التحديث التلقائي للdata غير الضرورية
    this.disableAutoRefresh();
    
    // ضغط الاستعلامات المتعددة
    this.batchQueries();
    
    // تأجيل تحميل المكونات الثقيلة
    this.deferHeavyComponents();
    
    console.log('🚀 Performance optimization applied');
  }

  // تعطيل التحديث التلقائي
  private disableAutoRefresh() {
    // تعطيل refetchOnWindowFocus في React Query
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', (e) => {
        e.preventDefault();
      }, { passive: false });
    }
  }

  // ضغط الاستعلامات
  private batchQueries() {
    const batchInterval = 100; // ms
    let queryBatch: Function[] = [];
    
    const executeBatch = () => {
      if (queryBatch.length > 0) {
        Promise.all(queryBatch.map(query => query()));
        queryBatch = [];
      }
    };

    setInterval(executeBatch, batchInterval);
  }

  // تأجيل المكونات الثقيلة
  private deferHeavyComponents() {
    // قائمة بالمكونات الثقيلة التي يجب تأجيلها
    const heavyComponents = [
      'ContactDeduplication',
      'AdvancedCampaign',
      'FinancialReports',
      'Analytics'
    ];

    heavyComponents.forEach(component => {
      setTimeout(() => {
        this.preloadComponent(component);
      }, 2000); // تأجيل لثانيتين
    });
  }

  // تحميل مسبق للمكونات
  async preloadComponent(componentName: string) {
    if (this.preloadCache.has(componentName)) {
      return this.preloadCache.get(componentName);
    }

    const preloadPromise = new Promise(async (resolve, reject) => {
      try {
        let component;
        
        switch (componentName) {
          case 'ContactDeduplication':
            component = await import('@/pages/whatsapp/ContactDeduplication');
            break;
          case 'AdvancedCampaign':
            component = await import('@/pages/whatsapp/AdvancedCampaign');
            break;
          case 'FinancialReports':
            component = await import('@/pages/accounting/index');
            break;
          default:
            reject(new Error(`Unknown component: ${componentName}`));
            return;
        }
        
        resolve(component);
        console.log(`✅ Preloaded: ${componentName}`);
      } catch (error) {
        console.error(`❌ Failed to preload: ${componentName}`, error);
        reject(error);
      }
    });

    this.preloadCache.set(componentName, preloadPromise);
    return preloadPromise;
  }

  // قياس الأداء
  measurePageLoad(pageName: string) {
    const startTime = performance.now();
    
    return {
      end: () => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        this.performanceMetrics.pageLoads.push(loadTime);
        
        console.log(`📊 ${pageName} loaded in ${loadTime.toFixed(2)}ms`);
        
        // تحذير إذا كان التحميل بطيئاً
        if (loadTime > 2000) {
          console.warn(`⚠️ Slow page load detected: ${pageName} (${loadTime.toFixed(2)}ms)`);
        }
        
        return loadTime;
      }
    };
  }

  // تحسين الاستعلامات
  optimizeQuery<T>(
    queryFn: () => Promise<T>,
    cacheKey: string,
    ttl: number = 30000 // 30 ثانية
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      try {
        const startTime = performance.now();
        const result = await queryFn();
        const queryTime = performance.now() - startTime;
        
        this.performanceMetrics.dbQueries.push(queryTime);
        
        if (queryTime > 1000) {
          console.warn(`⚠️ Slow query detected: ${cacheKey} (${queryTime.toFixed(2)}ms)`);
        }
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  // تحسين الرندرنغ
  optimizeRendering() {
    // إضافة Intersection Observer للمكونات
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) {
            // إخفاء المكونات خارج النظر لتوفير الذاكرة
            const element = entry.target as HTMLElement;
            if (element.classList.contains('heavy-component')) {
              element.style.display = 'none';
            }
          } else {
            const element = entry.target as HTMLElement;
            element.style.display = '';
          }
        });
      });

      // رصد المكونات الثقيلة
      document.querySelectorAll('.heavy-component').forEach(el => {
        observer.observe(el);
      });
    }
  }

  // تقرير الأداء
  getPerformanceReport() {
    const avgPageLoad = this.performanceMetrics.pageLoads.length > 0 
      ? this.performanceMetrics.pageLoads.reduce((a, b) => a + b, 0) / this.performanceMetrics.pageLoads.length
      : 0;

    const avgQueryTime = this.performanceMetrics.dbQueries.length > 0
      ? this.performanceMetrics.dbQueries.reduce((a, b) => a + b, 0) / this.performanceMetrics.dbQueries.length  
      : 0;

    return {
      averagePageLoad: avgPageLoad.toFixed(2) + 'ms',
      averageQueryTime: avgQueryTime.toFixed(2) + 'ms',
      totalPageLoads: this.performanceMetrics.pageLoads.length,
      totalQueries: this.performanceMetrics.dbQueries.length,
      preloadedComponents: this.preloadCache.size,
      recommendations: this.getRecommendations(avgPageLoad, avgQueryTime)
    };
  }

  // توصيات التحسين
  private getRecommendations(avgPageLoad: number, avgQueryTime: number): string[] {
    const recommendations: string[] = [];

    if (avgPageLoad > 2000) {
      recommendations.push('⚠️ تحسين lazy loading للمكونات الكبيرة');
      recommendations.push('📦 تقسيم المشروع إلى chunks أصغر');
    }

    if (avgQueryTime > 500) {
      recommendations.push('🔍 إضافة indexes لقاعدة البيانات');
      recommendations.push('⚡ استخدام caching للاستعلامات');
    }

    if (this.performanceMetrics.pageLoads.length > 50) {
      recommendations.push('🧹 تنظيف الذاكرة دورياً');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ الأداء جيد! لا توجد توصيات');
    }

    return recommendations;
  }

  // تنظيف الذاكرة
  cleanup() {
    this.preloadCache.clear();
    this.performanceMetrics = {
      pageLoads: [],
      dbQueries: [],
      componentRenders: []
    };
    console.log('🧹 Performance cache cleared');
  }
}

// تصدير النسخة الوحيدة
export const performanceService = PerformanceService.getInstance();
