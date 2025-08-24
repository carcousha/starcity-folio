// Algorithm Test Page
// صفحة اختبار الخوارزميات

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  calculateTextSimilarity,
  normalizePhoneNumber,
  normalizeText,
  levenshteinDistance,
  splitIntoWords,
  calculateWordSimilarity
} from '@/utils/deduplicationHelpers';
import { 
  TestTube, 
  Zap, 
  Database, 
  Users, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Calculator,
  Smartphone,
  Type
} from 'lucide-react';

export default function AlgorithmTest() {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [similarityResult, setSimilarityResult] = useState<number | null>(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [textInput, setTextInput] = useState('');
  const [normalizedText, setNormalizedText] = useState('');
  const [wordInput, setWordInput] = useState('');
  const [wordAnalysis, setWordAnalysis] = useState<any>(null);

  // اختبار حساب التشابه
  const testSimilarity = () => {
    if (text1 && text2) {
      const result = calculateTextSimilarity(text1, text2);
      setSimilarityResult(result);
    }
  };

  // اختبار تنظيف الهاتف
  const testPhoneNormalization = () => {
    if (phoneInput) {
      const normalized = normalizePhoneNumber(phoneInput);
      setNormalizedPhone(normalized);
    }
  };

  // اختبار تنظيف النص
  const testTextNormalization = () => {
    if (textInput) {
      const normalized = normalizeText(textInput);
      setNormalizedText(normalized);
    }
  };

  // اختبار تحليل الكلمات
  const testWordAnalysis = () => {
    if (wordInput) {
      const words = splitIntoWords(wordInput);
      const analysis = {
        original: wordInput,
        words: words,
        wordCount: words.length,
        uniqueWords: [...new Set(words)].length,
        averageLength: words.reduce((sum, word) => sum + word.length, 0) / words.length
      };
      setWordAnalysis(analysis);
    }
  };

  // اختبار مسافة Levenshtein
  const testLevenshtein = () => {
    if (text1 && text2) {
      const distance = levenshteinDistance(text1, text2);
      const maxLength = Math.max(text1.length, text2.length);
      const similarity = ((maxLength - distance) / maxLength) * 100;
      
      alert(`مسافة Levenshtein: ${distance}\nدرجة التشابه: ${similarity.toFixed(1)}%`);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* العنوان */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <TestTube className="h-8 w-8 text-purple-600" />
            اختبار خوارزميات إزالة التكرار
          </CardTitle>
          <p className="text-gray-600 text-lg">
            اختبار وتطوير الخوارزميات المستخدمة في نظام إزالة التكرار
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* اختبار حساب التشابه */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              اختبار حساب التشابه
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text1">النص الأول</Label>
              <Input
                id="text1"
                value={text1}
                onChange={(e) => setText1(e.target.value)}
                placeholder="أدخل النص الأول"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="text2">النص الثاني</Label>
              <Input
                id="text2"
                value={text2}
                onChange={(e) => setText2(e.target.value)}
                placeholder="أدخل النص الثاني"
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={testSimilarity} className="flex-1">
                حساب التشابه
              </Button>
              <Button onClick={testLevenshtein} variant="outline">
                اختبار Levenshtein
              </Button>
            </div>
            
            {similarityResult !== null && (
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {similarityResult}%
                </div>
                <div className="text-sm text-blue-600">درجة التشابه</div>
                <div className="mt-2">
                  <Badge className="bg-blue-100 text-blue-800">
                    {similarityResult >= 95 ? 'تشابه عالي جداً' :
                     similarityResult >= 80 ? 'تشابه عالي' :
                     similarityResult >= 60 ? 'تشابه متوسط' : 'تشابه منخفض'}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* اختبار تنظيف البيانات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              اختبار تنظيف البيانات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="أدخل رقم الهاتف"
                />
                <Button onClick={testPhoneNormalization} size="sm">
                  تنظيف
                </Button>
              </div>
              {normalizedPhone && (
                <div className="p-2 bg-green-50 rounded text-sm border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-semibold">النتيجة:</span>
                  </div>
                  <div className="mt-1 font-mono text-green-700">{normalizedPhone}</div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="text">النص</Label>
              <div className="flex gap-2">
                <Input
                  id="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="أدخل النص"
                />
                <Button onClick={testTextNormalization} size="sm">
                  تنظيف
                </Button>
              </div>
              {normalizedText && (
                <div className="p-2 bg-green-50 rounded text-sm border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-semibold">النتيجة:</span>
                  </div>
                  <div className="mt-1 text-green-700">{normalizedText}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* اختبار تحليل الكلمات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              اختبار تحليل الكلمات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wordInput">النص للتحليل</Label>
              <div className="flex gap-2">
                <Input
                  id="wordInput"
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  placeholder="أدخل نص للتحليل"
                />
                <Button onClick={testWordAnalysis} size="sm">
                  تحليل
                </Button>
              </div>
            </div>
            
            {wordAnalysis && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {wordAnalysis.wordCount}
                    </div>
                    <div className="text-sm text-blue-600">عدد الكلمات</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {wordAnalysis.uniqueWords}
                    </div>
                    <div className="text-sm text-green-600">كلمات فريدة</div>
                  </div>
                </div>
                
                <div className="text-center p-3 bg-purple-50 rounded">
                  <div className="text-2xl font-bold text-purple-600">
                    {wordAnalysis.averageLength.toFixed(1)}
                  </div>
                  <div className="text-sm text-purple-600">متوسط طول الكلمة</div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded">
                  <div className="text-sm font-semibold mb-2">الكلمات:</div>
                  <div className="flex flex-wrap gap-1">
                    {wordAnalysis.words.map((word: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {word}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* معلومات الخوارزميات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              معلومات الخوارزميات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                <Calculator className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">حساب التشابه</span>
                <Badge className="ml-auto">مُحسّن</Badge>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                <Smartphone className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">تنظيف الهاتف</span>
                <Badge className="ml-auto">مُحسّن</Badge>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                <Type className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">تحليل النص</span>
                <Badge className="ml-auto">مُحسّن</Badge>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                <Users className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">مسافة Levenshtein</span>
                <Badge className="ml-auto">مُحسّن</Badge>
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded text-sm">
              <div className="font-semibold mb-2">مميزات الخوارزميات:</div>
              <ul className="space-y-1 text-gray-600">
                <li>• دقة عالية في حساب التشابه</li>
                <li>• معالجة سريعة للبيانات</li>
                <li>• دعم اللغة العربية</li>
                <li>• تنظيف ذكي للبيانات</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* زر العودة */}
      <div className="text-center">
        <Button 
          onClick={() => window.location.href = '/whatsapp/contact-deduplication'}
          variant="outline"
          className="border-gray-300"
        >
          <ArrowRight className="h-4 w-4 mr-2" />
          العودة إلى صفحة إزالة التكرار
        </Button>
      </div>
    </div>
  );
}
