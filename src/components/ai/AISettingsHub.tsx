import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { aiSettingsService, AISettingsConfig } from '@/services/aiSettingsService';
import UAEMarketSettings from './UAEMarketSettings';
import { 
  Settings,
  Brain,
  MessageSquare,
  Target,
  TrendingUp,
  Users,
  Bell,
  Shield,
  Database,
  Zap,
  RefreshCw,
  Save,
  Download,
  Upload,
  MapPin,
  Building,
  DollarSign,
  Clock,
  Globe,
  Languages,
  Phone,
  Mail,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  Info,
  Eye,
  EyeOff,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Layers,
  Filter,
  Search,
  Star,
  Heart,
  ThumbsUp,
  Lightbulb,
  Cog,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Wrench,
  Gauge,
  Maximize,
  Minimize,
  RotateCcw,
  Home,
  Car,
  Trees,
  Briefcase,
  ShoppingBag
} from 'lucide-react';

// أنواع البيانات للإعدادات
interface AIConfiguration {
  general: {
    enabled: boolean;
    language: 'ar' | 'en' | 'both';
    responseDelay: number;
    maxResponseLength: number;
    learningMode: boolean;
    autoUpdate: boolean;
    debugMode: boolean;
  };
  propertyMatching: {
    enabled: boolean;
    accuracyThreshold: number;
    maxRecommendations: number;
    prioritizeNewProperties: boolean;
    considerBudgetFlexibility: number;
    includeNearbyAreas: boolean;
    weightByClientHistory: boolean;
    useMarketTrends: boolean;
  };
  clientAnalysis: {
    enabled: boolean;
    urgencyCalculation: 'basic' | 'advanced' | 'ml_based';
    intentRecognition: boolean;
    sentimentAnalysis: boolean;
    behaviorPrediction: boolean;
    responseTimeTracking: boolean;
    satisfactionMonitoring: boolean;
  };
  marketInsights: {
    enabled: boolean;
    updateFrequency: number;
    priceAnalysis: boolean;
    demandForecasting: boolean;
    competitorAnalysis: boolean;
    trendPrediction: boolean;
    seasonalAdjustments: boolean;
    economicFactors: boolean;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
    push: boolean;
    priorityFilter: 'all' | 'high' | 'urgent';
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
    frequency: 'instant' | 'hourly' | 'daily';
  };
  uaeSpecific: {
    enabled: boolean;
    ajmanFocus: boolean;
    arabicPriority: boolean;
    localHolidays: boolean;
    prayerTimesIntegration: boolean;
    weekendAdjustment: boolean;
    culturalSensitivity: boolean;
    localRegulations: boolean;
    emiratiClientPreference: boolean;
  };
  integrations: {
    dubizzle: boolean;
    bayut: boolean;
    propertyfinder: boolean;
    whatsappBusiness: boolean;
    googleMaps: boolean;
    dubairedcalendar: boolean;
    bankingAPIs: boolean;
  };
  security: {
    dataEncryption: boolean;
    accessLogs: boolean;
    adminApprovalRequired: boolean;
    sessionTimeout: number;
    twoFactorAuth: boolean;
    ipWhitelist: string[];
    auditTrail: boolean;
  };
  performance: {
    cacheEnabled: boolean;
    cacheLifetime: number;
    maxConcurrentRequests: number;
    responseTimeTarget: number;
    memoryLimit: number;
    autoOptimization: boolean;
    loadBalancing: boolean;
  };
}

// الإعدادات الافتراضية
const defaultConfig: AIConfiguration = {
  general: {
    enabled: true,
    language: 'both',
    responseDelay: 1500,
    maxResponseLength: 500,
    learningMode: true,
    autoUpdate: true,
    debugMode: false
  },
  propertyMatching: {
    enabled: true,
    accuracyThreshold: 75,
    maxRecommendations: 5,
    prioritizeNewProperties: true,
    considerBudgetFlexibility: 15,
    includeNearbyAreas: true,
    weightByClientHistory: true,
    useMarketTrends: true
  },
  clientAnalysis: {
    enabled: true,
    urgencyCalculation: 'advanced',
    intentRecognition: true,
    sentimentAnalysis: true,
    behaviorPrediction: true,
    responseTimeTracking: true,
    satisfactionMonitoring: true
  },
  marketInsights: {
    enabled: true,
    updateFrequency: 6,
    priceAnalysis: true,
    demandForecasting: true,
    competitorAnalysis: false,
    trendPrediction: true,
    seasonalAdjustments: true,
    economicFactors: true
  },
  notifications: {
    email: true,
    sms: false,
    whatsapp: true,
    push: true,
    priorityFilter: 'high',
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '07:00'
    },
    frequency: 'hourly'
  },
  uaeSpecific: {
    enabled: true,
    ajmanFocus: true,
    arabicPriority: true,
    localHolidays: true,
    prayerTimesIntegration: true,
    weekendAdjustment: true,
    culturalSensitivity: true,
    localRegulations: true,
    emiratiClientPreference: true
  },
  integrations: {
    dubizzle: true,
    bayut: true,
    propertyfinder: false,
    whatsappBusiness: true,
    googleMaps: true,
    dubairedcalendar: true,
    bankingAPIs: false
  },
  security: {
    dataEncryption: true,
    accessLogs: true,
    adminApprovalRequired: false,
    sessionTimeout: 60,
    twoFactorAuth: false,
    ipWhitelist: [],
    auditTrail: true
  },
  performance: {
    cacheEnabled: true,
    cacheLifetime: 300,
    maxConcurrentRequests: 50,
    responseTimeTarget: 2000,
    memoryLimit: 512,
    autoOptimization: true,
    loadBalancing: false
  }
};

