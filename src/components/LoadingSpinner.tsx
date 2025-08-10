import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  showProgress?: boolean;
  progress?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'lg',
  text = 'جاري التحميل...',
  showProgress = false,
  progress = 0
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-6">
        {/* Main Spinner */}
        <div className="relative">
          {/* Outer ring with pulse effect */}
          <div className={`${sizeClasses[size]} rounded-full border-4 border-primary/20 animate-pulse`}></div>
          
          {/* Inner spinning ring */}
          <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full border-4 border-transparent border-t-primary animate-spin`}></div>
          
          {/* Center dot */}
          <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full flex items-center justify-center`}>
            <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <p className={`font-medium text-foreground ${textSizes[size]}`}>
            {text}
          </p>
          <p className="text-sm text-muted-foreground">
            يرجى الانتظار قليلاً
          </p>
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="w-64 bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        )}

        {/* Loading Dots */}
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

// Variant for page loading
export const PageLoadingSpinner: React.FC<LoadingSpinnerProps> = (props) => (
  <LoadingSpinner size="lg" text="جاري تحميل الصفحة..." {...props} />
);

// Variant for component loading
export const ComponentLoadingSpinner: React.FC<LoadingSpinnerProps> = (props) => (
  <LoadingSpinner size="md" text="جاري التحميل..." {...props} />
);

// Variant for data loading
export const DataLoadingSpinner: React.FC<LoadingSpinnerProps> = (props) => (
  <LoadingSpinner size="sm" text="جاري جلب البيانات..." {...props} />
);

export default LoadingSpinner;
