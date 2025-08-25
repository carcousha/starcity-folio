// Sticker Message Tab Component
// مكون تاب رسالة الملصق

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface StickerMessageTabProps {
  data: any;
  onChange: (data: any) => void;
  isLoading: boolean;
}

export const StickerMessageTab: React.FC<StickerMessageTabProps> = ({ 
  data, 
  onChange, 
  isLoading 
}) => {
  return (
    <div className="space-y-6">
      <div className="text-right">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">رسالة ملصق</h2>
        <p className="text-gray-600">إنشاء رسالة ملصق</p>
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">قريباً</h3>
          <p className="text-gray-500">هذه الميزة ستكون متاحة قريباً</p>
          <Badge variant="secondary" className="mt-4">قيد التطوير</Badge>
        </CardContent>
      </Card>
    </div>
  );
};
