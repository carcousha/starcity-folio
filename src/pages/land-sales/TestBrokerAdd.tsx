// Test Broker Add Page - لاختبار إضافة الوسطاء
// صفحة اختبار إضافة وسطاء الأراضي

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, Database, User, Users } from 'lucide-react';

interface BrokerTestData {
  name: string;
  short_name: string;
  phone: string;
  email: string;
  whatsapp_number: string;
  areas_specialization: string[];
  office_name: string;
  office_location: string;
  activity_status: 'active' | 'medium' | 'low' | 'inactive';
  language: 'arabic' | 'english';
}

export default function TestBrokerAdd() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [formData, setFormData] = useState<BrokerTestData>({
    name: 'وسيط تجريبي',
    short_name: 'وسيط',
    phone: '+971501234567',
    email: 'test@broker.com',
    whatsapp_number: '+971501234567',
    areas_specialization: ['دبي', 'أبوظبي'],
    office_name: 'مكتب عقاري تجريبي',
    office_location: 'دبي مارينا',
    activity_status: 'active',
    language: 'arabic'
  });

  // اختبار الاتصال بجدول land_brokers
  const testDatabaseConnection = async () => {
    setIsLoading(true);
    const result: any = { test: 'Database Connection', status: 'pending', message: '', time: new Date() };
    
    try {
      const { data, error } = await supabase
        .from('land_brokers')
        .select('count(*)')
        .limit(1);

      if (error) throw error;
      
      result.status = 'success';
      result.message = `✅ اتصال ناجح بجدول land_brokers - عدد الوسطاء: ${data?.length || 0}`;
      toast.success('اتصال قاعدة البيانات ناجح');
    } catch (error: any) {
      result.status = 'error';
      result.message = `❌ فشل الاتصال: ${error.message}`;
      toast.error('فشل في الاتصال بقاعدة البيانات');
    }

    setTestResults(prev => [...prev, result]);
    setIsLoading(false);
  };

  // اختبار فحص schema الجدول
  const testTableSchema = async () => {
    setIsLoading(true);
    const result: any = { test: 'Table Schema Check', status: 'pending', message: '', time: new Date() };
    
    try {
      // فحص أعمدة الجدول
      const { data, error } = await supabase
        .rpc('get_table_columns', { table_name: 'land_brokers' })
        .select();

      if (error) {
        // إذا فشلت RPC، نجرب طريقة أخرى
        const { data: sampleData, error: sampleError } = await supabase
          .from('land_brokers')
          .select('*')
          .limit(1);

        if (sampleError) throw sampleError;
        
        const columns = sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : [];
        result.status = 'success';
        result.message = `✅ أعمدة الجدول: ${columns.join(', ')}`;
        result.data = { columns };
      } else {
        result.status = 'success';
        result.message = `✅ تم فحص schema بنجاح`;
        result.data = data;
      }
      
      toast.success('تم فحص هيكل الجدول بنجاح');
    } catch (error: any) {
      result.status = 'error';
      result.message = `❌ فشل فحص schema: ${error.message}`;
      toast.error('فشل في فحص هيكل الجدول');
    }

    setTestResults(prev => [...prev, result]);
    setIsLoading(false);
  };

  // اختبار إضافة وسيط مباشرة
  const testDirectInsert = async () => {
    setIsLoading(true);
    const result: any = { test: 'Direct Insert', status: 'pending', message: '', time: new Date() };
    
    try {
      const testBroker = {
        ...formData,
        name: `${formData.name} ${Date.now()}`,
        phone: formData.phone.replace('567', Math.floor(Math.random() * 1000).toString()),
        whatsapp_number: formData.phone.replace('567', Math.floor(Math.random() * 1000).toString()),
        deals_count: 0,
        total_sales_amount: 0
      };

      // إزالة notes إذا كان موجوداً (لأن العمود قد لا يكون موجوداً)
      const { notes, ...brokerDataWithoutNotes } = testBroker as any;

      const { data, error } = await supabase
        .from('land_brokers')
        .insert([brokerDataWithoutNotes])
        .select()
        .single();

      if (error) throw error;
      
      result.status = 'success';
      result.message = `✅ تم إضافة الوسيط: ${data.name} (ID: ${data.id})`;
      result.data = data;
      toast.success('تم إضافة الوسيط بنجاح');
    } catch (error: any) {
      result.status = 'error';
      result.message = `❌ فشل الإضافة: ${error.message}`;
      toast.error('فشل في إضافة الوسيط');
    }

    setTestResults(prev => [...prev, result]);
    setIsLoading(false);
  };

  // اختبار إضافة وسيط مع notes
  const testInsertWithNotes = async () => {
    setIsLoading(true);
    const result: any = { test: 'Insert With Notes', status: 'pending', message: '', time: new Date() };
    
    try {
      const testBroker = {
        ...formData,
        name: `${formData.name} مع ملاحظات ${Date.now()}`,
        phone: formData.phone.replace('567', Math.floor(Math.random() * 1000).toString()),
        whatsapp_number: formData.phone.replace('567', Math.floor(Math.random() * 1000).toString()),
        notes: 'ملاحظات تجريبية للوسيط',
        deals_count: 0,
        total_sales_amount: 0
      };

      const { data, error } = await supabase
        .from('land_brokers')
        .insert([testBroker])
        .select()
        .single();

      if (error) throw error;
      
      result.status = 'success';
      result.message = `✅ تم إضافة الوسيط مع الملاحظات: ${data.name} (ID: ${data.id})`;
      result.data = data;
      toast.success('تم إضافة الوسيط مع الملاحظات بنجاح');
    } catch (error: any) {
      result.status = 'error';
      result.message = `❌ فشل الإضافة مع الملاحظات: ${error.message}`;
      result.data = { error: error.message, details: error.details };
      toast.error('فشل في إضافة الوسيط مع الملاحظات');
    }

    setTestResults(prev => [...prev, result]);
    setIsLoading(false);
  };

  // تشغيل جميع الاختبارات
  const runAllTests = async () => {
    setTestResults([]);
    await testDatabaseConnection();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testTableSchema();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testDirectInsert();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testInsertWithNotes();
  };

  // مسح النتائج
  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            اختبار إضافة وسطاء الأراضي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* نموذج البيانات التجريبية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="test_name">الاسم التجريبي</Label>
              <Input
                id="test_name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="test_short_name">الاسم المختصر</Label>
              <Input
                id="test_short_name"
                value={formData.short_name}
                onChange={(e) => setFormData(prev => ({ ...prev, short_name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="test_phone">رقم الهاتف التجريبي</Label>
              <Input
                id="test_phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="test_email">البريد الإلكتروني</Label>
              <Input
                id="test_email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="test_office">اسم المكتب</Label>
              <Input
                id="test_office"
                value={formData.office_name}
                onChange={(e) => setFormData(prev => ({ ...prev, office_name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="test_location">موقع المكتب</Label>
              <Input
                id="test_location"
                value={formData.office_location}
                onChange={(e) => setFormData(prev => ({ ...prev, office_location: e.target.value }))}
              />
            </div>
          </div>

          {/* أزرار الاختبار */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={testDatabaseConnection}
              disabled={isLoading}
              variant="outline"
            >
              <Database className="h-4 w-4 mr-2" />
              اختبار الاتصال
            </Button>
            
            <Button 
              onClick={testTableSchema}
              disabled={isLoading}
              variant="outline"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              فحص Schema
            </Button>
            
            <Button 
              onClick={testDirectInsert}
              disabled={isLoading}
              variant="outline"
            >
              <User className="h-4 w-4 mr-2" />
              إضافة عادية
            </Button>
            
            <Button 
              onClick={testInsertWithNotes}
              disabled={isLoading}
              variant="outline"
            >
              <Users className="h-4 w-4 mr-2" />
              إضافة مع ملاحظات
            </Button>
            
            <Button 
              onClick={runAllTests}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              تشغيل جميع الاختبارات
            </Button>
            
            <Button 
              onClick={clearResults}
              variant="outline"
            >
              مسح النتائج
            </Button>
          </div>

          {/* عرض النتائج */}
          {testResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">نتائج الاختبارات:</h3>
              {testResults.map((result, index) => (
                <Alert 
                  key={index} 
                  className={result.status === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}
                >
                  {result.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription>
                    <div>
                      <strong>{result.test}</strong> - {result.time.toLocaleTimeString('ar-SA')}
                    </div>
                    <div className="mt-1">{result.message}</div>
                    {result.data && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-gray-600">عرض البيانات</summary>
                        <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* معلومات إضافية */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>ملاحظات:</strong>
              <ul className="mt-2 list-disc list-inside text-sm space-y-1">
                <li>هذه الصفحة لاختبار وتشخيص مشاكل إضافة الوسطاء</li>
                <li>كل اختبار يضيف وسيط بأرقام عشوائية لتجنب التكرار</li>
                <li>إذا فشل "اختبار الاتصال" فالمشكلة في قاعدة البيانات</li>
                <li>إذا فشل "فحص Schema" فالمشكلة في هيكل الجدول</li>
                <li>إذا فشلت "الإضافة العادية" فالمشكلة في صلاحيات Supabase</li>
                <li>إذا فشلت "الإضافة مع ملاحظات" فعمود notes غير موجود</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
