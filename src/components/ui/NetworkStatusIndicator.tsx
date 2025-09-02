import React from 'react';
import { useConnectionStatus, ConnectionStatus } from '@/services/connectionManager';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

interface NetworkStatusIndicatorProps {
  showLabel?: boolean;
  className?: string;
}

const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  showLabel = false,
  className = '',
}) => {
  const status = useConnectionStatus();

  let icon = null;
  let label = '';
  let colorClass = '';

  switch (status) {
    case ConnectionStatus.ONLINE:
      icon = <Wifi className="h-4 w-4" />;
      label = 'متصل';
      colorClass = 'text-green-500';
      break;
    case ConnectionStatus.OFFLINE:
      icon = <WifiOff className="h-4 w-4" />;
      label = 'غير متصل';
      colorClass = 'text-red-500';
      break;
    case ConnectionStatus.RECONNECTING:
      icon = <AlertCircle className="h-4 w-4 animate-pulse" />;
      label = 'جاري إعادة الاتصال';
      colorClass = 'text-amber-500';
      break;
  }

  return (
    <div className={`flex items-center gap-1.5 ${colorClass} ${className}`}>
      {icon}
      {showLabel && <span className="text-xs font-medium">{label}</span>}
    </div>
  );
};

export default NetworkStatusIndicator;