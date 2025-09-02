import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface RetryErrorViewProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Component to display error states with retry functionality
 */
const RetryErrorView: React.FC<RetryErrorViewProps> = ({
  title = 'حدث خطأ',
  message = 'حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-6 text-center ${className}`}>
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          إعادة المحاولة
        </button>
      )}
    </div>
  );
};

export default RetryErrorView;