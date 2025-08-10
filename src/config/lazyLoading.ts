// تكوين شامل للlazy loading
export const lazyLoadingConfig = {
  // إعدادات عامة
  general: {
    enabled: true,
    debug: process.env.NODE_ENV === 'development',
    defaultFallback: {
      size: 'lg' as const,
      text: 'جاري تحميل الصفحة...'
    }
  },

  // تكوين المسارات مع الأولويات
  routes: {
    // مسارات عالية الأولوية - تحميل فوري
    high: [
      {
        path: '/admin-dashboard',
        priority: 10,
        preload: true,
        bundle: 'admin'
      },
      {
        path: '/crm',
        priority: 9,
        preload: true,
        bundle: 'crm'
      },
      {
        path: '/employee/dashboard',
        priority: 9,
        preload: true,
        bundle: 'employee'
      }
    ],

    // مسارات متوسطة الأولوية - تحميل عند الحاجة
    medium: [
      {
        path: '/accounting',
        priority: 7,
        preload: false,
        bundle: 'accounting'
      },
      {
        path: '/rental',
        priority: 7,
        preload: false,
        bundle: 'rental'
      },
      {
        path: '/reports',
        priority: 6,
        preload: false,
        bundle: 'reports'
      },
      {
        path: '/whatsapp',
        priority: 6,
        preload: false,
        bundle: 'whatsapp'
      }
    ],

    // مسارات منخفضة الأولوية - تحميل عند التمرير
    low: [
      {
        path: '/settings',
        priority: 3,
        preload: false,
        bundle: 'admin'
      },
      {
        path: '/security-audit',
        priority: 2,
        preload: false,
        bundle: 'admin'
      }
    ]
  },

  // تكوين bundles
  bundles: [
    {
      name: 'admin',
      paths: ['/admin-dashboard', '/settings', '/security-audit'],
      priority: 10,
      preload: true
    },
    {
      name: 'crm',
      paths: ['/crm', '/crm/clients', '/crm/leads', '/crm/properties', '/crm/owners'],
      priority: 9,
      preload: true
    },
    {
      name: 'employee',
      paths: ['/employee'],
      priority: 8,
      preload: true
    },
    {
      name: 'accounting',
      paths: ['/accounting'],
      priority: 7,
      preload: false
    },
    {
      name: 'rental',
      paths: ['/rental'],
      priority: 6,
      preload: false
    },
    {
      name: 'reports',
      paths: ['/reports'],
      priority: 5,
      preload: false
    },
    {
      name: 'whatsapp',
      paths: ['/whatsapp'],
      priority: 6,
      preload: false
    }
  ],

  // إعدادات preloading
  preloading: {
    enabled: true,
    delay: 1000, // تأخير قبل بدء preloading
    maxConcurrent: 3, // أقصى عدد من المسارات للتحميل المسبق في نفس الوقت
    hoverDelay: 200, // تأخير عند hover
    scrollThreshold: 0.8 // نسبة التمرير لبدء preloading
  },

  // إعدادات error handling
  errorHandling: {
    retryAttempts: 3,
    retryDelay: 1000,
    showErrorBoundary: true,
    logErrors: true
  },

  // إعدادات الأداء
  performance: {
    enableCodeSplitting: true,
    enableBundlePreloading: true,
    enableMemoryCleanup: true,
    cleanupInterval: 60000, // كل دقيقة
    maxBundleAge: 5 * 60 * 1000 // 5 دقائق
  }
};

// دوال مساعدة
export const getRouteConfig = (path: string) => {
  const allRoutes = [
    ...lazyLoadingConfig.routes.high,
    ...lazyLoadingConfig.routes.medium,
    ...lazyLoadingConfig.routes.low
  ];
  
  return allRoutes.find(route => path.startsWith(route.path));
};

export const getBundleForPath = (path: string) => {
  const routeConfig = getRouteConfig(path);
  return routeConfig?.bundle || 'default';
};

export const shouldPreloadRoute = (path: string) => {
  const routeConfig = getRouteConfig(path);
  return routeConfig?.preload || false;
};

export const getRoutePriority = (path: string) => {
  const routeConfig = getRouteConfig(path);
  return routeConfig?.priority || 1;
};

// تكوين fallback مخصص لكل مسار
export const getFallbackConfig = (path: string) => {
  const routeConfig = getRouteConfig(path);
  
  if (!routeConfig) {
    return lazyLoadingConfig.general.defaultFallback;
  }

  // fallback مخصص حسب نوع المسار
  switch (routeConfig.bundle) {
    case 'admin':
      return {
        size: 'xl' as const,
        text: 'جاري تحميل لوحة الإدارة...'
      };
    case 'crm':
      return {
        size: 'lg' as const,
        text: 'جاري تحميل نظام إدارة العملاء...'
      };
    case 'accounting':
      return {
        size: 'lg' as const,
        text: 'جاري تحميل النظام المحاسبي...'
      };
    case 'reports':
      return {
        size: 'md' as const,
        text: 'جاري تحميل التقارير...'
      };
    default:
      return lazyLoadingConfig.general.defaultFallback;
  }
};

// تكوين error fallback مخصص
export const getErrorFallbackConfig = (path: string) => {
  const bundle = getBundleForPath(path);
  
  switch (bundle) {
    case 'admin':
      return {
        title: 'خطأ في تحميل لوحة الإدارة',
        description: 'حدث خطأ أثناء تحميل لوحة الإدارة. يرجى المحاولة مرة أخرى.'
      };
    case 'crm':
      return {
        title: 'خطأ في تحميل نظام إدارة العملاء',
        description: 'حدث خطأ أثناء تحميل نظام إدارة العملاء. يرجى المحاولة مرة أخرى.'
      };
    default:
      return {
        title: 'خطأ في التحميل',
        description: 'حدث خطأ أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى.'
      };
  }
};

export default lazyLoadingConfig;
