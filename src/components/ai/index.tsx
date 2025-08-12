import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '@/hooks/use-toast';
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
  Lightbulb,
  RefreshCw,
  Eye,
  Send,
  MapPin,
  Calendar,
  DollarSign,
  Ruler
} from 'lucide-react';

// استيراد أنواع البيانات
import {
  Client,
  Property,
  PropertyMatch,
  AIAnalysisResult,
  MarketInsight,
  BrokerRecommendation,
  AIPerformanceMetrics
} from '../../types/ai';

// استيراد محرك الذكاء الاصطناعي
import { AIEngine } from '../../services/aiEngine';
import { supabase } from '@/integrations/supabase/client';

// استيراد مكونات الذكاء الاصطناعي
import ClientEvaluation from './ClientEvaluation';
import SmartRecommendations from './SmartRecommendations';
import RecommendationAnalytics from './RecommendationAnalytics';
import AISettingsHub from './AISettingsHub';
import UAEMarketPredictions from './UAEMarketPredictions';
import UAEAIModels from './UAEAIModels';

// تخزين مؤقت للبيانات
const dataCache = {
  clients: null as Client[] | null,
  properties: null as Property[] | null,
  lastFetch: 0,
  cacheExpiry: 5 * 60 * 1000, // 5 دقائق
  currentUser: localStorage.getItem('auth-user') || null, // حفظ حالة المستخدم
};

/**
 * الوحدة الرئيسية للذكاء الاصطناعي
 * تجمع كل الخدمات والمكونات الذكية في مكان واحد
 */
