import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

/**
 * Fallback component for error boundaries
 */
const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
      <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold mb-2">حدث خطأ غير متوقع</h2>
      <p className="text-gray-600 mb-2 max-w-md">نعتذر عن هذا الخطأ. يرجى إعادة تحميل الصفحة للمتابعة.</p>
      <div className="bg-gray-100 p-4 rounded-md mb-6 max-w-md overflow-auto text-left">
        <p className="text-sm font-mono text-red-600">{error.message}</p>
      </div>
      <div className="flex gap-4">
        <button
          onClick={resetErrorBoundary}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          إعادة المحاولة
        </button>
        <button
          onClick={() => {
            try {
              // حفظ المسار الحالي قبل إعادة التحميل
              const currentPath = window.location.pathname;
              sessionStorage.setItem('lastPath', currentPath);
              sessionStorage.setItem('reconnectTimestamp', Date.now().toString());
              
              // إعادة تحميل الصفحة
              window.location.reload();
            } catch (error) {
              console.error('فشل في حفظ حالة التطبيق قبل إعادة التحميل:', error);
              // محاولة بديلة لإعادة التحميل
              window.location.reload();
            }
          }}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
        >
          إعادة تحميل الصفحة
        </button>
      </div>
    </div>
  );
};

export default ErrorFallback;