import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function WhatsAppContacts() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>جهات الاتصال</CardTitle>
          <CardDescription>إدارة جهات الاتصال في WhatsApp</CardDescription>
        </CardHeader>
        <CardContent>
          <p>صفحة جهات الاتصال قيد التطوير...</p>
        </CardContent>
      </Card>
    </div>
  );
}
