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
import { Upload, X, Check, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  owner_phone: z.string().min(8, 'رقم هاتف المالك مطلوب'),
  property_owner_id: z.string().optional(),
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
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<any>(null);

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      property_type: 'villa',
      property_status: 'available',
      transaction_type: 'sale',
      emirate: 'ajman',
      finish_quality: 'standard',
      is_negotiable: false,
      interior_features: [],
      exterior_features: [],
      owner_phone: '',
      property_owner_id: '',
    }
  });

  // Load owners on component mount
  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    try {
      const { data, error } = await supabase
        .from('property_owners')
        .select('id, full_name, mobile_numbers')
        .eq('is_active', true)
        .order('full_name');
      
      if (error) throw error;
      setOwners(data || []);
    } catch (error) {
      console.error('Error fetching owners:', error);
    }
  };

  // Function to find owner by phone number
  const findOwnerByPhone = (phoneNumber: string) => {
    return owners.find(owner => {
      const mobileNumbers = Array.isArray(owner.mobile_numbers) ? owner.mobile_numbers : [];
      return mobileNumbers.some((num: string) => 
        num.replace(/[\s\-\(\)]/g, '') === phoneNumber.replace(/[\s\-\(\)]/g, '')
      );
    });
  };

  // Watch for phone number changes
  const watchOwnerPhone = form.watch('owner_phone');
  
  useEffect(() => {
    if (watchOwnerPhone && watchOwnerPhone.length > 8) {
      const owner = findOwnerByPhone(watchOwnerPhone);
      if (owner) {
        setSelectedOwner(owner);
        form.setValue('property_owner_id', owner.id);
        toast({
          title: "تم العثور على المالك",
          description: `تم ربط العقار بالمالك: ${owner.full_name}`,
        });
      } else {
        setSelectedOwner(null);
        form.setValue('property_owner_id', '');
      }
    }
  }, [watchOwnerPhone, owners, form, toast]);

  const watchPropertyType = form.watch('property_type');

  useEffect(() => {
    if (property) {
      // Find owner if property has property_owner_id
      if (property.property_owner_id) {
        const owner = owners.find(o => o.id === property.property_owner_id);
        if (owner) {
          setSelectedOwner(owner);
          form.setValue('owner_phone', Array.isArray(owner.mobile_numbers) ? owner.mobile_numbers[0] : '');
        }
      }
      
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
        property_owner_id: property.property_owner_id || '',
        owner_phone: '',
      });
      try {
        const photos = typeof property.photos === 'string' ? JSON.parse(property.photos) : property.photos || [];
        setUploadedPhotos(photos);
      } catch {
        setUploadedPhotos([]);
      }
    }
  }, [property, form, owners]);

  const onSubmit = async (data: PropertyFormData) => {
    setIsSubmitting(true);
    try {
      const submitData = {
        ...data,
        photos: JSON.stringify(uploadedPhotos),
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
          
          {/* Owner Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>معلومات المالك</CardTitle>
              <CardDescription>أدخل رقم هاتف المالك للربط التلقائي</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="owner_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم هاتف المالك *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="مثال: +971501234567" 
                        {...field} 
                        className="text-right"
                        dir="rtl"
                      />
                    </FormControl>
                    <FormMessage />
                    {selectedOwner && (
                      <div className="flex items-center gap-2 mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <Check className="h-5 w-5 text-green-600" />
                        <User className="h-4 w-4 text-green-600" />
                        <span className="text-green-800 font-medium">
                          تم ربط العقار بالمالك: {selectedOwner.full_name}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          مربوط
                        </Badge>
                      </div>
                    )}
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

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
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
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

          {/* Description */}
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
                    <FormLabel>وصف العقار *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="وصف تفصيلي وجذاب للعقار..."
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