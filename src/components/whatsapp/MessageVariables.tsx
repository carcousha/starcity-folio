// Message Variables Component
// مكون متغيرات الرسائل

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus,
  Trash2,
  Copy,
  Eye,
  Hash,
  MessageSquare,
  Variable,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface MessageVariable {
  id: string;
  name: string;
  displayName: string;
  description: string;
  defaultValue: string;
  example: string;
  isRequired: boolean;
}

interface MessageVariablesProps {
  onVariablesChange: (variables: MessageVariable[]) => void;
  initialVariables?: MessageVariable[];
  onPreviewChange?: (preview: string) => void;
}

const defaultVariables: MessageVariable[] = [
  {
    id: '1',
    name: 'short_name',
    displayName: 'الاسم المختصر',
    description: 'الاسم المختصر للمستقبل',
    defaultValue: 'أخي الكريم',
    example: 'أهلاً {{short_name}}، كيف حالك؟',
    isRequired: true
  },
  {
    id: '2',
    name: 'full_name',
    displayName: 'الاسم الكامل',
    description: 'الاسم الكامل للمستقبل',
    defaultValue: 'أحمد محمد',
    example: 'مرحباً {{full_name}}، أهلاً وسهلاً بك',
    isRequired: false
  },
  {
    id: '3',
    name: 'company',
    displayName: 'اسم الشركة',
    description: 'اسم الشركة أو المؤسسة',
    defaultValue: 'StarCity Folio',
    example: 'نشكرك على اهتمامك بـ {{company}}',
    isRequired: false
  },
  {
    id: '4',
    name: 'position',
    displayName: 'المنصب',
    description: 'المنصب أو الوظيفة',
    defaultValue: 'مدير',
    example: 'أهلاً {{position}} {{short_name}}',
    isRequired: false
  },
  {
    id: '5',
    name: 'city',
    displayName: 'المدينة',
    description: 'اسم المدينة',
    defaultValue: 'دبي',
    example: 'أهلاً وسهلاً بك في {{city}}',
    isRequired: false
  }
];

