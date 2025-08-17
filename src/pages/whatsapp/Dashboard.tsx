import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Users, 
  TrendingUp, 
  Clock,
  Send,
  Phone,
  Calendar,
  BarChart3,
  Activity,
  Zap,
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Eye,
  Download,
  Filter
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DashboardStats {
  totalMessages: number;
  successMessages: number;
  failedMessages: number;
  activeRecipients: number;
  messagesToday: number;
  messagesThisWeek: number;
  messagesThisMonth: number;
  successRate: number;
  apiStatus: 'online' | 'offline' | 'error';
  lastApiCheck: string;
  pendingMessages: number;
  scheduledMessages: number;
}

interface MessageActivity {
  hour: string;
  sent: number;
  received: number;
  success: number;
}

interface TopRecipients {
  id: string;
  name: string;
  phone: string;
  type: string;
  messageCount: number;
  lastMessage: string;
  status: 'active' | 'inactive';
}

export default function WhatsAppDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMessages: 0,
    successMessages: 0,
    failedMessages: 0,
    activeRecipients: 0,
    messagesToday: 0,
    messagesThisWeek: 0,
    messagesThisMonth: 0,
    successRate: 0,
    apiStatus: 'online',
    lastApiCheck: '',
    pendingMessages: 0,
    scheduledMessages: 0
  });

  const [messageActivity, setMessageActivity] = useState<MessageActivity[]>([]);
  const [topRecipients, setTopRecipients] = useState<TopRecipients[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  // محاكاة البيانات
  useEffect(() => {
    const mockStats: DashboardStats = {
      totalMessages: 1247,
      successMessages: 1189,
      failedMessages: 58,
      activeRecipients: 89,
      messagesToday: 156,
      messagesThisWeek: 892,
      messagesThisMonth: 1247,
      successRate: 95.3,
      apiStatus: 'online',
      lastApiCheck: '2024-01-15 15:30',
      pendingMessages: 12,
      scheduledMessages: 8
    };
    setStats(mockStats);

    const mockActivity: MessageActivity[] = [
      { hour: '09:00', sent: 15, received: 8, success: 14 },
      { hour: '10:00', sent: 23, received: 12, success: 22 },
      { hour: '11:00', sent: 31, received: 18, success: 29 },
      { hour: '12:00', sent: 28, received: 15, success: 26 },
      { hour: '13:00', sent: 19, received: 10, success: 18 },
      { hour: '14:00', sent: 25, received: 14, success: 23 },
      { hour: '15:00', sent: 15, received: 9, success: 14 }
    ];
    setMessageActivity(mockActivity);

    const mockRecipients: TopRecipients[] = [
      { id: '1', name: 'أحمد محمد', phone: '+971501234567', type: 'مالك', messageCount: 45, lastMessage: '2024-01-15 14:30', status: 'active' },
      { id: '2', name: 'فاطمة علي', phone: '+971507654321', type: 'عميل', messageCount: 38, lastMessage: '2024-01-15 13:45', status: 'active' },
      { id: '3', name: 'محمد حسن', phone: '+971509876543', type: 'مسوق', messageCount: 32, lastMessage: '2024-01-15 12:20', status: 'active' },
      { id: '4', name: 'علي أحمد', phone: '+971501111111', type: 'مالك', messageCount: 28, lastMessage: '2024-01-15 11:15', status: 'inactive' },
      { id: '5', name: 'سارة محمد', phone: '+971502222222', type: 'عميل', messageCount: 25, lastMessage: '2024-01-15 10:30', status: 'active' }
    ];
    setTopRecipients(mockRecipients);
  }, []);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      // محاكاة تحديث البيانات
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // تحديث الإحصائيات
      setStats(prev => ({
        ...prev,
        messagesToday: prev.messagesToday + Math.floor(Math.random() * 10),
        lastApiCheck: new Date().toLocaleString('ar-SA')
      }));
      
      toast({
        title: "تم التحديث",
        description: "تم تحديث البيانات بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ في التحديث",
        description: "فشل في تحديث البيانات",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const checkApiStatus = async () => {
    try {
      // محاكاة تحديث حالة API
      await new Promise(resolve => setTimeout(resolve, 500));
      const isOnline = Math.random() > 0.1;
      
      setStats(prev => ({
        ...prev,
        apiStatus: isOnline ? 'online' : 'offline',
        lastApiCheck: new Date().toLocaleString('ar-SA')
      }));
      
      toast({
        title: isOnline ? "API متصل" : "API غير متصل",
        description: isOnline ? "الاتصال يعمل بشكل طبيعي" : "يرجى فحص الاتصال",
        variant: isOnline ? "default" : "destructive"
      });
    } catch (error) {
      setStats(prev => ({
        ...prev,
        apiStatus: 'error',
        lastApiCheck: new Date().toLocaleString('ar-SA')
      }));
    }
  };

  const getApiStatusIcon = () => {
    switch (stats.apiStatus) {
      case 'online':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'offline':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Wifi className="w-4 h-4 text-gray-500" />;
    }
  };

  const getApiStatusBadge = () => {
    switch (stats.apiStatus) {
      case 'online':
        return <Badge variant="default" className="bg-green-100 text-green-800">متصل</Badge>;
      case 'offline':
        return <Badge variant="destructive">غير متصل</Badge>;
      case 'error':
        return <Badge variant="outline" className="text-yellow-600">خطأ</Badge>;
      default:
        return <Badge variant="outline">غير معروف</Badge>;
    }
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'today': return 'اليوم';
      case 'week': return 'هذا الأسبوع';
      case 'month': return 'هذا الشهر';
      default: return 'اليوم';
    }
  };

  const getPeriodCount = () => {
    switch (selectedPeriod) {
      case 'today': return stats.messagesToday;
      case 'week': return stats.messagesThisWeek;
      case 'month': return stats.messagesThisMonth;
      default: return stats.messagesToday;
    }
  };

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* العنوان وحالة النظام */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">لوحة التحكم</h1>
          <p className="text-muted-foreground">نظرة عامة على نشاط WhatsApp</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <div className="flex items-center space-x-2">
            {getApiStatusIcon()}
            {getApiStatusBadge()}
            <span className="text-sm text-muted-foreground">
              آخر فحص: {stats.lastApiCheck}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={checkApiStatus}>
            <RefreshCw className="w-4 h-4 mr-2" />
            فحص الاتصال
          </Button>
          <Button variant="outline" size="sm" onClick={refreshData} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>
      </div>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الرسائل</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              رسائل مرسلة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل النجاح</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.successRate}%</div>
            <Progress value={stats.successRate} className="w-full mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.successMessages} نجح، {stats.failedMessages} فشل
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المستهدفون النشطون</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.activeRecipients}</div>
            <p className="text-xs text-muted-foreground">
              شخص نشط
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الرسائل المعلقة</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingMessages}</div>
            <p className="text-xs text-muted-foreground">
              في الانتظار
            </p>
          </CardContent>
        </Card>
      </div>

      {/* الرسوم البيانية والتفاصيل */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* نشاط الرسائل */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                نشاط الرسائل
              </CardTitle>
              <CardDescription>نشاط الرسائل خلال اليوم</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Tabs value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
                      <TabsList>
                        <TabsTrigger value="today">اليوم</TabsTrigger>
                        <TabsTrigger value="week">الأسبوع</TabsTrigger>
                        <TabsTrigger value="month">الشهر</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getPeriodLabel()}: {getPeriodCount()} رسالة
                  </div>
                </div>
                
                <div className="h-64 flex items-end justify-between space-x-2">
                  {messageActivity.map((activity, index) => (
                    <div key={index} className="flex flex-col items-center space-y-2">
                      <div className="w-8 bg-blue-500 rounded-t" style={{ height: `${(activity.sent / 35) * 100}%` }}></div>
                      <div className="w-8 bg-green-500 rounded-t" style={{ height: `${(activity.success / 35) * 100}%` }}></div>
                      <span className="text-xs text-muted-foreground">{activity.hour}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>مرسل</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>ناجح</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* المستهدفون الأكثر نشاطاً */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                المستهدفون الأكثر نشاطاً
              </CardTitle>
              <CardDescription>أعلى 5 مستهدفين</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topRecipients.map((recipient, index) => (
                  <div key={recipient.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{recipient.name}</div>
                        <div className="text-xs text-muted-foreground">{recipient.phone}</div>
                        <Badge variant="outline" className="text-xs mt-1">
                          {recipient.type}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">{recipient.messageCount}</div>
                      <div className="text-xs text-muted-foreground">رسالة</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* إحصائيات إضافية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الرسائل المجدولة</CardTitle>
            <Calendar className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{stats.scheduledMessages}</div>
            <p className="text-xs text-muted-foreground">
              رسائل مجدولة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل الاستجابة</CardTitle>
            <Phone className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">78%</div>
            <p className="text-xs text-muted-foreground">
              معدل الاستجابة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أداء النظام</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">98%</div>
            <p className="text-xs text-muted-foreground">
              كفاءة النظام
            </p>
          </CardContent>
        </Card>
      </div>

      {/* معلومات النظام */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <BarChart3 className="w-5 h-5 mr-2" />
            معلومات النظام
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">📊 الإحصائيات</h4>
              <p>يتم تحديث البيانات كل 5 دقائق تلقائياً</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">🔗 حالة API</h4>
              <p>مراقبة مستمرة لحالة الاتصال بـ x-growth.tech</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">📈 التقارير</h4>
              <p>تقارير مفصلة عن أداء الرسائل والمستهدفين</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
