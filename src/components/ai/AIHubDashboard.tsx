import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  BarChart3,
  Settings,
  Target,
  Lightbulb,
  MessageSquare,
  Zap,
  Eye,
  MapPin,
  Calendar,
  DollarSign,
  Ruler,
  ChevronLeft
} from 'lucide-react';

interface AIModule {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  route: string;
  isActive: boolean;
  comingSoon?: boolean;
}

export default function AIHubDashboard() {
  const navigate = useNavigate();

  // وحدات الذكاء الاصطناعي المتاحة والمستقبلية
  const aiModules: AIModule[] = [
    {
      id: 'property-recommendation',
      title: 'ترشيح العقارات',
      description: 'مطابقة ذكية للعقارات مع احتياجات العملاء',
      icon: Target,
      color: 'bg-blue-500',
      route: '/ai-intelligence-hub/property-recommendation',
      isActive: true
    },
    {
      id: 'client-evaluation',
      title: 'تقييم العملاء',
      description: 'قياس الجدية واحتمالية إتمام الصفقة',
      icon: Users,
      color: 'bg-green-500',
      route: '/ai-intelligence-hub/client-evaluation',
      isActive: true
    },
    {
      id: 'smart-recommendations',
      title: 'التوصيات الذكية',
      description: 'اقتراحات مدعومة بالذكاء الاصطناعي',
      icon: Lightbulb,
      color: 'bg-yellow-500',
      route: '/ai-intelligence-hub/smart-recommendations',
      isActive: true
    },
    {
      id: 'market-analysis',
      title: 'تحليل السوق',
      description: 'رؤى واتجاهات السوق الحالية',
      icon: BarChart3,
      color: 'bg-purple-500',
      route: '/ai-intelligence-hub/market-analysis',
      isActive: true
    },
    {
      id: 'ai-analytics',
      title: 'تحليلات الذكاء الاصطناعي',
      description: 'مؤشرات أداء نماذج الذكاء',
      icon: TrendingUp,
      color: 'bg-red-500',
      route: '/ai-intelligence-hub/ai-analytics',
      isActive: true
    },
    {
      id: 'uae-predictions',
      title: 'تنبؤات السوق الإماراتي',
      description: 'توقعات مخصصة للسوق الإماراتي',
      icon: MapPin,
      color: 'bg-indigo-500',
      route: '/ai-intelligence-hub/uae-predictions',
      isActive: true
    },
    {
      id: 'ai-models',
      title: 'إدارة النماذج',
      description: 'إدارة وتكوين النماذج الذكية',
      icon: Brain,
      color: 'bg-pink-500',
      route: '/ai-intelligence-hub/ai-models',
      isActive: true
    },
    {
      id: 'ai-settings',
      title: 'إعدادات الذكاء الاصطناعي',
      description: 'ضبط مصادر البيانات والسياسات',
      icon: Settings,
      color: 'bg-gray-500',
      route: '/ai-intelligence-hub/ai-settings',
      isActive: true
    },
    // وحدات مستقبلية
    {
      id: 'voice-assistant',
      title: 'المساعد الصوتي',
      description: 'مساعد ذكي للتفاعل الصوتي مع النظام',
      icon: MessageSquare,
      color: 'bg-teal-500',
      route: '/ai-intelligence-hub/voice-assistant',
      isActive: false,
      comingSoon: true
    },
    {
      id: 'predictive-pricing',
      title: 'التسعير التنبؤي',
      description: 'تحديد أسعار العقارات باستخدام الذكاء الاصطناعي',
      icon: DollarSign,
      color: 'bg-emerald-500',
      route: '/ai-intelligence-hub/predictive-pricing',
      isActive: false,
      comingSoon: true
    },
    {
      id: 'automated-valuation',
      title: 'التقييم الآلي',
      description: 'تقييم تلقائي للعقارات بدقة عالية',
      icon: Ruler,
      color: 'bg-orange-500',
      route: '/ai-intelligence-hub/automated-valuation',
      isActive: false,
      comingSoon: true
    },
    {
      id: 'smart-scheduling',
      title: 'الجدولة الذكية',
      description: 'جدولة المواعيد والمهام بذكاء اصطناعي',
      icon: Calendar,
      color: 'bg-cyan-500',
      route: '/ai-intelligence-hub/smart-scheduling',
      isActive: false,
      comingSoon: true
    }
  ];

  const handleModuleClick = (module: AIModule) => {
    if (module.isActive) {
      navigate(module.route);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">مركز الذكاء الاصطناعي</h1>
            <p className="text-muted-foreground">
              مجموعة شاملة من أدوات الذكاء الاصطناعي لتطوير الأعمال العقارية
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/admin-dashboard')}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          العودة للرئيسية
        </Button>
      </div>

      {/* Active Modules */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-green-500" />
          <h2 className="text-xl font-semibold">الوحدات النشطة</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {aiModules.filter(module => module.isActive).map((module) => (
            <Card 
              key={module.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-primary/20"
              onClick={() => handleModuleClick(module)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg ${module.color} text-white`}>
                    <module.icon className="h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 font-medium">نشط</span>
                  </div>
                </div>
                <CardTitle className="text-lg">{module.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {module.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Coming Soon Modules */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-blue-500" />
          <h2 className="text-xl font-semibold">قريباً</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {aiModules.filter(module => module.comingSoon).map((module) => (
            <Card 
              key={module.id}
              className="opacity-75 border-dashed border-2 cursor-not-allowed"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg ${module.color} text-white opacity-60`}>
                    <module.icon className="h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-blue-600 font-medium">قريباً</span>
                  </div>
                </div>
                <CardTitle className="text-lg text-muted-foreground">{module.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {module.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              الوحدات النشطة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {aiModules.filter(m => m.isActive).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              قيد التطوير
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {aiModules.filter(m => m.comingSoon).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي الوحدات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {aiModules.length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
