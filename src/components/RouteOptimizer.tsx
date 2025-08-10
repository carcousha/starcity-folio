import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Route, 
  Clock, 
  Zap, 
  TrendingUp, 
  Activity,
  ArrowRight,
  Loader2
} from 'lucide-react';

interface RouteMetrics {
  path: string;
  loadTime: number;
  accessCount: number;
  lastAccessed: Date;
  bundleSize: number;
  priority: number;
}

interface RouteOptimizerProps {
  routes: RouteMetrics[];
  onRouteOptimize?: (path: string) => void;
  enableAnalytics?: boolean;
  enableAutoOptimization?: boolean;
}

export const RouteOptimizer: React.FC<RouteOptimizerProps> = ({
  routes,
  onRouteOptimize,
  enableAnalytics = true,
  enableAutoOptimization = true
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [optimizationStats, setOptimizationStats] = useState<{
    totalRoutes: number;
    optimizedRoutes: number;
    averageLoadTime: number;
    totalBundleSize: number;
  }>({
    totalRoutes: 0,
    optimizedRoutes: 0,
    averageLoadTime: 0,
    totalBundleSize: 0
  });

  const [isOptimizing, setIsOptimizing] = useState(false);

  // حساب الإحصائيات
  useEffect(() => {
    if (!enableAnalytics) return;

    const stats = routes.reduce((acc, route) => {
      acc.totalRoutes++;
      acc.totalBundleSize += route.bundleSize;
      acc.averageLoadTime += route.loadTime;
      
      if (route.loadTime < 1000) { // أقل من ثانية
        acc.optimizedRoutes++;
      }
      
      return acc;
    }, {
      totalRoutes: 0,
      optimizedRoutes: 0,
      averageLoadTime: 0,
      totalBundleSize: 0
    });

    stats.averageLoadTime = stats.averageLoadTime / stats.totalRoutes;
    setOptimizationStats(stats);
  }, [routes, enableAnalytics]);

  // تحسين تلقائي للمسارات البطيئة
  useEffect(() => {
    if (!enableAutoOptimization) return;

    const slowRoutes = routes.filter(route => route.loadTime > 2000);
    if (slowRoutes.length > 0) {
      console.log('اكتشاف مسارات بطيئة:', slowRoutes.map(r => r.path));
    }
  }, [routes, enableAutoOptimization]);

  // تحسين مسار محدد
  const optimizeRoute = async (path: string) => {
    setIsOptimizing(true);
    
    try {
      // محاكاة عملية التحسين
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onRouteOptimize?.(path);
      
      // تحديث الإحصائيات
      setOptimizationStats(prev => ({
        ...prev,
        optimizedRoutes: prev.optimizedRoutes + 1
      }));
      
    } catch (error) {
      console.error('خطأ في تحسين المسار:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  // تحسين جميع المسارات
  const optimizeAllRoutes = async () => {
    setIsOptimizing(true);
    
    try {
      const slowRoutes = routes.filter(route => route.loadTime > 1000);
      
      for (const route of slowRoutes) {
        await optimizeRoute(route.path);
      }
      
    } catch (error) {
      console.error('خطأ في تحسين جميع المسارات:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  // ترتيب المسارات حسب الأولوية
  const sortedRoutes = useMemo(() => {
    return [...routes].sort((a, b) => {
      // أولاً حسب الأولوية
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      // ثم حسب وقت التحميل
      return a.loadTime - b.loadTime;
    });
  }, [routes]);

  // الحصول على حالة المسار الحالي
  const currentRoute = useMemo(() => {
    return routes.find(route => route.path === location.pathname);
  }, [routes, location.pathname]);

  if (!enableAnalytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* ملخص الإحصائيات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            ملخص تحسين المسارات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {optimizationStats.totalRoutes}
              </div>
              <div className="text-sm text-gray-600">إجمالي المسارات</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {optimizationStats.optimizedRoutes}
              </div>
              <div className="text-sm text-gray-600">المسارات المحسنة</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {optimizationStats.averageLoadTime.toFixed(0)}ms
              </div>
              <div className="text-sm text-gray-600">متوسط وقت التحميل</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(optimizationStats.totalBundleSize / 1024).toFixed(1)}KB
              </div>
              <div className="text-sm text-gray-600">حجم الحزم</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>نسبة التحسين</span>
              <span>{((optimizationStats.optimizedRoutes / optimizationStats.totalRoutes) * 100).toFixed(1)}%</span>
            </div>
            <Progress 
              value={(optimizationStats.optimizedRoutes / optimizationStats.totalRoutes) * 100} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* المسار الحالي */}
      {currentRoute && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Route className="h-5 w-5" />
              المسار الحالي: {currentRoute.path}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {currentRoute.loadTime}ms
                </div>
                <div className="text-sm text-blue-600">وقت التحميل</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {currentRoute.accessCount}
                </div>
                <div className="text-sm text-blue-600">عدد الزيارات</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {currentRoute.bundleSize}KB
                </div>
                <div className="text-sm text-blue-600">حجم الحزمة</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* قائمة المسارات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              تحليل المسارات
            </span>
            <Button 
              onClick={optimizeAllRoutes}
              disabled={isOptimizing}
              className="flex items-center gap-2"
            >
              {isOptimizing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              تحسين الكل
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedRoutes.map((route, index) => (
              <div 
                key={route.path}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  route.path === location.pathname 
                    ? 'border-blue-300 bg-blue-50' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={route.priority >= 8 ? 'default' : route.priority >= 5 ? 'secondary' : 'outline'}
                    className="min-w-[60px] text-center"
                  >
                    {route.priority}/10
                  </Badge>
                  <div>
                    <div className="font-medium">{route.path}</div>
                    <div className="text-sm text-gray-600">
                      آخر زيارة: {route.lastAccessed.toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-medium">{route.loadTime}ms</div>
                    <div className="text-sm text-gray-600">وقت التحميل</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium">{route.bundleSize}KB</div>
                    <div className="text-sm text-gray-600">الحجم</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium">{route.accessCount}</div>
                    <div className="text-sm text-gray-600">الزيارات</div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => optimizeRoute(route.path)}
                    disabled={isOptimizing}
                    className="flex items-center gap-2"
                  >
                    {isOptimizing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <ArrowRight className="h-3 w-3" />
                    )}
                    تحسين
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
