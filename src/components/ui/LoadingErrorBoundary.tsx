import React, { Suspense, ErrorInfo } from 'react';
import { handleModuleLoadError } from '@/services/moduleErrorHandler';
import { Loader2 } from 'lucide-react';

interface LoadingErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  modulePath?: string;
}

interface LoadingErrorBoundaryState {
  hasError: boolean;
}

/**
 * Error boundary specifically for handling lazy-loaded component errors
 * with integrated suspense fallback
 */
class LoadingErrorBoundary extends React.Component<
  LoadingErrorBoundaryProps,
  LoadingErrorBoundaryState
> {
  constructor(props: LoadingErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): LoadingErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { modulePath = 'unknown' } = this.props;
    handleModuleLoadError(error, modulePath);
    console.error('Component loading error:', error, errorInfo);
  }

  render(): React.ReactNode {
    const { children, fallback } = this.props;

    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <h2 className="text-xl font-semibold text-red-500 mb-2">خطأ في تحميل المكون</h2>
          <p className="text-gray-600 mb-4">فشل تحميل هذا الجزء من التطبيق</p>
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
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      );
    }

    return (
      <Suspense
        fallback={
          fallback || (
            <div className="flex items-center justify-center w-full h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )
        }
      >
        {children}
      </Suspense>
    );
  }
}

export default LoadingErrorBoundary;