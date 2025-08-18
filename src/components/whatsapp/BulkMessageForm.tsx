// Bulk Message Form Component
// مكون نموذج الرسالة الجماعية

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  MessageSquare,
  Users,
  Clock,
  Settings,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

import { bulkMessageService } from '@/services/bulkMessageService';
import { CreateBulkMessageForm, BulkMessageValidation } from '@/types/bulkMessage';

interface BulkMessageFormProps {
  onCreated: (message: any) => void;
  onCancel: () => void;
}

export default function BulkMessageForm({ onCreated, onCancel }: BulkMessageFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [validation, setValidation] = React.useState<BulkMessageValidation | null>(null);

  const [formData, setFormData] = React.useState<CreateBulkMessageForm>({
    name: '',
    message_content: '',
    message_type: 'text',
    recipient_type: 'all',
    send_type: 'immediate'
  });

  const updateFormData = (updates: Partial<CreateBulkMessageForm>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // التحقق من صحة البيانات
      const validationResult = await bulkMessageService.validateBulkMessage(formData);
      setValidation(validationResult);
      
      if (!validationResult.isValid) {
        toast({
          title: "خطأ في التحقق",
          description: validationResult.errors.join(', '),
          variant: "destructive"
        });
        return;
      }

      // إنشاء الرسالة الجماعية
      const newMessage = await bulkMessageService.createBulkMessage(formData);
      onCreated(newMessage);
      
    } catch (error: any) {
      console.error('Error creating bulk message:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء الرسالة الجماعية",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            إنشاء رسالة جماعية جديدة
          </CardTitle>
          <CardDescription>
            إنشاء وإرسال رسالة واتساب لعدة مستلمين دفعة واحدة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* معلومات أساسية */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">اسم الرسالة الجماعية *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  placeholder="مثال: إعلان عروض الشتاء"
                  required
                />
              </div>

              <div>
                <Label htmlFor="message_content">محتوى الرسالة *</Label>
                <Textarea
                  id="message_content"
                  value={formData.message_content}
                  onChange={(e) => updateFormData({ message_content: e.target.value })}
                  placeholder="اكتب محتوى الرسالة هنا..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="message_type">نوع الرسالة</Label>
                <Select
                  value={formData.message_type}
                  onValueChange={(value: any) => updateFormData({ message_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">نص عادي</SelectItem>
                    <SelectItem value="media">وسائط</SelectItem>
                    <SelectItem value="button">أزرار تفاعلية</SelectItem>
                    <SelectItem value="poll">استطلاع رأي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* إعدادات المستلمين */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                إعدادات المستلمين
              </h3>

              <div>
                <Label htmlFor="recipient_type">نوع المستلمين</Label>
                <Select
                  value={formData.recipient_type}
                  onValueChange={(value: any) => updateFormData({ recipient_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع جهات الاتصال</SelectItem>
                    <SelectItem value="by_type">حسب النوع</SelectItem>
                    <SelectItem value="by_company">حسب الشركة</SelectItem>
                    <SelectItem value="by_tags">حسب العلامات</SelectItem>
                    <SelectItem value="custom">قائمة مخصصة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* إعدادات الإرسال */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                إعدادات الإرسال
              </h3>

              <div>
                <Label htmlFor="send_type">نوع الإرسال</Label>
                <Select
                  value={formData.send_type}
                  onValueChange={(value: any) => updateFormData({ send_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">إرسال فوري</SelectItem>
                    <SelectItem value="scheduled">إرسال مجدول</SelectItem>
                    <SelectItem value="gradual">إرسال متدرج</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* التحقق من الصحة */}
            {validation && (
              <Alert className={validation.isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                {validation.isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={validation.isValid ? "text-green-800" : "text-red-800"}>
                  <div className="space-y-2">
                    <div>
                      <strong>عدد المستلمين:</strong> {validation.recipient_count}
                    </div>
                    {validation.estimated_duration && (
                      <div>
                        <strong>الوقت المتوقع:</strong> {validation.estimated_duration}
                      </div>
                    )}
                    {validation.errors.length > 0 && (
                      <div>
                        <strong>الأخطاء:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {validation.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {validation.warnings.length > 0 && (
                      <div>
                        <strong>التحذيرات:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {validation.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* أزرار التحكم */}
            <div className="flex justify-end space-x-3 space-x-reverse">
              <Button type="button" variant="outline" onClick={onCancel}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  'إنشاء الرسالة الجماعية'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
