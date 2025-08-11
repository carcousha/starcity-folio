import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Target, 
  Activity,
  PieChart,
  LineChart,
  RefreshCw,
  Download,
  Calendar,
  Filter,
  Settings,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Brain,
  Eye,
  MessageSquare,
  Phone,
  Star,
  Percent,
  DollarSign,
  Building,
  MapPin,
  TrendingDown as DownTrend,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

// أنواع البيانات للتحليلات
interface AnalyticsData {
  performance: {
    total_recommendations: number;
    successful_matches: number;
    conversion_rate: number;
    avg_response_time: number;
    client_satisfaction: number;
    accuracy_score: number;
  };
  trends: {
    weekly_growth: number;
    monthly_growth: number;
    recommendations_trend: 'up' | 'down' | 'stable';
    conversion_trend: 'up' | 'down' | 'stable';
  };
  categories: {
    follow_up: { count: number; success_rate: number; priority: number };
    property_match: { count: number; success_rate: number; priority: number };
    market_insight: { count: number; success_rate: number; priority: number };
    broker_assignment: { count: number; success_rate: number; priority: number };
  };
  time_analysis: {
    hourly_distribution: Record<string, number>;
    daily_distribution: Record<string, number>;
    peak_hours: string[];
    peak_days: string[];
  };
  client_segments: {
    hot_leads: { count: number; conversion_rate: number; avg_value: number };
    warm_leads: { count: number; conversion_rate: number; avg_value: number };
    cold_leads: { count: number; conversion_rate: number; avg_value: number };
  };
  broker_performance: {
    top_performers: Array<{
      name: string;
      recommendations_count: number;
      success_rate: number;
      avg_response_time: number;
    }>;
    improvement_needed: Array<{
      name: string;
      recommendations_count: number;
      success_rate: number;
      issues: string[];
    }>;
  };
  market_intelligence: {
    hot_areas: Array<{
      area: string;
      property_count: number;
      demand_score: number;
      price_trend: 'up' | 'down' | 'stable';
    }>;
    property_types: Array<{
      type: string;
      recommendation_count: number;
      success_rate: number;
      avg_days_to_close: number;
    }>;
  };
}

// بيانات تجريبية شاملة
const mockAnalyticsData: AnalyticsData = {
  performance: {
    total_recommendations: 1247,
    successful_matches: 823,
    conversion_rate: 66,
    avg_response_time: 2.3,
    client_satisfaction: 4.2,
    accuracy_score: 87
  },
  trends: {
    weekly_growth: 12.5,
    monthly_growth: 23.8,
    recommendations_trend: 'up',
    conversion_trend: 'up'
  },
  categories: {
    follow_up: { count: 423, success_rate: 78, priority: 85 },
    property_match: { count: 312, success_rate: 82, priority: 92 },
    market_insight: { count: 267, success_rate: 65, priority: 70 },
    broker_assignment: { count: 245, success_rate: 88, priority: 95 }
  },
  time_analysis: {
    hourly_distribution: {
      '9': 145, '10': 167, '11': 189, '12': 134, '13': 98, '14': 156,
      '15': 178, '16': 201, '17': 156, '18': 87, '19': 67, '20': 45
    },
    daily_distribution: {
      'الأحد': 234, 'الاثنين': 287, 'الثلاثاء': 298, 'الأربعاء': 276,
      'الخميس': 265, 'الجمعة': 123, 'السبت': 164
    },
    peak_hours: ['16:00', '15:00', '11:00'],
    peak_days: ['الثلاثاء', 'الاثنين', 'الأربعاء']
  },
  client_segments: {
    hot_leads: { count: 89, conversion_rate: 85, avg_value: 2.4 },
    warm_leads: { count: 234, conversion_rate: 62, avg_value: 1.8 },
    cold_leads: { count: 456, conversion_rate: 23, avg_value: 0.9 }
  },
  broker_performance: {
    top_performers: [
      { name: 'أحمد محمد', recommendations_count: 89, success_rate: 94, avg_response_time: 1.2 },
      { name: 'سارة أحمد', recommendations_count: 76, success_rate: 91, avg_response_time: 1.5 },
      { name: 'محمد علي', recommendations_count: 82, success_rate: 88, avg_response_time: 1.8 }
    ],
    improvement_needed: [
      { 
        name: 'خالد العتيبي', 
        recommendations_count: 45, 
        success_rate: 67, 
        issues: ['بطء في الاستجابة', 'متابعة غير منتظمة'] 
      },
      { 
        name: 'فاطمة الزهراء', 
        recommendations_count: 38, 
        success_rate: 71, 
        issues: ['تحتاج تدريب على التوصيات الذكية'] 
      }
    ]
  },
  market_intelligence: {
    hot_areas: [
      { area: 'دبي مارينا', property_count: 67, demand_score: 92, price_trend: 'up' },
      { area: 'الروضة', property_count: 45, demand_score: 87, price_trend: 'stable' },
      { area: 'دبي هيلز', property_count: 38, demand_score: 83, price_trend: 'up' }
    ],
    property_types: [
      { type: 'فيلا', recommendation_count: 387, success_rate: 78, avg_days_to_close: 45 },
      { type: 'شقة', recommendation_count: 298, success_rate: 82, avg_days_to_close: 32 },
      { type: 'أرض', recommendation_count: 156, success_rate: 65, avg_days_to_close: 67 },
      { type: 'مكتب', recommendation_count: 98, success_rate: 71, avg_days_to_close: 28 }
    ]
  }
};

