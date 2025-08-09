import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';

const propertySchema = z.object({
  title: z.string().min(1, 'عنوان العقار مطلوب'),
  property_type: z.enum(['villa', 'apartment', 'land', 'shop', 'office', 'other']),
  property_status: z.enum(['available', 'reserved', 'sold', 'under_construction']),
  transaction_type: z.enum(['sale', 'rent', 'resale', 'off_plan']),
  developer: z.string().optional(),
  emirate: z.enum(['ajman', 'dubai', 'sharjah', 'abu_dhabi', 'ras_al_khaimah', 'fujairah', 'umm_al_quwain']),
  area_community: z.string().min(1, 'المنطقة/المجتمع مطلوب'),
  full_address: z.string().min(1, 'العنوان الكامل مطلوب'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  plot_area: z.number().optional(),
  built_up_area: z.number().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  floor_number: z.number().optional(),
  unit_number: z.string().optional(),
  property_age: z.number().optional(),
  finish_quality: z.enum(['super_deluxe', 'standard', 'shell_core']).optional(),
  total_price: z.number().min(1, 'السعر الإجمالي مطلوب'),
  is_negotiable: z.boolean().default(false),
  down_payment: z.number().optional(),
  monthly_installments: z.number().optional(),
  commission_percentage: z.number().optional(),
  interior_features: z.array(z.string()).default([]),
  exterior_features: z.array(z.string()).default([]),
  virtual_tour_video: z.string().optional(),
  floor_plan_url: z.string().optional(),
  seo_description: z.string().min(10, 'الوصف يجب أن يكون 10 أحرف على الأقل'),
  internal_notes: z.string().optional(),
  assigned_employee: z.string().optional(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

interface PropertyFormProps {
  property?: any;
  onSuccess: () => void;
}

const propertyTypeLabels = {
  villa: 'فيلا',
  apartment: 'شقة',
  land: 'أرض',
  shop: 'محل تجاري',
  office: 'مكتب',
  other: 'أخرى'
};

const statusLabels = {
  available: 'متاح',
  reserved: 'محجوز',
  sold: 'مباع',
  under_construction: 'تحت الإنشاء'
};

const transactionTypeLabels = {
  sale: 'بيع',
  rent: 'إيجار',
  resale: 'إعادة بيع',
  off_plan: 'على الخريطة'
};

const emirateLabels = {
  ajman: 'عجمان',
  dubai: 'دبي',
  sharjah: 'الشارقة',
  abu_dhabi: 'أبوظبي',
  ras_al_khaimah: 'رأس الخيمة',
  fujairah: 'الفجيرة',
  umm_al_quwain: 'أم القيوين'
};

const finishQualityLabels = {
  super_deluxe: 'سوبر ديلوكس',
  standard: 'ستاندرد',
  shell_core: 'هيكل وقواعد'
};

const interiorFeaturesList = [
  { id: 'central_ac', label: 'تكييف مركزي' },
  { id: 'equipped_kitchen', label: 'مطبخ مجهز' },
  { id: 'maid_room', label: 'غرفة خادمة' },
  { id: 'balcony', label: 'شرفة' },
  { id: 'built_in_wardrobes', label: 'خزائن مدمجة' },
];

const exteriorFeaturesList = [
  { id: 'private_pool', label: 'مسبح خاص' },
  { id: 'shared_pool', label: 'مسبح مشترك' },
  { id: 'garden', label: 'حديقة/فناء' },
  { id: 'covered_parking', label: 'موقف مغطى' },
  { id: 'nearby_facilities', label: 'مرافق قريبة (مدارس، مستشفيات، أسواق، مساجد)' },
  { id: 'security_24_7', label: 'أمن 24/7' },
];

export function PropertyForm({ property, onSuccess }: PropertyFormProps) {
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: '',
      property_type: 'apartment',
      property_status: 'available',
      transaction_type: 'sale',
      developer: '',
      emirate: 'ajman',
      area_community: '',
      full_address: '',
      latitude: undefined,
      longitude: undefined,
      plot_area: undefined,
      built_up_area: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      floor_number: undefined,
      unit_number: '',
      property_age: undefined,
      finish_quality: undefined,
      total_price: 0,
      is_negotiable: false,
      down_payment: undefined,
      monthly_installments: undefined,
      commission_percentage: undefined,
      interior_features: [],
      exterior_features: [],
      virtual_tour_video: '',
      floor_plan_url: '',
      seo_description: '',
      internal_notes: '',
    }
  });

  const watchPropertyType = form.watch('property_type');

  useEffect(() => {
    if (property) {
      form.reset({
        ...property,
        latitude: property.latitude ? Number(property.latitude) : undefined,
        longitude: property.longitude ? Number(property.longitude) : undefined,
        plot_area: property.plot_area ? Number(property.plot_area) : undefined,
        built_up_area: property.built_up_area ? Number(property.built_up_area) : undefined,
        total_price: Number(property.total_price),
        down_payment: property.down_payment ? Number(property.down_payment) : undefined,
        monthly_installments: property.monthly_installments ? Number(property.monthly_installments) : undefined,
        commission_percentage: property.commission_percentage ? Number(property.commission_percentage) : undefined,
        interior_features: property.interior_features || [],
        exterior_features: property.exterior_features || [],
      });
      setUploadedPhotos(property.photos || []);
    }
  }, [property, form]);

  const onSubmit = async (data: PropertyFormData) => {
    setIsSubmitting(true);
    try {
      const submitData = {
        ...data,
        photos: uploadedPhotos,
      };

      let result;
      if (property?.id) {
        result = await supabase
          .from('crm_properties')
          .update(submitData)
          .eq('id', property.id);
      } else {
        result = await supabase
          .from('crm_properties')
          .insert(submitData as any);
      }

      if (result.error) {
        throw result.error;
      }

      toast({
        title: "تم الحفظ بنجاح",
        description: property?.id ? "تم تحديث العقار بنجاح" : "تم إضافة العقار بنجاح"
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving property:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ العقار",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `property-${Date.now()}-${i}.${file.name.split('.').pop()}`;
      
      try {
        const { data, error } = await supabase.storage
          .from('property-photos')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('property-photos')
          .getPublicUrl(fileName);

        setUploadedPhotos(prev => [...prev, publicUrl]);
      } catch (error) {
        console.error('Error uploading photo:', error);
        toast({
          title: "خطأ في رفع الصورة",
          description: "حدث خطأ أثناء رفع الصورة",
          variant: "destructive"
        });
      }
    }
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const isLandProperty = watchPropertyType === 'land';
  const needsFloorNumber = ['apartment', 'shop', 'office'].includes(watchPropertyType);
  const needsBedroomsBathrooms = ['villa', 'apartment'].includes(watchPropertyType);

  return (
    <div className="max-w-4xl mx-auto space-y-6" dir="rtl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>المعلومات الأساسية</CardTitle>
              <CardDescription>معلومات العقار الرئيسية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عنوان العقار *</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: فيلا فاخرة في عجمان" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="property_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع العقار *</FormLabel>
                      <FormControl>
                        <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                          {Object.entries(propertyTypeLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="property_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>حالة العقار *</FormLabel>
                      <FormControl>
                        <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                          {Object.entries(statusLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="transaction_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع المعاملة *</FormLabel>
                      <FormControl>
                        <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                          {Object.entries(transactionTypeLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="developer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المطور</FormLabel>
                      <FormControl>
                        <Input placeholder="اسم شركة التطوير" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location Details */}
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل الموقع</CardTitle>
              <CardDescription>معلومات موقع العقار</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emirate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الإمارة *</FormLabel>
                      <FormControl>
                        <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                          {Object.entries(emirateLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="area_community"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المنطقة/المجتمع *</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: النعيمية، الراشدية" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="full_address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>العنوان الكامل *</FormLabel>
                      <FormControl>
                        <Input placeholder="العنوان التفصيلي للعقار" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>خط العرض (GPS)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="any"
                          placeholder="25.4052"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>خط الطول (GPS)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="any"
                          placeholder="55.5136"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Property Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>مواصفات العقار</CardTitle>
              <CardDescription>التفاصيل الفنية للعقار</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="plot_area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مساحة الأرض (م²) {isLandProperty ? '*' : ''}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="500"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isLandProperty && (
                  <FormField
                    control={form.control}
                    name="built_up_area"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المساحة المبنية (م²) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="200"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {needsBedroomsBathrooms && (
                  <>
                    <FormField
                      control={form.control}
                      name="bedrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>عدد غرف النوم *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="3"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bathrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>عدد دورات المياه *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="2"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {needsFloorNumber && (
                  <FormField
                    control={form.control}
                    name="floor_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم الطابق *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="2"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {!isLandProperty && (
                  <>
                    <FormField
                      control={form.control}
                      name="unit_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم الوحدة/الشقة</FormLabel>
                          <FormControl>
                            <Input placeholder="A-101" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="property_age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>عمر العقار (بالسنوات)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="5"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="finish_quality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>جودة التشطيب</FormLabel>
                          <FormControl>
                            <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                              <option value="">اختر جودة التشطيب</option>
                              {Object.entries(finishQualityLabels).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Price & Financials */}
          <Card>
            <CardHeader>
              <CardTitle>السعر والتفاصيل المالية</CardTitle>
              <CardDescription>معلومات التسعير والدفع</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="total_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>السعر الإجمالي (درهم) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="500000"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="down_payment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الدفعة المقدمة (درهم)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="50000"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="monthly_installments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الأقساط الشهرية (درهم)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="5000"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="commission_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نسبة العمولة (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder="2.5"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_negotiable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>قابل للتفاوض</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>المميزات والخدمات</CardTitle>
              <CardDescription>اختر المميزات المتوفرة في العقار</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Interior Features */}
              <div>
                <h4 className="font-semibold mb-3">المميزات الداخلية</h4>
                <FormField
                  control={form.control}
                  name="interior_features"
                  render={({ field }) => (
                    <FormItem>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {interiorFeaturesList.map((feature) => (
                          <FormItem
                            key={feature.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(feature.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, feature.id]);
                                  } else {
                                    field.onChange(field.value?.filter((value) => value !== feature.id));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {feature.label}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Exterior Features */}
              <div>
                <h4 className="font-semibold mb-3">المميزات الخارجية والمجتمع</h4>
                <FormField
                  control={form.control}
                  name="exterior_features"
                  render={({ field }) => (
                    <FormItem>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {exteriorFeaturesList.map((feature) => (
                          <FormItem
                            key={feature.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(feature.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, feature.id]);
                                  } else {
                                    field.onChange(field.value?.filter((value) => value !== feature.id));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {feature.label}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Media Upload */}
          <Card>
            <CardHeader>
              <CardTitle>الصور والوسائط</CardTitle>
              <CardDescription>رفع صور عالية الجودة للعقار</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <FormLabel>صور العقار</FormLabel>
                <div className="mt-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400"
                  >
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">انقر لرفع الصور</p>
                    </div>
                  </label>
                </div>
                
                {uploadedPhotos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {uploadedPhotos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo}
                          alt={`صورة ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="virtual_tour_video"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رابط فيديو الجولة الافتراضية</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="floor_plan_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رابط مخطط الطابق</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Descriptions */}
          <Card>
            <CardHeader>
              <CardTitle>الوصف والملاحظات</CardTitle>
              <CardDescription>معلومات تفصيلية عن العقار</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="seo_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوصف المحسن لمحركات البحث *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="وصف تفصيلي وجذاب للعقار يساعد في الظهور في نتائج البحث..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="internal_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ملاحظات داخلية (للموظفين فقط)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="ملاحظات خاصة بالفريق حول العقار..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : (property?.id ? 'تحديث العقار' : 'إضافة العقار')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}