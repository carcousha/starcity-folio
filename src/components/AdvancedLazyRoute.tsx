import React, { Suspense, ComponentType, useState, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface AdvancedLazyRouteProps {
  component: ComponentType<any>;
  fallback?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  preload?: boolean;
  preloadDelay?: number;
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ComponentType<{ error: Error; retry: () => void }> },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback: React.ComponentType<{ error: Error; retry: () => void }> }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return <this.props.fallback error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] p-6 space-y-4">
    <Alert variant="destructive" className="max-w-md">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        حدث خطأ أثناء تحميل المكون
        <details className="mt-2 text-xs">
          <summary className="cursor-pointer">تفاصيل الخطأ</summary>
          <pre className="mt-2 whitespace-pre-wrap">{error.message}</pre>
        </details>
      </AlertDescription>
    </Alert>
    <Button onClick={retry} variant="outline" size="sm">
      <RefreshCw className="h-4 w-4 mr-2" />
      إعادة المحاولة
    </Button>
  </div>
);

export const AdvancedLazyRoute: React.FC<AdvancedLazyRouteProps> = ({
  component: Component,
  fallback,
  size = 'lg',
  text = 'جاري تحميل الصفحة...',
  preload = false,
  preloadDelay = 1000,
  errorFallback = DefaultErrorFallback,
  onLoad,
  onError
}) => {
  const [isPreloaded, setIsPreloaded] = useState(false);

  useEffect(() => {
    if (preload && !isPreloaded) {
      const timer = setTimeout(() => {
        setIsPreloaded(true);
      }, preloadDelay);

      return () => clearTimeout(timer);
    }
  }, [preload, preloadDelay, isPreloaded]);

  const defaultFallback = <LoadingSpinner size={size} text={text} />;

  const handleLoad = () => {
    onLoad?.();
  };

  const handleError = (error: Error) => {
    onError?.(error);
  };

  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense 
        fallback={fallback || defaultFallback}
        onError={handleError}
      >
        <Component onLoad={handleLoad} />
      </Suspense>
    </ErrorBoundary>
  );
};

export default AdvancedLazyRoute;
