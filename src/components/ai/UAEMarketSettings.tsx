import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { uaeMarketSettingsService, UAEMarketConfig } from '@/services/uaeMarketSettingsService';
import { 
  MapPin,
  Building,
  DollarSign,
  Clock,
  Globe,
  Languages,
  Calendar,
  Heart,
  Shield,
  Users,
  Home,
  Car,
  Trees,
  Briefcase,
  ShoppingBag,
  Star,
  TrendingUp,
  BarChart3,
  Settings,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Bell,
  MessageSquare,
  Phone,
  Mail
} from 'lucide-react';

// استيراد أنواع البيانات من الخدمة

// بيانات الإمارات والمناطق
const emirates = [
  'أبوظبي',
  'دبي', 
  'الشارقة',
  'عجمان',
  'أم القيوين',
  'رأس الخيمة',
  'الفجيرة'
];

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
  'مدينة الاتحاد',
  'الرميلة',
  'المويهات'
];

const dubaiAreas = [
  'دبي مارينا',
  'وسط دبي',
  'دبي هيلز',
  'الإمارات هيلز',
  'مدينة دبي الرياضية',
  'دبي لاند',
  'جميرا',
  'البرشاء',
  'المدينة العالمية'
];

// أوقات الصلاة (تقديرية)
const prayerTimes = [
  { name: 'الفجر', time: '05:30' },
  { name: 'الظهر', time: '12:15' },
  { name: 'العصر', time: '15:45' },
  { name: 'المغرب', time: '18:30' },
  { name: 'العشاء', time: '20:00' }
];

