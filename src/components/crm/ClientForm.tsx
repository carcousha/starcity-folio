import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Upload, X, FileText, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ClientFormData {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  nationality?: string;
  preferred_language: string;
  preferred_contact_method?: string;
  property_type_interest?: string;
  purchase_purpose?: string;
  budget_min?: number;
  budget_max?: number;
  preferred_location?: string;
  planned_purchase_date?: string;
  client_status: string;
  source?: string;
  preferred_payment_method?: string;
  last_contacted?: string;
  previous_deals_count: number;
  preferences?: string;
  notes?: string;
  internal_notes?: string;
}

interface ClientFormProps {
  client?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

// Options for dropdowns
const NATIONALITIES = [
  "الإمارات العربية المتحدة", "المملكة العربية السعودية", "قطر", "الكويت", "البحرين", "عمان",
  "مصر", "لبنان", "الأردن", "سوريا", "العراق", "فلسطين", "المغرب", "تونس", "الجزائر",
  "الولايات المتحدة", "المملكة المتحدة", "ألمانيا", "فرنسا", "كندا", "أستراليا",
  "الهند", "باكستان", "بنغلاديش", "الفلبين", "إندونيسيا", "روسيا", "أخرى"
];

const CONTACT_METHODS = [
  { value: 'phone', label: 'مكالمة هاتفية' },
  { value: 'whatsapp', label: 'واتساب' },
  { value: 'email', label: 'بريد إلكتروني' },
  { value: 'sms', label: 'رسالة نصية' }
];

const PROPERTY_TYPES = [
  { value: 'villa', label: 'فيلا' },
  { value: 'apartment', label: 'شقة' },
  { value: 'townhouse', label: 'تاون هاوس' },
  { value: 'land', label: 'أرض' },
  { value: 'commercial', label: 'تجاري' },
  { value: 'warehouse', label: 'مستودع' },
  { value: 'office', label: 'مكتب' }
];

const PURCHASE_PURPOSES = [
  { value: 'investment', label: 'استثمار' },
  { value: 'residence', label: 'سكن' },
  { value: 'resale', label: 'إعادة بيع' },
  { value: 'commercial', label: 'تجاري' }
];

const CLIENT_STATUSES = [
  { value: 'new', label: 'جديد' },
  { value: 'contacted', label: 'تم التواصل' },
  { value: 'negotiating', label: 'قيد التفاوض' },
  { value: 'deal_closed', label: 'صفقة ناجحة' },
  { value: 'deal_lost', label: 'صفقة ضائعة' }
];

const SOURCES = [
  { value: 'google_ads', label: 'إعلان جوجل' },
  { value: 'whatsapp', label: 'واتساب' },
  { value: 'referral', label: 'توصية' },
  { value: 'exhibition', label: 'معرض عقاري' },
  { value: 'website', label: 'موقع الويب' },
  { value: 'social_media', label: 'وسائل التواصل' },
  { value: 'cold_call', label: 'مكالمة باردة' },
  { value: 'walk_in', label: 'زيارة مباشرة' }
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'كاش' },
  { value: 'bank_financing', label: 'تمويل بنكي' },
  { value: 'installments', label: 'أقساط' },
  { value: 'mixed', label: 'مختلط' }
];

