// Deduplication Test Page
// صفحة اختبار نظام إزالة التكرار

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  createTestData, 
  createTestDuplicates, 
  createMockDeduplicationResult,
  calculateTextSimilarity,
  normalizePhoneNumber,
  normalizeText,
  createDataAnalysisReport,
  createDeduplicationPlan,
  exportToCSV,
  exportToJSON
} from '@/utils/deduplicationHelpers';
import { DuplicateContact, ContactSourceData } from '@/types/whatsapp';
import { 
  Play, 
  Database, 
  Users, 
  BarChart3, 
  FileText, 
  Download,
  TestTube,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

export default function DeduplicationTest() {
  const [testData, setTestData] = useState<ContactSourceData[]>([]);
  const [testDuplicates, setTestDuplicates] = useState<DuplicateContact[]>([]);
  const [mockResult, setMockResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('data');
  const [similarityText1, setSimilarityText1] = useState('');
  const [similarityText2, setSimilarityText2] = useState('');
  const [similarityResult, setSimilarityResult] = useState<number | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [textInput, setTextInput] = useState('');
  const [normalizedText, setNormalizedText] = useState('');

  // إنشاء بيانات تجريبية
  const generateTestData = () => {
    const data = createTestData();
    setTestData(data);
  };

  // إنشاء مكررات تجريبية
  const generateTestDuplicates = () => {
    const duplicates = createTestDuplicates();
    setTestDuplicates(duplicates);
  };

  // إنشاء نتائج محاكاة
  const generateMockResult = () => {
    const result = createMockDeduplicationResult();
    setMockResult(result);
  };

  // حساب درجة التشابه
  const calculateSimilarity = () => {
    if (similarityText1 && similarityText2) {
      const result = calculateTextSimilarity(similarityText1, similarityText2);
      setSimilarityResult(result);
    }
  };

  // تنظيف رقم الهاتف
  const normalizePhone = () => {
    if (phoneNumber) {
      const normalized = normalizePhoneNumber(phoneNumber);
      setNormalizedPhone(normalized);
    }
  };

  // تنظيف النص
  const normalizeTextInput = () => {
    if (textInput) {
      const normalized = normalizeText(textInput);
      setNormalizedText(normalized);
    }
  };

  // إنشاء تقرير تحليل البيانات
  const generateDataAnalysis = () => {
    if (testData.length > 0) {
      const report = createDataAnalysisReport(testData);
      console.log('Data Analysis Report:', report);
      alert('تم إنشاء تقرير تحليل البيانات. راجع Console للتفاصيل.');
    }
  };

  // إنشاء خطة إزالة التكرار
  const generateDeduplicationPlan = () => {
    if (testDuplicates.length > 0) {
      const plan = createDeduplicationPlan(testDuplicates);
      console.log('Deduplication Plan:', plan);
      alert('تم إنشاء خطة إزالة التكرار. راجع Console للتفاصيل.');
    }
  };

  // تصدير البيانات
  const exportData = (format: 'csv' | 'json') => {
    if (testData.length > 0) {
      if (format === 'csv') {
        exportToCSV(testData, 'test-contacts');
      } else {
        exportToJSON(testData, 'test-contacts');
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* العنوان */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <TestTube className="h-8 w-8 text-purple-600" />
            صفحة اختبار نظام إزالة التكرار
          </CardTitle>
          <p className="text-gray-600 text-lg">
            اختبار وتطوير خوارزميات إزالة التكرار مع بيانات تجريبية
          </p>
        </CardHeader>
      </Card>

      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            البيانات التجريبية
          </TabsTrigger>
          <TabsTrigger value="duplicates" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            المكررات التجريبية
          </TabsTrigger>
          <TabsTrigger value="algorithms" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            اختبار الخوارزميات
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            التحليل والتقارير
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            النتائج المحاكاة
          </TabsTrigger>
        </TabsList>

        {/* تبويب البيانات التجريبية */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                إنشاء بيانات تجريبية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button onClick={generateTestData} className="bg-blue-600 hover:bg-blue-700">
                  <Play className="h-4 w-4 mr-2" />
                  إنشاء بيانات تجريبية
                </Button>
                <Button 
                  onClick={() => exportData('csv')} 
                  variant="outline"
                  disabled={testData.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  تصدير CSV
                </Button>
                <Button 
                  onClick={() => exportData('json')} 
                  variant="outline"
                  disabled={testData.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  تصدير JSON
                </Button>
              </div>

              {testData.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-semibold">
                      تم إنشاء {testData.length} جهة اتصال تجريبية
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {testData.map((contact, index) => (
                      <Card key={index} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{contact.source}</Badge>
                            <Badge>{contact.source_id}</Badge>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div><strong>الاسم:</strong> {contact.name}</div>
                            <div><strong>الهاتف:</strong> {contact.phone}</div>
                            {contact.email && (
                              <div><strong>البريد:</strong> {contact.email}</div>
                            )}
                            {contact.company && (
                              <div><strong>الشركة:</strong> {contact.company}</div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب المكررات التجريبية */}
        <TabsContent value="duplicates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                إنشاء مكررات تجريبية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={generateTestDuplicates} className="bg-green-600 hover:bg-green-700">
                <Play className="h-4 w-4 mr-2" />
                إنشاء مكررات تجريبية
              </Button>

              {testDuplicates.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-semibold">
                      تم إنشاء {testDuplicates.length} مكرر تجريبي
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {testDuplicates.map((duplicate, index) => (
                      <Card key={index} className="border-l-4 border-l-orange-500">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <h4 className="font-semibold">{duplicate.name}</h4>
                            <Badge className="bg-red-100 text-red-800">
                              {duplicate.merge_priority === 'high' ? 'أولوية عالية' : 
                               duplicate.merge_priority === 'medium' ? 'أولوية متوسطة' : 'أولوية منخفضة'}
                            </Badge>
                            <Badge variant="outline">
                              درجة التشابه: {duplicate.similarity_score}%
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {duplicate.data.map((sourceData, sourceIndex) => (
                              <div key={sourceIndex} className="border rounded p-3 bg-gray-50">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline">{sourceData.source}</Badge>
                                  <Badge>{sourceData.source_id}</Badge>
                                </div>
                                <div className="text-sm space-y-1">
                                  <div><strong>الاسم:</strong> {sourceData.name}</div>
                                  <div><strong>الهاتف:</strong> {sourceData.phone}</div>
                                  {sourceData.email && (
                                    <div><strong>البريد:</strong> {sourceData.email}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب اختبار الخوارزميات */}
        <TabsContent value="algorithms" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* اختبار حساب التشابه */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  اختبار حساب التشابه
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="text1">النص الأول</Label>
                  <Input
                    id="text1"
                    value={similarityText1}
                    onChange={(e) => setSimilarityText1(e.target.value)}
                    placeholder="أدخل النص الأول"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="text2">النص الثاني</Label>
                  <Input
                    id="text2"
                    value={similarityText2}
                    onChange={(e) => setSimilarityText2(e.target.value)}
                    placeholder="أدخل النص الثاني"
                  />
                </div>
                
                <Button onClick={calculateSimilarity} className="w-full">
                  حساب درجة التشابه
                </Button>
                
                {similarityResult !== null && (
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {similarityResult}%
                    </div>
                    <div className="text-sm text-blue-600">درجة التشابه</div>
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
                  <Input
                    id="phone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="أدخل رقم الهاتف"
                  />
                  <Button onClick={normalizePhone} size="sm">
                    تنظيف
                  </Button>
                  {normalizedPhone && (
                    <div className="p-2 bg-green-50 rounded text-sm">
                      <strong>النتيجة:</strong> {normalizedPhone}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="text">النص</Label>
                  <Input
                    id="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="أدخل النص"
                  />
                  <Button onClick={normalizeTextInput} size="sm">
                    تنظيف
                  </Button>
                  {normalizedText && (
                    <div className="p-2 bg-green-50 rounded text-sm">
                      <strong>النتيجة:</strong> {normalizedText}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تبويب التحليل والتقارير */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* تحليل البيانات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  تحليل البيانات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={generateDataAnalysis}
                  disabled={testData.length === 0}
                  className="w-full"
                >
                  إنشاء تقرير تحليل البيانات
                </Button>
                
                <div className="text-sm text-gray-600">
                  <p>• إحصائيات المصادر</p>
                  <p>• تحليل جودة البيانات</p>
                  <p>• إحصائيات الشركات والنطاقات</p>
                  <p>• تقييم شامل للبيانات</p>
                </div>
              </CardContent>
            </Card>

            {/* خطة إزالة التكرار */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  خطة إزالة التكرار
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={generateDeduplicationPlan}
                  disabled={testDuplicates.length === 0}
                  className="w-full"
                >
                  إنشاء خطة إزالة التكرار
                </Button>
                
                <div className="text-sm text-gray-600">
                  <p>• تحليل الأولويات</p>
                  <p>• تقدير الوقت والتوفير</p>
                  <p>• تقييم المخاطر</p>
                  <p>• توصيات العملية</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تبويب النتائج المحاكاة */}
        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                نتائج المحاكاة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={generateMockResult} className="bg-purple-600 hover:bg-purple-700">
                <Play className="h-4 w-4 mr-2" />
                إنشاء نتائج محاكاة
              </Button>

              {mockResult && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-semibold">
                      تم إنشاء نتائج المحاكاة
                    </span>
                  </div>
                  
                  {/* ملخص النتائج */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {mockResult.merged_contacts}
                      </div>
                      <div className="text-sm text-green-700">مدمجة</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {mockResult.summary.brokers}
                      </div>
                      <div className="text-sm text-blue-700">وسطاء</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {mockResult.summary.clients}
                      </div>
                      <div className="text-sm text-purple-700">عملاء</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {mockResult.summary.owners}
                      </div>
                      <div className="text-sm text-orange-700">ملاك</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {mockResult.summary.tenants}
                      </div>
                      <div className="text-sm text-yellow-700">مستأجرين</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600">
                        {(mockResult.summary.total_saved_space / 1024).toFixed(1)}
                      </div>
                      <div className="text-sm text-indigo-700">KB محفوظة</div>
                    </div>
                  </div>
                  
                  {/* تفاصيل العمليات الناجحة */}
                  <div>
                    <h4 className="font-semibold text-green-800 mb-3">✅ العمليات الناجحة</h4>
                    <div className="space-y-2">
                      {mockResult.detailed_results.successful_merges.map((merge: any, index: number) => (
                        <div key={index} className="text-sm bg-green-100 p-2 rounded">
                          <strong>{merge.contact_name}</strong> - {merge.phone}
                          <br />
                          <span className="text-green-600">المصادر: {merge.merged_sources.join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* معلومات الأداء */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      الوقت: {mockResult.processing_time}ms
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      الأخطاء: {mockResult.errors.length}
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      التحذيرات: {mockResult.warnings.length}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
