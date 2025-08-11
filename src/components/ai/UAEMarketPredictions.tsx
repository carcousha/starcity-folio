import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  MapPin,
  DollarSign,
  Calendar,
  Building,
  Users,
  Target,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Download,
  Eye,
  Star,
  Home,
  Building2,
  TreePine,
  Briefcase,
  ShoppingBag,
  Car,
  Activity,
  LineChart,
  ArrowUp,
  ArrowDown,
  Minus,
  Zap,
  Globe,
  Clock,
  Calculator,
  TrendingDown as DownTrend
} from 'lucide-react';

// أنواع البيانات للتنبؤات
interface MarketPrediction {
  id: string;
  area: string;
  propertyType: string;
  predictionType: 'price' | 'demand' | 'supply' | 'roi';
  currentValue: number;
  predictedValue: number;
  changePercentage: number;
  confidence: number;
  timeframe: '1month' | '3months' | '6months' | '1year';
  factors: string[];
  recommendation: 'buy' | 'sell' | 'hold' | 'wait';
  riskLevel: 'low' | 'medium' | 'high';
  lastUpdated: string;
}

interface MarketTrend {
  area: string;
  averagePrice: number;
  priceChange: number;
  demandLevel: number;
  supplyLevel: number;
  transactionVolume: number;
  daysOnMarket: number;
  pricePerSqft: number;
  rentYield: number;
  occupancyRate: number;
}

interface SeasonalPattern {
  month: string;
  demand: number;
  supply: number;
  priceIndex: number;
  transactionCount: number;
}

interface EconomicIndicator {
  name: string;
  value: number;
  change: number;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
}

// بيانات تجريبية للتنبؤات
const mockPredictions: MarketPrediction[] = [
  {
    id: '1',
    area: 'مدينة عجمان',
    propertyType: 'شقة',
    predictionType: 'price',
    currentValue: 850000,
    predictedValue: 920000,
    changePercentage: 8.2,
    confidence: 78,
    timeframe: '6months',
    factors: ['نمو السكان', 'تحسن البنية التحتية', 'انخفاض أسعار الفائدة'],
    recommendation: 'buy',
    riskLevel: 'medium',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '2',
    area: 'الراشدية',
    propertyType: 'فيلا',
    predictionType: 'demand',
    currentValue: 65,
    predictedValue: 85,
    changePercentage: 30.8,
    confidence: 82,
    timeframe: '3months',
    factors: ['مشاريع جديدة', 'تحسن المواصلات', 'زيادة الاستثمارات'],
    recommendation: 'buy',
    riskLevel: 'low',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '3',
    area: 'النعيمية',
    propertyType: 'أرض',
    predictionType: 'roi',
    currentValue: 12.5,
    predictedValue: 16.2,
    changePercentage: 29.6,
    confidence: 71,
    timeframe: '1year',
    factors: ['خطط التطوير', 'قرب الشاطئ', 'مشاريع سياحية'],
    recommendation: 'buy',
    riskLevel: 'medium',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '4',
    area: 'الحميدية',
    propertyType: 'مكتب',
    predictionType: 'supply',
    currentValue: 45,
    predictedValue: 35,
    changePercentage: -22.2,
    confidence: 69,
    timeframe: '6months',
    factors: ['مشاريع مكتبية جديدة', 'نمو الأعمال', 'توسع الشركات'],
    recommendation: 'hold',
    riskLevel: 'medium',
    lastUpdated: new Date().toISOString()
  }
];

const mockTrends: MarketTrend[] = [
  {
    area: 'مدينة عجمان',
    averagePrice: 850000,
    priceChange: 8.2,
    demandLevel: 75,
    supplyLevel: 60,
    transactionVolume: 245,
    daysOnMarket: 35,
    pricePerSqft: 650,
    rentYield: 7.2,
    occupancyRate: 88
  },
  {
    area: 'الراشدية',
    averagePrice: 1200000,
    priceChange: 12.5,
    demandLevel: 85,
    supplyLevel: 55,
    transactionVolume: 180,
    daysOnMarket: 28,
    pricePerSqft: 720,
    rentYield: 6.8,
    occupancyRate: 92
  },
  {
    area: 'النعيمية',
    averagePrice: 650000,
    priceChange: 5.8,
    demandLevel: 70,
    supplyLevel: 65,
    transactionVolume: 320,
    daysOnMarket: 42,
    pricePerSqft: 580,
    rentYield: 8.1,
    occupancyRate: 85
  }
];

