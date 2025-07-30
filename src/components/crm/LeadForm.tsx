import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface LeadFormData {
  full_name: string;
  phone: string;
  email?: string;
  nationality?: string;
  preferred_language: string;
  lead_source: string;
  property_type: string;
  budget_min?: number;
  budget_max?: number;
  preferred_location?: string;
  purchase_purpose: string;
  assigned_to?: string;
  notes?: string;
  next_follow_up?: string;
}

interface LeadFormProps {
  onSuccess: () => void;
  lead?: any;
}

const LEAD_SOURCES = [
  { value: 'facebook_ads', label: 'إعلان فيسبوك' },
  { value: 'google_ads', label: 'إعلان جوجل' },
  { value: 'referral', label: 'توصية' },
  { value: 'whatsapp', label: 'واتساب' },
  { value: 'real_estate_expo', label: 'معرض عقاري' },
  { value: 'other', label: 'أخرى' },
];

const PROPERTY_TYPES = [
  { value: 'villa', label: 'فيلا' },
  { value: 'apartment', label: 'شقة' },
  { value: 'land', label: 'أرض' },
  { value: 'townhouse', label: 'تاون هاوس' },
  { value: 'commercial', label: 'تجاري' },
];

const PURCHASE_PURPOSES = [
  { value: 'investment', label: 'استثمار' },
  { value: 'residence', label: 'سكن' },
  { value: 'resale', label: 'إعادة بيع' },
];

const LANGUAGES = [
  { value: 'ar', label: 'العربية' },
  { value: 'en', label: 'الإنجليزية' },
  { value: 'fr', label: 'الفرنسية' },
  { value: 'ru', label: 'الروسية' },
];

export function LeadForm({ onSuccess, lead }: LeadFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<LeadFormData>({
    defaultValues: lead ? {
      full_name: lead.full_name,
      phone: lead.phone,
      email: lead.email || '',
      nationality: lead.nationality || '',
      preferred_language: lead.preferred_language,
      lead_source: lead.lead_source,
      property_type: lead.property_type,
      budget_min: lead.budget_min || '',
      budget_max: lead.budget_max || '',
      preferred_location: lead.preferred_location || '',
      purchase_purpose: lead.purchase_purpose,
      assigned_to: lead.assigned_to || '',
      notes: lead.notes || '',
      next_follow_up: lead.next_follow_up ? lead.next_follow_up.split('T')[0] : '',
    } : {
      preferred_language: 'ar',
      lead_source: 'other',
      property_type: 'apartment',
      purchase_purpose: 'residence',
    }
  });

  // جلب الموظفين
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .eq('is_active', true)
        .order('first_name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: LeadFormData) => {
      const formData = {
        ...data,
        budget_min: data.budget_min ? Number(data.budget_min) : null,
        budget_max: data.budget_max ? Number(data.budget_max) : null,
        created_by: user?.id,
        ...(lead ? {} : { stage: 'new' })
      };

      if (lead) {
        const { error } = await supabase
          .from('leads')
          .update(formData)
          .eq('id', lead.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('leads')
          .insert([formData]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "تم الحفظ",
        description: lead ? "تم تحديث الليد بنجاح" : "تم إضافة الليد بنجاح",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: LeadFormData) => {
    submitMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* المعلومات الأساسية */}
        <Card>
          <CardHeader>
            <CardTitle>المعلومات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="full_name">الاسم الكامل *</Label>
              <Input
                id="full_name"
                {...register("full_name", { required: "الاسم الكامل مطلوب" })}
                placeholder="أدخل الاسم الكامل"
              />
              {errors.full_name && (
                <p className="text-sm text-destructive mt-1">{errors.full_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">رقم الهاتف *</Label>
              <Input
                id="phone"
                {...register("phone", { required: "رقم الهاتف مطلوب" })}
                placeholder="أدخل رقم الهاتف"
                dir="ltr"
              />
              {errors.phone && (
                <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="أدخل البريد الإلكتروني"
                dir="ltr"
              />
            </div>

            <div>
              <Label htmlFor="nationality">الجنسية</Label>
              <Input
                id="nationality"
                {...register("nationality")}
                placeholder="أدخل الجنسية"
              />
            </div>

            <div>
              <Label htmlFor="preferred_language">لغة التواصل المفضلة *</Label>
              <Select
                value={watch("preferred_language")}
                onValueChange={(value) => setValue("preferred_language", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر اللغة" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* معلومات المصدر والاهتمام */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات المصدر والاهتمام</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="lead_source">مصدر الليد *</Label>
              <Select
                value={watch("lead_source")}
                onValueChange={(value) => setValue("lead_source", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المصدر" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="property_type">نوع العقار المهتم به *</Label>
              <Select
                value={watch("property_type")}
                onValueChange={(value) => setValue("property_type", value)}
              >
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

            <div>
              <Label htmlFor="purchase_purpose">الغرض من الشراء *</Label>
              <Select
                value={watch("purchase_purpose")}
                onValueChange={(value) => setValue("purchase_purpose", value)}
              >
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

            <div>
              <Label htmlFor="preferred_location">الموقع أو المنطقة المفضلة</Label>
              <Input
                id="preferred_location"
                {...register("preferred_location")}
                placeholder="أدخل الموقع المفضل"
              />
            </div>
          </CardContent>
        </Card>

        {/* الميزانية */}
        <Card>
          <CardHeader>
            <CardTitle>الميزانية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="budget_min">الحد الأدنى للميزانية (درهم)</Label>
              <Input
                id="budget_min"
                type="number"
                {...register("budget_min")}
                placeholder="أدخل الحد الأدنى"
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="budget_max">الحد الأقصى للميزانية (درهم)</Label>
              <Input
                id="budget_max"
                type="number"
                {...register("budget_max")}
                placeholder="أدخل الحد الأقصى"
                min="0"
              />
            </div>
          </CardContent>
        </Card>

        {/* إدارة ومتابعة */}
        <Card>
          <CardHeader>
            <CardTitle>إدارة ومتابعة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="assigned_to">الموظف المسؤول</Label>
              <Select
                value={watch("assigned_to")}
                onValueChange={(value) => setValue("assigned_to", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموظف المسؤول" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">غير مُعيّن</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.user_id} value={employee.user_id}>
                      {employee.first_name} {employee.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="next_follow_up">موعد المتابعة التالي</Label>
              <Input
                id="next_follow_up"
                type="date"
                {...register("next_follow_up")}
              />
            </div>

            <div>
              <Label htmlFor="notes">ملاحظات داخلية</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="أدخل أي ملاحظات إضافية"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* أزرار الحفظ */}
      <div className="flex justify-end space-x-4 space-x-reverse pt-6 border-t">
        <Button
          type="submit"
          disabled={submitMutation.isPending}
          className="bg-primary text-primary-foreground"
        >
          {submitMutation.isPending ? "جاري الحفظ..." : (lead ? "تحديث الليد" : "إضافة الليد")}
        </Button>
      </div>
    </form>
  );
}