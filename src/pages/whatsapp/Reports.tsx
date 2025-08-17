import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, MessageSquare, Users, Calendar, Download, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Stats {
  stat_date: string;
  total_sent: number;
  total_delivered: number;
  total_read: number;
  total_failed: number;
  campaigns_count: number;
  contacts_added: number;
}

interface ActivityLog {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
  metadata?: any;
}

export default function Reports() {
  const [stats, setStats] = useState<Stats[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7'); // Last 7 days
  const { toast } = useToast();

  useEffect(() => {
    loadReportsData();
  }, [dateRange]);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      
      // تحميل الإحصائيات
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(dateRange));
      
      const { data: statsData, error: statsError } = await supabase
        .from('whatsapp_stats')
        .select('*')
        .gte('stat_date', startDate.toISOString().split('T')[0])
        .lte('stat_date', endDate.toISOString().split('T')[0])
        .order('stat_date', { ascending: true });

      if (statsError) throw statsError;
      setStats(statsData || []);

      // تحميل سجل الأنشطة
      const { data: logsData, error: logsError } = await supabase
        .from('whatsapp_activity_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsError) throw logsError;
      setActivityLogs(logsData || []);

    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل التقارير",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    return stats.reduce((totals, stat) => ({
      total_sent: totals.total_sent + stat.total_sent,
      total_delivered: totals.total_delivered + stat.total_delivered,
      total_read: totals.total_read + stat.total_read,
      total_failed: totals.total_failed + stat.total_failed,
      campaigns_count: totals.campaigns_count + stat.campaigns_count,
      contacts_added: totals.contacts_added + stat.contacts_added
    }), {
      total_sent: 0,
      total_delivered: 0,
      total_read: 0,
      total_failed: 0,
      campaigns_count: 0,
      contacts_added: 0
    });
  };

  const calculateSuccessRate = () => {
    const totals = calculateTotals();
    if (totals.total_sent === 0) return 0;
    return Math.round((totals.total_delivered / totals.total_sent) * 100);
  };

  const calculateReadRate = () => {
    const totals = calculateTotals();
    if (totals.total_delivered === 0) return 0;
    return Math.round((totals.total_read / totals.total_delivered) * 100);
  };

  const getActivityTypeLabel = (type: string) => {
    const labels = {
      contact_added: 'إضافة جهة اتصال',
      contact_updated: 'تحديث جهة اتصال',
      campaign_created: 'إنشاء حملة',
      campaign_sent: 'إرسال حملة',
      message_sent: 'إرسال رسالة',
      template_created: 'إنشاء قالب',
      contacts_imported: 'استيراد جهات اتصال'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getActivityTypeColor = (type: string) => {
    const colors = {
      contact_added: 'bg-blue-100 text-blue-800',
      contact_updated: 'bg-yellow-100 text-yellow-800',
      campaign_created: 'bg-green-100 text-green-800',
      campaign_sent: 'bg-purple-100 text-purple-800',
      message_sent: 'bg-indigo-100 text-indigo-800',
      template_created: 'bg-pink-100 text-pink-800',
      contacts_imported: 'bg-orange-100 text-orange-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl" dir="rtl">
      <div className="space-y-6">
        {/* العنوان والفلاتر */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              التقارير والإحصائيات
            </h1>
            <p className="text-muted-foreground mt-1">
              مراقبة أداء حملات واتساب وتحليل النتائج
            </p>
          </div>
          
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">آخر 7 أيام</SelectItem>
                <SelectItem value="30">آخر 30 يوم</SelectItem>
                <SelectItem value="90">آخر 3 أشهر</SelectItem>
                <SelectItem value="365">آخر سنة</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Download className="ml-2 h-4 w-4" />
              تصدير التقرير
            </Button>
          </div>
        </div>

        {/* الإحصائيات الرئيسية */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">إجمالي الرسائل المرسلة</p>
                  <p className="text-2xl font-bold">{totals.total_sent.toLocaleString()}</p>
                  <p className="text-xs text-green-600">
                    <TrendingUp className="h-3 w-3 inline ml-1" />
                    نشط
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">الرسائل المسلمة</p>
                  <p className="text-2xl font-bold text-green-600">{totals.total_delivered.toLocaleString()}</p>
                  <p className="text-xs text-green-600">
                    {calculateSuccessRate()}% نسبة النجاح
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">الرسائل المقروءة</p>
                  <p className="text-2xl font-bold text-blue-600">{totals.total_read.toLocaleString()}</p>
                  <p className="text-xs text-blue-600">
                    {calculateReadRate()}% نسبة القراءة
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">الحملات المنفذة</p>
                  <p className="text-2xl font-bold text-purple-600">{totals.campaigns_count}</p>
                  <p className="text-xs text-purple-600">
                    {totals.contacts_added} جهة اتصال جديدة
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* التبويبات */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="performance">الأداء</TabsTrigger>
            <TabsTrigger value="activity">سجل الأنشطة</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* الرسم البياني */}
            <Card>
              <CardHeader>
                <CardTitle>إحصائيات الرسائل اليومية</CardTitle>
                <CardDescription>
                  عدد الرسائل المرسلة والمسلمة يومياً خلال الفترة المحددة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                  <p className="text-gray-500">الرسم البياني سيتم إضافته قريباً</p>
                </div>
              </CardContent>
            </Card>

            {/* توزيع أنواع الرسائل */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>توزيع الرسائل حسب الحالة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>مرسل</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                        <span className="text-sm">{totals.total_sent}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>مسلم</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(totals.total_delivered / Math.max(totals.total_sent, 1)) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{totals.total_delivered}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>مقروء</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${(totals.total_read / Math.max(totals.total_sent, 1)) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{totals.total_read}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>فشل</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-600 h-2 rounded-full" 
                            style={{ width: `${(totals.total_failed / Math.max(totals.total_sent, 1)) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{totals.total_failed}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>معدلات الأداء</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">{calculateSuccessRate()}%</p>
                      <p className="text-sm text-muted-foreground">نسبة التسليم</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600">{calculateReadRate()}%</p>
                      <p className="text-sm text-muted-foreground">نسبة القراءة</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-3xl font-bold text-purple-600">{Math.round(totals.total_sent / Math.max(totals.campaigns_count, 1))}</p>
                      <p className="text-sm text-muted-foreground">متوسط الرسائل لكل حملة</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>الأداء اليومي المفصل</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>مرسل</TableHead>
                      <TableHead>مسلم</TableHead>
                      <TableHead>مقروء</TableHead>
                      <TableHead>فشل</TableHead>
                      <TableHead>الحملات</TableHead>
                      <TableHead>نسبة النجاح</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.map((stat, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {new Date(stat.stat_date).toLocaleDateString('ar-EG')}
                        </TableCell>
                        <TableCell>{stat.total_sent}</TableCell>
                        <TableCell className="text-green-600">{stat.total_delivered}</TableCell>
                        <TableCell className="text-blue-600">{stat.total_read}</TableCell>
                        <TableCell className="text-red-600">{stat.total_failed}</TableCell>
                        <TableCell>{stat.campaigns_count}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {stat.total_sent > 0 ? Math.round((stat.total_delivered / stat.total_sent) * 100) : 0}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {stats.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد بيانات للفترة المحددة
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>سجل الأنشطة الأخيرة</CardTitle>
                <CardDescription>
                  آخر الأنشطة والعمليات المنفذة في النظام
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>النشاط</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>التوقيت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge className={getActivityTypeColor(log.activity_type)}>
                            {getActivityTypeLabel(log.activity_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.description}</TableCell>
                        <TableCell>
                          {new Date(log.created_at).toLocaleString('ar-EG')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {activityLogs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد أنشطة مسجلة
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}