export function MessageVariables({ onVariablesChange, initialVariables, onPreviewChange }: MessageVariablesProps) {
  const [variables, setVariables] = useState<MessageVariable[]>(
    initialVariables || defaultVariables
  );
  const [newVariable, setNewVariable] = useState({
    name: '',
    displayName: '',
    description: '',
    defaultValue: '',
    example: '',
    isRequired: false
  });
  const [previewText, setPreviewText] = useState('');
  const [selectedVariable, setSelectedVariable] = useState<string>('all');

  useEffect(() => {
    onVariablesChange(variables);
  }, [variables, onVariablesChange]);

  const addVariable = () => {
    if (!newVariable.name.trim() || !newVariable.displayName.trim()) {
      toast.error('يرجى إدخال اسم المتغير والاسم المعروض');
      return;
    }

    // التحقق من عدم تكرار اسم المتغير
    if (variables.some(v => v.name === newVariable.name.trim())) {
      toast.error('اسم المتغير موجود مسبقاً');
      return;
    }

    const newVar: MessageVariable = {
      id: Date.now().toString(),
      name: newVariable.name.trim(),
      displayName: newVariable.displayName.trim(),
      description: newVariable.description.trim() || 'متغير جديد',
      defaultValue: newVariable.defaultValue.trim() || 'قيمة افتراضية',
      example: newVariable.example.trim() || `مثال: {{${newVariable.name.trim()}}}`,
      isRequired: newVariable.isRequired
    };

    setVariables(prev => [...prev, newVar]);
    
    // إعادة تعيين النموذج
    setNewVariable({
      name: '',
      displayName: '',
      description: '',
      defaultValue: '',
      example: '',
      isRequired: false
    });
    
    toast.success('تم إضافة المتغير بنجاح');
  };

  const updateVariable = (id: string, updates: Partial<MessageVariable>) => {
    setVariables(prev => prev.map(v => 
      v.id === id ? { ...v, ...updates } : v
    ));
  };

  const removeVariable = (id: string) => {
    setVariables(prev => prev.filter(v => v.id !== id));
    toast.success('تم حذف المتغير');
  };

  const copyVariable = (variable: MessageVariable) => {
    const text = `{{${variable.name}}}`;
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ ${text} إلى الحافظة`);
  };

  const generatePreview = (text: string) => {
    let result = text;
    
    variables.forEach(variable => {
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      result = result.replace(regex, variable.defaultValue);
    });
    
    return result;
  };

  const copyPreview = () => {
    const preview = generatePreview(previewText);
    navigator.clipboard.writeText(preview);
    toast.success('تم نسخ النص مع المتغيرات إلى الحافظة');
  };

  const resetToDefaults = () => {
    setVariables(defaultVariables);
    toast.success('تم إعادة تعيين المتغيرات الافتراضية');
  };

  const filteredVariables = selectedVariable === 'all' 
    ? variables 
    : variables.filter(v => v.name === selectedVariable);

  const variableNames = ['all', ...variables.map(v => v.name)];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Variable className="h-5 w-5" />
          متغيرات الرسائل
          <Badge variant="secondary" className="text-xs">
            {variables.length} متغير
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* إضافة متغير جديد */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="varName">اسم المتغير</Label>
            <Input
              id="varName"
              value={newVariable.name}
              onChange={(e) => setNewVariable(prev => ({ ...prev, name: e.target.value }))}
              placeholder="مثال: short_name"
            />
          </div>
          <div>
            <Label htmlFor="varDisplayName">الاسم المعروض</Label>
            <Input
              id="varDisplayName"
              value={newVariable.displayName}
              onChange={(e) => setNewVariable(prev => ({ ...prev, displayName: e.target.value }))}
              placeholder="مثال: الاسم المختصر"
            />
          </div>
          <div>
            <Label htmlFor="varDescription">الوصف</Label>
            <Input
              id="varDescription"
              value={newVariable.description}
              onChange={(e) => setNewVariable(prev => ({ ...prev, description: e.target.value }))}
              placeholder="وصف المتغير"
            />
          </div>
          <div>
            <Label htmlFor="varDefaultValue">القيمة الافتراضية</Label>
            <Input
              id="varDefaultValue"
              value={newVariable.defaultValue}
              onChange={(e) => setNewVariable(prev => ({ ...prev, defaultValue: e.target.value }))}
              placeholder="مثال: أخي الكريم"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="varExample">مثال الاستخدام</Label>
            <Input
              id="varExample"
              value={newVariable.example}
              onChange={(e) => setNewVariable(prev => ({ ...prev, example: e.target.value }))}
              placeholder="مثال: أهلاً {{short_name}}، كيف حالك؟"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="varRequired"
              checked={newVariable.isRequired}
              onChange={(e) => setNewVariable(prev => ({ ...prev, isRequired: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="varRequired">متغير مطلوب</Label>
          </div>
        </div>
        
        <Button onClick={addVariable} className="w-full">
          <Plus className="h-4 w-4 ml-2" />
          إضافة متغير جديد
        </Button>

        <Separator />

        {/* فلتر المتغيرات */}
        <div className="flex flex-wrap gap-2">
          {variableNames.map(name => (
            <Button
              key={name}
              variant={selectedVariable === name ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedVariable(name)}
            >
              {name === 'all' ? 'الكل' : name}
            </Button>
          ))}
        </div>

        {/* عرض المتغيرات */}
        <div className="space-y-4">
          {filteredVariables.map(variable => (
            <Card key={variable.id} className="border-l-4 border-l-green-500">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={variable.isRequired ? 'destructive' : 'secondary'}>
                      {variable.isRequired ? 'مطلوب' : 'اختياري'}
                    </Badge>
                    <h4 className="font-semibold text-green-600">{{{variable.name}}}</h4>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyVariable(variable)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariable(variable.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2 mb-3">
                  <p className="font-medium">{variable.displayName}</p>
                  <p className="text-sm text-gray-600">{variable.description}</p>
                  <p className="text-sm text-gray-500">مثال: {variable.example}</p>
                </div>

                {/* تعديل القيمة الافتراضية */}
                <div className="flex gap-2">
                  <Input
                    value={variable.defaultValue}
                    onChange={(e) => updateVariable(variable.id, { defaultValue: e.target.value })}
                    placeholder="القيمة الافتراضية"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateVariable(variable.id, { isRequired: !variable.isRequired })}
                  >
                    {variable.isRequired ? 'إلغاء الإلزام' : 'إلزام'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator />

        {/* معاينة النص مع المتغيرات */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Eye className="h-4 w-4" />
            معاينة النص مع المتغيرات
          </h4>
          
          <Textarea
            placeholder="اكتب نصك هنا مع المتغيرات مثل: أهلاً {{short_name}}، كيف حالك؟"
            value={previewText}
            onChange={(e) => {
              setPreviewText(e.target.value);
              if (onPreviewChange) {
                onPreviewChange(e.target.value);
              }
            }}
            rows={3}
          />
          
          {previewText && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyPreview}
                >
                  <Copy className="h-4 w-4 ml-2" />
                  نسخ النص مع المتغيرات
                </Button>
              </div>
              
              <Card className="bg-gray-50">
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-600 mb-2">النص مع المتغيرات:</p>
                  <p className="font-medium">{generatePreview(previewText)}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* أزرار التحكم */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="flex-1"
          >
            <MessageSquare className="h-4 w-4 ml-2" />
            إعادة تعيين
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              const example = 'أهلاً {{short_name}}، كيف حالك؟ أهلاً وسهلاً بك في {{company}}';
              setPreviewText(example);
              if (onPreviewChange) {
                onPreviewChange(example);
              }
            }}
            className="flex-1"
          >
            <Hash className="h-4 w-4 ml-2" />
            مثال
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
