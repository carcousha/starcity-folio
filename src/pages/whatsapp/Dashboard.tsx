// WhatsApp Dashboard Page
// صفحة لوحة التحكم لوحدة الواتساب

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  MessageSquare,
  Users,
  Send,
  BarChart3,
  Plus,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  Building2,
  UserPlus,
  MessageCircle,
  Zap,
  Target,
  Calendar,
  FileText,
  Activity,
  Settings
} from 'lucide-react';

// Import services and types
import { whatsappService } from '@/services/whatsappService';
import { WhatsAppStats } from '@/types/whatsapp';

export default function WhatsAppDashboard() {
  console.log('WhatsAppDashboard: Component is loading...');
  
  const [stats, setStats] = useState<WhatsAppStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  console.log('WhatsAppDashboard: State initialized');

  useEffect(() => {
    console.log('WhatsApp Dashboard: Component mounted');
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      console.log('WhatsApp Dashboard: Loading stats...');
      setIsLoading(true);
      setError(null);
      
      const statsData = await whatsappService.getStats();
      console.log('WhatsApp Dashboard: Stats loaded successfully:', statsData);
      setStats(statsData);
    } catch (error) {
      console.error('WhatsApp Dashboard: Error loading stats:', error);
      setError(error instanceof Error ? error.message : 'خطأ غير معروف');
      // لا نعرض toast للخطأ، فقط نترك stats كـ null
      // هذا سيظهر الصفحة الترحيبية
    } finally {
      setIsLoading(false);
    }
  };

  console.log('WhatsApp Dashboard: Rendering with state:', { isLoading, stats, error });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">جاري تحميل الإحصائيات...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم الواتساب</h1>
            <p className="text-gray-600 mt-2">نظرة شاملة على نشاط الواتساب والإحصائيات</p>
          </div>
        </div>

        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">حدث خطأ في تحميل البيانات</h3>
          <p className="text-gray-600 mb-4">تفاصيل الخطأ: {error}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={loadStats} variant="outline">
              إعادة المحاولة
            </Button>
            <Button onClick={() => window.location.href = '/whatsapp/settings'}>
              <Settings className="h-4 w-4 ml-2" />
              إعدادات الواتساب
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم الواتساب</h1>
            <p className="text-gray-600 mt-2">نظرة شاملة على نشاط الواتساب والإحصائيات</p>
          </div>
        </div>

        {/* Debug Information */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">معلومات التشخيص</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>• تم تحميل المكون بنجاح</p>
            <p>• خدمة الواتساب متاحة</p>
            <p>• لا توجد إحصائيات متاحة حالياً</p>
            <p>• يمكنك البدء بإعداد الواتساب</p>
          </div>
        </div>

        <div className="text-center py-12">
          <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">مرحباً بك في وحدة الواتساب</h3>
          <p className="text-gray-600 mb-6">لا توجد بيانات متاحة حالياً. يمكنك البدء بإعداد الواتساب</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={loadStats} variant="outline">
              إعادة المحاولة
            </Button>
            <Button onClick={() => window.location.href = '/whatsapp/settings'}>
              <Settings className="h-4 w-4 ml-2" />
              إعدادات الواتساب
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم الواتساب</h1>
          <p className="text-gray-600 mt-2">نظرة شاملة على نشاط الواتساب والإحصائيات</p>
        </div>
        <div className="flex space-x-3 space-x-reverse">
          <Button onClick={loadStats} variant="outline">
            <BarChart3 className="ml-2 h-4 w-4" />
            تحديث البيانات
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="إجمالي جهات الاتصال"
          value={stats.total_contacts.toLocaleString()}
          icon={<Users className="h-6 w-6 text-blue-600" />}
          trend={stats.total_contacts > 0 ? 'up' : 'neutral'}
          trendValue="+5.2%"
        />
        
        <StatsCard
          title="الرسائل المرسلة اليوم"
          value={stats.messages_sent_today.toLocaleString()}
          icon={<Send className="h-6 w-6 text-green-600" />}
          trend={stats.messages_sent_today > 0 ? 'up' : 'neutral'}
          trendValue="+12.3%"
        />
        
        <StatsCard
          title="معدل النجاح"
          value={`${stats.success_rate.toFixed(1)}%`}
          icon={<CheckCircle className="h-6 w-6 text-emerald-600" />}
          trend={stats.success_rate > 80 ? 'up' : stats.success_rate > 60 ? 'neutral' : 'down'}
          trendValue={`${stats.failed_rate.toFixed(1)}% فشل`}
        />
        
        <StatsCard
          title="الحملات النشطة"
          value={stats.active_campaigns.toLocaleString()}
          icon={<Target className="h-6 w-6 text-purple-600" />}
          trend="neutral"
          trendValue="جاري التنفيذ"
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contacts by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="ml-2 h-5 w-5" />
              توزيع جهات الاتصال
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ContactTypeRow 
                label="الملاك" 
                count={stats.contacts_by_type.owners}
                total={stats.total_contacts}
                color="bg-blue-500"
                icon={<Building2 className="h-4 w-4" />}
              />
              <ContactTypeRow 
                label="المسوقين" 
                count={stats.contacts_by_type.marketers}
                total={stats.total_contacts}
                color="bg-green-500"
                icon={<UserPlus className="h-4 w-4" />}
              />
              <ContactTypeRow 
                label="العملاء" 
                count={stats.contacts_by_type.clients}
                total={stats.total_contacts}
                color="bg-purple-500"
                icon={<Phone className="h-4 w-4" />}
              />
            </div>
          </CardContent>
        </Card>

        {/* Messages Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="ml-2 h-5 w-5" />
              حالة الرسائل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <MessageStatusRow 
                label="تم الإرسال" 
                count={stats.messages_by_status.sent}
                icon={<CheckCircle className="h-4 w-4 text-green-600" />}
                color="text-green-600"
              />
              <MessageStatusRow 
                label="تم التسليم" 
                count={stats.messages_by_status.delivered}
                icon={<CheckCircle className="h-4 w-4 text-emerald-600" />}
                color="text-emerald-600"
              />
              <MessageStatusRow 
                label="فشل في الإرسال" 
                count={stats.messages_by_status.failed}
                icon={<XCircle className="h-4 w-4 text-red-600" />}
                color="text-red-600"
              />
              <MessageStatusRow 
                label="في الانتظار" 
                count={stats.messages_by_status.pending}
                icon={<Clock className="h-4 w-4 text-yellow-600" />}
                color="text-yellow-600"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="ml-2 h-5 w-5" />
            النشاط الأخير
          </CardTitle>
          <CardDescription>
            آخر 10 رسائل تم إرسالها
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recent_activity.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_activity.map((message) => (
                <RecentActivityItem key={message.id} message={message} />
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              لا يوجد نشاط حديث
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>إجراءات سريعة</CardTitle>
          <CardDescription>أهم الإجراءات التي قد تحتاجها</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-auto p-4 flex flex-col items-center space-y-2" variant="outline">
              <Send className="h-6 w-6" />
              <span>إرسال رسالة سريعة</span>
            </Button>
            <Button className="h-auto p-4 flex flex-col items-center space-y-2" variant="outline">
              <Target className="h-6 w-6" />
              <span>إنشاء حملة جديدة</span>
            </Button>
            <Button className="h-auto p-4 flex flex-col items-center space-y-2" variant="outline">
              <UserPlus className="h-6 w-6" />
              <span>إضافة جهة اتصال</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Components
interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
}

function StatsCard({ title, value, icon, trend, trendValue }: StatsCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          {icon}
        </div>
        <div className={`flex items-center mt-4 text-sm ${getTrendColor()}`}>
          {getTrendIcon()}
          <span className="mr-1">{trendValue}</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface ContactTypeRowProps {
  label: string;
  count: number;
  total: number;
  color: string;
  icon: React.ReactNode;
}

function ContactTypeRow({ label, count, total, color, icon }: ContactTypeRowProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3 space-x-reverse">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      <div className="flex items-center space-x-3 space-x-reverse">
        <span className="text-sm text-gray-600">{count.toLocaleString()}</span>
        <div className="w-20 h-2 bg-gray-200 rounded-full">
          <div 
            className={`h-2 rounded-full ${color}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 w-10">{percentage.toFixed(0)}%</span>
      </div>
    </div>
  );
}

interface MessageStatusRowProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

function MessageStatusRow({ label, count, icon, color }: MessageStatusRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3 space-x-reverse">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      <span className={`font-bold ${color}`}>{count.toLocaleString()}</span>
    </div>
  );
}

interface RecentActivityItemProps {
  message: any; // WhatsAppMessage type with relations
}

function RecentActivityItem({ message }: RecentActivityItemProps) {
  const getStatusBadge = (status: string) => {
    const statusMap = {
      sent: { label: 'تم الإرسال', variant: 'default' as const },
      delivered: { label: 'تم التسليم', variant: 'default' as const },
      failed: { label: 'فشل', variant: 'destructive' as const },
      pending: { label: 'انتظار', variant: 'secondary' as const }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center space-x-3 space-x-reverse">
        <MessageCircle className="h-4 w-4 text-gray-500" />
        <div>
          <p className="font-medium">
            {message.contact?.name || `+${message.phone_number}`}
          </p>
          <p className="text-sm text-gray-600 truncate max-w-xs">
            {message.content}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2 space-x-reverse">
        {getStatusBadge(message.status)}
        <span className="text-xs text-gray-500">
          {formatDate(message.created_at)}
        </span>
      </div>
    </div>
  );
}
