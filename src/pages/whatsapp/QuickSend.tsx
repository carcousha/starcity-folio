import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function WhatsAppQuickSend() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>الإرسال السريع</CardTitle>
          <CardDescription>إرسال رسائل WhatsApp سريعة</CardDescription>
        </CardHeader>
        <CardContent>
          <p>صفحة الإرسال السريع قيد التطوير...</p>
        </CardContent>
      </Card>
    </div>
  );
}