const seasonalPatterns: SeasonalPattern[] = [
  { month: 'يناير', demand: 85, supply: 60, priceIndex: 102, transactionCount: 280 },
  { month: 'فبراير', demand: 90, supply: 55, priceIndex: 105, transactionCount: 320 },
  { month: 'مارس', demand: 95, supply: 50, priceIndex: 108, transactionCount: 380 },
  { month: 'أبريل', demand: 80, supply: 65, priceIndex: 98, transactionCount: 220 },
  { month: 'مايو', demand: 70, supply: 75, priceIndex: 95, transactionCount: 180 },
  { month: 'يونيو', demand: 60, supply: 85, priceIndex: 92, transactionCount: 150 },
  { month: 'يوليو', demand: 55, supply: 90, priceIndex: 90, transactionCount: 130 },
  { month: 'أغسطس', demand: 58, supply: 88, priceIndex: 91, transactionCount: 140 },
  { month: 'سبتمبر', demand: 75, supply: 70, priceIndex: 96, transactionCount: 200 },
  { month: 'أكتوبر', demand: 88, supply: 58, priceIndex: 103, transactionCount: 290 },
  { month: 'نوفمبر', demand: 92, supply: 52, priceIndex: 106, transactionCount: 340 },
  { month: 'ديسمبر', demand: 95, supply: 45, priceIndex: 110, transactionCount: 400 }
];

const economicIndicators: EconomicIndicator[] = [
  { name: 'نمو الناتج المحلي', value: 3.8, change: 0.5, impact: 'positive', weight: 25 },
  { name: 'معدل التضخم', value: 2.1, change: -0.3, impact: 'positive', weight: 20 },
  { name: 'أسعار الفائدة', value: 4.25, change: -0.25, impact: 'positive', weight: 30 },
  { name: 'نمو السكان', value: 2.5, change: 0.2, impact: 'positive', weight: 15 },
  { name: 'مؤشر الثقة', value: 68, change: 3, impact: 'positive', weight: 10 }
];

