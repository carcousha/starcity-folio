import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  TrendingUp,
  Settings,
  Plus,
  BarChart3
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalMessages: 0,
    successfulMessages: 0,
    failedMessages: 0,
    pendingMessages: 0,
    dailyLimit: 1000,
    messagesUsedToday: 0
  });

  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      type: 'success',
      message: 'تم إرسال رسالة إلى +971501234567',
      time: 'منذ 5 دقائق',
      recipient: '+971501234567'
    },
    {
      id: 2,
      type: 'failed',
      message: 'فشل إرسال رسالة إلى +971509876543',
      time: 'منذ 12 دقيقة',
      recipient: '+971509876543'
    },
    {
      id: 3,
      type: 'success',
      message: 'تم إرسال رسالة إلى +971555555555',
      time: 'منذ 18 دقيقة',
      recipient: '+971555555555'
    }
  ]);

  const [isApiConnected, setIsApiConnected] = useState(false);

  // فحص حالة API عند تحميل الصفحة
  useEffect(() => {
    const apiKey = localStorage.getItem('whatsapp_api_key');
    setIsApiConnected(!!apiKey);

    // محاكاة تحميل الإحصائيات (في التطبيق الحقيقي ستأتي من API)
    setStats({
      totalMessages: 1247,
      successfulMessages: 1198,
      failedMessages: 49,
      pendingMessages: 3,
      dailyLimit: 1000,
      messagesUsedToday: 87
    });
  }, []);

  // حساب النسب المئوية
  const successRate = stats.totalMessages > 0 ? (stats.successfulMessages / stats.totalMessages) * 100 : 0;
  const dailyUsagePercentage = (stats.messagesUsedToday / stats.dailyLimit) * 100;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <MessageCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  const getActivityBadgeVariant = (type: string) => {
    switch (type) {
      case 'success':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl" dir="rtl">
      <div className="space-y-6">
        {/* العنوان والأزرار */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">لوحة تحكم واتساب</h1>
            <p className="text-muted-foreground">
              إدارة ومراقبة رسائل واتساب عبر StarCity Folio
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button onClick={() => navigate('/whatsapp/quick-send')} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              إرسال رسالة
            </Button>
            <Button variant="outline" onClick={() => navigate('/whatsapp/settings')}>
              <Settings className="h-4 w-4 ml-2" />
              الإعدادات
            </Button>
          </div>
        </div>

        {/* تنبيه حالة API */}
        {!isApiConnected && (
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              يرجى تكوين إعدادات API أولاً للبدء في استخدام خدمة واتساب.
              <Button 
                variant="link" 
                className="p-0 h-auto mr-2"
                onClick={() => navigate('/whatsapp/settings')}
              >
                اذهب للإعدادات
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* البطاقات الإحصائية */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الرسائل</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMessages.toLocaleString('ar-AE')}</div>
              <p className="text-xs text-muted-foreground">
                جميع الرسائل المرسلة
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الرسائل الناجحة</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.successfulMessages.toLocaleString('ar-AE')}</div>
              <p className="text-xs text-muted-foreground">
                نسبة النجاح: {successRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الرسائل الفاشلة</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failedMessages.toLocaleString('ar-AE')}</div>
              <p className="text-xs text-muted-foreground">
                تحتاج مراجعة وإعادة إرسال
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الرسائل المعلقة</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingMessages.toLocaleString('ar-AE')}</div>
              <p className="text-xs text-muted-foreground">
                في انتظار الإرسال
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* بطاقة الاستخدام اليومي */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                الاستخدام اليومي
              </CardTitle>
              <CardDescription>
                عدد الرسائل المرسلة اليوم من إجمالي الحد المسموح
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>المستخدم: {stats.messagesUsedToday}</span>
                <span>الحد الأقصى: {stats.dailyLimit}</span>
              </div>
              <Progress value={dailyUsagePercentage} className="w-full" />
              <p className="text-xs text-muted-foreground">
                متبقي: {(stats.dailyLimit - stats.messagesUsedToday).toLocaleString('ar-AE')} رسالة
              </p>
            </CardContent>
          </Card>

          {/* بطاقة النشاط الأخير */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                النشاط الأخير
              </CardTitle>
              <CardDescription>
                آخر العمليات والرسائل المرسلة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">{activity.message}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={getActivityBadgeVariant(activity.type)} className="text-xs">
                          {activity.type === 'success' ? 'نجح' : 
                           activity.type === 'failed' ? 'فشل' : 'معلق'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* إجراءات سريعة */}
        <Card>
          <CardHeader>
            <CardTitle>إجراءات سريعة</CardTitle>
            <CardDescription>
              وصول سريع للميزات الأكثر استخداماً
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 h-auto p-4"
                onClick={() => navigate('/whatsapp/quick-send')}
              >
                <Send className="h-5 w-5" />
                <div className="text-right">
                  <div className="font-medium">إرسال سريع</div>
                  <div className="text-xs text-muted-foreground">إرسال رسالة فورية</div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="flex items-center gap-2 h-auto p-4"
                onClick={() => navigate('/whatsapp/templates')}
              >
                <MessageCircle className="h-5 w-5" />
                <div className="text-right">
                  <div className="font-medium">القوالب</div>
                  <div className="text-xs text-muted-foreground">إدارة قوالب الرسائل</div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="flex items-center gap-2 h-auto p-4"
                onClick={() => navigate('/whatsapp/reports')}
              >
                <Users className="h-5 w-5" />
                <div className="text-right">
                  <div className="font-medium">التقارير</div>
                  <div className="text-xs text-muted-foreground">إحصائيات وتقارير</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}