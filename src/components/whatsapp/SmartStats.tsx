import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';

interface StatsData {
  totalMessages: number;
  deliveredMessages: number;
  failedMessages: number;
  pendingMessages: number;
  activeCampaigns: number;
  totalRecipients: number;
  responseRate: number;
  averageResponseTime: number;
}

export default function SmartStats() {
  const [stats, setStats] = useState<StatsData>({
    totalMessages: 0,
    deliveredMessages: 0,
    failedMessages: 0,
    pendingMessages: 0,
    activeCampaigns: 0,
    totalRecipients: 0,
    responseRate: 0,
    averageResponseTime: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    // محاكاة جلب البيانات
    const fetchStats = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockStats: StatsData = {
        totalMessages: 1247,
        deliveredMessages: 1189,
        failedMessages: 23,
        pendingMessages: 35,
        activeCampaigns: 8,
        totalRecipients: 892,
        responseRate: 78.5,
        averageResponseTime: 2.3
      };
      
      setStats(mockStats);
      setIsLoading(false);
    };

    fetchStats();
  }, [timeRange]);

  const getDeliveryRate = () => {
    if (stats.totalMessages === 0) return 0;
    return Math.round((stats.deliveredMessages / stats.totalMessages) * 100);
  };

  const getSuccessRate = () => {
    if (stats.totalMessages === 0) return 0;
    return Math.round((stats.deliveredMessages / (stats.deliveredMessages + stats.failedMessages)) * 100);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* شريط الفترة الزمنية */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">الإحصائيات الذكية</h3>
        <div className="flex space-x-2 space-x-reverse">
          {(['today', 'week', 'month'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === 'today' && 'اليوم'}
              {range === 'week' && 'الأسبوع'}
              {range === 'month' && 'الشهر'}
            </Button>
          ))}
        </div>
      </div>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              إجمالي الرسائل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {getDeliveryRate()}% تم التسليم
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              الرسائل المسلمة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.deliveredMessages.toLocaleString()}
            </div>
            <Progress value={getSuccessRate()} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              معدل النجاح: {getSuccessRate()}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              الرسائل الفاشلة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.failedMessages.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="destructive" className="text-xs">
                {stats.failedMessages > 0 ? Math.round((stats.failedMessages / stats.totalMessages) * 100) : 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              الرسائل المعلقة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pendingMessages.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                في الانتظار
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* إحصائيات إضافية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              إحصائيات المستلمين
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">إجمالي المستلمين</span>
              <span className="font-semibold">{stats.totalRecipients.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">معدل الاستجابة</span>
              <span className="font-semibold text-green-600">{stats.responseRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">متوسط وقت الاستجابة</span>
              <span className="font-semibold">{stats.averageResponseTime} دقيقة</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">الحملات النشطة</span>
              <span className="font-semibold text-blue-600">{stats.activeCampaigns}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              تحليل الأداء
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>معدل التسليم</span>
                <span>{getDeliveryRate()}%</span>
              </div>
              <Progress value={getDeliveryRate()} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>معدل النجاح</span>
                <span>{getSuccessRate()}%</span>
              </div>
              <Progress value={getSuccessRate()} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>معدل الاستجابة</span>
                <span>{stats.responseRate}%</span>
              </div>
              <Progress value={stats.responseRate} className="h-2" />
            </div>

            <div className="pt-2">
              <Button variant="outline" className="w-full" size="sm">
                <TrendingUp className="h-4 w-4 ml-2" />
                عرض التقرير التفصيلي
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* تنبيهات وإشعارات */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="h-5 w-5" />
            تنبيهات مهمة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.failedMessages > 20 && (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <AlertCircle className="h-4 w-4" />
                عدد كبير من الرسائل الفاشلة - يرجى مراجعة الإعدادات
              </div>
            )}
            {stats.pendingMessages > 50 && (
              <div className="flex items-center gap-2 text-sm text-yellow-600">
                <Clock className="h-4 w-4" />
                رسائل معلقة كثيرة - قد تحتاج إلى زيادة معدل الإرسال
              </div>
            )}
            {stats.responseRate < 50 && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Users className="h-4 w-4" />
                معدل استجابة منخفض - قد تحتاج إلى تحسين توقيت الرسائل
              </div>
            )}
            {stats.failedMessages <= 20 && stats.pendingMessages <= 50 && stats.responseRate >= 50 && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                جميع المؤشرات ضمن المعدل الطبيعي
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
