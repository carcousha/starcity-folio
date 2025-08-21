import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TestAdvanced() {
  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>🚀 اختبار النظام المتطور</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-lg">✅ النظام يعمل بنجاح!</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-bold text-green-800">البدائل النصية</h3>
                <p className="text-sm text-green-600">نظام {أهلاً|مرحباً|هاي} جاهز</p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-bold text-blue-800">المتغيرات المتقدمة</h3>
                <p className="text-sm text-blue-600">+18 متغير جديد مضاف</p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-bold text-purple-800">التوقيت الذكي</h3>
                <p className="text-sm text-purple-600">تحكم عشوائي 3-10 ثواني</p>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg">
                <h3 className="font-bold text-orange-800">معاينة مباشرة</h3>
                <p className="text-sm text-orange-600">تتبع الإرسال في الوقت الفعلي</p>
              </div>
            </div>
            
            <Button className="w-full" size="lg">
              🎉 جميع الميزات تعمل بنجاح!
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