export default function UAEMarketSettings() {
  const [config, setConfig] = useState<UAEMarketConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // تحميل الإعدادات عند بدء التشغيل
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const savedConfig = uaeMarketSettingsService.getConfig();
        setConfig(savedConfig);
        
        // إضافة مستمع للتغييرات
        uaeMarketSettingsService.addListener('uae-settings-component', (newConfig) => {
          setConfig(newConfig);
        });

      } catch (error) {
        console.error('خطأ في تحميل إعدادات السوق الإماراتي:', error);
        toast({
          title: "خطأ",
          description: "فشل في تحميل الإعدادات",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();

    // تنظيف المستمع عند إلغاء التحميل
    return () => {
      uaeMarketSettingsService.removeListener('uae-settings-component');
    };
  }, [toast]);

  // حفظ الإعدادات
  const saveConfiguration = async () => {
    if (!config) return;
    
    setIsSaving(true);
    try {
      await uaeMarketSettingsService.saveConfig(config);
      setLastSaved(new Date());
      
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات السوق الإماراتي بنجاح",
      });
      
      console.log('تم حفظ إعدادات السوق الإماراتي:', config);
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

  // التحقق من صحة الإعدادات
  const validateSettings = async () => {
    if (!config) return;
    
    setIsValidating(true);
    const results: Record<string, boolean> = {};
    
    try {
      // استخدام خدمة التحقق
      const errors = uaeMarketSettingsService.validateConfig(config);
      
      // فحص الإعدادات
      results.location = config.location.focusAreas.length > 0 && config.location.radiusKm > 0;
      results.language = config.language.translationQuality >= 50;
      results.business = config.business.businessHours.start < config.business.businessHours.end;
      results.overall = errors.length === 0;
      
      if (errors.length > 0) {
        toast({
          title: "تحذير",
          description: `مشاكل في الإعدادات: ${errors.join(', ')}`,
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('خطأ في التحقق من الإعدادات:', error);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setValidationResults(results);
    setIsValidating(false);
  };

  // تحديث الإعدادات
  const updateConfig = (category: keyof UAEMarketConfig, key: string, value: any) => {
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

  // تحديث إعدادات معقدة
  const updateNestedConfig = (category: keyof UAEMarketConfig, nestedKey: string, key: string, value: any) => {
    if (!config) return;
    
    setConfig(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [category]: {
          ...prev[category],
          [nestedKey]: {
            ...(prev[category] as any)[nestedKey],
            [key]: value
          }
        }
      };
    });
  };

  // إضافة/إزالة منطقة من المناطق المركزة
  const toggleArea = (area: string) => {
    if (!config) return;
    
    const currentAreas = config.location.focusAreas;
    if (currentAreas.includes(area)) {
      updateConfig('location', 'focusAreas', currentAreas.filter(a => a !== area));
    } else {
      updateConfig('location', 'focusAreas', [...currentAreas, area]);
    }
  };

  useEffect(() => {
    if (config) {
      validateSettings();
    }
  }, [config]);

  // عرض شاشة التحميل
  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل إعدادات السوق الإماراتي...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* العنوان الرئيسي */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <MapPin className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">إعدادات السوق الإماراتي</h1>
              <p className="text-green-100 text-lg">
                تخصيص النظام للسوق العقاري في دولة الإمارات العربية المتحدة
              </p>
              {lastSaved && (
                <p className="text-green-200 text-sm mt-2">
                  آخر حفظ: {lastSaved.toLocaleString('ar-SA')}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={validateSettings}
              disabled={isValidating}
              className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:text-green-600"
            >
              {isValidating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              فحص الإعدادات
            </Button>
            
            <Button
              onClick={saveConfiguration}
              disabled={isSaving}
              className="bg-white text-green-600 hover:bg-gray-100"
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

      {/* نتائج التحقق */}
      {Object.keys(validationResults).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(validationResults).map(([key, isValid]) => (
            <Card key={key} className={`border-l-4 ${isValid ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  {isValid ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">{key === 'location' ? 'الموقع' : key === 'language' ? 'اللغة' : 'العمل'}</p>
                    <p className={`text-sm ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                      {isValid ? 'إعدادات صحيحة' : 'تحتاج مراجعة'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* إعدادات الموقع والجغرافيا */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>الإعدادات الجغرافية</span>
          </CardTitle>
          <CardDescription>
            تحديد الإمارة الرئيسية والمناطق المركزة للعمل
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>الإمارة الرئيسية</Label>
            <Select 
              value={config.location.primaryEmirate} 
              onValueChange={(value) => updateConfig('location', 'primaryEmirate', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {emirates.map(emirate => (
                  <SelectItem key={emirate} value={emirate}>{emirate}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>المناطق المركزة</Label>
              <Badge variant="outline">
                {config.location.focusAreas.length} منطقة محددة
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {(config.location.primaryEmirate === 'عجمان' ? ajmanAreas : dubaiAreas).map(area => (
                <Button
                  key={area}
                  variant={config.location.focusAreas.includes(area) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleArea(area)}
                  className="text-sm"
                >
                  {area}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>تضمين الإمارات المجاورة</Label>
              <Switch
                checked={config.location.nearbyEmiratesIncluded}
                onCheckedChange={(checked) => updateConfig('location', 'nearbyEmiratesIncluded', checked)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>نطاق البحث</Label>
              <span className="text-sm font-medium text-blue-600">
                {config.location.radiusKm} كم
              </span>
            </div>
            <Slider
              value={[config.location.radiusKm]}
              onValueChange={([value]) => updateConfig('location', 'radiusKm', value)}
              max={200}
              min={10}
              step={10}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* إعدادات اللغة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Languages className="h-5 w-5" />
            <span>إعدادات اللغة والتواصل</span>
          </CardTitle>
          <CardDescription>
            تكوين اللغات ونمط التواصل المحلي
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>اللغة الأساسية</Label>
              <Select 
                value={config.language.primaryLanguage} 
                onValueChange={(value) => updateConfig('language', 'primaryLanguage', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="en">الإنجليزية</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>اللغة الثانوية</Label>
              <Select 
                value={config.language.secondaryLanguage} 
                onValueChange={(value) => updateConfig('language', 'secondaryLanguage', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="en">الإنجليزية</SelectItem>
                  <SelectItem value="none">لا شيء</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>اللهجة العربية</Label>
            <Select 
              value={config.language.arabicDialect} 
              onValueChange={(value) => updateConfig('language', 'arabicDialect', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gulf">خليجية</SelectItem>
                <SelectItem value="levantine">شامية</SelectItem>
                <SelectItem value="egyptian">مصرية</SelectItem>
                <SelectItem value="standard">فصحى</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>جودة الترجمة</Label>
              <span className="text-sm font-medium text-blue-600">
                {config.language.translationQuality}%
              </span>
            </div>
            <Slider
              value={[config.language.translationQuality]}
              onValueChange={([value]) => updateConfig('language', 'translationQuality', value)}
              max={100}
              min={50}
              step={5}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* الإعدادات الثقافية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5" />
            <span>الإعدادات الثقافية والدينية</span>
          </CardTitle>
          <CardDescription>
            مراعاة العادات والتقاليد المحلية في الإمارات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <Label>مراعاة أوقات الصلاة</Label>
                </div>
                <Switch
                  checked={config.cultural.respectPrayerTimes}
                  onCheckedChange={(checked) => updateConfig('cultural', 'respectPrayerTimes', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <Label>مراعاة الأعياد المحلية</Label>
                </div>
                <Switch
                  checked={config.cultural.observeLocalHolidays}
                  onCheckedChange={(checked) => updateConfig('cultural', 'observeLocalHolidays', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <Label>نهاية الأسبوع (جمعة-سبت)</Label>
                </div>
                <Switch
                  checked={config.cultural.weekendFridaySaturday}
                  onCheckedChange={(checked) => updateConfig('cultural', 'weekendFridaySaturday', checked)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Heart className="h-4 w-4 text-gray-500" />
                  <Label>الحساسية الثقافية</Label>
                </div>
                <Switch
                  checked={config.cultural.culturalSensitivity}
                  onCheckedChange={(checked) => updateConfig('cultural', 'culturalSensitivity', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Home className="h-4 w-4 text-gray-500" />
                  <Label>المحتوى الأسري</Label>
                </div>
                <Switch
                  checked={config.cultural.familyOrientedContent}
                  onCheckedChange={(checked) => updateConfig('cultural', 'familyOrientedContent', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Users className="h-4 w-4 text-gray-500" />
                  <Label>خيارات منفصلة حسب الجنس</Label>
                </div>
                <Switch
                  checked={config.cultural.genderSeparateOptions}
                  onCheckedChange={(checked) => updateConfig('cultural', 'genderSeparateOptions', checked)}
                />
              </div>
            </div>
          </div>

          {/* أوقات الصلاة */}
          {config.cultural.respectPrayerTimes && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-3">أوقات الصلاة المعتبرة</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {prayerTimes.map((prayer, index) => (
                  <div key={index} className="text-center">
                    <div className="text-sm font-medium">{prayer.name}</div>
                    <div className="text-xs text-gray-600">{prayer.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* الإعدادات القانونية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>الإعدادات القانونية والتنظيمية</span>
          </CardTitle>
          <CardDescription>
            مراعاة القوانين والأنظمة العقارية في الإمارات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>قوانين العقارات الإماراتية</Label>
                <Switch
                  checked={config.legal.uaePropertyLaws}
                  onCheckedChange={(checked) => updateConfig('legal', 'uaePropertyLaws', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>متطلبات التأشيرة</Label>
                <Switch
                  checked={config.legal.visaRequirements}
                  onCheckedChange={(checked) => updateConfig('legal', 'visaRequirements', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>اللوائح المصرفية</Label>
                <Switch
                  checked={config.legal.bankingRegulations}
                  onCheckedChange={(checked) => updateConfig('legal', 'bankingRegulations', checked)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>أولوية المواطنين الإماراتيين</Label>
                <Switch
                  checked={config.legal.emiratiPreference}
                  onCheckedChange={(checked) => updateConfig('legal', 'emiratiPreference', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>قوانين ملكية الأجانب</Label>
                <Switch
                  checked={config.legal.foreignOwnershipRules}
                  onCheckedChange={(checked) => updateConfig('legal', 'foreignOwnershipRules', checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* إعدادات العملة والأسعار */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>إعدادات العملة والأسعار</span>
          </CardTitle>
          <CardDescription>
            تكوين عرض الأسعار والعملات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>العملة الأساسية</Label>
              <Select 
                value={config.currency.primaryCurrency} 
                onValueChange={(value) => updateConfig('currency', 'primaryCurrency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                  <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>تنسيق الأسعار</Label>
              <Select 
                value={config.currency.priceFormatting} 
                onValueChange={(value) => updateConfig('currency', 'priceFormatting', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="arabic">عربي (١٢٣٬٤٥٦)</SelectItem>
                  <SelectItem value="western">غربي (123,456)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>عرض عملات متعددة</Label>
              <Switch
                checked={config.currency.showMultipleCurrencies}
                onCheckedChange={(checked) => updateConfig('currency', 'showMultipleCurrencies', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>تحديث أسعار الصرف تلقائياً</Label>
              <Switch
                checked={config.currency.exchangeRateUpdates}
                onCheckedChange={(checked) => updateConfig('currency', 'exchangeRateUpdates', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* إعدادات العمل */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Briefcase className="h-5 w-5" />
            <span>إعدادات العمل والتواصل</span>
          </CardTitle>
          <CardDescription>
            تكوين ساعات العمل ونمط التواصل مع العملاء
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <Label>بداية العمل</Label>
              <Input
                type="time"
                value={config.business.businessHours.start}
                onChange={(e) => updateNestedConfig('business', 'businessHours', 'start', e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <Label>نهاية العمل</Label>
              <Input
                type="time"
                value={config.business.businessHours.end}
                onChange={(e) => updateNestedConfig('business', 'businessHours', 'end', e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>تعديل لرمضان</Label>
                <Switch
                  checked={config.business.businessHours.adjustForRamadan}
                  onCheckedChange={(checked) => updateNestedConfig('business', 'businessHours', 'adjustForRamadan', checked)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>نمط التواصل</Label>
            <Select 
              value={config.business.communicationStyle} 
              onValueChange={(value) => updateConfig('business', 'communicationStyle', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="formal">رسمي</SelectItem>
                <SelectItem value="friendly">ودود</SelectItem>
                <SelectItem value="mixed">مختلط</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>تكرار متابعة العملاء</Label>
              <span className="text-sm font-medium text-blue-600">
                كل {config.business.clientFollowUpFrequency} أيام
              </span>
            </div>
            <Slider
              value={[config.business.clientFollowUpFrequency]}
              onValueChange={([value]) => updateConfig('business', 'clientFollowUpFrequency', value)}
              max={14}
              min={1}
              step={1}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>تفضيل الشركاء المحليين</Label>
            <Switch
              checked={config.business.localPartnerPreference}
              onCheckedChange={(checked) => updateConfig('business', 'localPartnerPreference', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
