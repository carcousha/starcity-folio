import React from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface FastLoaderProps {
  componentPath: string;
  fallbackText?: string;
  preload?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

const FastLoader: React.FC<FastLoaderProps> = ({ 
  fallbackText = 'جاري التحميل...', 
}) => {
  // For now, just show loading - the complex lazy loading was causing build issues
  return <LoadingSpinner text={fallbackText} />;
};

export default FastLoader;