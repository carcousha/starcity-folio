import React, { Suspense, ComponentType } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface LazyRouteProps {
  component: ComponentType<any>;
  fallback?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
}

export const LazyRoute: React.FC<LazyRouteProps> = ({
  component: Component,
  fallback,
  size = 'lg',
  text = 'جاري تحميل الصفحة...'
}) => {
  const defaultFallback = <LoadingSpinner size={size} text={text} />;
  
  return (
    <Suspense fallback={fallback || defaultFallback}>
      <Component />
    </Suspense>
  );
};

export default LazyRoute;
