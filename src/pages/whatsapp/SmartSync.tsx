// Smart Sync Page - مزامنة ذكية للأرقام الجديدة فقط مع حذف المكررات التلقائي
// صفحة المزامنة الذكية

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Phone,
  Users,
  Database,
  Zap,
  ArrowRight,
  ArrowLeft,
  Link,
  Unlink,
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  Play,
  Pause,
  Stop,
  Info,
  Clock,
  BarChart3,
  Merge,
  Trash2,
  Shield,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ContactSyncService, ContactSyncResult } from '@/services/contactSyncService';

interface SyncStats {
  total_contacts: number;
  synced_contacts: number;
  pending_sync: number;
  sync_errors: number;
}

interface SyncResult {
  action: 'created' | 'updated' | 'merged' | 'skipped';
  message: string;
  contactId?: string;
  source: string;
  phone: string;
  name: string;
  mergedData?: any;
}

export default function SmartSync() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<'all' | 'created' | 'updated' | 'merged' | 'skipped'>('all');
  const [autoSync, setAutoSync] = useState(false);
  const [syncInterval, setSyncInterval] = useState(5); // دقائق

  // تحميل الإحصائيات عند بدء الصفحة
  useEffect(() => {
    loadSyncStats();
  }, []);

  // تحميل إحصائيات المزامنة
  const loadSyncStats = async () => {
    try {
      const stats = await ContactSyncService.getSyncStats();
      setSyncStats(stats);
    } catch (error) {
      console.error('Error loading sync stats:', error);
    }
  };

  // مزامنة ذكية للوسطاء
  const syncBrokers = async () => {
    try {
      setIsLoading(true);
      setProgress(0);
      
      // جلب الوسطاء الذين ليس لديهم whatsapp_contact_id
      const { data: brokers, error } = await supabase
        .from('land_brokers')
        .select('*')
        .is('whatsapp_contact_id', null);

      if (error) throw error;

      const results: SyncResult[] = [];
      let processed = 0;

      for (const broker of brokers || []) {
        try {
          const result = await ContactSyncService.syncBrokerToWhatsApp(broker);
          
          results.push({
            action: result.action,
            message: result.message,
            contactId: result.contactId,
            source: 'land_brokers',
            phone: broker.phone,
            name: broker.name || `${broker.first_name} ${broker.last_name}`,
            mergedData: result.mergedData
          });

          processed++;
          setProgress((processed / brokers.length) * 100);
          
          // تأخير صغير لتجنب الضغط على قاعدة البيانات
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Error syncing broker ${broker.id}:`, error);
          results.push({
            action: 'skipped',
            message: 'فشل في المزامنة',
            source: 'land_brokers',
            phone: broker.phone,
            name: broker.name || `${broker.first_name} ${broker.last_name}`
          });
        }
      }

      setSyncResults(prev => [...prev, ...results]);
      toast.success(`تم مزامنة ${brokers.length} وسيط`);
      
    } catch (error) {
      console.error('Error syncing brokers:', error);
      toast.error('فشل في مزامنة الوسطاء');
    } finally {
      setIsLoading(false);
      setProgress(0);
      loadSyncStats();
    }
  };

  // مزامنة ذكية للعملاء
  const syncClients = async () => {
    try {
      setIsLoading(true);
      setProgress(0);
      
      const { data: clients, error } = await supabase
        .from('land_clients')
        .select('*')
        .is('whatsapp_contact_id', null);

      if (error) throw error;

      const results: SyncResult[] = [];
      let processed = 0;

      for (const client of clients || []) {
        try {
          const result = await ContactSyncService.syncClientToWhatsApp(client);
          
          results.push({
            action: result.action,
            message: result.message,
            contactId: result.contactId,
            source: 'land_clients',
            phone: client.phone,
            name: client.name || `${client.first_name} ${client.last_name}`,
            mergedData: result.mergedData
          });

          processed++;
          setProgress((processed / clients.length) * 100);
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Error syncing client ${client.id}:`, error);
          results.push({
            action: 'skipped',
            message: 'فشل في المزامنة',
            source: 'land_clients',
            phone: client.phone,
            name: client.name || `${client.first_name} ${client.last_name}`
          });
        }
      }

      setSyncResults(prev => [...prev, ...results]);
      toast.success(`تم مزامنة ${clients.length} عميل`);
      
    } catch (error) {
      console.error('Error syncing clients:', error);
      toast.error('فشل في مزامنة العملاء');
    } finally {
      setIsLoading(false);
      setProgress(0);
      loadSyncStats();
    }
  };

  // مزامنة ذكية للملاك
  const syncOwners = async () => {
    try {
      setIsLoading(true);
      setProgress(0);
      
      const { data: owners, error } = await supabase
        .from('property_owners')
        .select('*')
        .is('whatsapp_contact_id', null);

      if (error) throw error;

      const results: SyncResult[] = [];
      let processed = 0;

      for (const owner of owners || []) {
        try {
          const result = await ContactSyncService.syncOwnerToWhatsApp(owner);
          
          results.push({
            action: result.action,
            message: result.message,
            contactId: result.contactId,
            source: 'property_owners',
            phone: owner.phone,
            name: owner.name || `${owner.first_name} ${owner.last_name}`,
            mergedData: result.mergedData
          });

          processed++;
          setProgress((processed / owners.length) * 100);
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Error syncing owner ${owner.id}:`, error);
          results.push({
            action: 'skipped',
            message: 'فشل في المزامنة',
            source: 'property_owners',
            phone: owner.phone,
            name: owner.name || `${owner.first_name} ${owner.last_name}`
          });
        }
      }

      setSyncResults(prev => [...prev, ...results]);
      toast.success(`تم مزامنة ${owners.length} مالك`);
      
    } catch (error) {
      console.error('Error syncing owners:', error);
      toast.error('فشل في مزامنة الملاك');
    } finally {
      setIsLoading(false);
      setProgress(0);
      loadSyncStats();
    }
  };

  // مزامنة ذكية للمستأجرين
  const syncTenants = async () => {
    try {
      setIsLoading(true);
      setProgress(0);
      
      const { data: tenants, error } = await supabase
        .from('rental_tenants')
        .select('*')
        .is('whatsapp_contact_id', null);

      if (error) throw error;

      const results: SyncResult[] = [];
      let processed = 0;

      for (const tenant of tenants || []) {
        try {
          const result = await ContactSyncService.syncTenantToWhatsApp(tenant);
          
          results.push({
            action: result.action,
            message: result.message,
            contactId: result.contactId,
            source: 'rental_tenants',
            phone: tenant.phone,
            name: tenant.name || `${tenant.first_name} ${tenant.last_name}`,
            mergedData: result.mergedData
          });

          processed++;
          setProgress((processed / tenants.length) * 100);
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Error syncing tenant ${tenant.id}:`, error);
          results.push({
            action: 'skipped',
            message: 'فشل في المزامنة',
            source: 'rental_tenants',
            phone: tenant.phone,
            name: tenant.name || `${tenant.first_name} ${tenant.last_name}`
          });
        }
      }

      setSyncResults(prev => [...prev, ...results]);
      toast.success(`تم مزامنة ${tenants.length} مستأجر`);
      
    } catch (error) {
      console.error('Error syncing tenants:', error);
      toast.error('فشل في مزامنة المستأجرين');
    } finally {
      setIsLoading(false);
      setProgress(0);
      loadSyncStats();
    }
  };

  // مزامنة شاملة للأرقام الجديدة فقط
  const syncAllNew = async () => {
    try {
      setIsLoading(true);
      setProgress(0);
      
      toast.info('بدء المزامنة الشاملة للأرقام الجديدة مع حذف المكررات التلقائي...');
      
      // مزامنة كل نوع على حدة
      await syncBrokers();
      setProgress(25);
      
      await syncClients();
      setProgress(50);
      
      await syncOwners();
      setProgress(75);
      
      await syncTenants();
      setProgress(100);
      
      toast.success('تمت المزامنة الشاملة بنجاح!');
      
    } catch (error) {
      console.error('Error in comprehensive sync:', error);
      toast.error('فشل في المزامنة الشاملة');
    } finally {
      setIsLoading(false);
      setProgress(0);
      loadSyncStats();
    }
  };

  // تصفية النتائج
  const filteredResults = syncResults.filter(result => {
    const matchesSearch = result.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.phone.includes(searchTerm) ||
                         result.source.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = filterAction === 'all' || result.action === filterAction;
    
    return matchesSearch && matchesAction;
  });

  // تصدير النتائج
  const exportResults = () => {
    if (syncResults.length === 0) return;
    
    const dataStr = JSON.stringify(syncResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sync-results-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('تم تصدير النتائج بنجاح');
  };

  // مسح النتائج
  const clearResults = () => {
    setSyncResults([]);
    toast.success('تم مسح النتائج');
  };

  // الحصول على لون الإجراء
  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      'created': 'bg-green-100 text-green-800',
      'updated': 'bg-blue-100 text-blue-800',
      'merged': 'bg-purple-100 text-purple-800',
      'skipped': 'bg-yellow-100 text-yellow-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  // الحصول على لون المصدر
  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      'land_brokers': 'bg-blue-100 text-blue-800',
      'land_clients': 'bg-purple-100 text-purple-800',
      'property_owners': 'bg-orange-100 text-orange-800',
      'rental_tenants': 'bg-yellow-100 text-yellow-800'
    };
    return colors[source] || 'bg-gray-100 text-gray-800';
  };

  // الحصول على تسمية المصدر
  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      'land_brokers': 'الوسطاء',
      'land_clients': 'العملاء',
      'property_owners': 'الملاك',
      'rental_tenants': 'المستأجرين'
    };
    return labels[source] || source;
  };

  // الحصول على إحصائيات المكررات المحذوفة
  const getMergedStats = () => {
    const mergedResults = syncResults.filter(r => r.action === 'merged');
    const totalDuplicates = mergedResults.reduce((sum, r) => 
      sum + (r.mergedData?.deletedDuplicates || 0), 0
    );
    const totalMergedFields = mergedResults.reduce((sum, r) => 
      sum + (r.mergedData?.mergedFields?.length || 0), 0
    );
    
    return { totalDuplicates, totalMergedFields, mergedCount: mergedResults.length };
  };

  const mergedStats = getMergedStats();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* العنوان */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Link className="h-8 w-8 text-blue-600" />
            المزامنة الذكية - للأرقام الجديدة فقط مع حذف المكررات التلقائي
          </CardTitle>
          <p className="text-gray-600 text-lg">
            نظام مزامنة ذكي يضيف الأرقام الجديدة فقط ويحذف المكررات تلقائياً مع دمج البيانات
          </p>
        </CardHeader>
      </Card>

      {/* الإحصائيات */}
      {syncStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-800">{syncStats.total_contacts}</div>
                  <div className="text-sm text-blue-600">إجمالي جهات الاتصال</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-800">{syncStats.synced_contacts}</div>
                  <div className="text-sm text-green-600">مزامنة</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-50 to-orange-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-orange-800">{syncStats.pending_sync}</div>
                  <div className="text-sm text-orange-600">في انتظار المزامنة</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-red-50 to-red-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-800">{syncStats.sync_errors}</div>
                  <div className="text-sm text-red-700">أخطاء</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* إحصائيات المكررات المحذوفة */}
      {mergedStats.mergedCount > 0 && (
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-800">{mergedStats.mergedCount}</div>
                <div className="text-sm text-purple-600">عمليات دمج</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-800">{mergedStats.totalDuplicates}</div>
                <div className="text-sm text-purple-600">مكررات محذوفة</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-800">{mergedStats.totalMergedFields}</div>
                <div className="text-sm text-purple-600">حقول مدمجة</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* أزرار المزامنة */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
              onClick={syncBrokers}
              disabled={isLoading}
              variant="outline"
              size="lg"
              className="h-20 flex-col"
            >
              <Users className="h-6 w-6 mb-2" />
              مزامنة الوسطاء
            </Button>
            
            <Button 
              onClick={syncClients}
              disabled={isLoading}
              variant="outline"
              size="lg"
              className="h-20 flex-col"
            >
              <Users className="h-6 w-6 mb-2" />
              مزامنة العملاء
            </Button>
            
            <Button 
              onClick={syncOwners}
              disabled={isLoading}
              variant="outline"
              size="lg"
              className="h-20 flex-col"
            >
              <Users className="h-6 w-6 mb-2" />
              مزامنة الملاك
            </Button>
            
            <Button 
              onClick={syncTenants}
              disabled={isLoading}
              variant="outline"
              size="lg"
              className="h-20 flex-col"
            >
              <Users className="h-6 w-6 mb-2" />
              مزامنة المستأجرين
            </Button>
            
            <Button 
              onClick={syncAllNew}
              disabled={isLoading}
              size="lg"
              className="h-20 flex-col bg-blue-600 hover:bg-blue-700"
            >
              <Zap className="h-6 w-6 mb-2" />
              مزامنة شاملة
            </Button>
            
            <Button 
              onClick={loadSyncStats}
              disabled={isLoading}
              variant="outline"
              size="lg"
              className="h-20 flex-col"
            >
              <RefreshCw className="h-6 w-6 mb-2" />
              تحديث الإحصائيات
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
                <span>جاري المزامنة...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* التبويبات */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <Button
                variant={activeTab === 'overview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('overview')}
              >
                <Info className="h-4 w-4 mr-2" />
                نظرة عامة
              </Button>
              <Button
                variant={activeTab === 'results' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('results')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                نتائج المزامنة ({syncResults.length})
              </Button>
              <Button
                variant={activeTab === 'merged' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('merged')}
                disabled={mergedStats.mergedCount === 0}
              >
                <Merge className="h-4 w-4 mr-2" />
                المكررات المحذوفة ({mergedStats.mergedCount})
              </Button>
              <Button
                variant={activeTab === 'settings' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('settings')}
              >
                <Settings className="h-4 w-4 mr-2" />
                الإعدادات
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={exportResults} disabled={syncResults.length === 0} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                تصدير
              </Button>
              <Button onClick={clearResults} disabled={syncResults.length === 0} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                مسح
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* تبويب النظرة العامة */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg text-blue-600">🎯 كيف تعمل المزامنة الذكية</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>فحص الأرقام الموجودة:</strong> النظام يتحقق من وجود الرقم في WhatsApp قبل الإضافة</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>تحديث البيانات:</strong> إذا كان الرقم موجود، يتم تحديث البيانات فقط</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>إضافة جديدة:</strong> إذا كان الرقم جديد، يتم إنشاء جهة اتصال جديدة</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>ربط ذكي:</strong> ربط السجل الأصلي بجهة الاتصال في WhatsApp</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg text-green-600">🚀 المزايا الجديدة</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <Zap className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span><strong>حذف تلقائي للمكررات:</strong> النظام يحذف المكررات تلقائياً</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Zap className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span><strong>دمج ذكي للبيانات:</strong> الاحتفاظ بالبيانات الأفضل من كل مصدر</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Zap className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span><strong>أولوية للبيانات القديمة:</strong> الاحتفاظ بالسجل الأقدم كأساس</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Zap className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span><strong>تحديث تلقائي:</strong> البيانات تُحدث عند تغييرها</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* معلومات إضافية عن حذف المكررات */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-lg text-purple-700 mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  نظام حذف المكررات التلقائي
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-700">
                  <div>
                    <h5 className="font-medium mb-2">🔍 كيف يتم اكتشاف المكررات:</h5>
                    <ul className="space-y-1">
                      <li>• البحث عن نفس رقم الهاتف</li>
                      <li>• ترتيب حسب تاريخ الإنشاء (الأقدم أولاً)</li>
                      <li>• الاحتفاظ بالسجل الأساسي</li>
                      <li>• حذف المكررات تلقائياً</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">🔄 كيف يتم دمج البيانات:</h5>
                    <ul className="space-y-1">
                      <li>• الأسماء: الاحتفاظ بالأطول والأكثر اكتمالاً</li>
                      <li>• البريد: الاحتفاظ بالصحيح</li>
                      <li>• الشركة: الاحتفاظ بالأطول</li>
                      <li>• الملاحظات: دمج الجديد مع القديم</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* تبويب نتائج المزامنة */}
          {activeTab === 'results' && (
            <div className="space-y-6">
              {/* أدوات التصفية */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">البحث</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="اسم، هاتف، مصدر..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>نوع الإجراء</Label>
                  <select
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value as any)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="all">جميع الإجراءات</option>
                    <option value="created">تم الإنشاء</option>
                    <option value="updated">تم التحديث</option>
                    <option value="merged">تم الدمج</option>
                    <option value="skipped">تم التخطي</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label>النتائج</Label>
                  <div className="text-sm text-gray-600">
                    {filteredResults.length} من {syncResults.length} نتيجة
                  </div>
                </div>
              </div>

              {/* عرض النتائج */}
              {filteredResults.length > 0 ? (
                <div className="space-y-4">
                  {filteredResults.map((result, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge className={getActionColor(result.action)}>
                              {result.action === 'created' ? 'تم الإنشاء' :
                               result.action === 'updated' ? 'تم التحديث' :
                               result.action === 'merged' ? 'تم الدمج' : 'تم التخطي'}
                            </Badge>
                            <Badge className={getSourceColor(result.source)}>
                              {getSourceLabel(result.source)}
                            </Badge>
                            {result.action === 'merged' && result.mergedData && (
                              <Badge className="bg-purple-100 text-purple-800">
                                <Merge className="h-3 w-3 mr-1" />
                                {result.mergedData.deletedDuplicates} مكرر محذوف
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date().toLocaleTimeString('ar-SA')}
                          </div>
                        </div>
                        
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{result.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span>{result.name}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {result.message}
                          </div>
                          
                          {/* معلومات الدمج */}
                          {result.action === 'merged' && result.mergedData && (
                            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                              <h5 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                تفاصيل الدمج:
                              </h5>
                              <div className="text-sm text-purple-700 space-y-1">
                                <div>• تم حذف {result.mergedData.deletedDuplicates} مكرر</div>
                                {result.mergedData.mergedFields && result.mergedData.mergedFields.length > 0 && (
                                  <div>• الحقول المحدثة: {result.mergedData.mergedFields.join(', ')}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : syncResults.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد نتائج</h3>
                  <p className="text-gray-500">قم بتشغيل المزامنة لرؤية النتائج</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Filter className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد نتائج</h3>
                  <p className="text-gray-500">جرب تغيير معايير البحث أو التصفية</p>
                </div>
              )}
            </div>
          )}

          {/* تبويب المكررات المحذوفة */}
          {activeTab === 'merged' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <Merge className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-purple-800 mb-2">المكررات المحذوفة تلقائياً</h3>
                <p className="text-purple-600">تم حذف {mergedStats.totalDuplicates} مكرر تلقائياً مع دمج البيانات</p>
              </div>

              {syncResults.filter(r => r.action === 'merged').length > 0 ? (
                <div className="space-y-4">
                  {syncResults.filter(r => r.action === 'merged').map((result, index) => (
                    <Card key={index} className="border-l-4 border-l-purple-500 bg-purple-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge className="bg-purple-100 text-purple-800">
                            <Merge className="h-4 w-4 mr-1" />
                            تم الدمج
                          </Badge>
                          <Badge className={getSourceColor(result.source)}>
                            {getSourceLabel(result.source)}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div><strong>الاسم:</strong> {result.name}</div>
                          <div><strong>الهاتف:</strong> {result.phone}</div>
                          <div><strong>الرسالة:</strong> {result.message}</div>
                          
                          {result.mergedData && (
                            <div className="mt-3 p-3 bg-white border border-purple-200 rounded-lg">
                              <h5 className="font-medium text-purple-800 mb-2">تفاصيل العملية:</h5>
                              <div className="text-sm text-purple-700 space-y-1">
                                <div>• تم حذف {result.mergedData.deletedDuplicates} مكرر</div>
                                {result.mergedData.mergedFields && result.mergedData.mergedFields.length > 0 && (
                                  <div>• الحقول المحدثة: {result.mergedData.mergedFields.join(', ')}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-600 mb-2">لا توجد مكررات</h3>
                  <p className="text-green-500">جميع جهات الاتصال فريدة! 🎉</p>
                </div>
              )}
            </div>
          )}

          {/* تبويب الإعدادات */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-sync">مزامنة تلقائية</Label>
                    <Switch
                      id="auto-sync"
                      checked={autoSync}
                      onCheckedChange={setAutoSync}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sync-interval">فترة المزامنة (دقائق)</Label>
                    <Input
                      id="sync-interval"
                      type="number"
                      min="1"
                      max="60"
                      value={syncInterval}
                      onChange={(e) => setSyncInterval(parseInt(e.target.value) || 5)}
                    />
                    <p className="text-xs text-gray-500">
                      المزامنة التلقائية تعمل كل {syncInterval} دقائق
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg text-blue-600">معلومات النظام</h4>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p><strong>آخر تحديث:</strong> {new Date().toLocaleString('ar-SA')}</p>
                    <p><strong>حالة المزامنة:</strong> {isLoading ? 'جاري العمل' : 'جاهز'}</p>
                    <p><strong>إجمالي النتائج:</strong> {syncResults.length}</p>
                    <p><strong>المزامنة التلقائية:</strong> {autoSync ? 'مفعلة' : 'معطلة'}</p>
                    <p><strong>المكررات المحذوفة:</strong> {mergedStats.totalDuplicates}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