// بيانات المناطق في الإمارات/عجمان
const ajmanAreas = [
  'مدينة عجمان',
  'الراشدية',
  'النعيمية',
  'الحميدية',
  'الجرف',
  'مشيرف',
  'الكورنيش',
  'الصوان',
  'المنطقة الحرة',
  'مدينة الاتحاد'
];

const uaeAreas = [
  'دبي مارينا',
  'وسط دبي',
  'الشارقة',
  'أبوظبي',
  'رأس الخيمة',
  'الفجيرة',
  'أم القيوين'
];

const propertyTypes = [
  { id: 'apartment', name: 'شقة', icon: Building },
  { id: 'villa', name: 'فيلا', icon: Home },
  { id: 'land', name: 'أرض', icon: Trees },
  { id: 'office', name: 'مكتب', icon: Briefcase },
  { id: 'shop', name: 'محل تجاري', icon: ShoppingBag },
  { id: 'parking', name: 'موقف سيارة', icon: Car }
];

export default function AISettingsHub() {
  const [config, setConfig] = useState<AIConfiguration | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [isTestingConnections, setIsTestingConnections] = useState(false);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const { toast } = useToast();

  // تحميل الإعدادات عند بدء التشغيل
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        
        // تحميل الإعدادات من الخدمة
        const settings = aiSettingsService.getSettings();
        
        // تحويل إعدادات الخدمة إلى تنسيق المكون
        const uiConfig: AIConfiguration = {
          general: settings.general,
          propertyMatching: settings.propertyMatching,
          clientAnalysis: settings.clientAnalysis,
          marketInsights: settings.marketInsights,
          notifications: settings.notifications,
          uaeSpecific: settings.uaeSpecific,
          integrations: {
            dubizzle: settings.integrations.dubizzle.enabled,
            bayut: settings.integrations.bayut.enabled,
            propertyfinder: settings.integrations.propertyfinder.enabled,
            whatsappBusiness: settings.integrations.whatsappBusiness.enabled,
            googleMaps: settings.integrations.googleMaps.enabled,
            dubairedcalendar: false, // Legacy field
            bankingAPIs: settings.integrations.bankingAPIs.enabled
          },
          security: settings.security,
          performance: settings.performance
        };
        
        setConfig(uiConfig);
        setSystemStatus(aiSettingsService.getSystemStatus());
        
        // إضافة مستمع للتغييرات
        aiSettingsService.addListener('ai-settings-hub', (newSettings) => {
          setSystemStatus(aiSettingsService.getSystemStatus());
        });
        
      } catch (error) {
        console.error('خطأ في تحميل الإعدادات:', error);
        toast({
          title: "خطأ",
          description: "فشل في تحميل إعدادات الذكاء الاصطناعي",
          variant: "destructive",
        });
        setConfig(defaultConfig); // استخدام الإعدادات الافتراضية
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();

    return () => {
      aiSettingsService.removeListener('ai-settings-hub');
    };
  }, [toast]);

  // حفظ الإعدادات
  const saveConfiguration = async () => {
    if (!config) return;
    
    setIsSaving(true);
    try {
      // تحويل تنسيق المكون إلى تنسيق الخدمة
      const serviceSettings: Partial<AISettingsConfig> = {
        general: config.general,
        propertyMatching: config.propertyMatching,
        clientAnalysis: config.clientAnalysis,
        marketInsights: config.marketInsights,
        notifications: config.notifications,
        uaeSpecific: config.uaeSpecific,
        integrations: {
          dubizzle: {
            enabled: config.integrations.dubizzle,
            syncFrequency: 24,
            autoImport: false
          },
          bayut: {
            enabled: config.integrations.bayut,
            syncFrequency: 24,
            autoImport: false
          },
          propertyfinder: {
            enabled: config.integrations.propertyfinder,
            syncFrequency: 24,
            autoImport: false
          },
          whatsappBusiness: {
            enabled: config.integrations.whatsappBusiness,
            autoReply: true
          },
          googleMaps: {
            enabled: config.integrations.googleMaps,
            defaultZoom: 13
          },
          bankingAPIs: {
            enabled: config.integrations.bankingAPIs,
            supportedBanks: ['ADCB', 'Emirates NBD', 'FAB'],
            mortgageCalculation: false
          },
          crmSystems: {
            enabled: false,
            syncBidirectional: false
          }
        },
        security: config.security,
        performance: config.performance
      };
      
      await aiSettingsService.saveSettings(serviceSettings);
      setLastSaved(new Date());
      setSystemStatus(aiSettingsService.getSystemStatus());
      
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات الذكاء الاصطناعي بنجاح",
      });
      
      console.log('تم حفظ الإعدادات:', config);
    } catch (error) {
      console.error('خطأ في حفظ الإعدادات:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإعدادات",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // تصدير الإعدادات
  const exportConfiguration = () => {
    if (!config) return;
    
    try {
      const dataStr = aiSettingsService.exportSettings();
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-settings-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setShowExportDialog(false);
      
      toast({
        title: "تم التصدير",
        description: "تم تصدير الإعدادات بنجاح",
      });
    } catch (error) {
      console.error('خطأ في تصدير الإعدادات:', error);
      toast({
        title: "خطأ",
        description: "فشل في تصدير الإعدادات",
        variant: "destructive",
      });
    }
  };

  // استيراد الإعدادات
  const importConfiguration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const settingsJSON = e.target?.result as string;
          await aiSettingsService.importSettings(settingsJSON);
          
          // تحديث واجهة المستخدم
          const newSettings = aiSettingsService.getSettings();
          // تحويل إلى تنسيق المكون
          const uiConfig: AIConfiguration = {
            general: newSettings.general,
            propertyMatching: newSettings.propertyMatching,
            clientAnalysis: newSettings.clientAnalysis,
            marketInsights: newSettings.marketInsights,
            notifications: newSettings.notifications,
            uaeSpecific: newSettings.uaeSpecific,
            integrations: {
              dubizzle: newSettings.integrations.dubizzle.enabled,
              bayut: newSettings.integrations.bayut.enabled,
              propertyfinder: newSettings.integrations.propertyfinder.enabled,
              whatsappBusiness: newSettings.integrations.whatsappBusiness.enabled,
              googleMaps: newSettings.integrations.googleMaps.enabled,
              dubairedcalendar: false,
              bankingAPIs: newSettings.integrations.bankingAPIs.enabled
            },
            security: newSettings.security,
            performance: newSettings.performance
          };
          
          setConfig(uiConfig);
          setSystemStatus(aiSettingsService.getSystemStatus());
          
          toast({
            title: "تم الاستيراد",
            description: "تم استيراد الإعدادات بنجاح",
          });
        } catch (error) {
          console.error('خطأ في استيراد الإعدادات:', error);
          toast({
            title: "خطأ",
            description: "فشل في استيراد الإعدادات - تأكد من صحة الملف",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  // اختبار الاتصالات
  const testConnections = async () => {
    setIsTestingConnections(true);
    const integrations = Object.keys(config.integrations);
    const results: Record<string, boolean> = {};

    for (const integration of integrations) {
      // محاكاة اختبار الاتصال
      await new Promise(resolve => setTimeout(resolve, 1000));
      results[integration] = Math.random() > 0.3; // 70% success rate
    }

    setTestResults(results);
    setIsTestingConnections(false);
  };

  // إعادة تعيين الإعدادات
  const resetToDefaults = async () => {
    if (window.confirm('هل أنت متأكد من إعادة تعيين جميع الإعدادات إلى القيم الافتراضية؟')) {
      try {
        await aiSettingsService.resetAllToDefaults();
        const newSettings = aiSettingsService.getSettings();
        
        // تحديث واجهة المستخدم
        setConfig(defaultConfig);
        setSystemStatus(aiSettingsService.getSystemStatus());
        
        toast({
          title: "تم إعادة التعيين",
          description: "تم إعادة تعيين جميع الإعدادات إلى القيم الافتراضية",
        });
      } catch (error) {
        console.error('خطأ في إعادة تعيين الإعدادات:', error);
        toast({
          title: "خطأ",
          description: "فشل في إعادة تعيين الإعدادات",
          variant: "destructive",
        });
      }
    }
  };

  // تحديث قيم الإعدادات
  const updateConfig = (category: keyof AIConfiguration, key: string, value: any) => {
    if (!config) return;
    
    setConfig(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [category]: {
          ...prev[category],
          [key]: value
        }
      };
    });
  };

  // مكون السويتش المخصص
  const ConfigSwitch: React.FC<{
    category: keyof AIConfiguration;
    configKey: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
    disabled?: boolean;
  }> = ({ category, configKey, label, description, icon, disabled = false }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center space-x-3">
        {icon && <div className="text-gray-500">{icon}</div>}
        <div>
          <label className="text-sm font-medium text-gray-900">{label}</label>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
      </div>
      <Switch
        checked={(config[category] as any)[configKey]}
        onCheckedChange={(checked) => updateConfig(category, configKey, checked)}
        disabled={disabled}
      />
    </div>
  );

  // مكون المنزلق المخصص
  const ConfigSlider: React.FC<{
    category: keyof AIConfiguration;
    configKey: string;
    label: string;
    min: number;
    max: number;
    step: number;
    unit?: string;
    description?: string;
  }> = ({ category, configKey, label, min, max, step, unit = '', description }) => (
    <div className="space-y-3 py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-900">{label}</label>
        <span className="text-sm font-medium text-blue-600">
          {(config[category] as any)[configKey]}{unit}
        </span>
      </div>
      {description && <p className="text-xs text-gray-500">{description}</p>}
      <Slider
        value={[(config[category] as any)[configKey]]}
        onValueChange={([value]) => updateConfig(category, configKey, value)}
        max={max}
        min={min}
        step={step}
        className="w-full"
      />
    </div>
  );

  // عرض شاشة التحميل
  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل إعدادات الذكاء الاصطناعي...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* العنوان الرئيسي */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">مركز إعدادات الذكاء الاصطناعي</h1>
              <p className="text-indigo-100 text-lg">
                تخصيص محرك الذكاء الاصطناعي لشركة العقارات في عجمان، الإمارات
              </p>
              {lastSaved && (
                <p className="text-indigo-200 text-sm mt-2">
                  آخر حفظ: {lastSaved.toLocaleString('ar-SA')}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:text-indigo-600"
            >
              {showAdvanced ? <Minimize className="h-4 w-4 mr-2" /> : <Maximize className="h-4 w-4 mr-2" />}
              {showAdvanced ? 'مبسط' : 'متقدم'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
              className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:text-indigo-600"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              إعادة تعيين
            </Button>
            
            <Button
              onClick={saveConfiguration}
              disabled={isSaving}
              className="bg-white text-indigo-600 hover:bg-gray-100"
            >
              {isSaving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </Button>
          </div>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {Object.values(config.general).filter(Boolean).length}
            </div>
            <div className="text-sm text-gray-600">إعدادات عامة مفعلة</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {Object.values(config.integrations).filter(Boolean).length}
            </div>
            <div className="text-sm text-gray-600">تكاملات نشطة</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {config.uaeSpecific.enabled ? 'مفعل' : 'معطل'}
            </div>
            <div className="text-sm text-gray-600">التخصص الإماراتي</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {config.performance.responseTimeTarget}ms
            </div>
            <div className="text-sm text-gray-600">هدف الاستجابة</div>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات الرئيسية */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 bg-white border border-gray-200 rounded-lg p-1">
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <Cog className="h-4 w-4" />
            <span className="hidden sm:inline">عام</span>
          </TabsTrigger>
          <TabsTrigger value="matching" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">المطابقة</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">التحليل</span>
          </TabsTrigger>
          <TabsTrigger value="market" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">السوق</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">التنبيهات</span>
          </TabsTrigger>
          <TabsTrigger value="uae" className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">الإمارات</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center space-x-2">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">التكاملات</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">الأمان</span>
          </TabsTrigger>
        </TabsList>

        {/* تبويب الإعدادات العامة */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Cog className="h-5 w-5" />
                <span>الإعدادات العامة</span>
              </CardTitle>
              <CardDescription>
                تكوين الخصائص الأساسية لمحرك الذكاء الاصطناعي
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ConfigSwitch
                category="general"
                configKey="enabled"
                label="تفعيل محرك الذكاء الاصطناعي"
                description="تشغيل/إيقاف جميع ميزات الذكاء الاصطناعي"
                icon={<Brain className="h-4 w-4" />}
              />
              
              <div className="space-y-3">
                <Label>لغة النظام</Label>
                <Select 
                  value={config.general.language} 
                  onValueChange={(value) => updateConfig('general', 'language', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">العربية فقط</SelectItem>
                    <SelectItem value="en">الإنجليزية فقط</SelectItem>
                    <SelectItem value="both">العربية والإنجليزية</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ConfigSlider
                category="general"
                configKey="responseDelay"
                label="تأخير الاستجابة"
                min={500}
                max={5000}
                step={250}
                unit="ms"
                description="وقت التأخير قبل إرسال الرد التلقائي"
              />

              <ConfigSlider
                category="general"
                configKey="maxResponseLength"
                label="الحد الأقصى لطول الرد"
                min={100}
                max={1000}
                step={50}
                unit=" حرف"
                description="أقصى عدد أحرف للرد الواحد"
              />

              {showAdvanced && (
                <>
                  <ConfigSwitch
                    category="general"
                    configKey="learningMode"
                    label="وضع التعلم"
                    description="تمكين النظام من التعلم من التفاعلات"
                    icon={<Lightbulb className="h-4 w-4" />}
                  />
                  
                  <ConfigSwitch
                    category="general"
                    configKey="autoUpdate"
                    label="التحديث التلقائي"
                    description="تحديث المودل والبيانات تلقائياً"
                    icon={<RefreshCw className="h-4 w-4" />}
                  />
                  
                  <ConfigSwitch
                    category="general"
                    configKey="debugMode"
                    label="وضع التشخيص"
                    description="عرض معلومات إضافية للتشخيص"
                    icon={<Activity className="h-4 w-4" />}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب مطابقة العقارات */}
        <TabsContent value="matching" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>إعدادات مطابقة العقارات</span>
              </CardTitle>
              <CardDescription>
                تخصيص خوارزمية مطابقة العقارات مع العملاء
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ConfigSwitch
                category="propertyMatching"
                configKey="enabled"
                label="تفعيل مطابقة العقارات"
                description="استخدام الذكاء الاصطناعي لمطابقة العقارات مع العملاء"
                icon={<Home className="h-4 w-4" />}
              />

              <ConfigSlider
                category="propertyMatching"
                configKey="accuracyThreshold"
                label="عتبة الدقة"
                min={50}
                max={95}
                step={5}
                unit="%"
                description="الحد الأدنى لدقة المطابقة المطلوبة"
              />

              <ConfigSlider
                category="propertyMatching"
                configKey="maxRecommendations"
                label="الحد الأقصى للتوصيات"
                min={1}
                max={10}
                step={1}
                unit=" عقار"
                description="عدد العقارات المقترحة للعميل الواحد"
              />

              <ConfigSlider
                category="propertyMatching"
                configKey="considerBudgetFlexibility"
                label="مرونة الميزانية"
                min={0}
                max={30}
                step={5}
                unit="%"
                description="نسبة التجاوز المسموحة للميزانية المحددة"
              />

              <ConfigSwitch
                category="propertyMatching"
                configKey="prioritizeNewProperties"
                label="أولوية العقارات الجديدة"
                description="إعطاء أولوية للعقارات المضافة حديثاً"
                icon={<Star className="h-4 w-4" />}
              />

              <ConfigSwitch
                category="propertyMatching"
                configKey="includeNearbyAreas"
                label="تضمين المناطق المجاورة"
                description="البحث في المناطق القريبة من المنطقة المفضلة"
                icon={<MapPin className="h-4 w-4" />}
              />

              {showAdvanced && (
                <>
                  <ConfigSwitch
                    category="propertyMatching"
                    configKey="weightByClientHistory"
                    label="الترجيح بالتاريخ السابق"
                    description="استخدام سجل العميل في حساب التوصيات"
                    icon={<Clock className="h-4 w-4" />}
                  />
                  
                  <ConfigSwitch
                    category="propertyMatching"
                    configKey="useMarketTrends"
                    label="استخدام اتجاهات السوق"
                    description="مراعاة اتجاهات السوق في التوصيات"
                    icon={<TrendingUp className="h-4 w-4" />}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب تحليل العملاء */}
        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>إعدادات تحليل العملاء</span>
              </CardTitle>
              <CardDescription>
                تكوين أدوات التحليل والذكاء السلوكي للعملاء
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ConfigSwitch
                category="clientAnalysis"
                configKey="enabled"
                label="تفعيل تحليل العملاء"
                description="تحليل سلوك وتفضيلات العملاء باستخدام الذكاء الاصطناعي"
                icon={<Users className="h-4 w-4" />}
              />

              <div className="space-y-3">
                <Label>مستوى حساب الإلحاح</Label>
                <Select 
                  value={config.clientAnalysis.urgencyCalculation} 
                  onValueChange={(value) => updateConfig('clientAnalysis', 'urgencyCalculation', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">أساسي</SelectItem>
                    <SelectItem value="advanced">متقدم</SelectItem>
                    <SelectItem value="ml_based">بالذكاء الاصطناعي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ConfigSwitch
                category="clientAnalysis"
                configKey="intentRecognition"
                label="التعرف على النوايا"
                description="تحليل نوايا العملاء من رسائلهم ومحادثاتهم"
                icon={<MessageSquare className="h-4 w-4" />}
              />

              <ConfigSwitch
                category="clientAnalysis"
                configKey="sentimentAnalysis"
                label="تحليل المشاعر"
                description="تحليل مشاعر العملاء من النصوص والمحادثات"
                icon={<Heart className="h-4 w-4" />}
              />

              <ConfigSwitch
                category="clientAnalysis"
                configKey="behaviorPrediction"
                label="توقع السلوك"
                description="تنبؤ بسلوك العملاء المستقبلي"
                icon={<TrendingUp className="h-4 w-4" />}
              />

              {showAdvanced && (
                <>
                  <ConfigSwitch
                    category="clientAnalysis"
                    configKey="responseTimeTracking"
                    label="تتبع أوقات الاستجابة"
                    description="مراقبة أوقات رد العملاء والوسطاء"
                    icon={<Clock className="h-4 w-4" />}
                  />
                  
                  <ConfigSwitch
                    category="clientAnalysis"
                    configKey="satisfactionMonitoring"
                    label="مراقبة الرضا"
                    description="قياس مستوى رضا العملاء تلقائياً"
                    icon={<ThumbsUp className="h-4 w-4" />}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب رؤى السوق */}
        <TabsContent value="market" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>إعدادات رؤى السوق</span>
              </CardTitle>
              <CardDescription>
                تكوين تحليل السوق والتنبؤات الاقتصادية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ConfigSwitch
                category="marketInsights"
                configKey="enabled"
                label="تفعيل رؤى السوق"
                description="تحليل اتجاهات السوق العقاري والتنبؤ بالأسعار"
                icon={<BarChart3 className="h-4 w-4" />}
              />

              <ConfigSlider
                category="marketInsights"
                configKey="updateFrequency"
                label="تكرار التحديث"
                min={1}
                max={24}
                step={1}
                unit=" ساعة"
                description="كم مرة يتم تحديث بيانات السوق يومياً"
              />

              <ConfigSwitch
                category="marketInsights"
                configKey="priceAnalysis"
                label="تحليل الأسعار"
                description="تتبع وتحليل تغيرات الأسعار في السوق"
                icon={<DollarSign className="h-4 w-4" />}
              />

              <ConfigSwitch
                category="marketInsights"
                configKey="demandForecasting"
                label="توقع الطلب"
                description="التنبؤ بمستوى الطلب على أنواع العقارات المختلفة"
                icon={<PieChart className="h-4 w-4" />}
              />

              <ConfigSwitch
                category="marketInsights"
                configKey="trendPrediction"
                label="توقع الاتجاهات"
                description="تنبؤ باتجاهات السوق المستقبلية"
                icon={<LineChart className="h-4 w-4" />}
              />

              {showAdvanced && (
                <>
                  <ConfigSwitch
                    category="marketInsights"
                    configKey="competitorAnalysis"
                    label="تحليل المنافسين"
                    description="مراقبة وتحليل أسعار وعروض المنافسين"
                    icon={<Activity className="h-4 w-4" />}
                  />
                  
                  <ConfigSwitch
                    category="marketInsights"
                    configKey="seasonalAdjustments"
                    label="التعديلات الموسمية"
                    description="مراعاة التغيرات الموسمية في التحليل"
                    icon={<Calendar className="h-4 w-4" />}
                  />
                  
                  <ConfigSwitch
                    category="marketInsights"
                    configKey="economicFactors"
                    label="العوامل الاقتصادية"
                    description="تضمين المؤشرات الاقتصادية في التحليل"
                    icon={<TrendingUp className="h-4 w-4" />}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب التنبيهات */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>إعدادات التنبيهات والإشعارات</span>
              </CardTitle>
              <CardDescription>
                تخصيص طرق وأوقات الإشعارات والتنبيهات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">طرق الإشعار</h4>
                <div className="grid grid-cols-2 gap-4">
                  <ConfigSwitch
                    category="notifications"
                    configKey="email"
                    label="البريد الإلكتروني"
                    icon={<Mail className="h-4 w-4" />}
                  />
                  <ConfigSwitch
                    category="notifications"
                    configKey="sms"
                    label="الرسائل النصية"
                    icon={<MessageSquare className="h-4 w-4" />}
                  />
                  <ConfigSwitch
                    category="notifications"
                    configKey="whatsapp"
                    label="واتساب"
                    icon={<Phone className="h-4 w-4" />}
                  />
                  <ConfigSwitch
                    category="notifications"
                    configKey="push"
                    label="إشعارات المتصفح"
                    icon={<Smartphone className="h-4 w-4" />}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>فلتر الأولوية</Label>
                <Select 
                  value={config.notifications.priorityFilter} 
                  onValueChange={(value) => updateConfig('notifications', 'priorityFilter', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الإشعارات</SelectItem>
                    <SelectItem value="high">عالية الأولوية فقط</SelectItem>
                    <SelectItem value="urgent">الطارئة فقط</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>تكرار الإشعارات</Label>
                <Select 
                  value={config.notifications.frequency} 
                  onValueChange={(value) => updateConfig('notifications', 'frequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instant">فوري</SelectItem>
                    <SelectItem value="hourly">كل ساعة</SelectItem>
                    <SelectItem value="daily">يومي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showAdvanced && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>ساعات الهدوء</Label>
                    <Switch
                      checked={config.notifications.quietHours.enabled}
                      onCheckedChange={(checked) => 
                        updateConfig('notifications', 'quietHours', {
                          ...config.notifications.quietHours,
                          enabled: checked
                        })
                      }
                    />
                  </div>
                  
                  {config.notifications.quietHours.enabled && (
                    <div className="grid grid-cols-2 gap-4 pl-6">
                      <div>
                        <Label>من الساعة</Label>
                        <Input
                          type="time"
                          value={config.notifications.quietHours.start}
                          onChange={(e) => 
                            updateConfig('notifications', 'quietHours', {
                              ...config.notifications.quietHours,
                              start: e.target.value
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>إلى الساعة</Label>
                        <Input
                          type="time"
                          value={config.notifications.quietHours.end}
                          onChange={(e) => 
                            updateConfig('notifications', 'quietHours', {
                              ...config.notifications.quietHours,
                              end: e.target.value
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الإعدادات الإماراتية */}
        <TabsContent value="uae" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>الإعدادات المحلية للإمارات</span>
              </CardTitle>
              <CardDescription>
                تخصيص النظام للسوق الإماراتي وخصوصاً إمارة عجمان
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ConfigSwitch
                category="uaeSpecific"
                configKey="enabled"
                label="تفعيل التخصص الإماراتي"
                description="تمكين الميزات الخاصة بالسوق الإماراتي"
                icon={<Globe className="h-4 w-4" />}
              />

              <ConfigSwitch
                category="uaeSpecific"
                configKey="ajmanFocus"
                label="التركيز على عجمان"
                description="إعطاء أولوية للعقارات والعملاء في إمارة عجمان"
                icon={<MapPin className="h-4 w-4" />}
              />

              <ConfigSwitch
                category="uaeSpecific"
                configKey="arabicPriority"
                label="أولوية اللغة العربية"
                description="عرض المحتوى العربي أولاً والإنجليزي كبديل"
                icon={<Languages className="h-4 w-4" />}
              />

              <ConfigSwitch
                category="uaeSpecific"
                configKey="localHolidays"
                label="مراعاة الأعياد المحلية"
                description="تعديل أوقات العمل والتنبيهات حسب الأعياد الإماراتية"
                icon={<Calendar className="h-4 w-4" />}
              />

              <ConfigSwitch
                category="uaeSpecific"
                configKey="prayerTimesIntegration"
                label="مراعاة أوقات الصلاة"
                description="تعديل أوقات التواصل حسب أوقات الصلاة"
                icon={<Clock className="h-4 w-4" />}
              />

              <ConfigSwitch
                category="uaeSpecific"
                configKey="weekendAdjustment"
                label="تعديل نهاية الأسبوع"
                description="اعتبار الجمعة والسبت نهاية أسبوع"
                icon={<Calendar className="h-4 w-4" />}
              />

              {showAdvanced && (
                <>
                  <ConfigSwitch
                    category="uaeSpecific"
                    configKey="culturalSensitivity"
                    label="الحساسية الثقافية"
                    description="مراعاة القيم والتقاليد المحلية في التواصل"
                    icon={<Heart className="h-4 w-4" />}
                  />
                  
                  <ConfigSwitch
                    category="uaeSpecific"
                    configKey="localRegulations"
                    label="اللوائح المحلية"
                    description="مراعاة القوانين والأنظمة العقارية الإماراتية"
                    icon={<Shield className="h-4 w-4" />}
                  />
                  
                  <ConfigSwitch
                    category="uaeSpecific"
                    configKey="emiratiClientPreference"
                    label="أولوية العملاء الإماراتيين"
                    description="إعطاء أولوية عالية للعملاء الإماراتيين"
                    icon={<Users className="h-4 w-4" />}
                  />
                </>
              )}

              {/* قائمة المناطق المحلية */}
              <div className="mt-6">
                <h4 className="font-medium mb-3">المناطق المحلية في عجمان</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {ajmanAreas.map((area, index) => (
                    <Badge key={index} variant="outline" className="justify-center">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب التكاملات */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Layers className="h-5 w-5" />
                <span>التكاملات والخدمات الخارجية</span>
              </CardTitle>
              <CardDescription>
                ربط النظام بالمنصات والخدمات الخارجية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">منصات العقارات</h4>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={testConnections}
                  disabled={isTestingConnections}
                >
                  {isTestingConnections ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Gauge className="h-4 w-4 mr-2" />
                  )}
                  اختبار الاتصالات
                </Button>
              </div>
              
              <div className="grid gap-4">
                {[
                  { key: 'dubizzle', label: 'دوبيزل', description: 'منصة الإعلانات المبوبة الرائدة' },
                  { key: 'bayut', label: 'بيوت', description: 'منصة العقارات الأولى في الإمارات' },
                  { key: 'propertyfinder', label: 'Property Finder', description: 'محرك البحث العقاري' }
                ].map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Building className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">{label}</p>
                        <p className="text-sm text-gray-500">{description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {Object.keys(testResults).length > 0 && (
                        <div className="text-sm">
                          {testResults[key] ? (
                            <Badge className="bg-green-100 text-green-800">متصل</Badge>
                          ) : (
                            <Badge variant="destructive">خطأ</Badge>
                          )}
                        </div>
                      )}
                      <Switch
                        checked={(config.integrations as any)[key]}
                        onCheckedChange={(checked) => updateConfig('integrations', key, checked)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">خدمات التواصل</h4>
                <div className="grid gap-4">
                  {[
                    { key: 'whatsappBusiness', label: 'واتساب بيزنس', description: 'التواصل عبر واتساب', icon: Phone },
                    { key: 'googleMaps', label: 'خرائط جوجل', description: 'تحديد المواقع والمسارات', icon: MapPin }
                  ].map(({ key, label, description, icon: Icon }) => (
                    <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">{label}</p>
                          <p className="text-sm text-gray-500">{description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={(config.integrations as any)[key]}
                        onCheckedChange={(checked) => updateConfig('integrations', key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الأمان */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>إعدادات الأمان والخصوصية</span>
              </CardTitle>
              <CardDescription>
                تأمين النظام وحماية بيانات العملاء
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ConfigSwitch
                category="security"
                configKey="dataEncryption"
                label="تشفير البيانات"
                description="تشفير جميع البيانات الحساسة"
                icon={<Shield className="h-4 w-4" />}
              />

              <ConfigSwitch
                category="security"
                configKey="accessLogs"
                label="سجلات الوصول"
                description="تسجيل جميع عمليات الوصول للنظام"
                icon={<Eye className="h-4 w-4" />}
              />

              <ConfigSwitch
                category="security"
                configKey="adminApprovalRequired"
                label="موافقة المدير مطلوبة"
                description="طلب موافقة المدير للعمليات الحساسة"
                icon={<CheckCircle className="h-4 w-4" />}
              />

              <ConfigSlider
                category="security"
                configKey="sessionTimeout"
                label="انتهاء الجلسة"
                min={15}
                max={480}
                step={15}
                unit=" دقيقة"
                description="مدة انتهاء الجلسة تلقائياً"
              />

              {showAdvanced && (
                <>
                  <ConfigSwitch
                    category="security"
                    configKey="twoFactorAuth"
                    label="المصادقة الثنائية"
                    description="تمكين المصادقة الثنائية لحسابات المدراء"
                    icon={<Smartphone className="h-4 w-4" />}
                  />
                  
                  <ConfigSwitch
                    category="security"
                    configKey="auditTrail"
                    label="سجل التدقيق"
                    description="الاحتفاظ بسجل مفصل لجميع العمليات"
                    icon={<Database className="h-4 w-4" />}
                  />

                  <div className="space-y-3">
                    <Label>القائمة البيضاء للـ IP</Label>
                    <Textarea
                      placeholder="أدخل عناوين IP المسموحة، كل عنوان في سطر منفصل"
                      value={config.security.ipWhitelist.join('\n')}
                      onChange={(e) => 
                        updateConfig('security', 'ipWhitelist', 
                          e.target.value.split('\n').filter(ip => ip.trim())
                        )
                      }
                      className="h-24"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* شريط الحفظ السفلي */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            {Object.values(config).filter(section => 
              typeof section === 'object' && section.enabled
            ).length} / {Object.keys(config).length} مُفعل
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExportDialog(true)}
          >
            <Download className="h-4 w-4 mr-2" />
            تصدير
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('import-file')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            استيراد
          </Button>
          
          <input
            id="import-file"
            type="file"
            accept=".json"
            onChange={importConfiguration}
            className="hidden"
          />
        </div>

        <Button
          onClick={saveConfiguration}
          disabled={isSaving}
          size="lg"
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {isSaving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSaving ? 'جاري الحفظ...' : 'حفظ جميع الإعدادات'}
        </Button>
      </div>

      {/* مودال التصدير */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>تصدير الإعدادات</CardTitle>
              <CardDescription>
                سيتم تصدير جميع الإعدادات الحالية كملف JSON
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>سيتم تضمين:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>الإعدادات العامة</li>
                  <li>إعدادات المطابقة والتحليل</li>
                  <li>التكاملات والأمان</li>
                  <li>الإعدادات الإماراتية المحلية</li>
                </ul>
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowExportDialog(false)}
                >
                  إلغاء
                </Button>
                <Button 
                  className="flex-1"
                  onClick={exportConfiguration}
                >
                  <Download className="h-4 w-4 mr-2" />
                  تصدير
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
