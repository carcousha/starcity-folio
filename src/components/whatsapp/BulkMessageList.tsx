// Bulk Message List Component
// مكون قائمة الرسائل الجماعية

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BulkMessage } from '@/types/bulkMessage';

interface BulkMessageListProps {
  bulkMessages: BulkMessage[];
  onUpdated: () => void;
  onDeleted: () => void;
}

export default function BulkMessageList({ bulkMessages, onUpdated, onDeleted }: BulkMessageListProps) {
  return (
    <div className="space-y-4">
      {bulkMessages.map((message) => (
        <Card key={message.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{message.name}</span>
              <Badge variant="outline">
                {message.status === 'completed' ? 'مكتمل' : 'ملغي'}
              </Badge>
            </CardTitle>
            <CardDescription>
              {message.message_content.substring(0, 100)}...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>المستلمين: {message.total_recipients}</span>
              <span>تم الإرسال: {message.sent_count}</span>
              <span>معدل النجاح: {message.success_rate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
