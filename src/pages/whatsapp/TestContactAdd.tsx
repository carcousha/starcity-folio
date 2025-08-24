// Test Contact Add Page - لاختبار إضافة جهات الاتصال
// صفحة اختبار إضافة جهات الاتصال

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { whatsappService } from '@/services/whatsappService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, Database, User, Phone } from 'lucide-react';

export default function TestContactAdd() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: 'وسيط تجريبي',
    phone: '+971501234567',
    contact_type: 'marketer'
  });

  // اختبار الاتصال بقاعدة البيانات
  const testDatabaseConnection = async () => {
    setIsLoading(true);
    const result: any = { test: 'Database Connection', status: 'pending', message: '', time: new Date() };
    
    try {
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select('count(*)')
        .limit(1);

      if (error) throw error;
      
      result.status = 'success';
      result.message = `✅ اتصال ناجح - عدد جهات الاتصال: ${data?.length || 0}`;
      toast.success('اتصال قاعدة البيانات ناجح');
    } catch (error: any) {
      result.status = 'error';
      result.message = `❌ فشل الاتصال: ${error.message}`;
      toast.error('فشل في الاتصال بقاعدة البيانات');
    }

    setTestResults(prev => [...prev, result]);
    setIsLoading(false);
  };

  // اختبار إضافة جهة اتصال مباشرة
  const testDirectInsert = async () => {
    setIsLoading(true);
    const result: any = { test: 'Direct Insert', status: 'pending', message: '', time: new Date() };
    
    try {
      const testContact = {
        name: `${formData.name} ${Date.now()}`,
        phone: formData.phone.replace('567', Math.floor(Math.random() * 1000).toString()),
        contact_type: formData.contact_type,
        whatsapp_number: formData.phone.replace('567', Math.floor(Math.random() * 1000).toString()),
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .insert([testContact])
        .select()
        .single();

      if (error) throw error;
      
      result.status = 'success';
      result.message = `✅ تم إضافة جهة الاتصال: ${data.name} (ID: ${data.id})`;
      result.data = data;
      toast.success('تم إضافة جهة الاتصال بنجاح');
    } catch (error: any) {
      result.status = 'error';
      result.message = `❌ فشل الإضافة: ${error.message}`;
      toast.error('فشل في إضافة جهة الاتصال');
    }

    setTestResults(prev => [...prev, result]);
    setIsLoading(false);
  };

  // اختبار استخدام خدمة WhatsApp
  const testWhatsAppService = async () => {
    setIsLoading(true);
    const result: any = { test: 'WhatsApp Service', status: 'pending', message: '', time: new Date() };
    
    try {
      const testContact = {
        name: `${formData.name} Service ${Date.now()}`,
        phone: formData.phone.replace('567', Math.floor(Math.random() * 1000).toString()),
        contact_type: formData.contact_type as 'owner' | 'marketer' | 'client',
        whatsapp_number: formData.phone.replace('567', Math.floor(Math.random() * 1000).toString()),
        tags: ['test', 'اختبار']
      };

      const data = await whatsappService.createContact(testContact);
      
      result.status = 'success';
      result.message = `✅ تم إضافة جهة الاتصال عبر الخدمة: ${data.name} (ID: ${data.id})`;
      result.data = data;
      toast.success('تم إضافة جهة الاتصال عبر الخدمة بنجاح');
    } catch (error: any) {
      result.status = 'error';
      result.message = `❌ فشل الإضافة عبر الخدمة: ${error.message}`;
      toast.error('فشل في إضافة جهة الاتصال عبر الخدمة');
    }

    setTestResults(prev => [...prev, result]);
    setIsLoading(false);
  };

  // تشغيل جميع الاختبارات
  const runAllTests = async () => {
    setTestResults([]);
    await testDatabaseConnection();
    await new Promise(resolve => setTimeout(resolve, 1000)); // انتظار ثانية
    await testDirectInsert();
    await new Promise(resolve => setTimeout(resolve, 1000)); // انتظار ثانية
    await testWhatsAppService();
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
            <Database className="h-5 w-5" />
            اختبار إضافة جهات الاتصال
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* نموذج البيانات التجريبية */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="test_name">الاسم التجريبي</Label>
              <Input
                id="test_name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
              <Label htmlFor="test_type">نوع جهة الاتصال</Label>
              <select
                id="test_type"
                value={formData.contact_type}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="marketer">مسوق</option>
                <option value="client">عميل</option>
                <option value="owner">مالك</option>
              </select>
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
              onClick={testDirectInsert}
              disabled={isLoading}
              variant="outline"
            >
              <User className="h-4 w-4 mr-2" />
              إضافة مباشرة
            </Button>
            
            <Button 
              onClick={testWhatsAppService}
              disabled={isLoading}
              variant="outline"
            >
              <Phone className="h-4 w-4 mr-2" />
              عبر الخدمة
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
                <li>هذه الصفحة لاختبار وتشخيص مشاكل إضافة جهات الاتصال</li>
                <li>كل اختبار يضيف جهة اتصال بأرقام عشوائية لتجنب التكرار</li>
                <li>إذا فشل "اختبار الاتصال" فالمشكلة في قاعدة البيانات</li>
                <li>إذا فشلت "الإضافة المباشرة" فالمشكلة في صلاحيات Supabase</li>
                <li>إذا فشلت "عبر الخدمة" فالمشكلة في منطق whatsappService</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
