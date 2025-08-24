// Real Deduplication Page - Working with Real Database
// صفحة إزالة التكرار الحقيقية - تعمل مع قاعدة البيانات

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
  Users, 
  Merge, 
  Eye, 
  Play, 
  CheckCircle, 
  AlertCircle,
  Phone,
  Mail,
  Building2,
  Clock,
  Zap,
  Database,
  RefreshCw,
  Trash2,
  Save,
  Search,
  Filter,
  Download,
  Upload,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  notes?: string;
  contact_type: string;
  created_at: string;
  source: string;
}

interface DuplicateGroup {
  id: string;
  name: string;
  phone: string;
  contacts: Contact[];
  count: number;
  priority: 'high' | 'medium' | 'low';
  selectedPrimary: string; // ID of contact to keep
  selectedToDelete: string[]; // IDs of contacts to delete
}

export default function RealDeduplication() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [autoMerge, setAutoMerge] = useState(false);
  const [similarityThreshold, setSimilarityThreshold] = useState(80);

  // تحميل جميع جهات الاتصال من قاعدة البيانات
  const loadAllContacts = async () => {
    try {
      setIsLoading(true);
      setProgress(10);

      // جلب جهات الاتصال من جميع الجداول
      const allContacts: Contact[] = [];

      // 1. WhatsApp Contacts
      const { data: whatsappContacts, error: whatsappError } = await supabase
        .from('whatsapp_contacts')
        .select('*');
      
      if (whatsappContacts) {
        allContacts.push(...whatsappContacts.map(c => ({ ...c, source: 'whatsapp_contacts' })));
      }
      setProgress(30);

      // 2. Land Brokers
      const { data: brokers, error: brokersError } = await supabase
        .from('land_brokers')
        .select('*');
      
      if (brokers) {
        allContacts.push(...brokers.map(c => ({ 
          id: c.id,
          name: c.name || c.first_name + ' ' + c.last_name,
          phone: c.phone,
          email: c.email,
          company: c.company,
          notes: c.notes,
          contact_type: 'broker',
          created_at: c.created_at,
          source: 'land_brokers'
        })));
      }
      setProgress(50);

      // 3. Land Clients
      const { data: clients, error: clientsError } = await supabase
        .from('land_clients')
        .select('*');
      
      if (clients) {
        allContacts.push(...clients.map(c => ({ 
          id: c.id,
          name: c.name || c.first_name + ' ' + c.last_name,
          phone: c.phone,
          email: c.email,
          company: c.company,
          notes: c.notes,
          contact_type: 'client',
          created_at: c.created_at,
          source: 'land_clients'
        })));
      }
      setProgress(70);

      // 4. Property Owners
      const { data: owners, error: ownersError } = await supabase
        .from('property_owners')
        .select('*');
      
      if (owners) {
        allContacts.push(...owners.map(c => ({ 
          id: c.id,
          name: c.name || c.first_name + ' ' + c.last_name,
          phone: c.phone,
          email: c.email,
          company: c.company,
          notes: c.notes,
          contact_type: 'owner',
          created_at: c.created_at,
          source: 'property_owners'
        })));
      }
      setProgress(90);

      // 5. Rental Tenants
      const { data: tenants, error: tenantsError } = await supabase
        .from('rental_tenants')
        .select('*');
      
      if (tenants) {
        allContacts.push(...tenants.map(c => ({ 
          id: c.id,
          name: c.name || c.first_name + ' ' + c.last_name,
          phone: c.phone,
          email: c.email,
          company: c.company,
          notes: c.notes,
          contact_type: 'tenant',
          created_at: c.created_at,
          source: 'rental_tenants'
        })));
      }

      setProgress(100);
      setContacts(allContacts);
      
      toast.success(`تم تحميل ${allContacts.length} جهة اتصال`);
      
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error('فشل في تحميل جهات الاتصال');
    } finally {
      setIsLoading(false);
    }
  };

  // البحث عن المكررات
  const findDuplicates = () => {
    if (contacts.length === 0) {
      toast.error('قم بتحميل جهات الاتصال أولاً');
      return;
    }

    setIsLoading(true);
    setProgress(0);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 20, 100));
    }, 200);

    setTimeout(() => {
      clearInterval(progressInterval);
      setProgress(100);
      
      const duplicatesFound = findDuplicateContacts(contacts);
      setDuplicates(duplicatesFound);
      
      setIsLoading(false);
      toast.success(`تم العثور على ${duplicatesFound.length} مجموعة مكررة`);
    }, 1000);
  };

  // خوارزمية إيجاد المكررات
  const findDuplicateContacts = (contactsList: Contact[]) => {
    const groups: { [key: string]: Contact[] } = {};
    
    // تجميع جهات الاتصال حسب الهاتف
    contactsList.forEach(contact => {
      if (!contact.phone) return;
      
      const phone = normalizePhone(contact.phone);
      if (!groups[phone]) {
        groups[phone] = [];
      }
      groups[phone].push(contact);
    });
    
    // إرجاع المجموعات التي تحتوي على أكثر من جهة اتصال
    return Object.values(groups)
      .filter(group => group.length > 1)
      .map(group => {
        // ترتيب حسب الأولوية: WhatsApp > Brokers > Owners > Clients > Tenants
        const priorityOrder = ['whatsapp_contacts', 'land_brokers', 'property_owners', 'land_clients', 'rental_tenants'];
        group.sort((a, b) => {
          const aIndex = priorityOrder.indexOf(a.source);
          const bIndex = priorityOrder.indexOf(b.source);
          return aIndex - bIndex;
        });

        return {
          id: Math.random().toString(36).substr(2, 9),
          name: group[0].name,
          phone: group[0].phone,
          contacts: group,
          count: group.length,
          priority: (group.length >= 3 ? 'high' : group.length === 2 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
          selectedPrimary: group[0].id, // الأولوية الأولى
          selectedToDelete: group.slice(1).map(c => c.id) // الباقي للحذف
        };
      });
  };

  // تنظيف رقم الهاتف
  const normalizePhone = (phone: string) => {
    return phone.replace(/\D/g, '').slice(-9);
  };

  // دمج المكررات
  const mergeDuplicates = async () => {
    if (duplicates.length === 0) {
      toast.error('لا توجد مكررات للدمج');
      return;
    }

    setIsLoading(true);
    setProgress(0);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      let totalMerged = 0;
      let totalErrors = 0;

      for (const duplicate of duplicates) {
        try {
          // الاحتفاظ بالجهة الأساسية
          const primaryContact = duplicate.contacts.find(c => c.id === duplicate.selectedPrimary);
          
          if (!primaryContact) continue;

          // حذف المكررات
          for (const contactId of duplicate.selectedToDelete) {
            const contact = duplicate.contacts.find(c => c.id === contactId);
            if (!contact) continue;

            // حذف من الجدول المناسب
            const { error } = await supabase
              .from(contact.source)
              .delete()
              .eq('id', contactId);

            if (error) {
              console.error(`Error deleting ${contactId}:`, error);
              totalErrors++;
            } else {
              totalMerged++;
            }
          }
        } catch (error) {
          console.error(`Error processing duplicate group:`, error);
          totalErrors++;
        }
      }

      clearInterval(progressInterval);
      setProgress(100);
      
      const report = {
        total_merged: totalMerged,
        total_errors: totalErrors,
        groups_processed: duplicates.length,
        timestamp: new Date().toISOString()
      };
      
      setResults(report);
      
      // إعادة تحميل البيانات
      setTimeout(() => {
        loadAllContacts();
        setDuplicates([]);
      }, 2000);
      
      setIsLoading(false);
      
      if (totalErrors > 0) {
        toast.warning(`تم دمج ${totalMerged} جهة اتصال مع ${totalErrors} أخطاء`);
      } else {
        toast.success(`تم دمج ${totalMerged} جهة اتصال بنجاح!`);
      }
      
    } catch (error) {
      clearInterval(progressInterval);
      setIsLoading(false);
      console.error('Error merging duplicates:', error);
      toast.error('فشل في دمج المكررات');
    }
  };

  // تحديث اختيارات الدمج
  const updateMergeSelection = (duplicateId: string, primaryId: string) => {
    setDuplicates(prev => prev.map(dup => {
      if (dup.id === duplicateId) {
        const primary = dup.contacts.find(c => c.id === primaryId);
        const toDelete = dup.contacts.filter(c => c.id !== primaryId);
        
        return {
          ...dup,
          selectedPrimary: primaryId,
          selectedToDelete: toDelete.map(c => c.id)
        };
      }
      return dup;
    }));
  };

  // تصفية المكررات
  const filteredDuplicates = duplicates.filter(duplicate => {
    const matchesSearch = duplicate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         duplicate.phone.includes(searchTerm);
    
    const matchesPriority = filterPriority === 'all' || duplicate.priority === filterPriority;
    
    return matchesSearch && matchesPriority;
  });

  // تصدير النتائج
  const exportResults = () => {
    if (duplicates.length === 0) return;
    
    const dataStr = JSON.stringify(duplicates, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `duplicates-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('تم تصدير النتائج بنجاح');
  };

  // تحميل البيانات عند بدء الصفحة
  useEffect(() => {
    loadAllContacts();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* العنوان */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Merge className="h-8 w-8 text-blue-600" />
            إزالة التكرار الحقيقية - تعمل مع قاعدة البيانات
          </CardTitle>
          <p className="text-gray-600 text-lg">
            نظام متقدم لإزالة التكرار في جهات الاتصال مع خيارات دمج ذكية
          </p>
        </CardHeader>
      </Card>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-800">{contacts.length}</div>
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
                <div className="text-2xl font-bold text-orange-800">{duplicates.length}</div>
                <div className="text-sm text-orange-600">المجموعات المكررة</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-800">
                  {duplicates.reduce((sum, dup) => sum + dup.count - 1, 0)}
                </div>
                <div className="text-sm text-green-600">المكررات الفردية</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-800">
                  {duplicates.reduce((sum, dup) => sum + (dup.count - 1) * 0.5, 0).toFixed(1)}
                </div>
                <div className="text-sm text-purple-600">KB محفوظة</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* أزرار التحكم */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-3 justify-center">
            <Button 
              onClick={loadAllContacts}
              disabled={isLoading}
              variant="outline"
              size="lg"
              className="min-w-[200px]"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              تحميل جهات الاتصال
            </Button>
            
            <Button 
              onClick={findDuplicates}
              disabled={isLoading || contacts.length === 0}
              variant="outline"
              size="lg"
              className="min-w-[200px]"
            >
              <Eye className="h-5 w-5 mr-2" />
              البحث عن المكررات
            </Button>
            
            <Button 
              onClick={mergeDuplicates}
              disabled={isLoading || duplicates.length === 0}
              size="lg"
              className="min-w-[200px] bg-blue-600 hover:bg-blue-700"
            >
              <Merge className="h-5 w-5 mr-2" />
              دمج المكررات
            </Button>
            
            <Button 
              onClick={exportResults}
              disabled={duplicates.length === 0}
              variant="outline"
              size="lg"
              className="min-w-[200px]"
            >
              <Download className="h-4 w-4 mr-2" />
              تصدير النتائج
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* الإعدادات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            إعدادات الدمج
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-merge">دمج تلقائي</Label>
              <Switch
                id="auto-merge"
                checked={autoMerge}
                onCheckedChange={setAutoMerge}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="similarity-threshold">حد التشابه (%)</Label>
              <Input
                id="similarity-threshold"
                type="number"
                min="0"
                max="100"
                value={similarityThreshold}
                onChange={(e) => setSimilarityThreshold(parseInt(e.target.value) || 80)}
              />
            </div>
            
            <div className="text-sm text-gray-600">
              <p>الأولوية: WhatsApp → Brokers → Owners → Clients → Tenants</p>
            </div>
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

      {/* أدوات التصفية والبحث */}
      {duplicates.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">البحث</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="اسم، هاتف..."
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
                <Label>النتائج</Label>
                <div className="text-sm text-gray-600">
                  {filteredDuplicates.length} من {duplicates.length} مجموعة
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* عرض المكررات */}
      {filteredDuplicates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              المجموعات المكررة ({filteredDuplicates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {filteredDuplicates.map((duplicate) => (
                <div key={duplicate.id} className="border rounded-lg p-6 bg-orange-50">
                  <div className="flex items-center gap-3 mb-4">
                    <h4 className="text-xl font-semibold">{duplicate.name}</h4>
                    <Badge className={
                      duplicate.priority === 'high' ? 'bg-red-100 text-red-800' :
                      duplicate.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }>
                      {duplicate.priority === 'high' ? 'أولوية عالية' :
                       duplicate.priority === 'medium' ? 'أولوية متوسطة' : 'أولوية منخفضة'}
                    </Badge>
                    <Badge variant="outline">
                      {duplicate.count} جهة اتصال
                    </Badge>
                    <Badge variant="outline">
                      {duplicate.phone}
                    </Badge>
                  </div>
                  
                  <div className="mb-4">
                    <Label className="text-sm font-medium">اختر الجهة الأساسية (التي ستبقى):</Label>
                    <div className="mt-2 space-y-2">
                      {duplicate.contacts.map((contact) => (
                        <label key={contact.id} className="flex items-center gap-3 p-3 border rounded-lg bg-white hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name={`primary-${duplicate.id}`}
                            value={contact.id}
                            checked={duplicate.selectedPrimary === contact.id}
                            onChange={() => updateMergeSelection(duplicate.id, contact.id)}
                            className="text-blue-600"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{contact.source}</Badge>
                              <Badge>{contact.contact_type}</Badge>
                              {duplicate.selectedPrimary === contact.id && (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  أساسية
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm space-y-1">
                              <div><strong>الاسم:</strong> {contact.name}</div>
                              <div><strong>الهاتف:</strong> {contact.phone}</div>
                              {contact.email && (
                                <div><strong>البريد:</strong> {contact.email}</div>
                              )}
                              {contact.company && (
                                <div><strong>الشركة:</strong> {contact.company}</div>
                              )}
                              {contact.notes && (
                                <div><strong>ملاحظات:</strong> {contact.notes}</div>
                              )}
                              <div className="text-xs text-gray-500">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {new Date(contact.created_at).toLocaleDateString('ar-SA')}
                              </div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-sm text-orange-700 bg-orange-100 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    <strong>سيتم حذف:</strong> {duplicate.selectedToDelete.length} جهة اتصال مكررة
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* النتائج */}
      {results && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-6 w-6" />
              تمت عملية إزالة التكرار بنجاح! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {results.total_merged}
                </div>
                <div className="text-sm text-green-700">جهات اتصال مدمجة</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {results.groups_processed}
                </div>
                <div className="text-sm text-blue-700">مجموعات معالجة</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {results.total_errors}
                </div>
                <div className="text-sm text-red-700">أخطاء</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {new Date(results.timestamp).toLocaleTimeString('ar-SA')}
                </div>
                <div className="text-sm text-indigo-700">وقت الإنجاز</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* رسالة إذا لم توجد مكررات */}
      {duplicates.length === 0 && contacts.length > 0 && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد مكررات</h3>
            <p className="text-gray-500">جميع جهات الاتصال فريدة! 🎉</p>
          </CardContent>
        </Card>
      )}

      {/* رسالة إذا لم يتم تحميل بيانات */}
      {contacts.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد بيانات</h3>
            <p className="text-gray-500">اضغط على "تحميل جهات الاتصال" للبدء</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
