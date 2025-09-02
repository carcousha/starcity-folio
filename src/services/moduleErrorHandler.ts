// @ts-nocheck
import { toast } from '@/hooks/use-toast';
import { appErrorHandler } from './appErrorHandler';
import React from 'react';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';

/**
 * Handles errors related to dynamic module loading
 */
export function handleModuleLoadError(error: Error, modulePath: string) {
  console.error(`Error loading module: ${modulePath}`, error);
  
  // Check if it's a network error
  if (error.message?.includes('Failed to fetch dynamically imported module') ||
      error.message?.includes('net::ERR_ABORTED')) {
    
    toast({
      title: 'خطأ في تحميل الصفحة',
      description: 'فشل تحميل جزء من التطبيق. سيتم إعادة تحميل الصفحة تلقائيًا.',
      variant: 'destructive',
    });
    
    // Log to app error handler
    appErrorHandler.handleError(error, 'فشل تحميل وحدة ديناميكية');
    
    // حفظ المسار الحالي قبل إعادة التحميل
    try {
      const currentPath = window.location.pathname;
      sessionStorage.setItem('lastPath', currentPath);
      sessionStorage.setItem('reconnectTimestamp', Date.now().toString());
      
      // إعادة تحميل الصفحة بعد تأخير قصير
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error('فشل في حفظ حالة التطبيق قبل إعادة التحميل:', error);
      // محاولة بديلة لإعادة التحميل
      setTimeout(() => {
        window.location.href = window.location.origin + window.location.pathname + window.location.search;
      }, 3000);
    }
    
    return;
  }
  
  // For other module loading errors
  toast({
    title: 'خطأ في تحميل الصفحة',
    description: 'حدث خطأ أثناء تحميل جزء من التطبيق. يرجى إعادة تحميل الصفحة.',
    variant: 'destructive',
    action: {
      label: 'إعادة تحميل',
      onClick: () => window.location.reload(),
    },
  });
  
  // Log to app error handler
  appErrorHandler.handleError(error, 'فشل تحميل وحدة ديناميكية');
}

/**
 * Creates a wrapper for React.lazy to handle module loading errors
 */
export function lazyWithErrorHandling(factory: () => Promise<{ default: React.ComponentType<any> }>) {
  return React.lazy(() => {
    return factory().catch((error) => {
      const modulePath = factory.toString().match(/import\(['"](.+?)['"]\)/)?.[1] || 'unknown';
      handleModuleLoadError(error, modulePath);
      
      // Return a fallback component
      return {
        default: () => {
          return React.createElement(
            'div', 
            { className: 'flex flex-col items-center justify-center p-4 text-center' },
            React.createElement(
              'h2', 
              { className: 'text-xl font-semibold text-red-500 mb-2' },
              'خطأ في تحميل المكون'
            ),
            React.createElement(
              'p', 
              { className: 'text-gray-600 mb-4' },
              'فشل تحميل هذا الجزء من التطبيق'
            ),
            React.createElement(
              'button',
              { 
                onClick: () => window.location.reload(),
                className: 'px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90'
              },
              'إعادة تحميل الصفحة'
            )
          );
        }
      };
    });
  });
}