export default function ClientForm({ client, onSuccess, onCancel }: ClientFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ClientFormData>({
    defaultValues: {
      name: client?.name || "",
      phone: client?.phone || "",
      email: client?.email || "",
      address: client?.address || "",
      nationality: client?.nationality || "",
      preferred_language: client?.preferred_language || "ar",
      preferred_contact_method: client?.preferred_contact_method || "",
      property_type_interest: client?.property_type_interest || "",
      purchase_purpose: client?.purchase_purpose || "",
      budget_min: client?.budget_min || undefined,
      budget_max: client?.budget_max || undefined,
      preferred_location: client?.preferred_location || "",
      planned_purchase_date: client?.planned_purchase_date || "",
      client_status: client?.client_status || "new",
      source: client?.source || "",
      preferred_payment_method: client?.preferred_payment_method || "",
      last_contacted: client?.last_contacted || "",
      previous_deals_count: client?.previous_deals_count || 0,
      preferences: client?.preferences || "",
      notes: client?.notes || "",
      internal_notes: client?.internal_notes || ""
    }
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .eq('is_active', true)
        .order('first_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const onSubmit = async (data: ClientFormData) => {
    setLoading(true);
    try {
      const clientData = {
        ...data,
        // تحويل التواريخ الفارغة إلى null
        planned_purchase_date: data.planned_purchase_date || null,
        last_contacted: data.last_contacted || null,
        created_by: user?.id,
        assigned_to: user?.id
      };

      if (client) {
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', client.id);

        if (error) throw error;

        toast({
          title: "تم التحديث بنجاح",
          description: "تم تحديث بيانات العميل بنجاح",
        });
      } else {
        const { error } = await supabase
          .from('clients')
          .insert(clientData);

        if (error) throw error;

        toast({
          title: "تم الإضافة بنجاح",
          description: "تم إضافة العميل الجديد بنجاح",
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في حفظ بيانات العميل",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-right">
            {client ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
          </CardTitle>
          <CardDescription className="text-right">
            {client ? 'تعديل جميع البيانات الخاصة بالعميل' : 'إضافة عميل جديد مع جميع التفاصيل اللازمة'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full" dir="rtl">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">البيانات الأساسية</TabsTrigger>
                <TabsTrigger value="investment">تفاصيل الاستثمار</TabsTrigger>
                <TabsTrigger value="crm">حالة CRM</TabsTrigger>
                <TabsTrigger value="notes">الملاحظات</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">اسم العميل *</Label>
                    <Input
                      id="name"
                      {...register("name", { required: "اسم العميل مطلوب" })}
                      placeholder="الاسم الكامل"
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف *</Label>
                    <Input
                      id="phone"
                      {...register("phone", { required: "رقم الهاتف مطلوب" })}
                      placeholder="+971501234567"
                      dir="ltr"
                    />
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="client@example.com"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nationality">الجنسية</Label>
                    <Select onValueChange={(value) => setValue("nationality", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الجنسية" />
                      </SelectTrigger>
                      <SelectContent>
                        {NATIONALITIES.map((nationality) => (
                          <SelectItem key={nationality} value={nationality}>
                            {nationality}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferred_language">لغة التواصل المفضلة</Label>
                    <Select onValueChange={(value) => setValue("preferred_language", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر اللغة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="en">الإنجليزية</SelectItem>
                        <SelectItem value="both">كلاهما</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferred_contact_method">طريقة التواصل المفضلة</Label>
                    <Select onValueChange={(value) => setValue("preferred_contact_method", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر طريقة التواصل" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_METHODS.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">العنوان</Label>
                    <Input
                      id="address"
                      {...register("address")}
                      placeholder="عجمان، الإمارات العربية المتحدة"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="investment" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="property_type_interest">نوع العقار المهتم به</Label>
                    <Select onValueChange={(value) => setValue("property_type_interest", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع العقار" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purchase_purpose">غرض الشراء</Label>
                    <Select onValueChange={(value) => setValue("purchase_purpose", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الغرض" />
                      </SelectTrigger>
                      <SelectContent>
                        {PURCHASE_PURPOSES.map((purpose) => (
                          <SelectItem key={purpose.value} value={purpose.value}>
                            {purpose.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget_min">الميزانية الدنيا (درهم)</Label>
                    <Input
                      id="budget_min"
                      type="number"
                      {...register("budget_min", { valueAsNumber: true })}
                      placeholder="100000"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget_max">الميزانية العليا (درهم)</Label>
                    <Input
                      id="budget_max"
                      type="number"
                      {...register("budget_max", { valueAsNumber: true })}
                      placeholder="500000"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferred_location">الموقع المفضل</Label>
                    <Input
                      id="preferred_location"
                      {...register("preferred_location")}
                      placeholder="عجمان، دبي، الشارقة..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="planned_purchase_date">تاريخ التخطيط للشراء</Label>
                    <Input
                      id="planned_purchase_date"
                      type="date"
                      {...register("planned_purchase_date")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferred_payment_method">طريقة الدفع المفضلة</Label>
                    <Select onValueChange={(value) => setValue("preferred_payment_method", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر طريقة الدفع" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="crm" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client_status">حالة العميل</Label>
                    <Select onValueChange={(value) => setValue("client_status", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLIENT_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="source">مصدر العميل</Label>
                    <Select onValueChange={(value) => setValue("source", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المصدر" />
                      </SelectTrigger>
                      <SelectContent>
                        {SOURCES.map((source) => (
                          <SelectItem key={source.value} value={source.value}>
                            {source.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_contacted">تاريخ آخر تواصل</Label>
                    <Input
                      id="last_contacted"
                      type="date"
                      {...register("last_contacted")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="previous_deals_count">عدد الصفقات السابقة</Label>
                    <Input
                      id="previous_deals_count"
                      type="number"
                      {...register("previous_deals_count", { valueAsNumber: true })}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferences">التفضيلات العامة</Label>
                    <Textarea
                      id="preferences"
                      {...register("preferences")}
                      placeholder="تفضيلات العميل العامة، متطلبات خاصة..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">ملاحظات عامة</Label>
                    <Textarea
                      id="notes"
                      {...register("notes")}
                      placeholder="ملاحظات عامة حول العميل..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="internal_notes">ملاحظات داخلية</Label>
                    <Textarea
                      id="internal_notes"
                      {...register("internal_notes")}
                      placeholder="ملاحظات داخلية للموظفين (لا تظهر للعميل)..."
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground">
                      هذه الملاحظات خاصة بالموظفين ولا تظهر للعميل
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                إلغاء
              </Button>
              <Button type="submit" disabled={loading} className="bg-yellow-500 hover:bg-yellow-600">
                {loading ? "جاري الحفظ..." : (client ? "تحديث البيانات" : "إضافة العميل")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}