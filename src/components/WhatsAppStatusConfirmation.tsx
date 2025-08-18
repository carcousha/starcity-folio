// مكون لتأكيد حالة إرسال الرسالة يدوياً
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { whatsappService } from '@/services/whatsappService';

interface WhatsAppStatusConfirmationProps {
  messageId: string;
  phoneNumber: string;
  content: string;
  onStatusUpdate: (status: 'sent' | 'failed') => void;
}

export function WhatsAppStatusConfirmation({ 
  messageId, 
  phoneNumber, 
  content, 
  onStatusUpdate 
}: WhatsAppStatusConfirmationProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const updateMessageStatus = async (status: 'sent' | 'failed') => {
    setIsUpdating(true);
    try {
      // تحديث حالة الرسالة في قاعدة البيانات
      await whatsappService.updateMessageStatus(messageId, status);
      
      toast({
        title: status === 'sent' ? "تم التأكيد" : "تم الإبلاغ عن الفشل",
        description: status === 'sent' 
          ? "تم تحديث حالة الرسالة إلى مُرسلة بنجاح"
          : "تم تحديث حالة الرسالة إلى فاشلة",
        variant: status === 'sent' ? "default" : "destructive"
      });

      onStatusUpdate(status);
    } catch (error) {
      console.error('Error updating message status:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الرسالة",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-lg text-orange-800">تأكيد حالة الإرسال</CardTitle>
        </div>
        <CardDescription className="text-orange-700">
          تم إرسال الطلب ولكن لا يمكن التأكد من النتيجة تلقائياً بسبب قيود المتصفح
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white p-3 rounded-lg border">
          <p className="text-sm text-gray-600 mb-1">الرقم المُرسل إليه:</p>
          <p className="font-medium text-gray-900">{phoneNumber}</p>
          
          <p className="text-sm text-gray-600 mb-1 mt-2">محتوى الرسالة:</p>
          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
            {content.length > 100 ? content.substring(0, 100) + '...' : content}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            <MessageSquare className="inline h-4 w-4 mr-1" />
            يرجى التحقق من وصول الرسالة في واتساب ثم تأكيد الحالة:
          </p>
          
          <div className="flex gap-3">
            <Button
              onClick={() => updateMessageStatus('sent')}
              disabled={isUpdating}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isUpdating ? 'جارٍ التحديث...' : 'وصلت الرسالة ✓'}
            </Button>
            
            <Button
              onClick={() => updateMessageStatus('failed')}
              disabled={isUpdating}
              variant="destructive"
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {isUpdating ? 'جارٍ التحديث...' : 'لم تصل الرسالة ✗'}
            </Button>
          </div>
        </div>

        <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
          💡 نصيحة: هذا التأكيد اليدوي مؤقت حتى يتم حل مشكلة CORS. ستعمل الواجهة على تحديث نفسها تلقائياً قريباً.
        </div>
      </CardContent>
    </Card>
  );
}
