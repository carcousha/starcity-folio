// تشخيص مشاكل جهات الاتصال في WhatsApp
// Diagnose WhatsApp Contacts Issues

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, Database, RefreshCw } from 'lucide-react';

export default function DiagnoseContacts() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const runDiagnosis = async () => {
    setIsLoading(true);
    setResults([]);
    
    const testResults: any[] = [];

    // 1. فحص وجود الجدول
    try {
      const { data, error } = await supabase.rpc('get_schema_info');
      testResults.push({
        test: 'فحص Schema',
        status: error ? 'error' : 'success',
        message: error ? `خطأ: ${error.message}` : 'Schema متاح',
        data: data
      });
    } catch (error) {
      // فحص بديل
      try {
        const { data, error: tableError } = await supabase
          .from('whatsapp_contacts')
          .select('count(*)')
          .limit(1);
        
        testResults.push({
          test: 'فحص وجود الجدول',
          status: tableError ? 'error' : 'success',
          message: tableError ? `خطأ في الجدول: ${tableError.message}` : 'الجدول موجود',
          data: data
        });
      } catch (err) {
        testResults.push({
          test: 'فحص وجود الجدول',
          status: 'error',
          message: `الجدول غير موجود: ${err}`,
          data: null
        });
      }
    }

    // 2. فحص الصلاحيات
    try {
      const { data: user } = await supabase.auth.getUser();
      testResults.push({
        test: 'فحص المستخدم',
        status: user.user ? 'success' : 'error',
        message: user.user ? `مستخدم مسجل: ${user.user.email}` : 'مستخدم غير مسجل',
        data: user.user
      });
    } catch (error) {
      testResults.push({
        test: 'فحص المستخدم',
        status: 'error',
        message: `خطأ في التحقق من المستخدم: ${error}`,
        data: null
      });
    }

    // 3. فحص البيانات الموجودة
    try {
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .limit(5);
      
      testResults.push({
        test: 'فحص البيانات الموجودة',
        status: error ? 'error' : 'success',
        message: error ? `خطأ في قراءة البيانات: ${error.message}` : `تم العثور على ${data?.length || 0} جهات اتصال`,
        data: data
      });
    } catch (error) {
      testResults.push({
        test: 'فحص البيانات الموجودة',
        status: 'error',
        message: `خطأ في البيانات: ${error}`,
        data: null
      });
    }

    // 4. فحص الصلاحيات RLS
    try {
      const { data, error } = await supabase.rpc('check_rls_policies');
      testResults.push({
        test: 'فحص سياسات RLS',
        status: error ? 'warning' : 'success',
        message: error ? `تحذير RLS: ${error.message}` : 'سياسات RLS نشطة',
        data: data
      });
    } catch (error) {
      // اختبار إدراج تجريبي
      try {
        const { data: user } = await supabase.auth.getUser();
        if (user.user) {
          const { data, error: insertError } = await supabase
            .from('whatsapp_contacts')
            .insert([{
              name: 'اختبار تشخيص',
              phone: '+971999999999',
              contact_type: 'client',
              created_by: user.user.id
            }])
            .select()
            .single();

          if (!insertError) {
            // حذف البيانات التجريبية
            await supabase.from('whatsapp_contacts').delete().eq('id', data.id);
            
            testResults.push({
              test: 'اختبار الإدراج',
              status: 'success',
              message: 'يمكن إدراج البيانات بنجاح',
              data: data
            });
          } else {
            testResults.push({
              test: 'اختبار الإدراج',
              status: 'error',
              message: `فشل الإدراج: ${insertError.message}`,
              data: insertError
            });
          }
        }
      } catch (insertErr) {
        testResults.push({
          test: 'اختبار الإدراج',
          status: 'error',
          message: `خطأ في اختبار الإدراج: ${insertErr}`,
          data: null
        });
      }
    }

    // 5. فحص أنواع جهات الاتصال المتاحة
    try {
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select('contact_type')
        .limit(100);
      
      if (!error && data) {
        const types = [...new Set(data.map(item => item.contact_type))];
        testResults.push({
          test: 'أنواع جهات الاتصال المتاحة',
          status: 'success',
          message: `الأنواع المتاحة: ${types.join(', ')}`,
          data: types
        });
      }
    } catch (error) {
      testResults.push({
        test: 'أنواع جهات الاتصال',
        status: 'warning',
        message: 'لا يمكن قراءة أنواع جهات الاتصال',
        data: null
      });
    }

    // 6. فحص الفهارس
    try {
      const { data, error } = await supabase.rpc('get_table_indexes', { table_name: 'whatsapp_contacts' });
      testResults.push({
        test: 'فحص الفهارس',
        status: error ? 'warning' : 'success',
        message: error ? 'لا يمكن فحص الفهارس' : `الفهارس متاحة`,
        data: data
      });
    } catch (error) {
      testResults.push({
        test: 'فحص الفهارس',
        status: 'warning',
        message: 'فحص الفهارس غير متاح',
        data: null
      });
    }

    setResults(testResults);
    setIsLoading(false);

    // عرض ملخص
    const errors = testResults.filter(r => r.status === 'error').length;
    const warnings = testResults.filter(r => r.status === 'warning').length;
    
    if (errors > 0) {
      toast.error(`تم العثور على ${errors} مشاكل خطيرة`);
    } else if (warnings > 0) {
      toast.warning(`تم العثور على ${warnings} تحذيرات`);
    } else {
      toast.success('جميع الفحوصات نجحت!');
    }
  };

  // إصلاح سريع للمشاكل الشائعة
  const quickFix = async () => {
    try {
      setIsLoading(true);
      
      // محاولة إنشاء جدول احتياطي أو إصلاح البيانات
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return;
      }

      // إنشاء بيانات تجريبية
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .insert([
          {
            name: 'جهة اتصال تجريبية 1',
            phone: '+971501111111',
            contact_type: 'client',
            email: 'test1@example.com',
            created_by: user.user.id
          },
          {
            name: 'وسيط تجريبي',
            phone: '+971502222222',
            contact_type: 'marketer',
            email: 'broker@example.com',
            created_by: user.user.id
          },
          {
            name: 'مالك تجريبي',
            phone: '+971503333333',
            contact_type: 'owner',
            email: 'owner@example.com',
            created_by: user.user.id
          }
        ])
        .select();

      if (error) throw error;

      toast.success(`تم إنشاء ${data.length} جهات اتصال تجريبية`);
      
      // تشغيل التشخيص مرة أخرى
      setTimeout(() => runDiagnosis(), 1000);
      
    } catch (error) {
      toast.error(`فشل الإصلاح السريع: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            تشخيص مشاكل جهات الاتصال
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button 
              onClick={runDiagnosis}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              تشغيل التشخيص
            </Button>
            
            <Button 
              onClick={quickFix}
              disabled={isLoading}
              variant="outline"
            >
              إصلاح سريع (إنشاء بيانات تجريبية)
            </Button>
          </div>

          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">نتائج التشخيص:</h3>
              {results.map((result, index) => (
                <Alert 
                  key={index} 
                  className={
                    result.status === 'success' ? 'border-green-200 bg-green-50' :
                    result.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                    'border-red-200 bg-red-50'
                  }
                >
                  {result.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className={`h-4 w-4 ${result.status === 'warning' ? 'text-yellow-600' : 'text-red-600'}`} />
                  )}
                  <AlertDescription>
                    <div>
                      <strong>{result.test}</strong>
                    </div>
                    <div className="mt-1">{result.message}</div>
                    {result.data && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-gray-600">عرض التفاصيل</summary>
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

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>ملاحظات:</strong>
              <ul className="mt-2 list-disc list-inside text-sm space-y-1">
                <li>هذه الأداة تساعد في تشخيص مشاكل قاعدة البيانات</li>
                <li>إذا كانت جميع الفحوصات ناجحة والبيانات لا تظهر، تحقق من الشبكة</li>
                <li>الإصلاح السريع ينشئ بيانات تجريبية للاختبار</li>
                <li>يمكن حذف البيانات التجريبية من صفحة جهات الاتصال</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}


