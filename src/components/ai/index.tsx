import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Home, 
  MessageSquare, 
  BarChart3,
  Settings,
  Zap,
  Target,
  Lightbulb
} from 'lucide-react';

// استيراد أنواع البيانات
import {
  Client,
  Property,
  AIAnalysisResult,
  MarketInsight,
  BrokerRecommendation,
  AIPerformanceMetrics
} from '../../types/ai';

// استيراد محرك الذكاء الاصطناعي
import { AIEngine } from '../../services/aiEngine';

/**
 * الوحدة الرئيسية للذكاء الاصطناعي
 * تجمع كل الخدمات والمكونات الذكية في مكان واحد
 */
export default function AIIntelligenceHub() {
  const [aiEngine] = useState(() => new AIEngine());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AIAnalysisResult[]>([]);
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([]);
  const [recommendations, setRecommendations] = useState<BrokerRecommendation[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<AIPerformanceMetrics | null>(null);

  // تحليل شامل للبيانات
  const performFullAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      // هنا سيتم استدعاء البيانات الفعلية من قاعدة البيانات
      // حالياً نستخدم بيانات تجريبية
      const mockClients: Client[] = [
        {
          id: '1',
          full_name: 'أحمد محمد',
          email: 'ahmed@example.com',
          phone: '+966501234567',
          budget_min: 500000,
          budget_max: 800000,
          preferred_area: ['الرياض', 'جدة'],
          property_type: ['villa', 'apartment'],
          purpose: 'residential',
          area_min: 150,
          area_max: 300,
          bedrooms_min: 3,
          bathrooms_min: 2,
          urgency_level: 4,
          last_contact_date: new Date().toISOString(),
          contact_frequency: 5,
          interaction_score: 8,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'active'
        }
      ];

      const mockProperties: Property[] = [
        {
          id: '1',
          title: 'فيلا فاخرة في الرياض',
          description: 'فيلا حديثة البناء مع حديقة خاصة',
          price: 650000,
          area: 250,
          bedrooms: 4,
          bathrooms: 3,
          property_type: 'villa',
          area_name: 'الرياض',
          city: 'الرياض',
          district: 'النرجس',
          features: ['حديقة خاصة', 'مسبح', 'مطبخ مجهز'],
          images: [],
          status: 'available',
          owner_id: 'owner1',
          listed_date: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          views_count: 45,
          inquiries_count: 12
        }
      ];

      // تحليل شامل
      const results = await Promise.all(
        mockClients.map(client => 
          aiEngine.performFullAnalysis(client, mockProperties)
        )
      );

      setAnalysisResults(results);
      
      // تحليل السوق
      const insights = await aiEngine.analyzeMarketTrends(mockProperties);
      setMarketInsights(insights);

      // التوصيات
      const recs = await aiEngine.generateBrokerRecommendations(mockClients, mockProperties);
      setRecommendations(recs);

      // مقاييس الأداء
      setPerformanceMetrics({
        id: '1',
        date: new Date().toISOString(),
        metrics: {
          total_recommendations: recs.length,
          successful_matches: results.reduce((sum, r) => sum + r.property_matches.length, 0),
          conversion_rate: 75.5,
          response_time_avg: 2.3,
          client_satisfaction_score: 4.2,
          broker_efficiency_score: 3.8
        },
        insights: {
          top_performing_areas: ['الرياض', 'جدة'],
          improvement_opportunities: ['تحسين وقت الاستجابة', 'زيادة معدل التحويل'],
          trend_analysis: 'ارتفاع في الطلب على الفلل في الرياض'
        }
      });

    } catch (error) {
      console.error('خطأ في التحليل:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    // تحليل تلقائي عند تحميل الصفحة
    performFullAnalysis();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* العنوان الرئيسي */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Brain className="h-12 w-12 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">مركز الذكاء الاصطناعي</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          نظام ذكي متكامل لتحليل العملاء والعقارات وتقديم التوصيات المبنية على البيانات
        </p>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">العملاء النشطين</p>
                <p className="text-2xl font-bold">{analysisResults.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Home className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">العقارات المتطابقة</p>
                <p className="text-2xl font-bold">
                  {analysisResults.reduce((sum, r) => sum + r.property_matches.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Lightbulb className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">التوصيات</p>
                <p className="text-2xl font-bold">{recommendations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">معدل التحويل</p>
                <p className="text-2xl font-bold">
                  {performanceMetrics?.metrics.conversion_rate || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات الرئيسية */}
      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="analysis" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>التحليل الشامل</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center space-x-2">
            <Lightbulb className="h-4 w-4" />
            <span>رؤى السوق</span>
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>التوصيات</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>الأداء</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>الإعدادات</span>
          </TabsTrigger>
        </TabsList>

        {/* تبويب التحليل الشامل */}
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>التحليل الشامل للعملاء والعقارات</span>
              </CardTitle>
              <CardDescription>
                تحليل ذكي شامل يجمع بين بيانات العملاء والعقارات لتقديم أفضل التوصيات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={performFullAnalysis} 
                disabled={isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? 'جاري التحليل...' : 'تشغيل التحليل الشامل'}
              </Button>

              {analysisResults.map((result, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold">تحليل العميل #{index + 1}</h4>
                      <Badge variant="secondary">
                        النتيجة: {result.intent_score.overall_score}/5
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">العقارات المتطابقة:</p>
                        <p className="font-medium">{result.property_matches.length} عقار</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">التوصيات:</p>
                        <p className="font-medium">{result.recommendations.length} توصية</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">أفضل الإجراءات:</p>
                        <ul className="list-disc list-inside text-sm">
                          {result.next_best_actions.slice(0, 3).map((action, i) => (
                            <li key={i}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب رؤى السوق */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>رؤى السوق والاتجاهات</span>
              </CardTitle>
              <CardDescription>
                تحليل ذكي لاتجاهات السوق والفرص المتاحة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {marketInsights.map((insight, index) => (
                <Card key={index} className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold">{insight.title}</h4>
                      <Badge variant={
                        insight.insight_type === 'opportunity' ? 'default' :
                        insight.insight_type === 'warning' ? 'destructive' :
                        'secondary'
                      }>
                        {insight.insight_type}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">مستوى الطلب:</p>
                        <Badge variant="outline">{insight.data.demand_level}</Badge>
                      </div>
                      <div>
                        <p className="text-gray-600">مستوى العرض:</p>
                        <Badge variant="outline">{insight.data.supply_level}</Badge>
                      </div>
                      <div>
                        <p className="text-gray-600">اتجاه السعر:</p>
                        <Badge variant="outline">{insight.data.price_trend}</Badge>
                      </div>
                      <div>
                        <p className="text-gray-600">معدل الثقة:</p>
                        <Progress value={insight.confidence_score} className="w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب التوصيات */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>التوصيات الذكية للوسطاء</span>
              </CardTitle>
              <CardDescription>
                توصيات مبنية على الذكاء الاصطناعي لتحسين الأداء وزيادة المبيعات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendations.map((rec, index) => (
                <Card key={index} className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold">{rec.title}</h4>
                      <Badge variant={
                        rec.priority === 'urgent' ? 'destructive' :
                        rec.priority === 'high' ? 'default' :
                        rec.priority === 'medium' ? 'secondary' :
                        'outline'
                      }>
                        {rec.priority}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{rec.message}</p>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">
                        {new Date(rec.created_at).toLocaleDateString('ar-SA')}
                      </span>
                      {rec.action_required && (
                        <Badge variant="destructive">يتطلب إجراء</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الأداء */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>مقاييس الأداء والتحليل</span>
              </CardTitle>
              <CardDescription>
                تحليل شامل لأداء النظام والتحسينات المقترحة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {performanceMetrics && (
                <>
                  {/* المقاييس الأساسية */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {performanceMetrics.metrics.total_recommendations}
                      </p>
                      <p className="text-sm text-gray-600">إجمالي التوصيات</p>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {performanceMetrics.metrics.successful_matches}
                      </p>
                      <p className="text-sm text-gray-600">التطابقات الناجحة</p>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">
                        {performanceMetrics.metrics.conversion_rate}%
                      </p>
                      <p className="text-sm text-gray-600">معدل التحويل</p>
                    </div>
                  </div>

                  {/* الرؤى والتحسينات */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">الرؤى والتحسينات</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">أفضل المناطق أداءً:</p>
                        <div className="flex flex-wrap gap-2">
                          {performanceMetrics.insights.top_performing_areas.map((area, i) => (
                            <Badge key={i} variant="outline">{area}</Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 mb-2">فرص التحسين:</p>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {performanceMetrics.insights.improvement_opportunities.map((opp, i) => (
                            <li key={i} className="text-gray-700">{opp}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الإعدادات */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>إعدادات المحرك الذكي</span>
              </CardTitle>
              <CardDescription>
                تخصيص إعدادات محرك الذكاء الاصطناعي حسب احتياجاتك
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">الحد الأدنى لمعدل التطابق</label>
                  <div className="mt-1">
                    <Progress value={70} className="w-full" />
                    <p className="text-xs text-gray-500 mt-1">70%</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">معدل النية العالية</label>
                  <div className="mt-1">
                    <Progress value={80} className="w-full" />
                    <p className="text-xs text-gray-500 mt-1">4/5</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">أيام المتابعة</label>
                  <div className="mt-1">
                    <Progress value={60} className="w-full" />
                    <p className="text-xs text-gray-500 mt-1">3 أيام</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">تكرار تحليل السوق</label>
                  <div className="mt-1">
                    <Progress value={40} className="w-full" />
                    <p className="text-xs text-gray-500 mt-1">أسبوعياً</p>
                  </div>
                </div>
              </div>
              
              <Button className="w-full">حفظ الإعدادات</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
