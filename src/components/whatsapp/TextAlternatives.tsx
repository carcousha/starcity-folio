// Text Alternatives Component
// مكون البدائل النصية لتجنب Spam

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
  RefreshCw,
  Eye,
  Hash,
  MessageSquare,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface TextAlternative {
  id: string;
  alternatives: string[];
  category: string;
  description: string;
}

interface TextAlternativesProps {
  onAlternativesChange: (alternatives: TextAlternative[]) => void;
  initialAlternatives?: TextAlternative[];
}

const defaultAlternatives: TextAlternative[] = [
  {
    id: '1',
    alternatives: ['أهلاً', 'هاي', 'هلا', 'مرحباً', 'أهلاً وسهلاً'],
    category: 'تحية',
    description: 'بدائل للتحية'
  },
  {
    id: '2',
    alternatives: ['كيف حالك؟', 'كيف الحال؟', 'أخبارك إيه؟', 'كيف الأمور؟'],
    category: 'سؤال',
    description: 'بدائل للسؤال عن الحال'
  },
  {
    id: '3',
    alternatives: ['شكراً', 'مشكور', 'أشكرك', 'شكراً جزيلاً', 'ألف شكر'],
    category: 'شكر',
    description: 'بدائل للشكر'
  },
  {
    id: '4',
    alternatives: ['أهلاً وسهلاً', 'مرحباً بك', 'أهلاً وسهلاً بك', 'أهلاً وسهلاً فيك'],
    category: 'ترحيب',
    description: 'بدائل للترحيب'
  }
];

export function TextAlternatives({ onAlternativesChange, initialAlternatives }: TextAlternativesProps) {
  const [alternatives, setAlternatives] = useState<TextAlternative[]>(
    initialAlternatives || defaultAlternatives
  );
  const [newAlternative, setNewAlternative] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    onAlternativesChange(alternatives);
  }, [alternatives, onAlternativesChange]);

  const addAlternative = () => {
    if (!newAlternative.trim() || !newCategory.trim()) {
      toast.error('يرجى إدخال البديل والفئة');
      return;
    }

    const newAlt: TextAlternative = {
      id: Date.now().toString(),
      alternatives: [newAlternative.trim()],
      category: newCategory.trim(),
      description: newDescription.trim() || 'بديل جديد'
    };

    setAlternatives(prev => [...prev, newAlt]);
    setNewAlternative('');
    setNewCategory('');
    setNewDescription('');
    toast.success('تم إضافة البديل النصي بنجاح');
  };

  const addAlternativeToCategory = (categoryId: string, alternative: string) => {
    if (!alternative.trim()) return;

    setAlternatives(prev => prev.map(alt => 
      alt.id === categoryId 
        ? { ...alt, alternatives: [...alt.alternatives, alternative.trim()] }
        : alt
    ));
    toast.success('تم إضافة البديل إلى الفئة');
  };

  const removeAlternative = (categoryId: string, alternativeIndex: number) => {
    setAlternatives(prev => prev.map(alt => 
      alt.id === categoryId 
        ? { ...alt, alternatives: alt.alternatives.filter((_, index) => index !== alternativeIndex) }
        : alt
    ));
  };

  const removeCategory = (categoryId: string) => {
    setAlternatives(prev => prev.filter(alt => alt.id !== categoryId));
    toast.success('تم حذف الفئة');
  };

  const generateRandomText = (text: string) => {
    let result = text;
    
    alternatives.forEach(alt => {
      const randomAlternative = alt.alternatives[Math.floor(Math.random() * alt.alternatives.length)];
      // استبدال النص بالبديل العشوائي
      result = result.replace(new RegExp(`\\b${alt.category}\\b`, 'gi'), randomAlternative);
    });
    
    return result;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('تم نسخ النص إلى الحافظة');
  };

  const resetToDefaults = () => {
    setAlternatives(defaultAlternatives);
    toast.success('تم إعادة تعيين البدائل الافتراضية');
  };

  const filteredAlternatives = selectedCategory === 'all' 
    ? alternatives 
    : alternatives.filter(alt => alt.category === selectedCategory);

  const categories = ['all', ...Array.from(new Set(alternatives.map(alt => alt.category)))];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hash className="h-5 w-5" />
          نظام البدائل النصية
          <Badge variant="secondary" className="text-xs">
            {alternatives.reduce((total, alt) => total + alt.alternatives.length, 0)} بديل
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* إضافة بديل جديد */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="newCategory">الفئة</Label>
            <Input
              id="newCategory"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="مثال: تحية"
            />
          </div>
          <div>
            <Label htmlFor="newAlternative">البديل النصي</Label>
            <Input
              id="newAlternative"
              value={newAlternative}
              onChange={(e) => setNewAlternative(e.target.value)}
              placeholder="مثال: أهلاً"
            />
          </div>
          <div>
            <Label htmlFor="newDescription">الوصف</Label>
            <Input
              id="newDescription"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="وصف اختياري"
            />
          </div>
        </div>
        
        <Button onClick={addAlternative} className="w-full">
          <Plus className="h-4 w-4 ml-2" />
          إضافة بديل جديد
        </Button>

        <Separator />

        {/* فلتر الفئات */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? 'الكل' : category}
            </Button>
          ))}
        </div>

        {/* عرض البدائل */}
        <div className="space-y-4">
          {filteredAlternatives.map(alt => (
            <Card key={alt.id} className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-blue-600">{alt.category}</h4>
                    <p className="text-sm text-gray-600">{alt.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCategory(alt.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {alt.alternatives.map((alternative, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {alternative}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAlternative(alt.id, index)}
                        className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>

                {/* إضافة بديل جديد إلى الفئة */}
                <div className="flex gap-2">
                  <Input
                    placeholder="إضافة بديل جديد"
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addAlternativeToCategory(alt.id, e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      const input = document.querySelector(`input[placeholder="إضافة بديل جديد"]`) as HTMLInputElement;
                      if (input && input.value.trim()) {
                        addAlternativeToCategory(alt.id, input.value);
                        input.value = '';
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator />

        {/* معاينة النص */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Eye className="h-4 w-4" />
            معاينة النص مع البدائل
          </h4>
          
          <Textarea
            placeholder="اكتب نصك هنا لمعاينة البدائل..."
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            rows={3}
          />
          
          {previewText && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewText(generateRandomText(previewText))}
                >
                  <RefreshCw className="h-4 w-4 ml-2" />
                  توليد عشوائي
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generateRandomText(previewText))}
                >
                  <Copy className="h-4 w-4 ml-2" />
                  نسخ النص
                </Button>
              </div>
              
              <Card className="bg-gray-50">
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-600 mb-2">النص مع البدائل:</p>
                  <p className="font-medium">{generateRandomText(previewText)}</p>
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
            <RefreshCw className="h-4 w-4 ml-2" />
            إعادة تعيين
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              const text = generateRandomText(previewText || 'أهلاً وسهلاً بك في StarCity Folio');
              setPreviewText(text);
            }}
            className="flex-1"
          >
            <MessageSquare className="h-4 w-4 ml-2" />
            توليد مثال
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
