import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  CalendarIcon, 
  FileText, 
  Building2, 
  User, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Plus,
  X
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface GovernmentServiceFormData {
  service_name: string;
  service_type: string;
  government_entity: string;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  client_id?: string;
  official_fees: number;
  cost: number;
  expected_completion_date?: Date;
  due_date?: Date;
  notes?: string;
  documents: File[];
}

interface GovernmentServiceFormProps {
  onSubmit: (data: GovernmentServiceFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

const serviceTypes = [
  "تجديد عقد إيجار",
  "تسجيل ملكية",
  "استخراج وثيقة",
  "تصديق عقد",
  "ترخيص تجاري",
  "إقرار ضريبي",
  "تسجيل أرض",
  "تقسيم أرض",
  "دمج أراضي",
  "موافقة بناء",
  "شهادة عدم ممانعة",
  "تحديث بيانات",
  "أخرى"
];

const governmentEntities = [
  "بلدية عجمان",
  "دائرة الأراضي والأملاك",
  "دائرة التنمية الاقتصادية",
  "هيئة الضرائب الاتحادية",
  "دائرة التنمية السياحية",
  "دائرة البلدية والتخطيط",
  "هيئة كهرباء ومياه عجمان",
  "دائرة النقل",
  "المحاكم الاتحادية",
  "كاتب العدل",
  "أخرى"
];

const categories = [
  "عقود",
  "أراضي",
  "وثائق",
  "تراخيص",
  "ضرائب",
  "خدمات عامة",
  "قضائية",
  "أخرى"
];

const priorityOptions = [
  { value: 'low', label: 'منخفض', color: 'bg-gray-100 text-gray-800' },
  { value: 'normal', label: 'عادي', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'مرتفع', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'عاجل', color: 'bg-red-100 text-red-800' }
];

export function GovernmentServiceForm({ onSubmit, onCancel, loading = false }: GovernmentServiceFormProps) {
  const [formData, setFormData] = useState<GovernmentServiceFormData>({
    service_name: "",
    service_type: "",
    government_entity: "",
    category: "",
    priority: "normal",
    official_fees: 0,
    cost: 0,
    documents: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);

  const handleInputChange = (field: keyof GovernmentServiceFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.service_name.trim()) {
        newErrors.service_name = "اسم المعاملة مطلوب";
      }
      if (!formData.service_type) {
        newErrors.service_type = "نوع الخدمة مطلوب";
      }
      if (!formData.government_entity) {
        newErrors.government_entity = "الجهة الحكومية مطلوبة";
      }
      if (!formData.category) {
        newErrors.category = "فئة الخدمة مطلوبة";
      }
    }

    if (step === 2) {
      if (formData.official_fees < 0) {
        newErrors.official_fees = "الرسوم الرسمية لا يمكن أن تكون سالبة";
      }
      if (formData.cost < 0) {
        newErrors.cost = "إجمالي التكلفة لا يمكن أن تكون سالبة";
      }
      if (formData.cost < formData.official_fees) {
        newErrors.cost = "إجمالي التكلفة يجب أن تكون أكبر من أو تساوي الرسوم الرسمية";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateStep(3)) {
      onSubmit(formData);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, ...files]
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const getPriorityBadge = (priority: string) => {
    const option = priorityOptions.find(opt => opt.value === priority);
    return option ? (
      <Badge className={option.color}>
        {option.label}
      </Badge>
    ) : null;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2 space-x-reverse">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step <= currentStep 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {step < currentStep ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  step
                )}
              </div>
              {step < 3 && (
                <div className={`
                  w-12 h-1 mx-2
                  ${step < currentStep ? 'bg-blue-600' : 'bg-gray-200'}
                `} />
              )}
            </div>
          ))}
        </div>
        <div className="text-sm text-gray-600 font-tajawal">
          الخطوة {currentStep} من 3
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-tajawal">
                <FileText className="w-5 h-5" />
                المعلومات الأساسية
              </CardTitle>
              <CardDescription className="font-tajawal">
                أدخل تفاصيل المعاملة الحكومية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service_name" className="font-tajawal">اسم المعاملة *</Label>
                  <Input
                    id="service_name"
                    value={formData.service_name}
                    onChange={(e) => handleInputChange('service_name', e.target.value)}
                    placeholder="مثال: تجديد عقد إيجار تجاري"
                    className={cn("font-tajawal", errors.service_name && "border-red-500")}
                  />
                  {errors.service_name && (
                    <p className="text-sm text-red-600 font-tajawal">{errors.service_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_type" className="font-tajawal">نوع الخدمة *</Label>
                  <Select
                    value={formData.service_type}
                    onValueChange={(value) => handleInputChange('service_type', value)}
                  >
                    <SelectTrigger className={cn("font-tajawal", errors.service_type && "border-red-500")}>
                      <SelectValue placeholder="اختر نوع الخدمة" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map((type) => (
                        <SelectItem key={type} value={type} className="font-tajawal">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.service_type && (
                    <p className="text-sm text-red-600 font-tajawal">{errors.service_type}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="government_entity" className="font-tajawal">الجهة الحكومية *</Label>
                  <Select
                    value={formData.government_entity}
                    onValueChange={(value) => handleInputChange('government_entity', value)}
                  >
                    <SelectTrigger className={cn("font-tajawal", errors.government_entity && "border-red-500")}>
                      <Building2 className="w-4 h-4 ml-2" />
                      <SelectValue placeholder="اختر الجهة الحكومية" />
                    </SelectTrigger>
                    <SelectContent>
                      {governmentEntities.map((entity) => (
                        <SelectItem key={entity} value={entity} className="font-tajawal">
                          {entity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.government_entity && (
                    <p className="text-sm text-red-600 font-tajawal">{errors.government_entity}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="font-tajawal">فئة الخدمة *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger className={cn("font-tajawal", errors.category && "border-red-500")}>
                      <SelectValue placeholder="اختر فئة الخدمة" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category} className="font-tajawal">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-red-600 font-tajawal">{errors.category}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="font-tajawal">الأولوية</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => handleInputChange('priority', value as any)}
                  >
                    <SelectTrigger className="font-tajawal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="font-tajawal">
                          <div className="flex items-center gap-2">
                            <Badge className={option.color} variant="secondary">
                              {option.label}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Financial Information */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-tajawal">
                <DollarSign className="w-5 h-5" />
                المعلومات المالية
              </CardTitle>
              <CardDescription className="font-tajawal">
                أدخل تفاصيل الرسوم والتكاليف
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="official_fees" className="font-tajawal">الرسوم الرسمية (درهم)</Label>
                  <Input
                    id="official_fees"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.official_fees}
                    onChange={(e) => handleInputChange('official_fees', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className={cn("font-tajawal", errors.official_fees && "border-red-500")}
                  />
                  {errors.official_fees && (
                    <p className="text-sm text-red-600 font-tajawal">{errors.official_fees}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost" className="font-tajawal">إجمالي التكلفة (درهم)</Label>
                  <Input
                    id="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className={cn("font-tajawal", errors.cost && "border-red-500")}
                  />
                  {errors.cost && (
                    <p className="text-sm text-red-600 font-tajawal">{errors.cost}</p>
                  )}
                  {formData.cost > 0 && (
                    <p className="text-sm text-gray-600 font-tajawal">
                      التكلفة: {formatCurrency(formData.cost)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected_completion_date" className="font-tajawal">التاريخ المتوقع للإنجاز</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-right font-normal font-tajawal",
                          !formData.expected_completion_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {formData.expected_completion_date ? (
                          format(formData.expected_completion_date, "dd/MM/yyyy", { locale: ar })
                        ) : (
                          "اختر التاريخ"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.expected_completion_date}
                        onSelect={(date) => handleInputChange('expected_completion_date', date)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date" className="font-tajawal">تاريخ الاستحقاق</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-right font-normal font-tajawal",
                          !formData.due_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {formData.due_date ? (
                          format(formData.due_date, "dd/MM/yyyy", { locale: ar })
                        ) : (
                          "اختر التاريخ"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.due_date}
                        onSelect={(date) => handleInputChange('due_date', date)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Cost Summary */}
              {(formData.official_fees > 0 || formData.cost > 0) && (
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3 font-tajawal">ملخص التكاليف</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-tajawal">الرسوم الرسمية:</span>
                        <span className="font-semibold font-tajawal">{formatCurrency(formData.official_fees)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-tajawal">رسوم الخدمة:</span>
                        <span className="font-semibold font-tajawal">{formatCurrency(formData.cost - formData.official_fees)}</span>
                      </div>
                      <hr />
                      <div className="flex justify-between text-lg font-bold">
                        <span className="font-tajawal">إجمالي التكلفة:</span>
                        <span className="font-tajawal">{formatCurrency(formData.cost)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Additional Details */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-tajawal">
                <User className="w-5 h-5" />
                تفاصيل إضافية
              </CardTitle>
              <CardDescription className="font-tajawal">
                ملاحظات ومستندات المعاملة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes" className="font-tajawal">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="أدخل أي ملاحظات إضافية..."
                  className="min-h-[100px] font-tajawal"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-tajawal">المستندات المرفقة</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="space-y-2">
                      <FileText className="h-8 w-8 text-gray-400 mx-auto" />
                      <p className="text-gray-600 font-tajawal">انقر لرفع المستندات</p>
                      <p className="text-sm text-gray-500 font-tajawal">PDF, DOC, JPG, PNG</p>
                    </div>
                  </label>
                </div>

                {formData.documents.length > 0 && (
                  <div className="space-y-2">
                    <Label className="font-tajawal">الملفات المرفقة</Label>
                    {formData.documents.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-tajawal">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary */}
              <Card className="bg-blue-50">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3 font-tajawal">ملخص المعاملة</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 font-tajawal">اسم المعاملة:</span>
                      <p className="font-semibold font-tajawal">{formData.service_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 font-tajawal">الجهة الحكومية:</span>
                      <p className="font-semibold font-tajawal">{formData.government_entity}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 font-tajawal">الأولوية:</span>
                      <div>{getPriorityBadge(formData.priority)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 font-tajawal">إجمالي التكلفة:</span>
                      <p className="font-semibold font-tajawal">{formatCurrency(formData.cost)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                className="font-tajawal"
              >
                السابق
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="font-tajawal"
            >
              إلغاء
            </Button>
          </div>

          <div className="flex gap-2">
            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700 text-white font-tajawal"
              >
                التالي
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white font-tajawal"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري الحفظ...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    إنشاء المعاملة
                  </div>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}