// مكون البطاقة الإحصائية
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  icon: React.ReactNode;
  color?: string;
}> = ({ title, value, trend, trendValue, icon, color = 'blue' }) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'down': return <ArrowDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={`p-3 rounded-lg bg-${color}-100`}>
            {icon}
          </div>
          {trend && trendValue && (
            <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="text-sm font-medium">{trendValue}%</span>
            </div>
          )}
        </div>
        <div className="mt-4">
          <div className={`text-3xl font-bold text-${color}-600`}>{value}</div>
          <div className="text-sm text-gray-600 mt-1">{title}</div>
        </div>
      </CardContent>
    </Card>
  );
};

// مكون الرسم البياني البسيط
const SimpleChart: React.FC<{
  data: Record<string, number>;
  title: string;
  color?: string;
}> = ({ data, title, color = 'blue' }) => {
  const maxValue = Math.max(...Object.values(data));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(data).map(([key, value]) => {
            const percentage = (value / maxValue) * 100;
            return (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 w-20">{key}</span>
                <div className="flex-1 mx-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`bg-${color}-500 h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium w-12 text-right">{value}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// مكون أداء البروكر
const BrokerPerformanceCard: React.FC<{
  broker: {
    name: string;
    recommendations_count: number;
    success_rate: number;
    avg_response_time?: number;
    issues?: string[];
  };
  type: 'top' | 'improvement';
}> = ({ broker, type }) => {
  return (
    <Card className={`border-l-4 ${type === 'top' ? 'border-l-green-500' : 'border-l-yellow-500'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900">{broker.name}</h4>
          <Badge 
            variant="outline" 
            className={type === 'top' ? 'border-green-200 text-green-800' : 'border-yellow-200 text-yellow-800'}
          >
            {type === 'top' ? 'أداء ممتاز' : 'يحتاج تحسين'}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600">التوصيات:</span>
            <p className="font-medium">{broker.recommendations_count}</p>
          </div>
          <div>
            <span className="text-gray-600">معدل النجاح:</span>
            <p className="font-medium">{broker.success_rate}%</p>
          </div>
          {broker.avg_response_time && (
            <div className="col-span-2">
              <span className="text-gray-600">متوسط الاستجابة:</span>
              <p className="font-medium">{broker.avg_response_time} ساعة</p>
            </div>
          )}
        </div>

        {broker.issues && broker.issues.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <h5 className="text-xs font-medium text-gray-700 mb-2">نقاط التحسين:</h5>
            <ul className="space-y-1">
              {broker.issues.map((issue, index) => (
                <li key={index} className="text-xs text-gray-600 flex items-start space-x-1">
                  <span className="w-1 h-1 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// المكون الرئيسي
export default function RecommendationAnalytics() {
  const [data, setData] = useState<AnalyticsData>(mockAnalyticsData);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [activeTab, setActiveTab] = useState('overview');

  // تحديث البيانات
  const refreshData = async () => {
    setIsLoading(true);
    // محاكاة استدعاء API
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
  };

  // تصدير التقرير
  const exportReport = () => {
    const reportData = {
      generated_at: new Date().toISOString(),
      timeframe: selectedTimeframe,
      ...data
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-recommendations-analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* العنوان الرئيسي */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">تحليلات التوصيات الذكية</h1>
              <p className="text-purple-100 text-lg">
                رؤى شاملة حول أداء النظام الذكي والتحسينات المقترحة
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-3 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white"
            >
              <option value="week" className="text-gray-900">الأسبوع الماضي</option>
              <option value="month" className="text-gray-900">الشهر الماضي</option>
              <option value="quarter" className="text-gray-900">الربع الماضي</option>
              <option value="year" className="text-gray-900">السنة الماضية</option>
            </select>
            
            <Button
              onClick={exportReport}
              variant="outline"
              className="bg-white bg-opacity-20 border-white text-white hover:bg-white hover:text-purple-600"
            >
              <Download className="h-4 w-4 mr-2" />
              تصدير
            </Button>
            
            <Button
              onClick={refreshData}
              disabled={isLoading}
              variant="outline"
              className="bg-white bg-opacity-20 border-white text-white hover:bg-white hover:text-purple-600"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </div>
        </div>
      </div>

      {/* مؤشر التحميل */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-blue-800">جاري تحديث التحليلات...</span>
          </div>
        </div>
      )}

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="إجمالي التوصيات"
          value={data.performance.total_recommendations.toLocaleString()}
          trend={data.trends.recommendations_trend}
          trendValue={data.trends.weekly_growth}
          icon={<Target className="h-6 w-6 text-blue-600" />}
          color="blue"
        />
        
        <MetricCard
          title="معدل التحويل"
          value={`${data.performance.conversion_rate}%`}
          trend={data.trends.conversion_trend}
          trendValue={data.trends.monthly_growth}
          icon={<TrendingUp className="h-6 w-6 text-green-600" />}
          color="green"
        />
        
        <MetricCard
          title="متوسط الاستجابة"
          value={`${data.performance.avg_response_time} ساعة`}
          icon={<Clock className="h-6 w-6 text-orange-600" />}
          color="orange"
        />
        
        <MetricCard
          title="رضا العملاء"
          value={`${data.performance.client_satisfaction}/5`}
          icon={<Star className="h-6 w-6 text-yellow-600" />}
          color="yellow"
        />
        
        <MetricCard
          title="دقة النظام"
          value={`${data.performance.accuracy_score}%`}
          icon={<Brain className="h-6 w-6 text-purple-600" />}
          color="purple"
        />
        
        <MetricCard
          title="التطابقات الناجحة"
          value={data.performance.successful_matches.toLocaleString()}
          icon={<CheckCircle className="h-6 w-6 text-teal-600" />}
          color="teal"
        />
      </div>

      {/* التبويبات التحليلية */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 bg-white border border-gray-200 rounded-lg p-1">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="categories">الفئات</TabsTrigger>
          <TabsTrigger value="time">التوقيتات</TabsTrigger>
          <TabsTrigger value="clients">العملاء</TabsTrigger>
          <TabsTrigger value="brokers">الوسطاء</TabsTrigger>
          <TabsTrigger value="market">السوق</TabsTrigger>
        </TabsList>

        {/* نظرة عامة */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>نمو التوصيات</CardTitle>
                <CardDescription>تطور عدد التوصيات خلال الفترة المحددة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">النمو الأسبوعي</span>
                    <div className="flex items-center space-x-2">
                      <ArrowUp className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 font-medium">+{data.trends.weekly_growth}%</span>
                    </div>
                  </div>
                  <Progress value={data.trends.weekly_growth} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">النمو الشهري</span>
                    <div className="flex items-center space-x-2">
                      <ArrowUp className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 font-medium">+{data.trends.monthly_growth}%</span>
                    </div>
                  </div>
                  <Progress value={data.trends.monthly_growth} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>توزيع النجاح حسب الفئة</CardTitle>
                <CardDescription>معدلات نجاح التوصيات حسب النوع</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(data.categories).map(([key, category]) => {
                    const categoryNames = {
                      follow_up: 'متابعة العملاء',
                      property_match: 'مطابقة العقارات',
                      market_insight: 'رؤى السوق',
                      broker_assignment: 'تعيين الوسطاء'
                    };
                    
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {categoryNames[key as keyof typeof categoryNames]}
                        </span>
                        <div className="flex items-center space-x-2">
                          <Progress value={category.success_rate} className="w-20" />
                          <span className="text-sm font-medium w-12">{category.success_rate}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تحليل الفئات */}
        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(data.categories).map(([key, category]) => {
              const categoryNames = {
                follow_up: 'متابعة العملاء',
                property_match: 'مطابقة العقارات',
                market_insight: 'رؤى السوق',
                broker_assignment: 'تعيين الوسطاء'
              };
              
              const categoryIcons = {
                follow_up: <Phone className="h-6 w-6" />,
                property_match: <Building className="h-6 w-6" />,
                market_insight: <TrendingUp className="h-6 w-6" />,
                broker_assignment: <Users className="h-6 w-6" />
              };

              return (
                <Card key={key} className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      {categoryIcons[key as keyof typeof categoryIcons]}
                      <span>{categoryNames[key as keyof typeof categoryNames]}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{category.count}</div>
                          <div className="text-xs text-gray-600">العدد</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{category.success_rate}%</div>
                          <div className="text-xs text-gray-600">النجاح</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">{category.priority}%</div>
                          <div className="text-xs text-gray-600">الأولوية</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>معدل النجاح</span>
                            <span>{category.success_rate}%</span>
                          </div>
                          <Progress value={category.success_rate} />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>مستوى الأولوية</span>
                            <span>{category.priority}%</span>
                          </div>
                          <Progress value={category.priority} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* تحليل التوقيتات */}
        <TabsContent value="time" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SimpleChart
              data={data.time_analysis.hourly_distribution}
              title="توزيع التوصيات حسب الساعة"
              color="blue"
            />
            
            <SimpleChart
              data={data.time_analysis.daily_distribution}
              title="توزيع التوصيات حسب اليوم"
              color="green"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>أوقات الذروة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">الساعات الأكثر نشاطاً:</h4>
                    <div className="flex space-x-2">
                      {data.time_analysis.peak_hours.map((hour, index) => (
                        <Badge key={index} variant="outline" className="bg-blue-50">
                          {hour}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">الأيام الأكثر نشاطاً:</h4>
                    <div className="flex space-x-2">
                      {data.time_analysis.peak_days.map((day, index) => (
                        <Badge key={index} variant="outline" className="bg-green-50">
                          {day}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>نصائح التحسين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <Zap className="h-4 w-4 text-yellow-500 mt-1" />
                    <div className="text-sm">
                      <p className="font-medium">استغل ساعات الذروة</p>
                      <p className="text-gray-600">ركز على إرسال التوصيات بين 15:00-17:00</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Brain className="h-4 w-4 text-purple-500 mt-1" />
                    <div className="text-sm">
                      <p className="font-medium">أيام العمل الأكثر فعالية</p>
                      <p className="text-gray-600">الثلاثاء والاثنين أفضل أيام للمتابعة</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تحليل العملاء */}
        <TabsContent value="clients" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(data.client_segments).map(([segment, data]) => {
              const segmentNames = {
                hot_leads: 'عملاء ساخنون',
                warm_leads: 'عملاء دافئون',
                cold_leads: 'عملاء باردون'
              };
              
              const segmentColors = {
                hot_leads: 'red',
                warm_leads: 'yellow',
                cold_leads: 'blue'
              };

              return (
                <Card key={segment} className="text-center">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {segmentNames[segment as keyof typeof segmentNames]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className={`text-3xl font-bold text-${segmentColors[segment as keyof typeof segmentColors]}-600`}>
                        {data.count}
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <div className="text-sm text-gray-600">معدل التحويل</div>
                          <div className="font-medium">{data.conversion_rate}%</div>
                          <Progress value={data.conversion_rate} className="mt-1" />
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600">متوسط القيمة</div>
                          <div className="font-medium">{data.avg_value}M د.إ</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* تحليل الوسطاء */}
        <TabsContent value="brokers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-green-600" />
                  <span>أفضل الوسطاء</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.broker_performance.top_performers.map((broker, index) => (
                    <BrokerPerformanceCard key={index} broker={broker} type="top" />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span>يحتاجون تحسين</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.broker_performance.improvement_needed.map((broker, index) => (
                    <BrokerPerformanceCard key={index} broker={broker} type="improvement" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تحليل السوق */}
        <TabsContent value="market" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>المناطق الساخنة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.market_intelligence.hot_areas.map((area, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-gray-600" />
                        <div>
                          <div className="font-medium">{area.area}</div>
                          <div className="text-sm text-gray-600">{area.property_count} عقار</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <div className="font-medium">{area.demand_score}%</div>
                          <div className="text-xs text-gray-600">الطلب</div>
                        </div>
                        {area.price_trend === 'up' ? (
                          <ArrowUp className="h-4 w-4 text-green-600" />
                        ) : area.price_trend === 'down' ? (
                          <ArrowDown className="h-4 w-4 text-red-600" />
                        ) : (
                          <Minus className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>أنواع العقارات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.market_intelligence.property_types.map((type, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{type.type}</div>
                        <div className="text-sm text-gray-600">{type.recommendation_count} توصية</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">معدل النجاح:</span>
                          <span className="font-medium ml-1">{type.success_rate}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">متوسط الإغلاق:</span>
                          <span className="font-medium ml-1">{type.avg_days_to_close} يوم</span>
                        </div>
                      </div>
                      
                      <Progress value={type.success_rate} className="mt-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}