import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Network, 
  Wifi, 
  WifiOff, 
  Download, 
  Upload,
  Clock,
  Activity,
  Zap,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Settings,
  Database
} from 'lucide-react';

interface NetworkStats {
  latency: number;
  bandwidth: number;
  connectionType: string;
  isOnline: boolean;
  requestCount: number;
  cacheHitRate: number;
  averageResponseTime: number;
  failedRequests: number;
}

interface CacheItem {
  key: string;
  size: number;
  lastAccessed: Date;
  accessCount: number;
  ttl: number;
}

interface NetworkOptimizerProps {
  onNetworkOptimize?: () => void;
  onCacheClear?: () => void;
  enableAutoOptimization?: boolean;
  cacheEnabled?: boolean;
  compressionEnabled?: boolean;
}

export const NetworkOptimizer: React.FC<NetworkOptimizerProps> = ({
  onNetworkOptimize,
  onCacheClear,
  enableAutoOptimization = true,
  cacheEnabled = true,
  compressionEnabled = true
}) => {
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    latency: 0,
    bandwidth: 0,
    connectionType: 'unknown',
    isOnline: navigator.onLine,
    requestCount: 0,
    cacheHitRate: 0,
    averageResponseTime: 0,
    failedRequests: 0
  });

  const [cacheItems, setCacheItems] = useState<CacheItem[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [autoOptimizationEnabled, setAutoOptimizationEnabled] = useState(enableAutoOptimization);
  const [cacheEnabledState, setCacheEnabledState] = useState(cacheEnabled);
  const [compressionEnabledState, setCompressionEnabledState] = useState(compressionEnabled);
  const [customCacheTTL, setCustomCacheTTL] = useState(300); // 5 دقائق

  const optimizationIntervalRef = useRef<NodeJS.Timeout>();
  const networkCheckIntervalRef = useRef<NodeJS.Timeout>();

  // محاكاة فحص الشبكة
  const checkNetworkStatus = useCallback(() => {
    // محاكاة قياسات الشبكة
    const mockLatency = Math.random() * 100 + 20; // 20-120ms
    const mockBandwidth = Math.random() * 50 + 10; // 10-60 Mbps
    const mockResponseTime = Math.random() * 500 + 100; // 100-600ms
    
    // محاكاة نوع الاتصال
    const connectionTypes = ['4G', '5G', 'WiFi', 'Ethernet'];
    const mockConnectionType = connectionTypes[Math.floor(Math.random() * connectionTypes.length)];
    
    // محاكاة معدل نجاح الكاش
    const mockCacheHitRate = Math.random() * 40 + 60; // 60-100%
    
    // محاكاة عدد الطلبات
    const mockRequestCount = Math.floor(Math.random() * 100) + 50;
    const mockFailedRequests = Math.floor(Math.random() * 10);

    setNetworkStats(prev => ({
      ...prev,
      latency: mockLatency,
      bandwidth: mockBandwidth,
      connectionType: mockConnectionType,
      isOnline: navigator.onLine,
      requestCount: mockRequestCount,
      cacheHitRate: mockCacheHitRate,
      averageResponseTime: mockResponseTime,
      failedRequests: mockFailedRequests
    }));

    // تحسين تلقائي إذا كانت الشبكة بطيئة
    if (autoOptimizationEnabled && mockLatency > 80) {
      performNetworkOptimization();
    }
  }, [autoOptimizationEnabled]);

  // محاكاة عناصر الكاش
  const generateMockCacheItems = useCallback(() => {
    const mockItems: CacheItem[] = [];
    const cacheKeys = [
      'user-profile', 'dashboard-data', 'settings', 'notifications',
      'client-list', 'reports', 'templates', 'analytics'
    ];

    for (let i = 0; i < 8; i++) {
      mockItems.push({
        key: cacheKeys[i],
        size: Math.floor(Math.random() * 100) + 10, // 10-110 KB
        lastAccessed: new Date(Date.now() - Math.random() * 86400000), // آخر 24 ساعة
        accessCount: Math.floor(Math.random() * 100) + 1,
        ttl: Math.floor(Math.random() * 600) + 300 // 5-15 دقيقة
      });
    }

    setCacheItems(mockItems);
  }, []);

  // تحسين الشبكة
  const performNetworkOptimization = useCallback(async () => {
    setIsOptimizing(true);
    
    try {
      // محاكاة عملية التحسين
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // تحسين الإحصائيات
      setNetworkStats(prev => ({
        ...prev,
        latency: Math.max(prev.latency * 0.7, 20), // تحسين 30%
        averageResponseTime: Math.max(prev.averageResponseTime * 0.8, 100),
        cacheHitRate: Math.min(prev.cacheHitRate * 1.1, 100)
      }));

      onNetworkOptimize?.();
      
    } catch (error) {
      console.error('خطأ في تحسين الشبكة:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [onNetworkOptimize]);

  // تنظيف الكاش
  const clearCache = useCallback(async () => {
    setIsOptimizing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setCacheItems([]);
      onCacheClear?.();
      
      // تحسين معدل نجاح الكاش
      setNetworkStats(prev => ({
        ...prev,
        cacheHitRate: Math.max(prev.cacheHitRate * 0.9, 0)
      }));
      
    } catch (error) {
      console.error('خطأ في تنظيف الكاش:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [onCacheClear]);

  // تنظيف عناصر الكاش منتهية الصلاحية
  const cleanupExpiredCache = useCallback(() => {
    const now = Date.now();
    const validItems = cacheItems.filter(item => {
      const itemAge = now - item.lastAccessed.getTime();
      return itemAge < item.ttl * 1000; // تحويل TTL إلى ميلي ثانية
    });

    setCacheItems(validItems);
  }, [cacheItems]);

  // إضافة عنصر كاش جديد
  const addCacheItem = useCallback((key: string, size: number) => {
    const newItem: CacheItem = {
      key,
      size,
      lastAccessed: new Date(),
      accessCount: 1,
      ttl: customCacheTTL
    };

    setCacheItems(prev => [...prev, newItem]);
  }, [customCacheTTL]);

  // إعداد الفحص التلقائي
  useEffect(() => {
    if (autoOptimizationEnabled) {
      networkCheckIntervalRef.current = setInterval(checkNetworkStatus, 10000); // كل 10 ثوان
    }

    return () => {
      if (networkCheckIntervalRef.current) {
        clearInterval(networkCheckIntervalRef.current);
      }
    };
  }, [autoOptimizationEnabled, checkNetworkStatus]);

  // تحسين تلقائي دوري
  useEffect(() => {
    if (autoOptimizationEnabled) {
      optimizationIntervalRef.current = setInterval(() => {
        if (networkStats.latency > 100 || networkStats.cacheHitRate < 70) {
          performNetworkOptimization();
        }
      }, 60000); // كل دقيقة
    }

    return () => {
      if (optimizationIntervalRef.current) {
        clearInterval(optimizationIntervalRef.current);
      }
    };
  }, [autoOptimizationEnabled, networkStats.latency, networkStats.cacheHitRate, performNetworkOptimization]);

  // فحص أولي
  useEffect(() => {
    checkNetworkStatus();
    generateMockCacheItems();
  }, []);

  // تنظيف الكاش منتهي الصلاحية كل دقيقة
  useEffect(() => {
    const cleanupInterval = setInterval(cleanupExpiredCache, 60000);
    return () => clearInterval(cleanupInterval);
  }, [cleanupExpiredCache]);

  const getNetworkStatusColor = (latency: number) => {
    if (latency < 50) return 'text-green-600';
    if (latency < 100) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getNetworkStatusIcon = (latency: number) => {
    if (latency < 50) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (latency < 100) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <AlertTriangle className="h-5 w-5 text-red-600" />;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* حالة الشبكة الحالية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            حالة الشبكة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getNetworkStatusColor(networkStats.latency)}`}>
                {networkStats.latency.toFixed(0)}ms
              </div>
              <div className="text-sm text-gray-600">زمن الاستجابة</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {networkStats.bandwidth.toFixed(1)}Mbps
              </div>
              <div className="text-sm text-gray-600">سرعة النطاق</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {networkStats.cacheHitRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">معدل نجاح الكاش</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {networkStats.connectionType}
              </div>
              <div className="text-sm text-gray-600">نوع الاتصال</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">زمن الاستجابة</span>
              <div className="flex items-center gap-2">
                {getNetworkStatusIcon(networkStats.latency)}
                <span className={`text-sm font-medium ${getNetworkStatusColor(networkStats.latency)}`}>
                  {networkStats.latency.toFixed(0)}ms
                </span>
              </div>
            </div>
            <Progress 
              value={Math.min((networkStats.latency / 200) * 100, 100)} 
              className="h-2"
            />
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span>الطلبات:</span>
                <Badge variant="outline">{networkStats.requestCount}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>الطلبات الفاشلة:</span>
                <Badge variant={networkStats.failedRequests > 5 ? 'destructive' : 'outline'}>
                  {networkStats.failedRequests}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>متوسط وقت الاستجابة:</span>
                <span>{networkStats.averageResponseTime.toFixed(0)}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span>الحالة:</span>
                <Badge variant={networkStats.isOnline ? 'default' : 'destructive'}>
                  {networkStats.isOnline ? 'متصل' : 'غير متصل'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* إعدادات التحسين */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            إعدادات التحسين
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">التحسين التلقائي</div>
                <div className="text-sm text-gray-600">
                  تحسين تلقائي عند انخفاض الأداء
                </div>
              </div>
              <Switch
                checked={autoOptimizationEnabled}
                onCheckedChange={setAutoOptimizationEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">تفعيل الكاش</div>
                <div className="text-sm text-gray-600">
                  تخزين البيانات مؤقتاً لتحسين الأداء
                </div>
              </div>
              <Switch
                checked={cacheEnabledState}
                onCheckedChange={setCacheEnabledState}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">ضغط البيانات</div>
                <div className="text-sm text-gray-600">
                  تقليل حجم البيانات المرسلة
                </div>
              </div>
              <Switch
                checked={compressionEnabledState}
                onCheckedChange={setCompressionEnabledState}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cache-ttl">وقت صلاحية الكاش (ثانية)</Label>
              <Input
                id="cache-ttl"
                type="number"
                value={customCacheTTL}
                onChange={(e) => setCustomCacheTTL(Number(e.target.value))}
                min="60"
                max="3600"
                className="w-32"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* إدارة الكاش */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              إدارة الكاش
            </span>
            <div className="flex gap-2">
              <Button
                onClick={performNetworkOptimization}
                disabled={isOptimizing}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {isOptimizing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                تحسين الشبكة
              </Button>
              
              <Button
                onClick={clearCache}
                disabled={isOptimizing}
                variant="destructive"
                size="sm"
                className="flex items-center gap-2"
              >
                {isOptimizing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Database className="h-4 w-4" />
                )}
                تنظيف الكاش
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cacheItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Database className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-medium">{item.key}</div>
                    <div className="text-sm text-gray-600">
                      آخر استخدام: {item.lastAccessed.toLocaleTimeString('ar-SA')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-medium">{formatBytes(item.size * 1024)}</div>
                    <div className="text-sm text-gray-600">الحجم</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium">{item.accessCount}</div>
                    <div className="text-sm text-gray-600">الاستخدامات</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium">{item.ttl}s</div>
                    <div className="text-sm text-gray-600">TTL</div>
                  </div>
                  
                  <Badge variant="outline">
                    {Math.ceil((Date.now() - item.lastAccessed.getTime()) / 1000)}s
                  </Badge>
                </div>
              </div>
            ))}
            
            {cacheItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد عناصر في الكاش</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
