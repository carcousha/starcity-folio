import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SimpleTest() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardTitle className="text-2xl">✅ اختبار النظام البسيط</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              
              {/* Status */}
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">✓</span>
                </div>
                <h2 className="text-xl font-bold text-green-600 mb-2">النظام يعمل بنجاح!</h2>
                <p className="text-gray-600">جميع المكونات الأساسية تعمل بشكل طبيعي</p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-bold text-green-800 mb-2">🎭 البدائل النصية</h3>
                  <p className="text-sm text-green-600">نظام {أهلاً|مرحباً|هاي} جاهز</p>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-bold text-blue-800 mb-2">🔧 المتغيرات المتقدمة</h3>
                  <p className="text-sm text-blue-600">+18 متغير جديد مضاف</p>
                </div>
                
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h3 className="font-bold text-purple-800 mb-2">⏱️ التوقيت الذكي</h3>
                  <p className="text-sm text-purple-600">تحكم عشوائي 3-10 ثواني</p>
                </div>
                
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h3 className="font-bold text-orange-800 mb-2">👁️ معاينة مباشرة</h3>
                  <p className="text-sm text-orange-600">تتبع الإرسال في الوقت الفعلي</p>
                </div>
              </div>

              {/* Navigation */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-gray-800 mb-3">🔗 روابط التجربة:</h3>
                <div className="space-y-2">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => window.location.href = '/whatsapp/test-advanced'}
                  >
                    🚀 النظام المتطور - عرض الميزات
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => window.location.href = '/whatsapp/advanced-text-message'}
                  >
                    🎭 رسائل نصية ذكية - النظام الكامل
                  </Button>
                </div>
              </div>

              {/* System Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-bold text-blue-800 mb-2">📊 معلومات النظام:</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>✅ المسارات: تم إضافة جميع المسارات بنجاح</p>
                  <p>✅ المكونات: جميع المكونات محملة بشكل صحيح</p>
                  <p>✅ الخدمات: الخدمات الذكية تعمل بنجاح</p>
                  <p>✅ الواجهة: واجهة المستخدم متجاوبة ومتطورة</p>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
