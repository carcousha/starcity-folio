// Contact Deduplication Management Page - Enhanced Version
// صفحة إدارة إزالة التكرار في جهات الاتصال - نسخة محسّنة

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  contactDeduplicationService, 
  DuplicateContact, 
  DeduplicationResult,
  DeduplicationOptions
} from '@/services/contactDeduplicationService';
import { toast } from 'sonner';
import { 
  AlertCircle, 
  CheckCircle, 
  Users, 
  Eye, 
  Trash2, 
  RefreshCw, 
  Merge,
  Database,
  Phone,
  Building2,
  UserCheck,
  Home,
  Settings,
  BarChart3,
  FileText,
  Clock,
  Zap,
  Shield,
  Info,
  Filter,
  Search,
  Download,
  Upload,
  Play,
  Pause,
  StopCircle,
  TestTube,
  Shuffle
} from 'lucide-react';

export default function ContactDeduplication() {
  const [isLoading, setIsLoading] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateContact[]>([]);
  const [deduplicationResult, setDeduplicationResult] = useState<DeduplicationResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [stats, setStats] = useState<{
    total_contacts: number;
    estimated_duplicates: number;
    potential_savings: number;
  } | null>(null);

  // إعدادات إزالة التكرار
  const [deduplicationOptions, setDeduplicationOptions] = useState<DeduplicationOptions>({
    auto_merge: false,
    similarity_threshold: 85,
    preserve_data: true,
    dry_run: false,
    batch_size: 50
  });

  // تحميل الإحصائيات عند بدء الصفحة
  useEffect(() => {
    loadQuickStats();
  }, []);

  // تحميل الإحصائيات السريعة
  const loadQuickStats = async () => {
    try {
      const quickStats = await contactDeduplicationService.getQuickStats();
      setStats(quickStats);
    } catch (error) {
      console.error('Error loading quick stats:', error);
    }
  };

  // تحميل معاينة المكررات
  const loadPreview = async () => {
    try {
      setIsLoading(true);
      setProgress(20);
      
      const duplicateContacts = await contactDeduplicationService.previewDuplicates(deduplicationOptions);
      setDuplicates(duplicateContacts);
      setProgress(100);
      
      toast.success(`تم العثور على ${duplicateContacts.length} جهة اتصال مكررة`);
    } catch (error) {
      console.error('Error loading preview:', error);
      toast.error('فشل في تحميل معاينة المكررات');
    } finally {
      setIsLoading(false);
    }
  };

  // تشغيل عملية إزالة التكرار الكاملة
  const runDeduplication = async () => {
    try {
      setIsLoading(true);
      setProgress(0);
      
      // محاكاة تقدم العملية
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);
      
      const result = await contactDeduplicationService.runFullDeduplication(deduplicationOptions);
      
      clearInterval(progressInterval);
      setProgress(100);
      setDeduplicationResult(result);
      
      // إعادة تحميل المعاينة والإحصائيات
      setTimeout(() => {
        loadPreview();
        loadQuickStats();
      }, 2000);
      
      toast.success(`تم دمج ${result.merged_contacts} جهة اتصال بنجاح!`);
      
    } catch (error) {
      console.error('Error running deduplication:', error);
      toast.error('فشل في تشغيل عملية إزالة التكرار');
    } finally {
      setIsLoading(false);
    }
  };

  // تشغيل تجريبي
  const runDryRun = async () => {
    try {
      setIsLoading(true);
      setProgress(0);
      
      const dryRunOptions = { ...deduplicationOptions, dry_run: true };
      const result = await contactDeduplicationService.runFullDeduplication(dryRunOptions);
      
      setDeduplicationResult(result);
      toast.success(`التشغيل التجريبي مكتمل! سيتم دمج ${result.merged_contacts} جهة اتصال`);
      
    } catch (error) {
      console.error('Error running dry run:', error);
      toast.error('فشل في التشغيل التجريبي');
    } finally {
      setIsLoading(false);
    }
  };

  // تصدير النتائج
  const exportResults = () => {
    if (!deduplicationResult) return;
    
    const dataStr = JSON.stringify(deduplicationResult, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deduplication-results-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('تم تصدير النتائج بنجاح');
  };

  // الحصول على لون المصدر
  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      'whatsapp_contacts': 'bg-green-100 text-green-800',
      'land_brokers': 'bg-blue-100 text-blue-800',
      'land_clients': 'bg-purple-100 text-purple-800',
      'property_owners': 'bg-orange-100 text-orange-800',
      'rental_tenants': 'bg-yellow-100 text-yellow-800'
    };
    return colors[source] || 'bg-gray-100 text-gray-800';
  };

  // الحصول على أيقونة المصدر
  const getSourceIcon = (source: string) => {
    const icons: Record<string, React.ReactNode> = {
      'whatsapp_contacts': <Phone className="h-3 w-3" />,
      'land_brokers': <Building2 className="h-3 w-3" />,
      'land_clients': <Users className="h-3 w-3" />,
      'property_owners': <Home className="h-3 w-3" />,
      'rental_tenants': <UserCheck className="h-3 w-3" />
    };
    return icons[source] || <Database className="h-3 w-3" />;
  };

  // الحصول على تسمية المصدر
  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      'whatsapp_contacts': 'WhatsApp',
      'land_brokers': 'الوسطاء',
      'land_clients': 'العملاء',
      'property_owners': 'الملاك',
      'rental_tenants': 'المستأجرين'
    };
    return labels[source] || source;
  };

  // الحصول على لون الأولوية
  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-green-100 text-green-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  // تصفية المكررات
  const filteredDuplicates = duplicates.filter(duplicate => {
    const matchesSearch = duplicate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         duplicate.phone.includes(searchTerm) ||
                         duplicate.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPriority = filterPriority === 'all' || duplicate.merge_priority === filterPriority;
    
    const matchesSource = filterSource === 'all' || duplicate.source_tables.includes(filterSource);
    
    return matchesSearch && matchesPriority && matchesSource;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* العنوان الرئيسي */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Merge className="h-8 w-8 text-blue-600" />
            إدارة إزالة التكرار في جهات الاتصال
          </CardTitle>
          <p className="text-gray-600 text-lg">
            نظام ذكي لإدارة مركزية لجهات الاتصال - جعل WhatsApp هو المصدر الأساسي وإزالة التكرار
          </p>
        </CardHeader>
      </Card>

      {/* الإحصائيات السريعة */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-800">{stats.total_contacts.toLocaleString()}</div>
                  <div className="text-sm text-blue-600">إجمالي جهات الاتصال</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-50 to-orange-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-orange-800">{stats.estimated_duplicates.toLocaleString()}</div>
                  <div className="text-sm text-orange-600">المكررات المقدرة</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Zap className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-800">{(stats.potential_savings / 1024).toFixed(1)} KB</div>
                  <div className="text-sm text-green-600">المساحة المحفوظة</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* أزرار التحكم الرئيسية */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-3 justify-center">
            <Button 
              onClick={() => window.location.href = '/whatsapp/deduplication-test'}
              variant="outline"
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <TestTube className="h-4 w-4 mr-2" />
              صفحة الاختبار
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/whatsapp/algorithm-test'}
              variant="outline"
              className="border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              <Zap className="h-4 w-4 mr-2" />
              اختبار الخوارزميات
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/whatsapp/deduplication-report'}
              variant="outline"
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              <FileText className="h-4 w-4 mr-2" />
              التقرير الشامل
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/whatsapp/working-deduplication'}
              variant="outline"
              className="border-green-200 text-green-700 hover:bg-green-50"
            >
              <Merge className="h-4 w-4 mr-2" />
              إزالة التكرار - تعمل فعلياً
            </Button>
            
                                 <Button 
                       onClick={() => window.location.href = '/whatsapp/real-deduplication'}
                       variant="outline"
                       className="border-red-200 text-red-700 hover:bg-red-50"
                     >
                       <Database className="h-4 w-4 mr-2" />
                       إزالة التكرار الحقيقية - قاعدة البيانات
                     </Button>
                     
                     <Button 
                       onClick={() => window.location.href = '/whatsapp/smart-sync'}
                       variant="outline"
                       className="border-green-200 text-green-700 hover:bg-green-50"
                     >
                       <Shuffle className="h-4 w-4 mr-2" />
                       المزامنة الذكية - حذف المكررات التلقائي
                     </Button>
            
            <Button 
              onClick={loadPreview}
              disabled={isLoading}
              variant="outline"
              size="lg"
              className="min-w-[200px]"
            >
              <Eye className="h-5 w-5 mr-2" />
              معاينة المكررات
            </Button>
            
            <Button 
              onClick={runDryRun}
              disabled={isLoading}
              variant="outline"
              size="lg"
              className="min-w-[200px]"
            >
              <Play className="h-5 w-5 mr-2" />
              تشغيل تجريبي
            </Button>
            
            <Button 
              onClick={runDeduplication}
              disabled={isLoading || duplicates.length === 0}
              size="lg"
              className="min-w-[200px] bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Merge className="h-5 w-5 mr-2" />
              )}
              تشغيل إزالة التكرار
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* شريط التقدم */}
      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span>جاري المعالجة...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* التبويبات الرئيسية */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="duplicates" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            المكررات ({filteredDuplicates.length})
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            النتائج
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            الإعدادات
          </TabsTrigger>
        </TabsList>

        {/* تبويب النظرة العامة */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                كيف يعمل النظام
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg text-blue-600">🎯 المبدأ الأساسي</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>WhatsApp كمصدر أساسي:</strong> جميع جهات الاتصال تُحفظ أو تُحدث في جدول WhatsApp</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>ربط ذكي:</strong> الجداول الأخرى تحتوي على مرجع لجهة الاتصال الأساسية</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>دمج البيانات:</strong> المعلومات من جميع المصادر تُدمج في جهة الاتصال الأساسية</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg text-green-600">🚀 المزايا</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <Zap className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span><strong>خوارزمية ذكية:</strong> كشف المكررات باستخدام درجة التشابه</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span><strong>حماية البيانات:</strong> لا يتم حذف أي بيانات، فقط ربط ودمج</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span><strong>معالجة في دفعات:</strong> أداء محسن للمجموعات الكبيرة</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب المكررات */}
        <TabsContent value="duplicates" className="space-y-6">
          {/* أدوات التصفية والبحث */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">البحث</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="اسم، هاتف، بريد..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>أولوية الدمج</Label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value as any)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="all">جميع الأولويات</option>
                    <option value="high">عالية</option>
                    <option value="medium">متوسطة</option>
                    <option value="low">منخفضة</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label>المصدر</Label>
                  <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="all">جميع المصادر</option>
                    <option value="whatsapp_contacts">WhatsApp</option>
                    <option value="land_brokers">الوسطاء</option>
                    <option value="land_clients">العملاء</option>
                    <option value="property_owners">الملاك</option>
                    <option value="rental_tenants">المستأجرين</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label>الإجراءات</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadPreview}
                      disabled={isLoading}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportResults}
                      disabled={!deduplicationResult}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* عرض المكررات */}
          {filteredDuplicates.length > 0 ? (
            <div className="space-y-4">
              {filteredDuplicates.map((duplicate, index) => (
                <Card key={duplicate.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-semibold">{duplicate.name}</h4>
                          <Badge className={getPriorityColor(duplicate.merge_priority)}>
                            {duplicate.merge_priority === 'high' ? 'أولوية عالية' : 
                             duplicate.merge_priority === 'medium' ? 'أولوية متوسطة' : 'أولوية منخفضة'}
                          </Badge>
                          <Badge variant="outline">
                            {duplicate.total_records} سجل
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {duplicate.phone}
                          </span>
                          {duplicate.email && (
                            <span>{duplicate.email}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-4 w-4" />
                            درجة التشابه: {duplicate.similarity_score}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {duplicate.data.map((sourceData, sourceIndex) => (
                        <div key={sourceIndex} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center gap-2 mb-3">
                            {getSourceIcon(sourceData.source)}
                            <Badge className={getSourceColor(sourceData.source)}>
                              {getSourceLabel(sourceData.source)}
                            </Badge>
                          </div>
                          <div className="text-sm space-y-2">
                            <div><strong>الاسم:</strong> {sourceData.name}</div>
                            <div><strong>الهاتف:</strong> {sourceData.phone}</div>
                            {sourceData.email && (
                              <div><strong>البريد:</strong> {sourceData.email}</div>
                            )}
                            {sourceData.company && (
                              <div><strong>الشركة:</strong> {sourceData.company}</div>
                            )}
                            {sourceData.notes && (
                              <div><strong>ملاحظات:</strong> {sourceData.notes}</div>
                            )}
                            {sourceData.created_at && (
                              <div className="text-xs text-gray-500">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {new Date(sourceData.created_at).toLocaleDateString('ar-SA')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : duplicates.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد مكررات</h3>
                <p className="text-gray-500">اضغط على "معاينة المكررات" للبدء</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Filter className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد نتائج</h3>
                <p className="text-gray-500">جرب تغيير معايير البحث أو التصفية</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* تبويب النتائج */}
        <TabsContent value="results" className="space-y-6">
          {deduplicationResult ? (
            <div className="space-y-6">
              {/* ملخص النتائج */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-6 w-6" />
                    تمت عملية إزالة التكرار بنجاح! 🎉
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {deduplicationResult.merged_contacts}
                      </div>
                      <div className="text-sm text-green-700">جهات اتصال مدمجة</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {deduplicationResult.summary.brokers}
                      </div>
                      <div className="text-sm text-blue-700">وسطاء مربوطين</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {deduplicationResult.summary.clients}
                      </div>
                      <div className="text-sm text-purple-700">عملاء مربوطين</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {deduplicationResult.summary.owners}
                      </div>
                      <div className="text-sm text-orange-700">ملاك مربوطين</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {deduplicationResult.summary.tenants}
                      </div>
                      <div className="text-sm text-yellow-700">مستأجرين مربوطين</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600">
                        {(deduplicationResult.summary.total_saved_space / 1024).toFixed(1)}
                      </div>
                      <div className="text-sm text-indigo-700">KB محفوظة</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-green-800 mb-3">✅ العمليات الناجحة</h4>
                      <div className="space-y-2">
                        {deduplicationResult.detailed_results.successful_merges.map((merge, index) => (
                          <div key={index} className="text-sm bg-green-100 p-2 rounded">
                            <strong>{merge.contact_name}</strong> - {merge.phone}
                            <br />
                            <span className="text-green-600">المصادر: {merge.merged_sources.join(', ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {deduplicationResult.detailed_results.failed_merges.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-red-800 mb-3">❌ العمليات الفاشلة</h4>
                        <div className="space-y-2">
                          {deduplicationResult.detailed_results.failed_merges.map((merge, index) => (
                            <div key={index} className="text-sm bg-red-100 p-2 rounded">
                              <strong>{merge.contact_name}</strong> - {merge.phone}
                              <br />
                              <span className="text-red-600">الخطأ: {merge.error}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {deduplicationResult.errors.length > 0 && (
                    <details className="mt-6">
                      <summary className="cursor-pointer text-sm text-red-600 font-semibold">
                        أخطاء ({deduplicationResult.errors.length})
                      </summary>
                      <ul className="mt-2 list-disc list-inside text-sm text-red-700 space-y-1">
                        {deduplicationResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                  
                  {deduplicationResult.warnings.length > 0 && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm text-yellow-600 font-semibold">
                        تحذيرات ({deduplicationResult.warnings.length})
                      </summary>
                      <ul className="mt-2 list-disc list-inside text-sm text-yellow-700 space-y-1">
                        {deduplicationResult.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                  
                  <div className="mt-6 flex gap-3">
                    <Button onClick={exportResults} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      تصدير النتائج
                    </Button>
                    <Button onClick={loadPreview} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      تحديث المعاينة
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد نتائج</h3>
                <p className="text-gray-500">قم بتشغيل عملية إزالة التكرار لرؤية النتائج</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* تبويب الإعدادات */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                إعدادات إزالة التكرار
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-merge">دمج تلقائي</Label>
                    <Switch
                      id="auto-merge"
                      checked={deduplicationOptions.auto_merge}
                      onCheckedChange={(checked) => 
                        setDeduplicationOptions(prev => ({ ...prev, auto_merge: checked }))
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="similarity-threshold">حد التشابه (%)</Label>
                    <Input
                      id="similarity-threshold"
                      type="number"
                      min="0"
                      max="100"
                      value={deduplicationOptions.similarity_threshold}
                      onChange={(e) => 
                        setDeduplicationOptions(prev => ({ 
                          ...prev, 
                          similarity_threshold: parseInt(e.target.value) || 85 
                        }))
                      }
                    />
                    <p className="text-xs text-gray-500">
                      درجة التشابه المطلوبة لاعتبار جهات الاتصال مكررة
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="preserve-data">الحفاظ على البيانات</Label>
                    <Switch
                      id="preserve-data"
                      checked={deduplicationOptions.preserve_data}
                      onCheckedChange={(checked) => 
                        setDeduplicationOptions(prev => ({ ...prev, preserve_data: checked }))
                      }
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dry-run">تشغيل تجريبي</Label>
                    <Switch
                      id="dry-run"
                      checked={deduplicationOptions.dry_run}
                      onCheckedChange={(checked) => 
                        setDeduplicationOptions(prev => ({ ...prev, dry_run: checked }))
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="batch-size">حجم الدفعة</Label>
                    <Input
                      id="batch-size"
                      type="number"
                      min="10"
                      max="200"
                      value={deduplicationOptions.batch_size}
                      onChange={(e) => 
                        setDeduplicationOptions(prev => ({ 
                          ...prev, 
                          batch_size: parseInt(e.target.value) || 50 
                        }))
                      }
                    />
                    <p className="text-xs text-gray-500">
                      عدد جهات الاتصال المعالجة في كل دفعة
                    </p>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      onClick={() => setDeduplicationOptions({
                        auto_merge: false,
                        similarity_threshold: 85,
                        preserve_data: true,
                        dry_run: false,
                        batch_size: 50
                      })}
                      variant="outline"
                      size="sm"
                    >
                      إعادة تعيين للإعدادات الافتراضية
                    </Button>
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