export default function AIIntelligenceHub() {
  const navigate = useNavigate();
  const params = useParams();
  const [aiEngine] = useState(() => new AIEngine());
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AIAnalysisResult[]>([]);
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([]);
  const [recommendations, setRecommendations] = useState<BrokerRecommendation[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<AIPerformanceMetrics | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [dbClients, setDbClients] = useState<Client[]>([]);
  const [dbProperties, setDbProperties] = useState<Property[]>([]);
  const [propertyMatches, setPropertyMatches] = useState<PropertyMatch[]>([]);
  const [activeTab, setActiveTab] = useState('property-recommendation');
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // تعريف وحدات داخلية للمركز تطابق قيم التبويبات لسهولة التحكم والتنقل
  const hubModules: Array<{
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
  }> = [
    { id: 'property-recommendation', title: 'ترشيح العقارات', description: 'مطابقة ذكية للعقارات مع احتياجات العملاء', icon: Target },
    { id: 'client-evaluation', title: 'تقييم العملاء', description: 'قياس الجدية واحتمالية إتمام الصفقة', icon: Users },
    { id: 'smart-recommendations', title: 'توصيات ذكية', description: 'اقتراحات مدعومة بالذكاء الاصطناعي', icon: Lightbulb },
    { id: 'market-analysis', title: 'تحليل السوق', description: 'رؤى واتجاهات السوق الحالية', icon: BarChart3 },
    { id: 'ai-analytics', title: 'تحليلات الذكاء الاصطناعي', description: 'مؤشرات أداء نماذج الذكاء', icon: TrendingUp },
    { id: 'uae-predictions', title: 'تنبؤات السوق الإماراتي', description: 'توقعات مخصصة للسوق الإماراتي', icon: TrendingUp },
    { id: 'ai-models', title: 'إدارة النماذج', description: 'إدارة وتكوين النماذج', icon: Brain },
    { id: 'ai-settings', title: 'إعدادات الذكاء الاصطناعي', description: 'ضبط مصادر البيانات والسياسات', icon: Settings },
  ];

  // التزامن مع عنوان الصفحة: قراءة المعرف من المسار وتحديث التبويب
  useEffect(() => {
    const sub = (params as any)?.sub as string | undefined;
    if (sub && hubModules.some(m => m.id === sub)) {
      setActiveTab(sub);
      // حفظ التبويب النشط في localStorage
      localStorage.setItem('ai-active-tab', sub);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.sub]);

  const handleSelectTab = useCallback((id: string) => {
    setActiveTab(id);
    // حفظ التبويب النشط في localStorage
    localStorage.setItem('ai-active-tab', id);
    navigate(`/ai-intelligence-hub/${id}`);
  }, [navigate]);

  // استعادة التبويب النشط من localStorage عند بدء المكون
  useEffect(() => {
    const savedTab = localStorage.getItem('ai-active-tab');
    if (savedTab && hubModules.some(m => m.id === savedTab)) {
      setActiveTab(savedTab);
    }
  }, [hubModules]);

  // تحويل عميل CRM إلى نموذج AI Client
  const mapCrmClientToAIClient = useCallback((c: any): Client => {
    const mapPropertyType = (val?: string): Client['property_type'] => {
      const normalized = (val || '').toLowerCase();
      if (normalized.includes('villa') || normalized.includes('فيلا')) return ['villa'];
      if (normalized.includes('apartment') || normalized.includes('شقة')) return ['apartment'];
      if (normalized.includes('office') || normalized.includes('مكتب')) return ['office'];
      if (normalized.includes('warehouse') || normalized.includes('مستودع')) return ['warehouse'];
      if (normalized.includes('shop') || normalized.includes('محل')) return ['shop'];
      if (normalized.includes('building') || normalized.includes('مبنى')) return ['building'];
      if (normalized.includes('land') || normalized.includes('أرض')) return ['land'];
      return ['apartment'];
    };

    const mapPurpose = (val?: string): Client['purpose'] => {
      const normalized = (val || '').toLowerCase();
      if (normalized.includes('invest')) return 'investment';
      if (normalized.includes('both') || normalized.includes('كلا')) return 'both';
      return 'residential';
    };

    const status: Client['status'] = 'active';

    return {
      id: c.id,
      full_name: c.name || c.full_name || 'Client',
      email: c.email,
      phone: c.phone,
      budget_min: typeof c.budget_min === 'number' ? c.budget_min : 0,
      budget_max: typeof c.budget_max === 'number' ? c.budget_max : 0,
      preferred_area: c.preferred_location ? [c.preferred_location] : [],
      property_type: mapPropertyType(c.property_type_interest),
      purpose: mapPurpose(c.purchase_purpose),
      area_min: undefined,
      area_max: undefined,
      bedrooms_min: undefined,
      bathrooms_min: undefined,
      urgency_level: 3,
      last_contact_date: c.last_contacted || c.updated_at || c.created_at || new Date().toISOString(),
      contact_frequency: c.previous_deals_count || 0,
      interaction_score: 0.6,
      created_at: c.created_at || new Date().toISOString(),
      updated_at: c.updated_at || new Date().toISOString(),
      assigned_broker_id: c.assigned_to,
      status,
    };
  }, []);

  // تحويل عقار CRM إلى نموذج AI Property
  const mapCrmPropertyToAIProperty = useCallback((p: any): Property => {
    const mapPropertyType = (val?: string): Property['property_type'] => {
      const normalized = (val || '').toLowerCase();
      if (normalized.includes('villa') || normalized.includes('فيلا')) return 'villa';
      if (normalized.includes('apartment') || normalized.includes('شقة')) return 'apartment';
      if (normalized.includes('office') || normalized.includes('مكتب')) return 'office';
      if (normalized.includes('warehouse') || normalized.includes('مستودع')) return 'warehouse';
      if (normalized.includes('shop') || normalized.includes('محل')) return 'shop';
      if (normalized.includes('building') || normalized.includes('مبنى')) return 'building';
      if (normalized.includes('land') || normalized.includes('أرض')) return 'land';
      return 'apartment';
    };

    const mapStatus = (val?: string): Property['status'] => {
      const normalized = (val || '').toLowerCase();
      if (normalized.includes('sold') || normalized.includes('مباع')) return 'sold';
      if (normalized.includes('rented') || normalized.includes('مؤجر')) return 'rented';
      if (normalized.includes('under_contract') || normalized.includes('عقد')) return 'under_contract';
      return 'available';
    };

    return {
      id: p.id,
      title: p.title || p.property_name || `عقار #${p.id}`,
      description: p.description || p.notes || 'لا يوجد وصف متاح',
      price: typeof p.price === 'number' ? p.price : (typeof p.asking_price === 'number' ? p.asking_price : 0),
      area: typeof p.area === 'number' ? p.area : (typeof p.square_feet === 'number' ? p.square_feet : 0),
      bedrooms: typeof p.bedrooms === 'number' ? p.bedrooms : 0,
      bathrooms: typeof p.bathrooms === 'number' ? p.bathrooms : 0,
      property_type: mapPropertyType(p.property_type),
      area_name: p.area_name || p.location || p.neighborhood || 'غير محدد',
      city: p.city || p.city_name || 'غير محدد',
      district: p.district || p.area || 'غير محدد',
      features: p.features ? (Array.isArray(p.features) ? p.features : [p.features]) : [],
      images: p.images ? (Array.isArray(p.images) ? p.images : [p.images]) : [],
      status: mapStatus(p.status),
      owner_id: p.owner_id || p.created_by || '',
      listed_date: p.listed_date || p.created_at || new Date().toISOString(),
      last_updated: p.last_updated || p.updated_at || p.created_at || new Date().toISOString(),
      views_count: typeof p.views_count === 'number' ? p.views_count : 0,
      inquiries_count: typeof p.inquiries_count === 'number' ? p.inquiries_count : 0,
      ai_score: typeof p.ai_score === 'number' ? p.ai_score : undefined,
    };
  }, []);

  // جلب بيانات حقيقية من Supabase مع تخزين مؤقت
  const fetchData = useCallback(async (forceRefresh = false) => {
    // التحقق من التخزين المؤقت
    const now = Date.now();
    if (!forceRefresh && 
        dataCache.clients && 
        dataCache.properties && 
        (now - dataCache.lastFetch) < dataCache.cacheExpiry) {
      setDbClients(dataCache.clients);
      setDbProperties(dataCache.properties);
      setIsDataLoaded(true);
      return;
    }

    try {
      const [clientsRes, propertiesRes] = await Promise.all([
        supabase.from('clients').select('*').order('updated_at', { ascending: false }),
        supabase.from('crm_properties').select('*').order('last_updated', { ascending: false })
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (propertiesRes.error) throw propertiesRes.error;

      const clients = (clientsRes.data || []).map(mapCrmClientToAIClient) as Client[];
      const properties = (propertiesRes.data || []).map(mapCrmPropertyToAIProperty) as Property[];

      // تحديث التخزين المؤقت
      dataCache.clients = clients;
      dataCache.properties = properties;
      dataCache.lastFetch = now;

      setDbClients(clients);
      setDbProperties(properties);
      setIsDataLoaded(true);
    } catch (err) {
      console.error('فشل تحميل بيانات العملاء/العقارات من Supabase:', err);
      setIsDataLoaded(false);
    }
  }, [mapCrmClientToAIClient, mapCrmPropertyToAIProperty]);

  // تحميل البيانات عند بدء المكون
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // تحليل شامل للبيانات
  const performFullAnalysis = useCallback(async () => {
    if (!isDataLoaded || dbClients.length === 0 || dbProperties.length === 0) {
      return;
    }

    setIsAnalyzing(true);
    try {
      const clients = dbClients;
      const properties = dbProperties;

      // تحليل شامل
      const results = await Promise.all(
        clients.map(client => aiEngine.performFullAnalysis(client, properties))
      );

      setAnalysisResults(results);
      
      // تحليل السوق
      const insights = await aiEngine.analyzeMarketTrends(properties);
      setMarketInsights(insights);

      // التوصيات
      const recs = await aiEngine.generateBrokerRecommendations(clients, properties);
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
  }, [aiEngine, dbClients, dbProperties, isDataLoaded]);

  // إعادة تحليل العميل المحدد
  const reanalyzeClient = useCallback(async (client: Client) => {
    setIsAnalyzing(true);
    try {
      const result = await aiEngine.performFullAnalysis(client, dbProperties);
      setAnalysisResults(prev => prev.map(r => r.client_id === client.id ? result : r));
      setSelectedClient(client);
      // تحديث نتائج التطابق للعقارات
      const matches = await aiEngine.findPropertyMatches(client, dbProperties);
      setPropertyMatches(matches);
    } catch (error) {
      console.error('خطأ في إعادة التحليل:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [aiEngine, dbProperties]);

  // حساب التطابقات عند اختيار عميل
  useEffect(() => {
    const computeMatches = async () => {
      if (selectedClient && dbProperties.length > 0) {
        const matches = await aiEngine.findPropertyMatches(selectedClient, dbProperties);
        setPropertyMatches(matches);
      } else {
        setPropertyMatches([]);
      }
    };
    computeMatches();
  }, [selectedClient, dbProperties, aiEngine]);

  // تشغيل التحليل عند توفر البيانات
  useEffect(() => {
    if (isDataLoaded && dbClients.length > 0 && dbProperties.length > 0) {
      performFullAnalysis();
    }
  }, [isDataLoaded, dbClients.length, dbProperties.length, performFullAnalysis]);

  // تشغيل ترشيح العقارات تلقائياً عند إضافة عميل جديد في CRM (Realtime)
  useEffect(() => {
    // لا يمكن الاشتراك بدون خصائص متاحة للمطابقة
    if (!isDataLoaded || !dbProperties || dbProperties.length === 0) return;

    const channel = supabase
      .channel('realtime-clients-ai')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clients' }, async (payload) => {
        try {
          const newClient = mapCrmClientToAIClient(payload.new);
          setDbClients((prev) => [newClient, ...prev]);

          // تحديث التخزين المؤقت
          if (dataCache.clients) {
            dataCache.clients = [newClient, ...dataCache.clients];
          }

          // اجعل العميل الجديد هو المختار وقم بحساب التطابق فوراً
          setSelectedClient(newClient);

          const matches = await aiEngine.findPropertyMatches(newClient, dbProperties);
          setPropertyMatches(matches);

          const recs = await aiEngine.generateBrokerRecommendations([newClient], dbProperties);
          setRecommendations((prev) => [...recs, ...prev]);

          toast({
            title: 'تم إضافة عميل جديد',
            description: `تم توليد ترشيحات العقارات تلقائياً للعميل ${newClient.full_name}.`,
          });
        } catch (err) {
          console.error('Realtime client insert handling error:', err);
        }
      })
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch { /* no-op */ }
    };
  }, [dbProperties, aiEngine, mapCrmClientToAIClient, toast, isDataLoaded]);

  // تحديث البيانات يدوياً
  const refreshData = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // تنظيف التخزين المؤقت عند تسجيل الخروج
  const clearCache = useCallback(() => {
    dataCache.clients = null;
    dataCache.properties = null;
    dataCache.lastFetch = 0;
    localStorage.removeItem('ai-selected-client');
    localStorage.removeItem('ai-analysis-results');
    localStorage.removeItem('ai-recommendations');
    localStorage.removeItem('ai-property-matches');
    localStorage.removeItem('ai-market-insights');
    localStorage.removeItem('ai-performance-metrics');
    localStorage.removeItem('ai-active-tab');
  }, []);

  // تنظيف التخزين المؤقت عند إغلاق الصفحة
  useEffect(() => {
    const handleBeforeUnload = () => {
      // لا نحذف التخزين المؤقت عند إغلاق الصفحة، فقط عند تسجيل الخروج
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // تنظيف التخزين المؤقت عند تسجيل الخروج
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth-session' && !e.newValue) {
        // تم تسجيل الخروج، امسح التخزين المؤقت
        clearCache();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [clearCache]);

  // تنظيف التخزين المؤقت عند تغيير المستخدم
  useEffect(() => {
    const handleUserChange = () => {
      // إذا تغير المستخدم، امسح التخزين المؤقت
      clearCache();
    };

    // استمع لتغييرات في localStorage
    const checkUserChange = setInterval(() => {
      const currentUser = localStorage.getItem('auth-user');
      if (currentUser !== dataCache.currentUser) {
        dataCache.currentUser = currentUser;
        handleUserChange();
      }
    }, 1000);

    return () => clearInterval(checkUserChange);
  }, [clearCache]);

  // تنظيف التخزين المؤقت عند تغيير الصفحة
  useEffect(() => {
    const handleRouteChange = () => {
      // إذا تغيرت الصفحة، احفظ الحالة الحالية
      if (selectedClient) {
        localStorage.setItem('ai-selected-client', JSON.stringify(selectedClient));
      }
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [selectedClient]);

  // تنظيف التخزين المؤقت عند تغيير البيانات
  useEffect(() => {
    const handleDataChange = () => {
      // إذا تغيرت البيانات، امسح التخزين المؤقت
      if (dbClients.length > 0 || dbProperties.length > 0) {
        dataCache.lastFetch = Date.now();
      }
    };

    // استمع لتغييرات في البيانات
    handleDataChange();
  }, [dbClients.length, dbProperties.length]);

  // حفظ الحالة في localStorage
  useEffect(() => {
    if (selectedClient) {
      localStorage.setItem('ai-selected-client', JSON.stringify(selectedClient));
    }
  }, [selectedClient]);

  // حفظ نتائج التحليل في localStorage
  useEffect(() => {
    if (analysisResults.length > 0) {
      localStorage.setItem('ai-analysis-results', JSON.stringify(analysisResults));
    }
  }, [analysisResults]);

  // حفظ التوصيات في localStorage
  useEffect(() => {
    if (recommendations.length > 0) {
      localStorage.setItem('ai-recommendations', JSON.stringify(recommendations));
    }
  }, [recommendations]);

  // حفظ التطابقات في localStorage
  useEffect(() => {
    if (propertyMatches.length > 0) {
      localStorage.setItem('ai-property-matches', JSON.stringify(propertyMatches));
    }
  }, [propertyMatches]);

  // حفظ رؤى السوق في localStorage
  useEffect(() => {
    if (marketInsights.length > 0) {
      localStorage.setItem('ai-market-insights', JSON.stringify(marketInsights));
    }
  }, [marketInsights]);

  // حفظ مؤشرات الأداء في localStorage
  useEffect(() => {
    if (performanceMetrics) {
      localStorage.setItem('ai-performance-metrics', JSON.stringify(performanceMetrics));
    }
  }, [performanceMetrics]);

  // استعادة الحالة من localStorage
  useEffect(() => {
    const savedClient = localStorage.getItem('ai-selected-client');
    if (savedClient && isDataLoaded) {
      try {
        const client = JSON.parse(savedClient);
        // التحقق من أن العميل لا يزال موجوداً في البيانات الحالية
        if (dbClients.find(c => c.id === client.id)) {
          setSelectedClient(client);
        }
      } catch (error) {
        console.error('خطأ في استعادة العميل المحفوظ:', error);
      }
    }

    // استعادة نتائج التحليل
    const savedAnalysis = localStorage.getItem('ai-analysis-results');
    if (savedAnalysis) {
      try {
        const analysis = JSON.parse(savedAnalysis);
        setAnalysisResults(analysis);
      } catch (error) {
        console.error('خطأ في استعادة نتائج التحليل:', error);
      }
    }

    // استعادة التوصيات
    const savedRecommendations = localStorage.getItem('ai-recommendations');
    if (savedRecommendations) {
      try {
        const recs = JSON.parse(savedRecommendations);
        setRecommendations(recs);
      } catch (error) {
        console.error('خطأ في استعادة التوصيات:', error);
      }
    }

    // استعادة التطابقات
    const savedMatches = localStorage.getItem('ai-property-matches');
    if (savedMatches) {
      try {
        const matches = JSON.parse(savedMatches);
        setPropertyMatches(matches);
      } catch (error) {
        console.error('خطأ في استعادة التطابقات:', error);
      }
    }

    // استعادة رؤى السوق
    const savedInsights = localStorage.getItem('ai-market-insights');
    if (savedInsights) {
      try {
        const insights = JSON.parse(savedInsights);
        setMarketInsights(insights);
      } catch (error) {
        console.error('خطأ في استعادة رؤى السوق:', error);
      }
    }

    // استعادة مؤشرات الأداء
    const savedMetrics = localStorage.getItem('ai-performance-metrics');
    if (savedMetrics) {
      try {
        const metrics = JSON.parse(savedMetrics);
        setPerformanceMetrics(metrics);
      } catch (error) {
        console.error('خطأ في استعادة مؤشرات الأداء:', error);
      }
    }
  }, [isDataLoaded, dbClients]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* العنوان الرئيسي */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3 space-x-reverse">
          <Brain className="h-12 w-12 text-purple-600" />
          <h1 className="text-4xl font-bold text-gray-900">محرك الذكاء الاصطناعي</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          نظام ذكي لتحليل البيانات وتقديم التوصيات لزيادة كفاءة المبيعات
        </p>
        
        {/* شريط الأدوات */}
        <div className="flex items-center justify-center space-x-4 space-x-reverse">
          <Button
            onClick={refreshData}
            disabled={isAnalyzing}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2 space-x-reverse"
          >
            <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>تحديث البيانات</span>
          </Button>
          
          <Button
            onClick={clearCache}
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <span>مسح التخزين المؤقت</span>
          </Button>
          
          {isDataLoaded && (
            <Badge variant="secondary" className="text-xs">
              آخر تحديث: {new Date(dataCache.lastFetch).toLocaleTimeString('ar-SA')}
            </Badge>
          )}
        </div>
      </div>

      {/* الوحدات الداخلية - شبكة كروت للتحكم السريع */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {hubModules.map(({ id, title, description, icon: Icon }) => (
          <Card
            key={id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              activeTab === id ? 'ring-2 ring-purple-500 border-purple-200' : 'hover:border-purple-300'
            }`}
            onClick={() => handleSelectTab(id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{title}</h3>
                  <p className="text-xs text-gray-600 mt-1">{description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* شريط التنقل العلوي */}
      <Tabs value={activeTab} onValueChange={handleSelectTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-8 bg-white border border-gray-200 rounded-lg p-1">
          <TabsTrigger 
            value="property-recommendation" 
            className="flex items-center space-x-2 space-x-reverse data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
          >
            <Target className="h-4 w-4" />
            <span>ترشيح العقارات</span>
          </TabsTrigger>
          <TabsTrigger 
            value="client-evaluation" 
            className="flex items-center space-x-2 space-x-reverse data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
          >
            <Users className="h-4 w-4" />
            <span>تقييم العملاء</span>
          </TabsTrigger>
          <TabsTrigger 
            value="smart-recommendations" 
            className="flex items-center space-x-2 space-x-reverse data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
          >
            <Lightbulb className="h-4 w-4" />
            <span>توصيات ذكية</span>
          </TabsTrigger>
          <TabsTrigger 
            value="market-analysis" 
            className="flex items-center space-x-2 space-x-reverse data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
          >
            <BarChart3 className="h-4 w-4" />
            <span>تحليل السوق</span>
          </TabsTrigger>
          <TabsTrigger 
            value="ai-analytics" 
            className="flex items-center space-x-2 space-x-reverse data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
          >
            <TrendingUp className="h-4 w-4" />
            <span>تحليلات الذكاء الاصطناعي</span>
          </TabsTrigger>
          <TabsTrigger 
            value="uae-predictions" 
            className="flex items-center space-x-2 space-x-reverse data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
          >
            <TrendingUp className="h-4 w-4" />
            <span>تنبؤات السوق الإماراتي</span>
          </TabsTrigger>
          <TabsTrigger 
            value="ai-models" 
            className="flex items-center space-x-2 space-x-reverse data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
          >
            <Brain className="h-4 w-4" />
            <span>إدارة النماذج</span>
          </TabsTrigger>
          <TabsTrigger 
            value="ai-settings" 
            className="flex items-center space-x-2 space-x-reverse data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
          >
            <Settings className="h-4 w-4" />
            <span>إعدادات الذكاء الاصطناعي</span>
          </TabsTrigger>
        </TabsList>

        {/* تبويب ترشيح العقارات */}
        <TabsContent value="property-recommendation" className="space-y-6">
          {/* البانر الرئيسي */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl p-8 text-white">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Target className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">محرك ترشيح العقارات</h2>
                <p className="text-purple-100 text-lg">
                  مطابقة ذكية للعقارات مع احتياجات العملاء باستخدام الذكاء الاصطناعي
                </p>
              </div>
            </div>
          </div>

          {/* اختيار العميل */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <h3 className="text-xl font-semibold text-gray-800">
                اختر العميل لتحليل العقارات المناسبة
              </h3>
              <div className="w-full md:w-80">
                <Select onValueChange={(val) => {
                  const c = dbClients.find((cl) => cl.id === val);
                  if (c) setSelectedClient(c);
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر عميل من القائمة" />
                  </SelectTrigger>
                  <SelectContent>
                    {dbClients.length === 0 ? (
                      <SelectItem value="none" disabled>
                        لا يوجد عملاء — انتقل إلى إدارة العملاء لإضافة عميل
                      </SelectItem>
                    ) : (
                      dbClients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.full_name} • {c.phone || ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* شبكة بطاقات العملاء لسهولة الاختيار البصري */}
            {dbClients.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dbClients.map((client) => (
                  <Card 
                    key={client.id} 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      selectedClient?.id === client.id 
                        ? 'ring-2 ring-purple-500 border-purple-200' 
                        : 'hover:border-purple-300'
                    }`}
                    onClick={() => setSelectedClient(client)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center">
                          <span className="text-purple-700 font-bold text-lg">
                            {client.full_name.charAt(0)}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {client.urgency_level === 5 ? 'عالي جداً' : 
                           client.urgency_level === 4 ? 'عالي' : 
                           client.urgency_level === 3 ? 'متوسط' : 'منخفض'}
                        </Badge>
                      </div>
                      
                      <h4 className="font-semibold text-gray-900 mb-2">{client.full_name}</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {client.property_type[0]}{client.preferred_area[0] ? ` في ${client.preferred_area[0]}` : ''}
                      </p>
                      <p className="text-sm text-gray-600">
                        {client.budget_min.toLocaleString()} د.إ. - {client.budget_max.toLocaleString()} د.إ.
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="p-4 border rounded-lg bg-gray-50 text-gray-600">
                لا يوجد عملاء للعرض هنا. انتقل إلى إدارة العملاء لإضافة عميل جديد من قائمة CRM.
              </div>
            )}
          </div>

          {/* نتائج التحليل */}
          {selectedClient && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  نتائج التحليل الذكي للعميل: {selectedClient.full_name}
                </h3>
                <Button 
                  onClick={() => reanalyzeClient(selectedClient)}
                  disabled={isAnalyzing}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <RefreshCw className={`h-4 w-4 ml-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  إعادة التحليل
                </Button>
              </div>

              {/* ملخص احتياجات العميل */}
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-purple-800 mb-4">ملخص احتياجات العميل</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-purple-600">النوع</p>
                      <p className="font-medium text-purple-800">{selectedClient.property_type[0]}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-purple-600">المنطقة</p>
                      <p className="font-medium text-purple-800">{selectedClient.preferred_area[0]}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-purple-600">الميزانية</p>
                      <p className="font-medium text-purple-800">
                        {selectedClient.budget_min.toLocaleString()} - {selectedClient.budget_max.toLocaleString()} د.إ
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-purple-600">التوقيت</p>
                      <p className="font-medium text-purple-800">1-3 أشهر</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* العقارات المطابقة */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-800">
                  العقارات المطابقة (1)
                </h4>
                <p className="text-sm text-gray-600">مرتبة حسب درجة التوافق</p>
                
                <div className="space-y-4">
              {propertyMatches.map((match) => (
                    <Card key={match.property.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4 space-x-reverse">
                          {/* صورة العقار */}
                          <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0">
                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                              <Home className="h-8 w-8 text-white" />
                            </div>
                          </div>
                          
                          {/* تفاصيل العقار */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between">
                              <h5 className="text-lg font-semibold text-gray-900">
                                #{match.property.id} {match.property.title}
                              </h5>
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                {match.match_score}% توافق
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <DollarSign className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-600">السعر:</span>
                                <span className="font-medium">{match.property.price.toLocaleString()} د.إ.</span>
                              </div>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <Ruler className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-600">المساحة:</span>
                                <span className="font-medium">{match.property.area.toLocaleString()} قدم²</span>
                              </div>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <MapPin className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-600">المنطقة:</span>
                                <span className="font-medium">{match.property.area_name}</span>
                              </div>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-600">تاريخ الإدراج:</span>
                                <span className="font-medium">
                                  {new Date(match.property.listed_date).toLocaleDateString('ar-SA')}
                                </span>
                              </div>
                            </div>
                            
                            {/* أسباب التوافق */}
                            <div>
                              <p className="text-sm text-gray-600 mb-2">أسباب التوافق:</p>
                              <div className="flex flex-wrap gap-2">
                                {match.match_reasons.slice(0,4).map((reason, idx) => (
                                  <Badge key={idx} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    {reason}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            {/* إحصائيات التفاعل */}
                            <div className="flex items-center space-x-6 space-x-reverse text-sm text-gray-500">
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <Eye className="h-4 w-4" />
                                <span>{match.property.views_count} مشاهدة</span>
                              </div>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <MessageSquare className="h-4 w-4" />
                                <span>{match.property.inquiries_count} استفسار</span>
                              </div>
                            </div>
                            
                            {/* أزرار الإجراءات */}
                            <div className="flex space-x-3 space-x-reverse pt-2">
                              <Button variant="outline" className="flex-1">
                                عرض التفاصيل
                              </Button>
                              <Button className="flex-1 bg-purple-600 hover:bg-purple-700">
                                <Send className="h-4 w-4 ml-2" />
                                إرسال للعميل
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* تبويب تقييم العملاء */}
        <TabsContent value="client-evaluation" className="space-y-4">
          <ClientEvaluation />
        </TabsContent>

        {/* تبويب التوصيات الذكية */}
        <TabsContent value="smart-recommendations" className="space-y-4">
          <SmartRecommendations 
            recommendations={recommendations}
            clients={dbClients}
            properties={dbProperties}
          />
        </TabsContent>

        {/* تبويب تحليل السوق */}
        <TabsContent value="market-analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>رؤى السوق والاتجاهات</span>
              </CardTitle>
              <CardDescription>
                تحليل ذكي لاتجاهات السوق والفرص المتاحة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {marketInsights.slice(0, 2).map((insight, index) => (
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

        {/* تبويب تحليلات الذكاء الاصطناعي */}
        <TabsContent value="ai-analytics" className="space-y-4">
          <RecommendationAnalytics />
        </TabsContent>

        {/* تبويب تنبؤات السوق الإماراتي */}
        <TabsContent value="uae-predictions" className="space-y-4">
          <UAEMarketPredictions />
        </TabsContent>

        {/* تبويب إدارة النماذج */}
        <TabsContent value="ai-models" className="space-y-4">
          <UAEAIModels />
        </TabsContent>

        {/* تبويب الإعدادات */}
        <TabsContent value="ai-settings" className="space-y-4">
          <AISettingsHub />
        </TabsContent>
      </Tabs>
    </div>
  );
}
