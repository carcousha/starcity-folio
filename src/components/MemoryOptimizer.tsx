import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { 
  Memory, 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  Activity,
  Gauge,
  HardDrive
} from 'lucide-react';

interface MemoryStats {
  usedMemory: number;
  totalMemory: number;
  freeMemory: number;
  memoryUsage: number;
  componentCount: number;
  cachedComponents: number;
  lastCleanup: Date;
}

interface MemoryOptimizerProps {
  onMemoryCleanup?: () => void;
  onComponentUnmount?: (componentId: string) => void;
  enableAutoCleanup?: boolean;
  cleanupThreshold?: number;
  maxCachedComponents?: number;
}

export const MemoryOptimizer: React.FC<MemoryOptimizerProps> = ({
  onMemoryCleanup,
  onComponentUnmount,
  enableAutoCleanup = true,
  cleanupThreshold = 80,
  maxCachedComponents = 50
}) => {
  const [memoryStats, setMemoryStats] = useState<MemoryStats>({
    usedMemory: 0,
    totalMemory: 0,
    freeMemory: 0,
    memoryUsage: 0,
    componentCount: 0,
    cachedComponents: 0,
    lastCleanup: new Date()
  });

  const [isCleaning, setIsCleaning] = useState(false);
  const [autoCleanupEnabled, setAutoCleanupEnabled] = useState(enableAutoCleanup);
  const [cleanupHistory, setCleanupHistory] = useState<Array<{
    timestamp: Date;
    freedMemory: number;
    componentsRemoved: number;
  }>>([]);

  const cleanupIntervalRef = useRef<NodeJS.Timeout>();
  const memoryCheckIntervalRef = useRef<NodeJS.Timeout>();

  // محاكاة فحص الذاكرة
  const checkMemoryUsage = useCallback(() => {
    // في التطبيق الحقيقي، يمكن استخدام Performance API أو Web Memory API
    const mockUsedMemory = Math.random() * 100 + 50; // 50-150 MB
    const mockTotalMemory = 200; // 200 MB
    const mockFreeMemory = mockTotalMemory - mockUsedMemory;
    const mockMemoryUsage = (mockUsedMemory / mockTotalMemory) * 100;
    
    const mockComponentCount = Math.floor(Math.random() * 100) + 20;
    const mockCachedComponents = Math.floor(Math.random() * 30) + 10;

    setMemoryStats({
      usedMemory: mockUsedMemory,
      totalMemory: mockTotalMemory,
      freeMemory: mockFreeMemory,
      memoryUsage: mockMemoryUsage,
      componentCount: mockComponentCount,
      cachedComponents: mockCachedComponents,
      lastCleanup: memoryStats.lastCleanup
    });

    // تنظيف تلقائي إذا تجاوز الاستخدام الحد
    if (autoCleanupEnabled && mockMemoryUsage > cleanupThreshold) {
      performCleanup();
    }
  }, [autoCleanupEnabled, cleanupThreshold, memoryStats.lastCleanup]);

  // تنظيف الذاكرة
  const performCleanup = useCallback(async () => {
    setIsCleaning(true);
    
    try {
      // محاكاة عملية التنظيف
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const freedMemory = memoryStats.usedMemory * 0.3; // تحرير 30% من الذاكرة المستخدمة
      const componentsRemoved = Math.floor(memoryStats.cachedComponents * 0.5);
      
      // تحديث الإحصائيات
      setMemoryStats(prev => ({
        ...prev,
        usedMemory: prev.usedMemory - freedMemory,
        freeMemory: prev.freeMemory + freedMemory,
        memoryUsage: ((prev.usedMemory - freedMemory) / prev.totalMemory) * 100,
        cachedComponents: prev.cachedComponents - componentsRemoved,
        lastCleanup: new Date()
      }));

      // إضافة إلى سجل التنظيف
      setCleanupHistory(prev => [
        {
          timestamp: new Date(),
          freedMemory,
          componentsRemoved
        },
        ...prev.slice(0, 9) // الاحتفاظ بآخر 10 عمليات تنظيف
      ]);

      // استدعاء callback التنظيف
      onMemoryCleanup?.();
      
    } catch (error) {
      console.error('خطأ في تنظيف الذاكرة:', error);
    } finally {
      setIsCleaning(false);
    }
  }, [memoryStats, onMemoryCleanup]);

  // تنظيف مكون محدد
  const cleanupComponent = useCallback((componentId: string) => {
    onComponentUnmount?.(componentId);
    
    setMemoryStats(prev => ({
      ...prev,
      componentCount: Math.max(0, prev.componentCount - 1),
      cachedComponents: Math.max(0, prev.cachedComponents - 1)
    }));
  }, [onComponentUnmount]);

  // تنظيف شامل
  const performFullCleanup = useCallback(async () => {
    setIsCleaning(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const freedMemory = memoryStats.usedMemory * 0.6; // تحرير 60% من الذاكرة
      const componentsRemoved = memoryStats.cachedComponents;
      
      setMemoryStats(prev => ({
        ...prev,
        usedMemory: prev.usedMemory - freedMemory,
        freeMemory: prev.freeMemory + freedMemory,
        memoryUsage: ((prev.usedMemory - freedMemory) / prev.totalMemory) * 100,
        cachedComponents: 0,
        lastCleanup: new Date()
      }));

      setCleanupHistory(prev => [
        {
          timestamp: new Date(),
          freedMemory,
          componentsRemoved
        },
        ...prev.slice(0, 9)
      ]);

      onMemoryCleanup?.();
      
    } catch (error) {
      console.error('خطأ في التنظيف الشامل:', error);
    } finally {
      setIsCleaning(false);
    }
  }, [memoryStats, onMemoryCleanup]);

  // إعداد الفحص التلقائي
  useEffect(() => {
    if (autoCleanupEnabled) {
      memoryCheckIntervalRef.current = setInterval(checkMemoryUsage, 5000); // كل 5 ثوان
    }

    return () => {
      if (memoryCheckIntervalRef.current) {
        clearInterval(memoryCheckIntervalRef.current);
      }
    };
  }, [autoCleanupEnabled, checkMemoryUsage]);

  // تنظيف تلقائي دوري
  useEffect(() => {
    if (autoCleanupEnabled) {
      cleanupIntervalRef.current = setInterval(() => {
        if (memoryStats.memoryUsage > 70) { // تنظيف عند 70%
          performCleanup();
        }
      }, 30000); // كل 30 ثانية
    }

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, [autoCleanupEnabled, memoryStats.memoryUsage, performCleanup]);

  // فحص أولي
  useEffect(() => {
    checkMemoryUsage();
  }, []);

  const getMemoryStatusColor = (usage: number) => {
    if (usage < 50) return 'text-green-600';
    if (usage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMemoryStatusIcon = (usage: number) => {
    if (usage < 50) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (usage < 80) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <AlertTriangle className="h-5 w-5 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      {/* حالة الذاكرة الحالية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Memory className="h-5 w-5" />
            حالة الذاكرة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getMemoryStatusColor(memoryStats.memoryUsage)}`}>
                {memoryStats.memoryUsage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">استخدام الذاكرة</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {memoryStats.usedMemory.toFixed(1)}MB
              </div>
              <div className="text-sm text-gray-600">الذاكرة المستخدمة</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {memoryStats.freeMemory.toFixed(1)}MB
              </div>
              <div className="text-sm text-gray-600">الذاكرة المتاحة</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {memoryStats.componentCount}
              </div>
              <div className="text-sm text-gray-600">المكونات النشطة</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">استخدام الذاكرة</span>
              <div className="flex items-center gap-2">
                {getMemoryStatusIcon(memoryStats.memoryUsage)}
                <span className={`text-sm font-medium ${getMemoryStatusColor(memoryStats.memoryUsage)}`}>
                  {memoryStats.memoryUsage.toFixed(1)}%
                </span>
              </div>
            </div>
            <Progress 
              value={memoryStats.memoryUsage} 
              className="h-2"
              color={memoryStats.memoryUsage > 80 ? 'red' : memoryStats.memoryUsage > 60 ? 'yellow' : 'green'}
            />
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span>آخر تنظيف:</span>
              <span>{memoryStats.lastCleanup.toLocaleString('ar-SA')}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span>المكونات المخزنة مؤقتاً:</span>
              <Badge variant={memoryStats.cachedComponents > maxCachedComponents ? 'destructive' : 'secondary'}>
                {memoryStats.cachedComponents}/{maxCachedComponents}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* إعدادات التنظيف */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            إعدادات التنظيف
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">التنظيف التلقائي</div>
                <div className="text-sm text-gray-600">
                  تنظيف تلقائي عند تجاوز {cleanupThreshold}% من الذاكرة
                </div>
              </div>
              <Switch
                checked={autoCleanupEnabled}
                onCheckedChange={setAutoCleanupEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">حد التنظيف</div>
                <div className="text-sm text-gray-600">
                  بدء التنظيف عند {cleanupThreshold}% من استخدام الذاكرة
                </div>
              </div>
              <Badge variant="outline">{cleanupThreshold}%</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">الحد الأقصى للمكونات المخزنة</div>
                <div className="text-sm text-gray-600">
                  عدد المكونات التي يمكن تخزينها مؤقتاً
                </div>
              </div>
              <Badge variant="outline">{maxCachedComponents}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* أزرار التنظيف */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            عمليات التنظيف
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={performCleanup}
              disabled={isCleaning}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isCleaning ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              تنظيف عادي
            </Button>
            
            <Button
              onClick={performFullCleanup}
              disabled={isCleaning}
              variant="destructive"
              className="flex items-center gap-2"
            >
              {isCleaning ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <HardDrive className="h-4 w-4" />
              )}
              تنظيف شامل
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* سجل التنظيف */}
      {cleanupHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              سجل عمليات التنظيف
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cleanupHistory.map((cleanup, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium">
                        تم تحرير {cleanup.freedMemory.toFixed(1)}MB
                      </div>
                      <div className="text-sm text-gray-600">
                        {cleanup.componentsRemoved} مكون تم إزالته
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {cleanup.timestamp.toLocaleTimeString('ar-SA')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