export default function UAEMarketPredictions() {
  const [predictions, setPredictions] = useState<MarketPrediction[]>(mockPredictions);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('6months');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('predictions');

  // تحديث التنبؤات
  const updatePredictions = async () => {
    setIsUpdating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLastUpdate(new Date());
      console.log('تم تحديث التنبؤات');
    } catch (error) {
      console.error('خطأ في تحديث التنبؤات:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // تصدير التقرير
  const exportReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      predictions: predictions,
      trends: mockTrends,
      seasonal: seasonalPatterns,
      economic: economicIndicators
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `uae-market-predictions-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // فلترة التنبؤات
  const filteredPredictions = predictions.filter(pred => {
    const timeframeMatch = selectedTimeframe === 'all' || pred.timeframe === selectedTimeframe;
    const areaMatch = selectedArea === 'all' || pred.area === selectedArea;
    return timeframeMatch && areaMatch;
  });

  // الحصول على لون التغيير
  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // الحصول على أيقونة التغيير
  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="h-4 w-4" />;
    if (change < 0) return <ArrowDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  // الحصول على لون التوصية
  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'buy': return 'bg-green-100 text-green-800 border-green-200';
      case 'sell': return 'bg-red-100 text-red-800 border-red-200';
      case 'hold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'wait': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // الحصول على نص التوصية
  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'buy': return 'شراء';
      case 'sell': return 'بيع';
      case 'hold': return 'احتفاظ';
      case 'wait': return 'انتظار';
      default: return recommendation;
    }
  };

  // الحصول على لون مستوى المخاطرة
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskText = (risk: string) => {
    switch (risk) {
      case 'low': return 'منخفض';
      case 'medium': return 'متوسط';
      case 'high': return 'عالي';
      default: return risk;
    }
  };

  useEffect(() => {
    // تحديث تلقائي كل 30 ثانية
    const interval = setInterval(() => {
      if (!isUpdating) {
        updatePredictions();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isUpdating]);

  return (
    <div className="space-y-6">
      {/* العنوان الرئيسي */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">تنبؤات السوق العقاري</h1>
              <p className="text-blue-100 text-lg">
                تحليلات ذكية ومتقدمة للسوق العقاري في الإمارات
              </p>
              <p className="text-blue-200 text-sm mt-2">
                آخر تحديث: {lastUpdate.toLocaleString('ar-SA')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={exportReport}
              className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:text-blue-600"
            >
              <Download className="h-4 w-4 mr-2" />
              تصدير التقرير
            </Button>
            
            <Button
              onClick={updatePredictions}
              disabled={isUpdating}
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              {isUpdating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {isUpdating ? 'جاري التحديث...' : 'تحديث'}
            </Button>
          </div>
        </div>
      </div>

      {/* مؤشرات اقتصادية سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {economicIndicators.map((indicator, index) => (
          <Card key={index} className="text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className={`text-lg font-bold ${getChangeColor(indicator.change)}`}>
                  {indicator.value}%
                </div>
                <div className={getChangeColor(indicator.change)}>
                  {getChangeIcon(indicator.change)}
                </div>
              </div>
              <div className="text-sm text-gray-600">{indicator.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                وزن: {indicator.weight}%
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* أدوات التصفية */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <label className="text-sm font-medium mb-2 block">الفترة الزمنية:</label>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">جميع الفترات</option>
                  <option value="1month">شهر واحد</option>
                  <option value="3months">3 أشهر</option>
                  <option value="6months">6 أشهر</option>
                  <option value="1year">سنة واحدة</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">المنطقة:</label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">جميع المناطق</option>
                  <option value="مدينة عجمان">مدينة عجمان</option>
                  <option value="الراشدية">الراشدية</option>
                  <option value="النعيمية">النعيمية</option>
                  <option value="الحميدية">الحميدية</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {filteredPredictions.length} تنبؤ
              </Badge>
              <Badge className="bg-blue-100 text-blue-800">
                متوسط الثقة: {Math.round(filteredPredictions.reduce((sum, p) => sum + p.confidence, 0) / filteredPredictions.length)}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* التبويبات الرئيسية */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200 rounded-lg p-1">
          <TabsTrigger value="predictions" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>التنبؤات</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>الاتجاهات</span>
          </TabsTrigger>
          <TabsTrigger value="seasonal" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>الأنماط الموسمية</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>التحليل المتقدم</span>
          </TabsTrigger>
        </TabsList>

        {/* تبويب التنبؤات */}
        <TabsContent value="predictions" className="space-y-6">
          <div className="grid gap-6">
            {filteredPredictions.map((prediction) => (
              <Card key={prediction.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        {prediction.propertyType === 'شقة' && <Building className="h-5 w-5 text-blue-600" />}
                        {prediction.propertyType === 'فيلا' && <Home className="h-5 w-5 text-blue-600" />}
                        {prediction.propertyType === 'أرض' && <TreePine className="h-5 w-5 text-blue-600" />}
                        {prediction.propertyType === 'مكتب' && <Briefcase className="h-5 w-5 text-blue-600" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{prediction.area}</h3>
                        <p className="text-gray-600">{prediction.propertyType}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge className={getRecommendationColor(prediction.recommendation)}>
                        {getRecommendationText(prediction.recommendation)}
                      </Badge>
                      <p className="text-sm text-gray-500 mt-1">
                        {prediction.timeframe === '1month' && 'شهر واحد'}
                        {prediction.timeframe === '3months' && '3 أشهر'}
                        {prediction.timeframe === '6months' && '6 أشهر'}
                        {prediction.timeframe === '1year' && 'سنة واحدة'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">القيمة الحالية</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {prediction.predictionType === 'price' ? 
                          `${prediction.currentValue.toLocaleString()} د.إ` : 
                          `${prediction.currentValue}${prediction.predictionType === 'roi' ? '%' : ''}`
                        }
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600">القيمة المتوقعة</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {prediction.predictionType === 'price' ? 
                          `${prediction.predictedValue.toLocaleString()} د.إ` : 
                          `${prediction.predictedValue}${prediction.predictionType === 'roi' ? '%' : ''}`
                        }
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600">نسبة التغيير</p>
                      <div className={`text-2xl font-bold flex items-center justify-center space-x-2 ${getChangeColor(prediction.changePercentage)}`}>
                        {getChangeIcon(prediction.changePercentage)}
                        <span>{Math.abs(prediction.changePercentage)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">مستوى الثقة</span>
                        <span className="text-sm font-medium">{prediction.confidence}%</span>
                      </div>
                      <Progress value={prediction.confidence} className="h-2" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">مستوى المخاطرة</span>
                      <Badge className={getRiskColor(prediction.riskLevel)}>
                        {getRiskText(prediction.riskLevel)}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">العوامل المؤثرة:</p>
                    <div className="flex flex-wrap gap-2">
                      {prediction.factors.map((factor, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* تبويب الاتجاهات */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid gap-6">
            {mockTrends.map((trend, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>{trend.area}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">متوسط السعر</p>
                      <p className="text-lg font-bold">{trend.averagePrice.toLocaleString()} د.إ</p>
                      <div className={`text-sm flex items-center justify-center space-x-1 ${getChangeColor(trend.priceChange)}`}>
                        {getChangeIcon(trend.priceChange)}
                        <span>{Math.abs(trend.priceChange)}%</span>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600">مستوى الطلب</p>
                      <p className="text-lg font-bold">{trend.demandLevel}%</p>
                      <Progress value={trend.demandLevel} className="mt-1" />
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600">مستوى العرض</p>
                      <p className="text-lg font-bold">{trend.supplyLevel}%</p>
                      <Progress value={trend.supplyLevel} className="mt-1" />
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600">حجم التداول</p>
                      <p className="text-lg font-bold">{trend.transactionVolume}</p>
                      <p className="text-xs text-gray-500">معاملة</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600">أيام في السوق</p>
                      <p className="text-lg font-bold">{trend.daysOnMarket}</p>
                      <p className="text-xs text-gray-500">يوم متوسط</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600">السعر/قدم²</p>
                      <p className="text-lg font-bold">{trend.pricePerSqft}</p>
                      <p className="text-xs text-gray-500">د.إ</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600">عائد الإيجار</p>
                      <p className="text-lg font-bold">{trend.rentYield}%</p>
                      <p className="text-xs text-gray-500">سنوي</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600">معدل الإشغال</p>
                      <p className="text-lg font-bold">{trend.occupancyRate}%</p>
                      <Progress value={trend.occupancyRate} className="mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* تبويب الأنماط الموسمية */}
        <TabsContent value="seasonal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>الأنماط الموسمية للسوق العقاري</CardTitle>
              <CardDescription>
                تحليل الاتجاهات الموسمية للطلب والعرض والأسعار
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {seasonalPatterns.map((pattern, index) => (
                  <div key={index} className="grid grid-cols-5 gap-4 items-center p-3 border rounded-lg">
                    <div className="font-medium">{pattern.month}</div>
                    
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>الطلب</span>
                        <span>{pattern.demand}%</span>
                      </div>
                      <Progress value={pattern.demand} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>العرض</span>
                        <span>{pattern.supply}%</span>
                      </div>
                      <Progress value={pattern.supply} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>مؤشر السعر</span>
                        <span>{pattern.priceIndex}</span>
                      </div>
                      <Progress value={pattern.priceIndex - 80} className="h-2" />
                    </div>
                    
                    <div className="text-center">
                      <p className="text-lg font-bold">{pattern.transactionCount}</p>
                      <p className="text-xs text-gray-500">معاملة</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب التحليل المتقدم */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <span>تحليل العائد على الاستثمار</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">متوسط العائد</p>
                      <p className="text-2xl font-bold text-green-600">7.8%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">أفضل منطقة</p>
                      <p className="text-lg font-bold">النعيمية</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-2">توزيع العائد حسب النوع:</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">شقق</span>
                        <span className="font-medium">7.2%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">فلل</span>
                        <span className="font-medium">6.8%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">أراضي</span>
                        <span className="font-medium">8.5%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>مؤشرات السيولة</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">متوسط أيام البيع</p>
                      <p className="text-2xl font-bold text-blue-600">35</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">معدل الدوران</p>
                      <p className="text-lg font-bold">12.5%</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-2">السيولة حسب المنطقة:</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">مدينة عجمان</span>
                        <Badge className="bg-green-100 text-green-800">عالية</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">الراشدية</span>
                        <Badge className="bg-yellow-100 text-yellow-800">متوسطة</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">النعيمية</span>
                        <Badge className="bg-green-100 text-green-800">عالية</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>تحليل المخاطر والفرص</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-red-600">المخاطر المحتملة</h4>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-1" />
                      <div>
                        <p className="text-sm font-medium">زيادة أسعار الفائدة</p>
                        <p className="text-xs text-gray-600">قد تؤثر على الطلب</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-1" />
                      <div>
                        <p className="text-sm font-medium">زيادة المعروض</p>
                        <p className="text-xs text-gray-600">مشاريع جديدة قيد التطوير</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3 text-green-600">الفرص الاستثمارية</h4>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                      <div>
                        <p className="text-sm font-medium">نمو القطاع السياحي</p>
                        <p className="text-xs text-gray-600">زيادة الطلب على الفنادق</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                      <div>
                        <p className="text-sm font-medium">مشاريع البنية التحتية</p>
                        <p className="text-xs text-gray-600">تحسن إمكانية الوصول</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


