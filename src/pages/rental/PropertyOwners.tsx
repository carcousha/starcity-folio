import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Mail, Globe, Calendar as CalendarIcon, IdCard, MapPin, MessageSquare, Languages, FileText, CheckCircle, X, ArrowLeft } from 'lucide-react';
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface PropertyOwnerForm {
  full_name: string;
  phone: string;
  email: string;
  birth_date?: Date;
  nationality: string;
  id_passport_number: string;
  mailing_address: string;
  preferred_contact_method: string;
  preferred_language: string;
  internal_notes: string;
  status: string;
}

const PropertyOwners = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [formData, setFormData] = useState<PropertyOwnerForm>({
    full_name: '',
    phone: '',
    email: '',
    birth_date: undefined,
    nationality: '',
    id_passport_number: '',
    mailing_address: '',
    preferred_contact_method: 'whatsapp',
    preferred_language: 'ar',
    internal_notes: '',
    status: 'active'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.full_name || !formData.phone || !formData.email) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Here you would typically save to Supabase
      // const { error } = await supabase...
      
      toast({
        title: "تم الحفظ",
        description: "تم إضافة المالك بنجاح",
      });
      
      // Navigate to next step or back to list
      navigate('/rental/contracts');
    } catch (error) {
      console.error('Error saving owner:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ بيانات المالك",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-tajawal" dir="rtl">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* شريط التقدم */}
        <Card className="mb-6 border-t-4 border-t-blue-500">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-gray-800 flex items-center gap-2">
                  <User className="h-6 w-6 text-blue-500" />
                  إضافة مالك جديد
                </CardTitle>
                <CardDescription className="text-gray-600 mt-1">
                  الخطوة 1 من 2 - بيانات المالك الأساسية
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4 ml-2" />
                العودة
              </Button>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>بيانات المالك</span>
                <span>50%</span>
              </div>
              <Progress value={50} className="h-2" />
            </div>
          </CardHeader>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* البيانات الأساسية */}
          <Card className="shadow-sm">
            <CardHeader className="bg-blue-50/50">
              <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                البيانات الأساسية
              </CardTitle>
              <CardDescription>الحقول المطلوبة لإضافة المالك</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-500" />
                    الاسم الكامل *
                  </Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    placeholder="أدخل الاسم الكامل"
                    className="border-gray-300 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-500" />
                    رقم الهاتف *
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+971 50 123 4567"
                    className="border-gray-300 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email" className="text-gray-700 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-500" />
                    البريد الإلكتروني *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="owner@example.com"
                    className="border-gray-300 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* البيانات الإضافية */}
          <Card className="shadow-sm">
            <CardHeader className="bg-gray-50/50">
              <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                <IdCard className="h-5 w-5 text-gray-500" />
                البيانات الإضافية
              </CardTitle>
              <CardDescription>معلومات تفصيلية عن المالك (اختيارية)</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* تاريخ الميلاد */}
                <div className="space-y-2">
                  <Label className="text-gray-700 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    تاريخ الميلاد
                  </Label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-right font-normal border-gray-300",
                          !formData.birth_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {formData.birth_date ? (
                          format(formData.birth_date, "PPP", { locale: ar })
                        ) : (
                          <span>اختر التاريخ</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.birth_date}
                        onSelect={(date) => {
                          setFormData({...formData, birth_date: date});
                          setCalendarOpen(false);
                        }}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* الجنسية */}
                <div className="space-y-2">
                  <Label className="text-gray-700 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    الجنسية
                  </Label>
                  <Select value={formData.nationality} onValueChange={(value) => setFormData({...formData, nationality: value})}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="اختر الجنسية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ae">الإمارات العربية المتحدة</SelectItem>
                      <SelectItem value="sa">السعودية</SelectItem>
                      <SelectItem value="eg">مصر</SelectItem>
                      <SelectItem value="jo">الأردن</SelectItem>
                      <SelectItem value="lb">لبنان</SelectItem>
                      <SelectItem value="sy">سوريا</SelectItem>
                      <SelectItem value="iq">العراق</SelectItem>
                      <SelectItem value="kw">الكويت</SelectItem>
                      <SelectItem value="qa">قطر</SelectItem>
                      <SelectItem value="bh">البحرين</SelectItem>
                      <SelectItem value="om">عمان</SelectItem>
                      <SelectItem value="pk">باكستان</SelectItem>
                      <SelectItem value="in">الهند</SelectItem>
                      <SelectItem value="bd">بنغلاديش</SelectItem>
                      <SelectItem value="other">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* رقم الهوية/جواز السفر */}
                <div className="space-y-2">
                  <Label htmlFor="id_passport" className="text-gray-700 flex items-center gap-2">
                    <IdCard className="h-4 w-4 text-gray-500" />
                    رقم الهوية/جواز السفر
                  </Label>
                  <Input
                    id="id_passport"
                    value={formData.id_passport_number}
                    onChange={(e) => setFormData({...formData, id_passport_number: e.target.value})}
                    placeholder="784-1985-1234567-8"
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>

                {/* طريقة التواصل المفضلة */}
                <div className="space-y-2">
                  <Label className="text-gray-700 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    طريقة التواصل المفضلة
                  </Label>
                  <Select value={formData.preferred_contact_method} onValueChange={(value) => setFormData({...formData, preferred_contact_method: value})}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">واتساب</SelectItem>
                      <SelectItem value="email">البريد الإلكتروني</SelectItem>
                      <SelectItem value="sms">رسائل نصية</SelectItem>
                      <SelectItem value="call">مكالمة هاتفية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* لغة التواصل */}
                <div className="space-y-2">
                  <Label className="text-gray-700 flex items-center gap-2">
                    <Languages className="h-4 w-4 text-gray-500" />
                    لغة التواصل
                  </Label>
                  <Select value={formData.preferred_language} onValueChange={(value) => setFormData({...formData, preferred_language: value})}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">الإنجليزية</SelectItem>
                      <SelectItem value="hi">الهندية</SelectItem>
                      <SelectItem value="ur">الأردية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* حالة المالك */}
                <div className="space-y-2">
                  <Label className="text-gray-700 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-gray-500" />
                    حالة المالك
                  </Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="inactive">غير نشط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* عنوان المراسلة */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="mailing_address" className="text-gray-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    عنوان المراسلة
                  </Label>
                  <Textarea
                    id="mailing_address"
                    value={formData.mailing_address}
                    onChange={(e) => setFormData({...formData, mailing_address: e.target.value})}
                    placeholder="أدخل العنوان الكامل للمراسلة"
                    rows={3}
                    className="border-gray-300 focus:border-blue-500 resize-none"
                  />
                </div>

                {/* الملاحظات الداخلية */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="internal_notes" className="text-gray-700 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    الملاحظات الداخلية
                  </Label>
                  <Textarea
                    id="internal_notes"
                    value={formData.internal_notes}
                    onChange={(e) => setFormData({...formData, internal_notes: e.target.value})}
                    placeholder="ملاحظات داخلية حول المالك..."
                    rows={4}
                    className="border-gray-300 focus:border-blue-500 resize-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* أزرار التحكم */}
          <Card className="shadow-sm border-t-2 border-t-blue-100">
            <CardContent className="p-6">
              <div className="flex gap-4 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  className="px-8 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <X className="h-4 w-4 ml-2" />
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 ml-2" />
                  {loading ? 'جاري الحفظ...' : 'حفظ المالك'}
                </Button>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 text-center">
                  بعد حفظ المالك، ستنتقل إلى الخطوة التالية لإنشاء العقد
                </p>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default PropertyOwners;