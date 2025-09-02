// @ts-nocheck
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Users, MapPin, DollarSign, Calendar, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

export function LandReports() {
  const [period, setPeriod] = useState('this_month');

  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case 'today':
        return {
          start: format(now, 'yyyy-MM-dd'),
          end: format(now, 'yyyy-MM-dd')
        };
      case 'last_7_days':
        return {
          start: format(subDays(now, 7), 'yyyy-MM-dd'),
          end: format(now, 'yyyy-MM-dd')
        };
      case 'this_month':
        return {
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd')
        };
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        return {
          start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
          end: format(endOfMonth(lastMonth), 'yyyy-MM-dd')
        };
      case 'last_3_months':
        return {
          start: format(subMonths(now, 3), 'yyyy-MM-dd'),
          end: format(now, 'yyyy-MM-dd')
        };
      default:
        return {
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd')
        };
    }
  };

  const dateRange = getDateRange();

  // New lands added
  const { data: newLandsStats } = useQuery({
    queryKey: ['new-lands-stats', period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('land_properties')
        .select('created_at, status')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);
      
      if (error) throw error;
      
      const total = data.length;
      const available = data.filter(land => land.status === 'available').length;
      const sold = data.filter(land => land.status === 'sold').length;
      
      return { total, available, sold };
    }
  });

  // New clients and brokers
  const { data: newClientsStats } = useQuery({
    queryKey: ['new-clients-stats', period],
    queryFn: async () => {
      const [clientsResult, brokersResult] = await Promise.all([
        supabase
          .from('land_clients')
          .select('created_at, status')
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end),
        supabase
          .from('land_brokers')
          .select('created_at, activity_status')
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end)
      ]);
      
      return {
        newClients: clientsResult.data?.length || 0,
        newBrokers: brokersResult.data?.length || 0,
        activeClients: clientsResult.data?.filter(c => c.status === 'interested' || c.status === 'negotiation').length || 0,
        activeBrokers: brokersResult.data?.filter(b => b.activity_status === 'active').length || 0
      };
    }
  });

  // Successful deals
  const { data: dealsStats } = useQuery({
    queryKey: ['deals-stats', period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('land_deals')
        .select(`
          *,
          land_properties(location, area_sqm),
          land_brokers(name)
        `)
        .eq('status', 'completed')
        .gte('deal_date', dateRange.start)
        .lte('deal_date', dateRange.end);
      
      if (error) throw error;
      
      const totalDeals = data.length;
      const totalValue = data.reduce((sum, deal) => sum + deal.deal_amount, 0);
      const avgDealValue = totalDeals > 0 ? totalValue / totalDeals : 0;
      
      return { totalDeals, totalValue, avgDealValue, deals: data };
    }
  });

  // Top selling areas
  const { data: topAreas } = useQuery({
    queryKey: ['top-areas', period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('land_deals')
        .select(`
          deal_amount,
          land_properties(location)
        `)
        .eq('status', 'completed')
        .gte('deal_date', dateRange.start)
        .lte('deal_date', dateRange.end);
      
      if (error) throw error;
      
      const areaStats = data.reduce((acc: any, deal) => {
        const location = (deal.land_properties as any)?.location || 'غير محدد';
        if (!acc[location]) {
          acc[location] = { deals: 0, totalValue: 0 };
        }
        acc[location].deals += 1;
        acc[location].totalValue += deal.deal_amount;
        return acc;
      }, {});
      
      return Object.entries(areaStats)
        .map(([location, stats]: [string, any]) => ({
          location,
          deals: stats.deals,
          totalValue: stats.totalValue,
          avgValue: stats.totalValue / stats.deals
        }))
        .sort((a, b) => b.deals - a.deals)
        .slice(0, 5);
    }
  });

  // Broker performance
  const { data: brokerPerformance } = useQuery({
    queryKey: ['broker-performance', period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('land_deals')
        .select(`
          deal_amount,
          commission_amount,
          land_brokers(id, name)
        `)
        .eq('status', 'completed')
        .gte('deal_date', dateRange.start)
        .lte('deal_date', dateRange.end)
        .not('broker_id', 'is', null);
      
      if (error) throw error;
      
      const brokerStats = data.reduce((acc: any, deal) => {
        const brokerId = (deal.land_brokers as any)?.id;
        const brokerName = (deal.land_brokers as any)?.name || 'غير محدد';
        
        if (!acc[brokerId]) {
          acc[brokerId] = {
            name: brokerName,
            deals: 0,
            totalSales: 0,
            totalCommission: 0
          };
        }
        
        acc[brokerId].deals += 1;
        acc[brokerId].totalSales += deal.deal_amount;
        acc[brokerId].totalCommission += deal.commission_amount || 0;
        
        return acc;
      }, {});
      
      return Object.values(brokerStats)
        .sort((a: any, b: any) => b.totalSales - a.totalSales)
        .slice(0, 5);
    }
  });

  // Tasks completion rate
  const { data: tasksStats } = useQuery({
    queryKey: ['tasks-stats', period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('land_tasks')
        .select('status, created_at')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);
      
      if (error) throw error;
      
      const total = data.length;
      const completed = data.filter(task => task.status === 'completed').length;
      const pending = data.filter(task => task.status === 'pending').length;
      const inProgress = data.filter(task => task.status === 'in_progress').length;
      
      return {
        total,
        completed,
        pending,
        inProgress,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    }
  });

  const handleExport = () => {
    toast({ title: "جاري تصدير التقرير...", description: "سيتم تحميل الملف قريباً" });
    // TODO: Implement export functionality
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="التقارير والإحصائيات" 
          description="تقارير شاملة عن الأداء والمبيعات"
        />
        
        <div className="flex gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">اليوم</SelectItem>
              <SelectItem value="last_7_days">آخر 7 أيام</SelectItem>
              <SelectItem value="this_month">هذا الشهر</SelectItem>
              <SelectItem value="last_month">الشهر الماضي</SelectItem>
              <SelectItem value="last_3_months">آخر 3 أشهر</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 ml-2" />
            تصدير التقرير
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أراضي جديدة</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newLandsStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {newLandsStats?.available} متاحة • {newLandsStats?.sold} مباعة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عملاء ووسطاء جدد</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(newClientsStats?.newClients || 0) + (newClientsStats?.newBrokers || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {newClientsStats?.newClients} عملاء • {newClientsStats?.newBrokers} وسطاء
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صفقات ناجحة</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dealsStats?.totalDeals || 0}</div>
            <p className="text-xs text-muted-foreground">
              إجمالي {formatCurrency(dealsStats?.totalValue || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل إنجاز المهام</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksStats?.completionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {tasksStats?.completed} من {tasksStats?.total} مهمة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              أفضل المناطق مبيعاً
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topAreas && topAreas.length > 0 ? (
              <div className="space-y-4">
                {topAreas.map((area: any, index) => (
                  <div key={area.location} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium">{area.location}</div>
                        <div className="text-sm text-muted-foreground">
                          {area.deals} صفقة
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-bold">{formatCurrency(area.totalValue)}</div>
                      <div className="text-sm text-muted-foreground">
                        متوسط: {formatCurrency(area.avgValue)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد بيانات للفترة المحددة
              </div>
            )}
          </CardContent>
        </Card>

        {/* Broker Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              ترتيب أداء الوسطاء
            </CardTitle>
          </CardHeader>
          <CardContent>
            {brokerPerformance && brokerPerformance.length > 0 ? (
              <div className="space-y-4">
                {brokerPerformance.map((broker: any, index) => (
                  <div key={broker.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={index === 0 ? "default" : "outline"} 
                        className="w-6 h-6 rounded-full p-0 flex items-center justify-center"
                      >
                        {index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium">{broker.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {broker.deals} صفقة
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-bold">{formatCurrency(broker.totalSales)}</div>
                      <div className="text-sm text-muted-foreground">
                        عمولة: {formatCurrency(broker.totalCommission)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد بيانات للفترة المحددة
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Deals */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              الصفقات الأخيرة
            </CardTitle>
            <CardDescription>
              آخر الصفقات المكتملة في الفترة المحددة
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dealsStats?.deals && dealsStats.deals.length > 0 ? (
              <div className="space-y-4">
                {dealsStats.deals.slice(0, 5).map((deal: any) => (
                  <div key={deal.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">
                        {deal.land_properties?.location || 'موقع غير محدد'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        المساحة: {deal.land_properties?.area_sqm?.toLocaleString()} م²
                      </div>
                      <div className="text-sm text-muted-foreground">
                        الوسيط: {deal.land_brokers?.name || 'مباشر'}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-lg">
                        {formatCurrency(deal.deal_amount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(deal.deal_date), 'dd MMM yyyy', { locale: ar })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد صفقات للفترة المحددة
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}