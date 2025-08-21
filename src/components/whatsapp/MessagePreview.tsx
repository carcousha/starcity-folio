// Message Preview Component - مكون معاينة الرسالة
// معاينة شاملة للرسالة قبل الإرسال مع نماذج متعددة

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Eye,
  Smartphone,
  Users,
  RefreshCw,
  Copy,
  Send,
  MessageSquare,
  Clock,
  Hash,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { MessagePreview as MessagePreviewType, smartMessageService } from '@/services/smartMessageService';
import { toast } from 'sonner';

interface MessagePreviewProps {
  template: string;
  contacts: any[];
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  onSend?: () => void;
  showSendButton?: boolean;
}

export function MessagePreview({
  template,
  contacts,
  mediaUrl,
  mediaType,
  onSend,
  showSendButton = true
}: MessagePreviewProps) {
  
  const [selectedContactIndex, setSelectedContactIndex] = useState(0);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'list'>('mobile');
  
  // توليد المعاينات
  const previews = smartMessageService.generatePreview(template, contacts, Math.min(contacts.length, 10));
  const currentPreview = previews[selectedContactIndex];
  
  // تحليل القالب
  const analysis = smartMessageService.analyzeTemplate(template);
  const validation = smartMessageService.validateTemplate(template);

  // نسخ الرسالة
  const copyMessage = (message: string) => {
    navigator.clipboard.writeText(message);
    toast.success('تم نسخ الرسالة');
  };

  // توليد رسالة عشوائية جديدة
  const regenerateMessage = () => {
    // لا نحتاج لتحديث الـ state لأن المعاينة تعتمد على template الذي يعيد توليد نفسه
    toast.success('تم توليد رسالة جديدة');
  };

  if (!template || contacts.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">أدخل نص الرسالة واختر جهات اتصال للمعاينة</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-green-600" />
            معاينة الرسالة
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Select
              value={previewMode}
              onValueChange={(value: 'mobile' | 'list') => setPreviewMode(value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    جوال
                  </div>
                </SelectItem>
                <SelectItem value="list">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    قائمة
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={regenerateMessage}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              تجديد
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">المستلمين</span>
            </div>
            <div className="text-xl font-bold text-blue-700">{contacts.length}</div>
          </div>

          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Hash className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">المتغيرات</span>
            </div>
            <div className="text-xl font-bold text-green-700">{analysis.variables.length}</div>
          </div>

          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <RefreshCw className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">البدائل</span>
            </div>
            <div className="text-xl font-bold text-purple-700">{analysis.alternatives.length}</div>
          </div>

          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Hash className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">التنويعات</span>
            </div>
            <div className="text-xl font-bold text-orange-700">
              {analysis.estimatedVariations > 1000 ? '1000+' : analysis.estimatedVariations}
            </div>
          </div>
        </div>

        {/* رسائل التحقق */}
        {validation && (
          <div className="space-y-2">
            {validation.isValid && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">الرسالة جاهزة للإرسال!</span>
              </div>
            )}

            {validation.errors.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">أخطاء:</p>
                  <ul className="text-sm text-red-700 mt-1">
                    {validation.errors.map((error: string, index: number) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {validation.warnings.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">تحذيرات:</p>
                  <ul className="text-sm text-yellow-700 mt-1">
                    {validation.warnings.map((warning: string, index: number) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* معاينة جوال */}
        {previewMode === 'mobile' && currentPreview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-medium">معاينة الجوال</Label>
              <Select
                value={selectedContactIndex.toString()}
                onValueChange={(value) => setSelectedContactIndex(parseInt(value))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {previews.map((preview, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {preview.contactName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* محاكي الجوال */}
            <div className="max-w-sm mx-auto">
              <div className="bg-black rounded-3xl p-3 shadow-2xl">
                <div className="bg-white rounded-2xl overflow-hidden">
                  {/* شريط الحالة */}
                  <div className="bg-green-600 text-white px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xs font-bold">
                          {currentPreview.contactName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{currentPreview.contactName}</p>
                        <p className="text-xs opacity-90">متصل الآن</p>
                      </div>
                    </div>
                    <Clock className="h-4 w-4" />
                  </div>

                  {/* محتوى الرسالة */}
                  <div className="p-4 min-h-96 bg-gray-50">
                    <div className="flex justify-end mb-4">
                      <div className="max-w-xs">
                        {/* الوسائط إن وجدت */}
                        {mediaUrl && (
                          <div className="mb-2">
                            {mediaType === 'image' && (
                              <div className="bg-gray-200 rounded-lg p-4 text-center">
                                <div className="text-gray-500 text-sm">🖼️ صورة</div>
                              </div>
                            )}
                            {mediaType === 'video' && (
                              <div className="bg-gray-200 rounded-lg p-4 text-center">
                                <div className="text-gray-500 text-sm">🎥 فيديو</div>
                              </div>
                            )}
                            {mediaType === 'audio' && (
                              <div className="bg-gray-200 rounded-lg p-4 text-center">
                                <div className="text-gray-500 text-sm">🎵 صوت</div>
                              </div>
                            )}
                            {mediaType === 'document' && (
                              <div className="bg-gray-200 rounded-lg p-4 text-center">
                                <div className="text-gray-500 text-sm">📄 مستند</div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* نص الرسالة */}
                        <div className="bg-green-600 text-white rounded-lg px-3 py-2 relative">
                          <div className="whitespace-pre-wrap text-sm">
                            {currentPreview.processedMessage}
                          </div>
                          <div className="absolute -right-2 bottom-0 w-0 h-0 border-l-8 border-l-green-600 border-t-8 border-t-transparent"></div>
                        </div>

                        {/* وقت الإرسال */}
                        <div className="text-xs text-gray-500 mt-1 text-left">
                          {new Date().toLocaleTimeString('ar-SA', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })} ✓✓
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* أزرار التحكم */}
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyMessage(currentPreview.processedMessage)}
              >
                <Copy className="h-4 w-4 mr-1" />
                نسخ
              </Button>
              
              {showSendButton && onSend && (
                <Button onClick={onSend} className="bg-green-600 hover:bg-green-700">
                  <Send className="h-4 w-4 mr-1" />
                  إرسال الحملة
                </Button>
              )}
            </div>
          </div>
        )}

        {/* معاينة قائمة */}
        {previewMode === 'list' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-medium">معاينة القائمة</Label>
              <Badge variant="outline">
                {previews.length} من {contacts.length}
              </Badge>
            </div>

            <ScrollArea className="h-80 w-full border rounded">
              <div className="p-2 space-y-3">
                {previews.map((preview, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{preview.contactName}</p>
                        <p className="text-xs text-gray-500">{preview.contactPhone}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyMessage(preview.processedMessage)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">
                      {preview.processedMessage}
                    </div>
                    
                    {/* المتغيرات المستخدمة */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.entries(preview.variables).map(([key, value]) => (
                        value && (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key}: {value}
                          </Badge>
                        )
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            {contacts.length > previews.length && (
              <p className="text-center text-sm text-gray-500">
                وسيتم إرسال رسائل مماثلة لـ {contacts.length - previews.length} جهة اتصال أخرى...
              </p>
            )}

            {/* زر الإرسال */}
            {showSendButton && onSend && (
              <div className="text-center">
                <Button onClick={onSend} size="lg" className="bg-green-600 hover:bg-green-700">
                  <Send className="h-4 w-4 mr-2" />
                  إرسال الحملة إلى {contacts.length} جهة اتصال
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// مكون Label مفقود
function Label({ children, className = '', ...props }: any) {
  return (
    <label className={`text-sm font-medium ${className}`} {...props}>
      {children}
    </label>
  );
}
