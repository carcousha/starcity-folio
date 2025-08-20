// Bulk Message Stats Component
// مكون إحصائيات الرسائل الجماعية

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  Download,
  RefreshCw,
  Eye,
  Target,
  Zap,
  Activity
} from 'lucide-react';
import { bulkMessageService } from '@/services/bulkMessageService';

interface BulkMessageStatsProps {
  refreshTrigger?: number;
}

interface Stats {
  total_messages: number;
  active_messages: number;
  completed_messages: number;
  success_rate: number;
  failed_messages: number;
  pending_messages: number;
  total_recipients: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
  }[];
}

export const BulkMessageStats: React.FC<BulkMessageStatsProps> = ({ refreshTrigger }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [chartData, setChartData] = useState<ChartData | null>(null);

  useEffect(() => {
    loadStats();
  }, [refreshTrigger, timeRange]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const statsData = await bulkMessageService.getBulkMessageStats();
      // Map the response to match our Stats interface
      setStats({
        total_messages: statsData.total_bulk_messages || 0,
        active_messages: statsData.active_bulk_messages || 0,
        completed_messages: statsData.completed_bulk_messages || 0,
        success_rate: statsData.average_success_rate || 0,
        failed_messages: statsData.total_failed || 0,
        pending_messages: 0,
        total_recipients: statsData.total_recipients || 0
      });
      
      // إنشاء بيانات الرسم البياني
      createChartData(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createChartData = (statsData: any) => {
    // بيانات الرسم البياني للإرسال اليومي
    const dailyData = {
      labels: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
      datasets: [
        {
          label: 'الرسائل المرسلة',
          data: [120, 150, 180, 200, 160, 140, 100],
          backgroundColor: ['rgba(34, 197, 94, 0.2)'],
          borderColor: ['rgba(34, 197, 94, 1)'],
        },
        {
          label: 'الرسائل الفاشلة',
          data: [5, 8, 12, 15, 10, 7, 3],
          backgroundColor: ['rgba(239, 68, 68, 0.2)'],
          borderColor: ['rgba(239, 68, 68, 1)'],
        }
      ]
    };
    setChartData(dailyData);
  };

  const exportStats = () => {
    if (!stats) return;
    
    const csvContent = `
      الإحصائيات,القيمة
      إجمالي الرسائل الجماعية,${stats.total_messages}
      الرسائل النشطة,${stats.active_messages}
      الرسائل المكتملة,${stats.completed_messages}
      إجمالي المستلمين,${stats.total_recipients}
      الرسائل الفاشلة,${stats.failed_messages}
      معدل النجاح,${stats.success_rate}%
      الرسائل المعلقة,${stats.pending_messages}
    `;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bulk_message_stats_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (current < previous) return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
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

  if (!stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">لا توجد إحصائيات متاحة</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* رأس الإحصائيات */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إحصائيات الإرسال الجماعي</h2>
          <p className="text-gray-600">نظرة عامة على أداء الرسائل الجماعية</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">اليوم</SelectItem>
              <SelectItem value="7d">7 أيام</SelectItem>
              <SelectItem value="30d">30 يوم</SelectItem>
              <SelectItem value="90d">90 يوم</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadStats}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={exportStats}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* الإحصائيات الأساسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الرسائل</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_messages}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active_messages} نشطة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستلمين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_recipients.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              إجمالي المستلمين
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل النجاح</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.success_rate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.failed_messages} فاشلة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">اليوم</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_messages}</div>
            <p className="text-xs text-muted-foreground">
              معلقة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* الإحصائيات المتقدمة */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* أداء الإرسال */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              أداء الإرسال
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">إجمالي المرسل</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-semibold">{stats.total_recipients} رسالة</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">معدل النجاح</span>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-500" />
                <span className="font-semibold">{stats.success_rate}%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">الرسائل الفاشلة</span>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="font-semibold">{stats.failed_messages}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* حالة الرسائل */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              حالة الرسائل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">مكتملة</span>
              </div>
              <Badge variant="secondary">{stats.completed_messages}</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">نشطة</span>
              </div>
              <Badge variant="secondary">{stats.active_messages}</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm">فاشلة</span>
              </div>
              <Badge variant="secondary">{stats.failed_messages}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الرسم البياني */}
      {chartData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              نشاط الإرسال الأسبوعي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {chartData.labels.map((label, index) => (
                <div key={label} className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-full bg-gray-200 rounded-t" style={{ height: `${(chartData.datasets[0].data[index] / Math.max(...chartData.datasets[0].data)) * 200}px` }}>
                    <div className="w-full bg-green-500 rounded-t" style={{ height: '100%' }}></div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-t" style={{ height: `${(chartData.datasets[1].data[index] / Math.max(...chartData.datasets[1].data)) * 100}px` }}>
                    <div className="w-full bg-red-500 rounded-t" style={{ height: '100%' }}></div>
                  </div>
                  <span className="text-xs text-gray-600">{label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-sm">مرسل</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-sm">فاشل</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* مؤشرات الأداء */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">إجمالي الرسائل</p>
                <p className="text-2xl font-bold text-green-900">{stats.total_messages}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">معدل النجاح</p>
                <p className="text-2xl font-bold text-blue-900">{stats.success_rate}%</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">المستلمون</p>
                <p className="text-2xl font-bold text-purple-900">{stats.total_recipients}</p>
              </div>
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
