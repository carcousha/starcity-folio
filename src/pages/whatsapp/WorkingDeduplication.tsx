import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Users, Merge, Eye, CheckCircle, AlertCircle, Phone, Database } from 'lucide-react';

// بيانات تجريبية
const mockContacts = [
  { id: 1, name: 'أحمد محمد', phone: '0123456789', source: 'whatsapp' },
  { id: 2, name: 'أحمد محمد', phone: '0123456789', source: 'brokers' },
  { id: 3, name: 'أحمد محمد', phone: '0123456789', source: 'clients' },
  { id: 4, name: 'فاطمة علي', phone: '0987654321', source: 'whatsapp' },
  { id: 5, name: 'فاطمة علي', phone: '0987654321', source: 'owners' },
  { id: 6, name: 'محمد أحمد', phone: '0555555555', source: 'whatsapp' },
  { id: 7, name: 'محمد أحمد', phone: '0555555555', source: 'tenants' }
];

export default function WorkingDeduplication() {
  const [contacts, setContacts] = useState(mockContacts);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);

  // البحث عن المكررات
  const findDuplicates = () => {
    setIsLoading(true);
    setProgress(0);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 20, 100));
    }, 300);

    setTimeout(() => {
      clearInterval(progressInterval);
      setProgress(100);
      
      // خوارزمية بسيطة لإيجاد المكررات
      const duplicatesFound = findDuplicateContacts(contacts);
      setDuplicates(duplicatesFound);
      
      setIsLoading(false);
      toast.success(`تم العثور على ${duplicatesFound.length} مجموعة مكررة`);
    }, 1500);
  };

  // إيجاد المكررات
  const findDuplicateContacts = (contactsList: any[]) => {
    const groups: { [key: string]: any[] } = {};
    
    contactsList.forEach(contact => {
      const phone = contact.phone;
      if (!groups[phone]) {
        groups[phone] = [];
      }
      groups[phone].push(contact);
    });
    
    return Object.values(groups)
      .filter(group => group.length > 1)
      .map(group => ({
        id: Math.random().toString(36).substr(2, 9),
        phone: group[0].phone,
        name: group[0].name,
        contacts: group,
        count: group.length,
        priority: group.length >= 3 ? 'high' : 'medium'
      }));
  };

  // دمج المكررات
  const mergeDuplicates = () => {
    if (duplicates.length === 0) {
      toast.error('لا توجد مكررات للدمج');
      return;
    }

    setIsLoading(true);
    setProgress(0);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    setTimeout(() => {
      clearInterval(progressInterval);
      setProgress(100);
      
      const mergedContacts = mergeDuplicateContacts(contacts, duplicates);
      setContacts(mergedContacts);
      
      const report = {
        total_merged: duplicates.reduce((sum, dup) => sum + dup.count - 1, 0),
        groups_processed: duplicates.length,
        contacts_after_merge: mergedContacts.length,
        saved_space: duplicates.reduce((sum, dup) => sum + (dup.count - 1) * 0.5, 0),
        timestamp: new Date().toISOString()
      };
      
      setResults(report);
      setDuplicates([]);
      setIsLoading(false);
      
      toast.success(`تم دمج ${report.total_merged} جهة اتصال بنجاح!`);
    }, 2000);
  };

  // دمج جهات الاتصال المكررة
  const mergeDuplicateContacts = (contactsList: any[], duplicatesList: any[]) => {
    const mergedContacts = [...contactsList];
    
    duplicatesList.forEach(duplicate => {
      const firstContact = duplicate.contacts[0];
      const contactsToRemove = duplicate.contacts.slice(1);
      
      contactsToRemove.forEach(contactToRemove => {
        const index = mergedContacts.findIndex(c => c.id === contactToRemove.id);
        if (index !== -1) {
          mergedContacts.splice(index, 1);
        }
      });
    });
    
    return mergedContacts;
  };

  // إعادة تعيين البيانات
  const resetData = () => {
    setContacts(mockContacts);
    setDuplicates([]);
    setResults(null);
    setProgress(0);
    toast.info('تم إعادة تعيين البيانات');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Merge className="h-8 w-8 text-blue-600" />
            إزالة التكرار - تعمل فعلياً
          </CardTitle>
          <p className="text-gray-600 text-lg">
            نظام مبسط لإزالة التكرار في جهات الاتصال
          </p>
        </CardHeader>
      </Card>

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
              <Phone className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-800">
                  {(duplicates.reduce((sum, dup) => sum + (dup.count - 1) * 0.5, 0)).toFixed(1)}
                </div>
                <div className="text-sm text-purple-600">KB محفوظة</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-3 justify-center">
            <Button 
              onClick={findDuplicates}
              disabled={isLoading}
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
              onClick={resetData}
              disabled={isLoading}
              variant="outline"
              size="lg"
              className="min-w-[200px]"
            >
              إعادة تعيين
            </Button>
          </div>
        </CardContent>
      </Card>

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

      {duplicates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              المجموعات المكررة ({duplicates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {duplicates.map((duplicate) => (
                <div key={duplicate.id} className="border rounded-lg p-4 bg-orange-50">
                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="font-semibold text-lg">{duplicate.name}</h4>
                    <Badge className={
                      duplicate.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }>
                      {duplicate.priority === 'high' ? 'أولوية عالية' : 'أولوية متوسطة'}
                    </Badge>
                    <Badge variant="outline">
                      {duplicate.count} جهة اتصال
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {duplicate.contacts.map((contact: any, index: number) => (
                      <div key={index} className="border rounded p-3 bg-white">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{contact.source}</Badge>
                          <Badge>{contact.id}</Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <div><strong>الاسم:</strong> {contact.name}</div>
                          <div><strong>الهاتف:</strong> {contact.phone}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                <div className="text-2xl font-bold text-purple-600">
                  {results.contacts_after_merge}
                </div>
                <div className="text-sm text-purple-700">بعد الدمج</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {results.saved_space.toFixed(1)}
                </div>
                <div className="text-sm text-indigo-700">KB محفوظة</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            جهات الاتصال الحالية ({contacts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map((contact) => (
              <div key={contact.id} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{contact.source}</Badge>
                  <Badge>{contact.id}</Badge>
                </div>
                <div className="text-sm space-y-1">
                  <div><strong>الاسم:</strong> {contact.name}</div>
                  <div><strong>الهاتف:</strong> {contact.phone}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
