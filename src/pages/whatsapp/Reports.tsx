// WhatsApp Reports Component
// صفحة تقارير الواتساب

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Send,
  CheckCircle,
  XCircle,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Eye,
  MessageSquare,
  Target,
  Clock,
  Loader2
} from 'lucide-react';

import { whatsappService } from '@/services/whatsappService';
import { WhatsAppStats, WhatsAppMessage, WhatsAppCampaign } from '@/types/whatsapp';

interface ReportsState {
  stats: WhatsAppStats | null;
  recentMessages: WhatsAppMessage[];
  campaigns: WhatsAppCampaign[];
  isLoading: boolean;
  dateRange: {
    from: string;
    to: string;
  };
  selectedPeriod: 'today' | 'week' | 'month' | 'custom';
}

export default function WhatsAppReports() {
  const [state, setState] = useState<ReportsState>({
    stats: null,
    recentMessages: [],
    campaigns: [],
    isLoading: false,
    dateRange: {
      from: '',
      to: ''
    },
    selectedPeriod: 'week'
  });

  const { toast } = useToast();

  useEffect(() => {
    setDateRangeFromPeriod(state.selectedPeriod);
    loadReports();
  }, []);

  const updateState = (updates: Partial<ReportsState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const setDateRangeFromPeriod = (period: typeof state.selectedPeriod) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let from: Date;
    let to: Date = now;

    switch (period) {
      case 'today':
        from = today;
        break;
      case 'week':
        from = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        from = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        break;
      default:
        return; // للفترة المخصصة، لا نغير التواريخ
    }

    updateState({
      selectedPeriod: period,
      dateRange: {
        from: from.toISOString().split('T')[0],
        to: to.toISOString().split('T')[0]
      }
    });
  };

  const loadReports = async () => {
    try {
      updateState({ isLoading: true });
      
      const [statsData, campaignsData] = await Promise.all([
        whatsappService.getStats(),
        whatsappService.getCampaigns()
      ]);
      
      updateState({ 
        stats: statsData,
        campaigns: campaignsData,
        recentMessages: statsData.recent_activity || []
      });
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل التقارير",
        variant: "destructive"
      });
    } finally {
      updateState({ isLoading: false });
    }
  };

  const exportReport = () => {
    toast({
      title: "قريباً",
      description: "ميزة تصدير التقارير ستكون متاحة قريباً",
      variant: "default"
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Send className="h-4 w-4 text-blue-600" />;
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getMessageStatusBadge = (status: string) => {
    const statusMap = {
      'sent': { label: 'تم الإرسال', color: 'bg-blue-100 text-blue-800' },
      'delivered': { label: 'تم التسليم', color: 'bg-green-100 text-green-800' },
      'failed': { label: 'فشل', color: 'bg-red-100 text-red-800' },
      'pending': { label: 'انتظار', color: 'bg-yellow-100 text-yellow-800' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
  };

  const getCampaignStatusBadge = (status: string) => {
    const statusMap = {
      'draft': { label: 'مسودة', color: 'bg-gray-100 text-gray-800' },
      'scheduled': { label: 'مجدولة', color: 'bg-blue-100 text-blue-800' },
      'running': { label: 'قيد التنفيذ', color: 'bg-yellow-100 text-yellow-800' },
      'completed': { label: 'مكتملة', color: 'bg-green-100 text-green-800' },
      'paused': { label: 'متوقفة', color: 'bg-orange-100 text-orange-800' },
      'cancelled': { label: 'ملغاة', color: 'bg-red-100 text-red-800' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
  };

  if (!state.stats && !state.isLoading) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">لا توجد بيانات متاحة للتقارير</p>
        <Button onClick={loadReports} className="mt-4">
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">تقارير الواتساب</h2>
          <p className="text-gray-600">تحليلات شاملة لأداء رسائل الواتساب</p>
        </div>
        <div className="flex space-x-3 space-x-reverse">
          <Button onClick={exportReport} variant="outline">
            <Download className="ml-2 h-4 w-4" />
            تصدير التقرير
          </Button>
          <Button onClick={loadReports} disabled={state.isLoading}>
            {state.isLoading ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="ml-2 h-4 w-4" />
            )}
            تحديث
          </Button>
        </div>
      </div>

      {/* Period Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>الفترة الزمنية</Label>
              <Select
                value={state.selectedPeriod}
                onValueChange={(value: any) => setDateRangeFromPeriod(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">اليوم</SelectItem>
                  <SelectItem value="week">آخر 7 أيام</SelectItem>
                  <SelectItem value="month">آخر شهر</SelectItem>
                  <SelectItem value="custom">فترة مخصصة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {state.selectedPeriod === 'custom' && (
              <>
                <div className="space-y-2">
                  <Label>من تاريخ</Label>
                  <Input
                    type="date"
                    value={state.dateRange.from}
                    onChange={(e) => updateState({
                      dateRange: { ...state.dateRange, from: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>إلى تاريخ</Label>
                  <Input
                    type="date"
                    value={state.dateRange.to}
                    onChange={(e) => updateState({
                      dateRange: { ...state.dateRange, to: e.target.value }
                    })}
                  />
                </div>
              </>
            )}

            <div className="flex items-end">
              <Button onClick={loadReports} className="w-full">
                <Filter className="ml-2 h-4 w-4" />
                تطبيق الفلتر
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {state.isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-gray-600">جاري تحميل التقارير...</p>
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="messages">الرسائل</TabsTrigger>
            <TabsTrigger value="campaigns">الحملات</TabsTrigger>
            <TabsTrigger value="contacts">جهات الاتصال</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">إجمالي الرسائل</p>
                      <p className="text-2xl font-bold">{state.stats?.total_messages_sent.toLocaleString()}</p>
                    </div>
                    <Send className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex items-center mt-2 text-sm text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>+12.5% من الشهر الماضي</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">معدل النجاح</p>
                      <p className="text-2xl font-bold">{state.stats?.success_rate.toFixed(1)}%</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="flex items-center mt-2 text-sm text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>+2.1% من الشهر الماضي</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">جهات الاتصال</p>
                      <p className="text-2xl font-bold">{state.stats?.total_contacts.toLocaleString()}</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="flex items-center mt-2 text-sm text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>+8.3% من الشهر الماضي</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">الحملات النشطة</p>
                      <p className="text-2xl font-bold">{state.stats?.active_campaigns}</p>
                    </div>
                    <Target className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="flex items-center mt-2 text-sm text-gray-600">
                    <span>في التنفيذ حالياً</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>توزيع حالة الرسائل</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {state.stats && Object.entries(state.stats.messages_by_status).map(([status, count]) => {
                      const total = Object.values(state.stats!.messages_by_status).reduce((a, b) => a + b, 0);
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      
                      return (
                        <div key={status} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              {getMessageStatusIcon(status)}
                              <span>{getMessageStatusBadge(status)}</span>
                            </div>
                            <span className="font-medium">{count.toLocaleString()}</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>توزيع جهات الاتصال</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {state.stats && [
                      { type: 'owners', label: 'الملاك', count: state.stats.contacts_by_type.owners, color: 'bg-blue-500' },
                      { type: 'marketers', label: 'المسوقين', count: state.stats.contacts_by_type.marketers, color: 'bg-green-500' },
                      { type: 'clients', label: 'العملاء', count: state.stats.contacts_by_type.clients, color: 'bg-purple-500' }
                    ].map(({ type, label, count, color }) => {
                      const total = state.stats!.total_contacts;
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      
                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{label}</span>
                            <span>{count.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${color}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>آخر الرسائل المرسلة</CardTitle>
                <CardDescription>تفاصيل الرسائل المرسلة مؤخراً</CardDescription>
              </CardHeader>
              <CardContent>
                {state.recentMessages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد رسائل حديثة
                  </div>
                ) : (
                  <div className="space-y-4">
                    {state.recentMessages.map(message => (
                      <div key={message.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          {getMessageStatusIcon(message.status)}
                          <div>
                            <p className="font-medium">
                              {message.contact?.name || `+${message.phone_number}`}
                            </p>
                            <p className="text-sm text-gray-600 truncate max-w-xs">
                              {message.content}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 space-x-reverse">
                          {getMessageStatusBadge(message.status)}
                          <span className="text-sm text-gray-500">
                            {formatDate(message.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>أداء الحملات</CardTitle>
                <CardDescription>تحليل أداء الحملات الإعلانية</CardDescription>
              </CardHeader>
              <CardContent>
                {state.campaigns.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد حملات متاحة
                  </div>
                ) : (
                  <div className="space-y-4">
                    {state.campaigns.map(campaign => {
                      const successRate = campaign.messages_sent > 0 ? 
                        (campaign.messages_delivered / campaign.messages_sent) * 100 : 0;
                      const progress = campaign.total_recipients > 0 ?
                        (campaign.messages_sent / campaign.total_recipients) * 100 : 0;
                      
                      return (
                        <div key={campaign.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-medium">{campaign.name}</h3>
                              <p className="text-sm text-gray-600">{campaign.description}</p>
                            </div>
                            {getCampaignStatusBadge(campaign.status)}
                          </div>
                          
                          <div className="grid grid-cols-4 gap-4 mb-3 text-sm">
                            <div className="text-center">
                              <p className="font-medium">{campaign.total_recipients}</p>
                              <p className="text-gray-600">مستهدف</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium">{campaign.messages_sent}</p>
                              <p className="text-gray-600">مرسل</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium">{campaign.messages_delivered}</p>
                              <p className="text-gray-600">تم التسليم</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium">{successRate.toFixed(1)}%</p>
                              <p className="text-gray-600">معدل النجاح</p>
                            </div>
                          </div>
                          
                          {campaign.status === 'running' && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>التقدم</span>
                                <span>{progress.toFixed(1)}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="ml-2 h-5 w-5 text-blue-600" />
                    الملاك
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {state.stats?.contacts_by_type.owners.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    من إجمالي {state.stats?.total_contacts.toLocaleString()} جهة اتصال
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="ml-2 h-5 w-5 text-green-600" />
                    المسوقين
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {state.stats?.contacts_by_type.marketers.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    من إجمالي {state.stats?.total_contacts.toLocaleString()} جهة اتصال
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="ml-2 h-5 w-5 text-purple-600" />
                    العملاء
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {state.stats?.contacts_by_type.clients.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    من إجمالي {state.stats?.total_contacts.toLocaleString()} جهة اتصال
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
