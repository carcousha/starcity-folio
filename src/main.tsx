import React from 'react'
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'
import { appErrorHandler } from './services/appErrorHandler'
import { connectionManager } from './services/connectionManager'
import { toast } from '@/hooks/use-toast'
import ErrorBoundary from './components/ui/ErrorBoundary'
import { handleModuleLoadError } from './services/moduleErrorHandler'
import NetworkStatusIndicator from './components/ui/NetworkStatusIndicator'

// استعادة المسار بعد إعادة تحميل الصفحة بسبب مشاكل الاتصال
const handleReconnectReload = () => {
  try {
    // تنظيف أي بيانات قديمة من sessionStorage لمنع حلقات التحميل
    if (sessionStorage.getItem('lastPath') || sessionStorage.getItem('reconnectTimestamp')) {
      // إزالة البيانات من sessionStorage
      sessionStorage.removeItem('lastPath');
      sessionStorage.removeItem('reconnectTimestamp');
      
      console.log('تم تنظيف بيانات إعادة الاتصال من sessionStorage');
    }
  } catch (error) {
    console.error('فشل في معالجة بيانات إعادة التحميل:', error);
  }
};

// تنفيذ تنظيف بيانات إعادة الاتصال عند تحميل الصفحة
handleReconnectReload();

// Add global error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  
  // Check if it's a module loading error
  if (event.error?.message?.includes('Failed to fetch dynamically imported module') ||
      event.error?.message?.includes('net::ERR_ABORTED')) {
    handleModuleLoadError(event.error, event.filename || 'unknown');
    return;
  }
  
  appErrorHandler.handleError(event.error);
});

// Add global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Check if it's a network error
  if (event.reason instanceof TypeError && 
      (event.reason.message?.includes('Failed to fetch') ||
       event.reason.message?.includes('net::ERR_ABORTED'))) {
    connectionManager.checkConnectionAndNotify();
  }
  
  appErrorHandler.handleError(event.reason);
});

// Add custom error handler for React errors
const originalConsoleError = console.error;
console.error = (...args) => {
  // Check if this is a React error
  const errorMessage = args.join(' ');
  if (
    errorMessage.includes('The above error occurred in') ||
    errorMessage.includes('React will try to recreate this component tree')
  ) {
    appErrorHandler.handleError(new Error(errorMessage));
  }
  originalConsoleError(...args);
};

// Set health check endpoint - استخدام نقطة نهاية متسقة مع ما تم تعديله في connectionManager.ts
connectionManager.setHealthCheckEndpoint('/api/health-check');

// Create a network status indicator element
const networkStatusContainer = document.createElement('div');
networkStatusContainer.id = 'network-status-container';
networkStatusContainer.style.position = 'fixed';
networkStatusContainer.style.bottom = '10px';
networkStatusContainer.style.right = '10px';
networkStatusContainer.style.zIndex = '9999';
document.body.appendChild(networkStatusContainer);

// Render the main app
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

// Render the network status indicator in its own container
createRoot(networkStatusContainer).render(
  <NetworkStatusIndicator showLabel={true} />
);
