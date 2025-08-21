// Smart Message Editor - محرر الرسائل الذكي
// يدعم البدائل النصية، المتغيرات المتقدمة، والمعاينة المباشرة

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Wand2,
  Eye,
  AlertTriangle,
  CheckCircle,
  Info,
  Copy,
  Shuffle,
  Clock,
  Users,
  Zap,
  RotateCcw,
  Variable
} from 'lucide-react';
import { smartMessageService, MessageVariable, TimingSettings, MessagePreview } from '@/services/smartMessageService';
import { toast } from 'sonner';

interface SmartMessageEditorProps {
  value: string;
  onChange: (value: string) => void;
  contacts?: any[];
  onPreview?: (previews: MessagePreview[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function SmartMessageEditor({
  value,
  onChange,
  contacts = [],
  onPreview,
  disabled = false,
  placeholder = 'اكتب رسالتك هنا...'
}: SmartMessageEditorProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [validation, setValidation] = useState<any>(null);
  const [previews, setPreviews] = useState<MessagePreview[]>([]);
  const [showVariables, setShowVariables] = useState(false);
  const [showPreviews, setShowPreviews] = useState(false);

  // تحليل القالب عند التغيير
  const analyzeTemplate = useCallback(() => {
    if (!value) {
      setAnalysis(null);
      setValidation(null);
      return;
    }

    const templateAnalysis = smartMessageService.analyzeTemplate(value);
    const templateValidation = smartMessageService.validateTemplate(value);
    
    setAnalysis(templateAnalysis);
    setValidation(templateValidation);
  }, [value]);

  // تحديث المعاينة
  const updatePreviews = useCallback(() => {
    if (!value || contacts.length === 0) {
      setPreviews([]);
      return;
    }

    const newPreviews = smartMessageService.generatePreview(value, contacts, 3);
    setPreviews(newPreviews);
    
    if (onPreview) {
      onPreview(newPreviews);
    }
  }, [value, contacts, onPreview]);

  useEffect(() => {
    analyzeTemplate();
    updatePreviews();
  }, [analyzeTemplate, updatePreviews]);

  // إدراج متغير
  const insertVariable = (variable: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + `{${variable}}` + value.substring(end);
    
    onChange(newValue);
    
    // إعادة تعيين موضع المؤشر
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length + 2, start + variable.length + 2);
    }, 10);
  };

  // إدراج مثال على البدائل
  const insertAlternativeExample = () => {
    const example = '{أهلاً|مرحباً|هاي} {name}، {كيف حالك؟|أرجو أن تكون بخير|أتمنى لك يوماً سعيداً}';
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + example + value.substring(end);
    
    onChange(newValue);
    toast.success('تم إدراج مثال على البدائل النصية');
  };

  // توليد رسالة عشوائية لاختبار البدائل
  const generateRandomMessage = () => {
    if (!value) return;
    
    const processed = smartMessageService.processTextAlternatives(value);
    toast.success('تم توليد رسالة عشوائية جديدة');
    // يمكن إظافة منطق لعرض الرسالة المولدة
  };

  const availableVariables = smartMessageService.getAvailableVariables();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-purple-600" />
          محرر الرسائل الذكي
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* محرر النص */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>نص الرسالة</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowVariables(!showVariables)}
              >
                <Variable className="h-4 w-4 mr-1" />
                المتغيرات
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={insertAlternativeExample}
              >
                <Shuffle className="h-4 w-4 mr-1" />
                مثال البدائل
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateRandomMessage}
                disabled={!value}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                توليد عشوائي
              </Button>
            </div>
          </div>

          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            rows={6}
            className="resize-none font-mono text-sm"
          />

          {/* نصائح الاستخدام */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">💡 نصائح الاستخدام:</p>
                <ul className="text-xs space-y-1">
                  <li>• استخدم <code>{'{name}'}</code> للاسم و <code>{'{short_name}'}</code> للاسم المختصر</li>
                  <li>• استخدم <code>{'{أهلاً|مرحباً|هاي}'}</code> للبدائل النصية العشوائية</li>
                  <li>• استخدم <code>{'{company}'}</code> للشركة و <code>{'{date}'}</code> للتاريخ</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* لوحة المتغيرات */}
        {showVariables && (
          <Card className="bg-gray-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">المتغيرات المتاحة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableVariables.map((variable) => (
                  <Button
                    key={variable.key}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertVariable(variable.key)}
                    className="justify-start h-auto py-2 px-3"
                    title={variable.description}
                  >
                    <div className="text-left">
                      <div className="text-xs font-medium">{variable.label}</div>
                      <div className="text-xs text-gray-500">{`{${variable.key}}`}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* تحليل القالب */}
        {analysis && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Variable className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">المتغيرات</span>
                </div>
                <div className="text-2xl font-bold text-blue-700">{analysis.variables.length}</div>
                <div className="text-xs text-blue-600">متغير مستخدم</div>
              </CardContent>
            </Card>

            <Card className="bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shuffle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">البدائل</span>
                </div>
                <div className="text-2xl font-bold text-green-700">{analysis.alternatives.length}</div>
                <div className="text-xs text-green-600">مجموعة بدائل</div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">التنويعات</span>
                </div>
                <div className="text-2xl font-bold text-purple-700">
                  {analysis.estimatedVariations > 1000 ? '1000+' : analysis.estimatedVariations}
                </div>
                <div className="text-xs text-purple-600">تنويعة محتملة</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* رسائل التحقق */}
        {validation && (
          <div className="space-y-2">
            {validation.errors.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">أخطاء في القالب:</p>
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
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
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

            {validation.isValid && validation.errors.length === 0 && validation.warnings.length === 0 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">القالب صحيح وجاهز للاستخدام!</span>
              </div>
            )}
          </div>
        )}

        {/* معاينة الرسائل */}
        {contacts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                معاينة الرسائل
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreviews(!showPreviews)}
              >
                {showPreviews ? 'إخفاء' : 'عرض'} المعاينة
              </Button>
            </div>

            {showPreviews && previews.length > 0 && (
              <div className="space-y-3">
                {previews.map((preview, index) => (
                  <Card key={index} className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{preview.contactName}</p>
                          <p className="text-xs text-gray-500">{preview.contactPhone}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(preview.processedMessage);
                            toast.success('تم نسخ الرسالة');
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="bg-white p-3 rounded border text-sm whitespace-pre-wrap">
                        {preview.processedMessage}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {contacts.length > 3 && (
                  <p className="text-center text-sm text-gray-500">
                    وسيتم إرسال رسائل مماثلة لـ {contacts.length - 3} جهة اتصال أخرى...
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
