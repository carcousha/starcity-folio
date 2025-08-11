import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Lightbulb, 
  RefreshCw, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Users,
  Home,
  MessageSquare,
  Phone,
  Calendar,
  Filter,
  Search,
  Bell,
  Zap,
  Target,
  BarChart3,
  Settings,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  PieChart,
  Activity,
  Award,
  Shield,
  TrendingDown,
  UserCheck,
  Building2,
  MapPin,
  DollarSign,
  Percent,
  Clock3,
  AlertCircle,
  Info,
  HelpCircle,
  Settings2,
  BellRing,
  MessageCircle,
  PhoneCall,
  CalendarDays,
  FileText,
  BarChart,
  LineChart
} from 'lucide-react';
import { BrokerRecommendation, Client, Property } from '../../types/ai';

interface SmartRecommendationsProps {
  recommendations?: BrokerRecommendation[];
  clients?: Client[];
  properties?: Property[];
}

export default function SmartRecommendations({ 
  recommendations = [], 
  clients = [], 
  properties = [] 
}: SmartRecommendationsProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [filteredRecommendations, setFilteredRecommendations] = useState<BrokerRecommendation[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    sms: false,
    whatsapp: true,
    autoRefresh: true,
    refreshInterval: 300000 // 5 minutes in milliseconds
  });

  // استخدام التوصيات الحقيقية القادمة من الـ props
  const baseRecommendations: BrokerRecommendation[] = recommendations || [];

  // إحصائيات التوصيات
  const stats = {
    total: baseRecommendations.length,
    unread: baseRecommendations.filter(r => !r.is_read).length,
    urgent: baseRecommendations.filter(r => r.priority === 'urgent').length,
    completed: baseRecommendations.filter(r => !r.action_required).length,
    followUp: baseRecommendations.filter(r => r.type === 'follow_up').length,
    propertyMatch: baseRecommendations.filter(r => r.type === 'property_match').length,
    marketInsight: baseRecommendations.filter(r => r.type === 'market_insight').length,
    brokerAssignment: baseRecommendations.filter(r => r.type === 'broker_assignment').length
  };

  // إحصائيات الأداء
  const performanceStats = {
    responseRate: 78,
    avgResponseTime: 1.2,
    conversionRate: 65,
    clientSatisfaction: 92,
    marketTrend: 'up',
    marketChange: '+12%',
    topPerformingArea: 'دبي مارينا',
    topPerformingType: 'فيلا فاخرة'
  };

  useEffect(() => {
    filterRecommendations();
  }, [activeTab, searchQuery, selectedPriority, showCompleted, recommendations]);

  // توليد التوصيات تلقائياً عند تحميل الكومبوننت
  useEffect(() => {
    // توليد التوصيات فور تحميل الوحدة
    generateSmartRecommendations();
    
    // إعداد التحديث التلقائي
    setupAutoRefresh();
    
    // تنظيف عند إلغاء الكومبوننت
    return () => {
      cleanupAutoRefresh();
    };
  }, []);

  // تحديث التحديث التلقائي عند تغيير الإعدادات
  useEffect(() => {
    setupAutoRefresh();
  }, [notificationSettings.autoRefresh, notificationSettings.refreshInterval]);

  const filterRecommendations = () => {
    let filtered = [...baseRecommendations];

    // فلترة حسب التبويب
    if (activeTab !== 'all') {
      if (activeTab === 'unread') {
        filtered = filtered.filter(r => !r.is_read);
      } else if (activeTab === 'urgent') {
        filtered = filtered.filter(r => r.priority === 'urgent');
      } else if (activeTab === 'follow-up') {
        filtered = filtered.filter(r => r.type === 'follow_up');
      } else if (activeTab === 'property-match') {
        filtered = filtered.filter(r => r.type === 'property_match');
      } else if (activeTab === 'completed') {
        filtered = filtered.filter(r => !r.action_required);
      }
    }

    // فلترة حسب البحث
    if (searchQuery) {
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // فلترة حسب الأولوية
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(r => r.priority === selectedPriority);
    }

    // فلترة حسب الحالة
    if (!showCompleted) {
      filtered = filtered.filter(r => r.action_required);
    }

    setFilteredRecommendations(filtered);
  };

  const updateRecommendations = async () => {
    setIsUpdating(true);
    try {
      await generateSmartRecommendations();
    } finally {
      setIsUpdating(false);
    }
  };

  const markAsRead = (id: string) => {
    // تحديث حالة القراءة
    console.log('تم تحديث حالة القراءة:', id);
  };

  const executeRecommendation = (id: string) => {
    // تنفيذ التوصية
    console.log('تم تنفيذ التوصية:', id);
  };

  const toggleNotificationSettings = (type: string, value?: any) => {
    setNotificationSettings(prev => ({
      ...prev,
      [type]: value !== undefined ? value : !prev[type as keyof typeof prev]
    }));
  };

  const exportRecommendations = () => {
    const dataStr = JSON.stringify(filteredRecommendations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'smart-recommendations.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateReport = () => {
    // توليد تقرير شامل
    console.log('توليد تقرير شامل للتوصيات');
  };

  // تحديث/إعادة تحميل التوصيات (يعتمد على المصدر الخارجي)
  const generateSmartRecommendations = async () => {
    setIsGeneratingRecommendations(true);
    
    try {
      // محاكاة انتظار تحديث المصدر الخارجي
      await new Promise(resolve => setTimeout(resolve, 1000));

      // تحديث الوقت وإعادة تطبيق الفلاتر على البيانات الواردة من props
      setLastUpdateTime(new Date());
      
      // إعادة تطبيق الفلاتر
      filterRecommendations();
      
    } catch (error) {
      console.error('خطأ في توليد التوصيات:', error);
    } finally {
      setIsGeneratingRecommendations(false);
    }
  };

  // إعداد التحديث التلقائي
  const setupAutoRefresh = () => {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
    }

    if (notificationSettings.autoRefresh) {
      const interval = setInterval(() => {
        generateSmartRecommendations();
      }, notificationSettings.refreshInterval);
      
      setAutoRefreshInterval(interval);
    }
  };

  // تنظيف التحديث التلقائي
  const cleanupAutoRefresh = () => {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
      setAutoRefreshInterval(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'follow_up': return <Phone className="h-4 w-4" />;
      case 'property_match': return <Home className="h-4 w-4" />;
      case 'market_insight': return <TrendingUp className="h-4 w-4" />;
      case 'broker_assignment': return <Users className="h-4 w-4" />;
      case 'client_evaluation': return <UserCheck className="h-4 w-4" />;
      case 'market_analysis': return <BarChart className="h-4 w-4" />;
      case 'performance_optimization': return <Target className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'follow_up': return 'متابعة عميل';
      case 'property_match': return 'مطابقة عقار';
      case 'market_insight': return 'رؤية سوقية';
      case 'broker_assignment': return 'تعيين وسيط';
      case 'client_evaluation': return 'تقييم عميل';
      case 'market_analysis': return 'تحليل سوق';
      case 'performance_optimization': return 'تحسين الأداء';
      default: return 'توصية عامة';
    }
  };

  return (
    <div className="space-y-6">
      {/* مؤشر توليد التوصيات */}
      {isGeneratingRecommendations && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white animate-pulse">
          <div className="flex items-center justify-center space-x-3">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span className="text-lg font-semibold">جاري توليد التوصيات الذكية...</span>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
            </div>
          </div>
        </div>
      )}

      {/* البانر الرئيسي */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <Lightbulb className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">التوصيات الذكية</h2>
              <p className="text-orange-100 text-lg">
                اقتراحات مدعومة بالذكاء الاصطناعي لتحسين الأداء والمتابعة
              </p>
              {lastUpdateTime && (
                <p className="text-orange-200 text-sm mt-2">
                  آخر تحديث: {lastUpdateTime.toLocaleTimeString('ar-SA')}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={updateRecommendations}
              disabled={isUpdating || isGeneratingRecommendations}
              className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:text-orange-600"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(isUpdating || isGeneratingRecommendations) ? 'animate-spin' : ''}`} />
              تحديث التوصيات
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:text-orange-600"
            >
              <BarChart className="h-4 w-4 mr-2" />
              التحليلات
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:text-orange-600"
            >
              <Settings2 className="h-4 w-4 mr-2" />
              الإعدادات
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={exportRecommendations}
              className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:text-orange-600"
            >
              <FileText className="h-4 w-4 mr-2" />
              تصدير
            </Button>
          </div>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">تم تنفيذها</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
            <div className="text-sm text-gray-600">عاجلة</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.unread}</div>
            <div className="text-sm text-gray-600">غير مقروءة</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">إجمالي التوصيات</div>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات والفلترة */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7 bg-white border border-gray-200 rounded-lg p-1">
          <TabsTrigger value="all" className="flex items-center space-x-2">
            <span>الكل</span>
          </TabsTrigger>
          <TabsTrigger value="unread" className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>غير مقروءة</span>
          </TabsTrigger>
          <TabsTrigger value="urgent" className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>عاجلة</span>
          </TabsTrigger>
          <TabsTrigger value="follow-up" className="flex items-center space-x-2">
            <Phone className="h-4 w-4" />
            <span>متابعة</span>
          </TabsTrigger>
          <TabsTrigger value="property-match" className="flex items-center space-x-2">
            <Home className="h-4 w-4" />
            <span>مطابقة عقار</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>تم تنفيذها</span>
          </TabsTrigger>
        </TabsList>

        {/* شريط البحث والفلترة */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border">
          <div className="flex items-center space-x-2 flex-1 max-w-md">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="البحث في التوصيات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-none outline-none text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">جميع الأولويات</option>
              <option value="urgent">عاجلة</option>
              <option value="high">عالية</option>
              <option value="medium">متوسطة</option>
              <option value="low">منخفضة</option>
            </select>
            
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="rounded"
              />
              <span>إظهار المكتملة</span>
            </label>
          </div>
        </div>

        {/* محتوى التبويبات */}
        <TabsContent value={activeTab} className="space-y-4">
          {filteredRecommendations.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Lightbulb className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد توصيات</h3>
                <p className="text-gray-500">لم يتم العثور على توصيات تطابق المعايير المحددة</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRecommendations.map((recommendation) => (
                <Card key={recommendation.id} className="hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-orange-100 p-2 rounded-lg">
                          {getTypeIcon(recommendation.type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {recommendation.title}
                          </h3>
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge 
                              variant="outline" 
                              className={getPriorityColor(recommendation.priority)}
                            >
                              {recommendation.priority}
                            </Badge>
                            <Badge variant="secondary">
                              {getTypeLabel(recommendation.type)}
                            </Badge>
                            {!recommendation.is_read && (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                جديد
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(recommendation.id)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {recommendation.action_required && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => executeRecommendation(recommendation.id)}
                            className="bg-orange-500 hover:bg-orange-600"
                          >
                            تنفيذ
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{recommendation.message}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(recommendation.created_at).toLocaleDateString('ar-SA')}</span>
                      </div>
                      
                      {recommendation.action_deadline && (
                        <div className="flex items-center space-x-2 text-red-600">
                          <Clock className="h-4 w-4" />
                          <span>مطلوب بحلول: {new Date(recommendation.action_deadline).toLocaleDateString('ar-SA')}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* مكون الإعدادات */}
      {showSettings && (
        <Card className="border-2 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-700">
              <Settings2 className="h-5 w-5" />
              <span>إعدادات التوصيات الذكية</span>
            </CardTitle>
            <CardDescription>
              تخصيص إعدادات الإشعارات والتنبيهات
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">إعدادات الإشعارات</h4>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={notificationSettings.email}
                    onChange={() => toggleNotificationSettings('email')}
                    className="rounded"
                  />
                  <span className="text-sm">إشعارات البريد الإلكتروني</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={notificationSettings.push}
                    onChange={() => toggleNotificationSettings('push')}
                    className="rounded"
                  />
                  <span className="text-sm">إشعارات المتصفح</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={notificationSettings.sms}
                    onChange={() => toggleNotificationSettings('sms')}
                    className="rounded"
                  />
                  <span className="text-sm">رسائل SMS</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={notificationSettings.whatsapp}
                    onChange={() => toggleNotificationSettings('whatsapp')}
                    className="rounded"
                  />
                  <span className="text-sm">رسائل واتساب</span>
                </label>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">إعدادات التوصيات</h4>
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={notificationSettings.autoRefresh}
                    onChange={(e) => toggleNotificationSettings('autoRefresh', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">تحديث تلقائي للتوصيات</span>
                </label>
                
                {notificationSettings.autoRefresh && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">تحديث تلقائي كل</span>
                    <select 
                      value={notificationSettings.refreshInterval}
                      onChange={(e) => toggleNotificationSettings('refreshInterval', parseInt(e.target.value))}
                      className="border border-gray-200 rounded px-2 py-1 text-sm"
                    >
                      <option value="60000">دقيقة واحدة</option>
                      <option value="300000">5 دقائق</option>
                      <option value="900000">15 دقيقة</option>
                      <option value="1800000">30 دقيقة</option>
                      <option value="3600000">ساعة واحدة</option>
                    </select>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">أولوية التوصيات</span>
                  <select className="border border-gray-200 rounded px-2 py-1 text-sm">
                    <option>عاجلة فقط</option>
                    <option>عاجلة وعالية</option>
                    <option>جميع الأولويات</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                إلغاء
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600">
                حفظ الإعدادات
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* مكون التحليلات */}
      {showAnalytics && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-700">
              <BarChart className="h-5 w-5" />
              <span>تحليل الأداء والتوصيات</span>
            </CardTitle>
            <CardDescription>
              رؤى شاملة حول أداء التوصيات الذكية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{performanceStats.conversionRate}%</div>
                <div className="text-sm text-blue-700">معدل التحويل</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{performanceStats.clientSatisfaction}%</div>
                <div className="text-sm text-green-700">رضا العملاء</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{performanceStats.marketChange}</div>
                <div className="text-sm text-purple-700">تغير السوق</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{performanceStats.topPerformingArea}</div>
                <div className="text-sm text-orange-700">أفضل منطقة</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">توزيع التوصيات حسب النوع</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">متابعة عملاء</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={stats.followUp / stats.total * 100} className="w-20" />
                      <span className="text-sm font-medium">{stats.followUp}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">مطابقة عقارات</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={stats.propertyMatch / stats.total * 100} className="w-20" />
                      <span className="text-sm font-medium">{stats.propertyMatch}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">رؤى سوقية</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={stats.marketInsight / stats.total * 100} className="w-20" />
                      <span className="text-sm font-medium">{stats.marketInsight}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">أداء التوصيات</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">التوصيات العاجلة</span>
                    <Badge variant="destructive">{stats.urgent}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">غير المقروءة</span>
                    <Badge variant="secondary">{stats.unread}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">تم تنفيذها</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">{stats.completed}</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowAnalytics(false)}>
                إغلاق
              </Button>
              <Button onClick={generateReport} className="bg-blue-500 hover:bg-blue-600">
                <FileText className="h-4 w-4 mr-2" />
                توليد تقرير
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}