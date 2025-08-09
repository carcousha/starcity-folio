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
import { useAuth } from '@/hooks/useAuth';
import { Upload, X, Check, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const propertySchema = z.object({
  title: z.string().min(1, 'عنوان العقار مطلوب'),
  property_code: z.string().optional(),
  listing_date: z.string().optional(),
  property_type: z.enum(['villa', 'apartment', 'land', 'shop', 'office', 'other']),
  property_status: z.enum(['available', 'reserved', 'sold', 'under_construction']),
  transaction_type: z.enum(['sale', 'rent', 'resale', 'off_plan']),
  developer: z.string().optional(),
  emirate: z.enum(['ajman', 'dubai', 'sharjah', 'abu_dhabi', 'ras_al_khaimah', 'fujairah', 'umm_al_quwain']),
  area_community: z.string().min(1, 'المنطقة/المجتمع مطلوب'),
  full_address: z.string().min(1, 'العنوان الكامل مطلوب'),
  city: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  plot_area_sqft: z.number().optional(),
  built_up_area_sqft: z.number().optional(),
  plot_area: z.number().optional(), // stored in square meters
  built_up_area: z.number().optional(), // stored in square meters
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  floor_number: z.number().optional(),
  floors: z.number().optional(),
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
  country_code: z.string().min(1, 'مفتاح الدولة مطلوب'),
  owner_phone: z.string().min(8, 'رقم هاتف المالك مطلوب'),
  property_owner_id: z.string().optional(),
  property_details: z.object({
    // Location details
    neighborhood_type: z.string().optional(),
    in_compound: z.boolean().optional(),
    compound_name: z.string().optional(),
    near_landmarks: z.array(z.string()).optional(),
    
    // Technical specifications
    design_style: z.string().optional(),
    air_conditioning: z.string().optional(),
    construction_status: z.string().optional(),
    
    // Facilities & Services
    parking_count: z.number().optional(),
    parking_type: z.string().optional(),
    garden_area: z.number().optional(),
    pool_type: z.string().optional(),
    security_system: z.string().optional(),
    gym: z.boolean().optional(),
    children_play_area: z.boolean().optional(),
    maintenance_services: z.string().optional(),
    internet_provider: z.string().optional(),
    internet_speed: z.string().optional(),
    utilities_electricity: z.string().optional(),
    utilities_water: z.string().optional(),
    utilities_generator: z.boolean().optional(),
    
    // Additional features
    view_type: z.string().optional(),
    orientation: z.string().optional(),
    expansion_possible: z.boolean().optional(),
    has_elevator: z.boolean().optional(),
    flooring_type: z.string().optional(),
    smart_home_features: z.array(z.string()).optional(),
    suitability: z.array(z.string()).optional(),
    
    // Legal status
    legal_status: z.string().optional(),
    has_building_permits: z.boolean().optional(),
    official_valuation: z.number().optional(),
    taxes_fees: z.string().optional(),
    
    // Payment & Pricing
    payment_methods: z.array(z.string()).optional(),
    has_discounts: z.boolean().optional(),
    discount_details: z.string().optional(),
    monthly_costs: z.string().optional(),
    
    // Media
    images_urls: z.array(z.string()).optional(),
    videos_urls: z.array(z.string()).optional(),
    floor_plans_urls: z.array(z.string()).optional(),
  }).default({}),
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

const countryCodeOptions = [
  { code: '+971', country: 'الإمارات', flag: '🇦🇪' },
  { code: '+20', country: 'مصر', flag: '🇪🇬' },
  { code: '+966', country: 'السعودية', flag: '🇸🇦' },
  { code: '+965', country: 'الكويت', flag: '🇰🇼' },
  { code: '+974', country: 'قطر', flag: '🇶🇦' },
  { code: '+973', country: 'البحرين', flag: '🇧🇭' },
  { code: '+968', country: 'عمان', flag: '🇴🇲' },
];

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

// Conversion function: Square Feet to Square Meters
const sqftToSqm = (sqft: number): number => {
  return Number((sqft * 0.092903).toFixed(2));
};

// Conversion function: Square Meters to Square Feet
const sqmToSqft = (sqm: number): number => {
  return Number((sqm / 0.092903).toFixed(2));
};

export function PropertyForm({ property, onSuccess }: PropertyFormProps) {
  const { toast } = useToast();
  const { profile } = useAuth();
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
      country_code: '+971',
      owner_phone: '',
      property_owner_id: '',
      property_code: '',
      listing_date: '',
      city: '',
      floors: undefined,
      plot_area_sqft: undefined,
      built_up_area_sqft: undefined,
      property_details: {},
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
  const findOwnerByPhone = (countryCode: string, phoneNumber: string) => {
    const fullNumber = countryCode + phoneNumber;
    return owners.find(owner => {
      const mobileNumbers = Array.isArray(owner.mobile_numbers) ? owner.mobile_numbers : [];
      return mobileNumbers.some((num: string) => 
        num.replace(/[\s\-\(\)]/g, '') === fullNumber.replace(/[\s\-\(\)]/g, '')
      );
    });
  };

  // Watch for phone number changes
  const watchOwnerPhone = form.watch('owner_phone');
  const watchCountryCode = form.watch('country_code');
  
  useEffect(() => {
    if (watchOwnerPhone && watchOwnerPhone.length > 6 && watchCountryCode) {
      const owner = findOwnerByPhone(watchCountryCode, watchOwnerPhone);
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
  }, [watchOwnerPhone, watchCountryCode, owners, form, toast]);

  const watchPropertyType = form.watch('property_type');
  const watchPlotAreaSqft = form.watch('plot_area_sqft');
  const watchBuiltUpAreaSqft = form.watch('built_up_area_sqft');

  // Auto-convert square feet to square meters
  useEffect(() => {
    if (watchPlotAreaSqft && watchPlotAreaSqft > 0) {
      const sqmValue = sqftToSqm(watchPlotAreaSqft);
      form.setValue('plot_area', sqmValue);
    }
  }, [watchPlotAreaSqft, form]);

  useEffect(() => {
    if (watchBuiltUpAreaSqft && watchBuiltUpAreaSqft > 0) {
      const sqmValue = sqftToSqm(watchBuiltUpAreaSqft);
      form.setValue('built_up_area', sqmValue);
    }
  }, [watchBuiltUpAreaSqft, form]);

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
        plot_area_sqft: property.plot_area ? sqmToSqft(Number(property.plot_area)) : undefined,
        built_up_area_sqft: property.built_up_area ? sqmToSqft(Number(property.built_up_area)) : undefined,
        total_price: Number(property.total_price),
        down_payment: property.down_payment ? Number(property.down_payment) : undefined,
        monthly_installments: property.monthly_installments ? Number(property.monthly_installments) : undefined,
        commission_percentage: property.commission_percentage ? Number(property.commission_percentage) : undefined,
        interior_features: property.interior_features || [],
        exterior_features: property.exterior_features || [],
        property_owner_id: property.property_owner_id || '',
        property_code: property.property_code || '',
        listing_date: property.listing_date || '',
        city: property.city || '',
        floors: property.floors ? Number(property.floors) : undefined,
        property_details: property.property_details || {},
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
      // Enforce linking to an existing owner by phone
      if (!data.property_owner_id) {
        toast({
          title: 'رقم المالك غير مرتبط',
          description: 'يرجى إدخال رقم مالك موجود ليتم ربط العقار بالمالك تلقائياً',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Map only valid DB columns for public.crm_properties and convert types
      const submitData: any = {
        // Basic info
        title: data.title,
        property_type: data.property_type,
        property_status: data.property_status,
        transaction_type: data.transaction_type,
        developer: data.developer ?? null,

        // Location
        emirate: data.emirate,
        area_community: data.area_community,
        full_address: data.full_address,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,

        // Specs (store in square meters as per schema)
        plot_area: data.plot_area ?? null,
        built_up_area: data.built_up_area ?? null,
        bedrooms: data.bedrooms ?? null,
        bathrooms: data.bathrooms ?? null,
        floor_number: data.floor_number ?? null,
        unit_number: data.unit_number ?? null,
        property_age: data.property_age ?? null,
        finish_quality: data.finish_quality ?? null,

        // Price & financials
        total_price: data.total_price,
        is_negotiable: data.is_negotiable ?? false,
        down_payment: data.down_payment ?? null,
        monthly_installments: data.monthly_installments ?? null,
        commission_percentage: data.commission_percentage ?? null,

        // Features & media
        interior_features: Array.isArray(data.interior_features) ? data.interior_features : [],
        exterior_features: Array.isArray(data.exterior_features) ? data.exterior_features : [],
        photos: Array.isArray(uploadedPhotos) ? uploadedPhotos : [],
        virtual_tour_video: data.virtual_tour_video ?? null,
        floor_plan_url: data.floor_plan_url ?? null,

        // SEO & notes
        seo_description: data.seo_description,
        internal_notes: data.internal_notes ?? null,

        // Relations & ownership
        owner_id: data.property_owner_id ?? null,
        assigned_employee: data.assigned_employee || profile?.user_id || null,
        created_by: profile?.user_id ?? null,
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="country_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مفتاح الدولة *</FormLabel>
                      <FormControl>
                        <select 
                          {...field} 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        >
                          {countryCodeOptions.map((option) => (
                            <option key={option.code} value={option.code}>
                              {option.flag} {option.code} {option.country}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="owner_phone"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>رقم هاتف المالك *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="مثال: 501234567" 
                          {...field} 
                          className="text-right"
                          dir="rtl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
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

                <FormField
                  control={form.control}
                  name="property_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كود/رقم العقار</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: SC-2025-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="listing_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ الإدراج</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>خط العرض (Latitude)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.000001" value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
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
                      <FormLabel>خط الطول (Longitude)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.000001" value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="property_details.neighborhood_type"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>نوع الحي (سكني، تجاري، مختلط)</FormLabel>
                      <FormControl>
                        <Input placeholder="سكني / تجاري / مختلط" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="property_details.in_compound"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>داخل مجمع سكني (كمبوند)</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="property_details.compound_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المجمع (إن وجد)</FormLabel>
                    <FormControl>
                      <Input placeholder="اسم الكمبوند / المجمع" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Property Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>مواصفات العقار</CardTitle>
              <CardDescription>التفاصيل الفنية للعقار</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="plot_area_sqft"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مساحة الأرض (قدم²) {isLandProperty ? '*' : ''}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="5380"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      {watchPlotAreaSqft && watchPlotAreaSqft > 0 && (
                        <p className="text-sm text-muted-foreground">
                          = {sqftToSqm(watchPlotAreaSqft)} متر مربع
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isLandProperty && (
                  <FormField
                    control={form.control}
                    name="built_up_area_sqft"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المساحة المبنية (قدم²) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="2150"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        {watchBuiltUpAreaSqft && watchBuiltUpAreaSqft > 0 && (
                          <p className="text-sm text-muted-foreground">
                            = {sqftToSqm(watchBuiltUpAreaSqft)} متر مربع
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                <FormField
                  control={form.control}
                  name="floors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عدد الطوابق</FormLabel>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="property_details.design_style"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع التصميم</FormLabel>
                      <FormControl>
                        <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                          <option value="">اختر نوع التصميم</option>
                          <option value="modern">مودرن</option>
                          <option value="classic">كلاسيكي</option>
                          <option value="traditional">تقليدي</option>
                          <option value="contemporary">معاصر</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="property_details.air_conditioning"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع التكييف</FormLabel>
                      <FormControl>
                        <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                          <option value="">اختر نوع التكييف</option>
                          <option value="central">مركزي</option>
                          <option value="split">سبليت</option>
                          <option value="window">شباك</option>
                          <option value="none">غير موجود</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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

          {/* Facilities & Services */}
          <Card>
            <CardHeader>
              <CardTitle>المرافق والخدمات</CardTitle>
              <CardDescription>المرافق المتوفرة في العقار</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="property_details.parking_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عدد مواقف السيارات</FormLabel>
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

                <FormField
                  control={form.control}
                  name="property_details.parking_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع الموقف</FormLabel>
                      <FormControl>
                        <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                          <option value="">اختر نوع الموقف</option>
                          <option value="covered">مغطى</option>
                          <option value="open">مفتوح</option>
                          <option value="garage">جراج</option>
                          <option value="basement">تحت الأرض</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="property_details.pool_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع المسبح</FormLabel>
                      <FormControl>
                        <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                          <option value="">لا يوجد مسبح</option>
                          <option value="private">مسبح خاص</option>
                          <option value="shared">مسبح مشترك</option>
                          <option value="community">مسبح عام</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="property_details.security_system"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نظام الأمان</FormLabel>
                      <FormControl>
                        <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                          <option value="">اختر نظام الأمان</option>
                          <option value="cameras">كاميرات مراقبة</option>
                          <option value="guards">حراس أمن</option>
                          <option value="electronic_gates">بوابات إلكترونية</option>
                          <option value="complete_system">نظام متكامل</option>
                          <option value="none">غير متوفر</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="property_details.garden_area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مساحة الحديقة (قدم²)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="1000"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="property_details.gym"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>نادي صحي</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="property_details.children_play_area"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>منطقة لعب أطفال</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="property_details.has_elevator"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>مصعد</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="property_details.utilities_generator"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>مولد كهرباء</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Features */}
          <Card>
            <CardHeader>
              <CardTitle>ميزات إضافية</CardTitle>
              <CardDescription>الميزات والإطلالات الخاصة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="property_details.view_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع الإطلالة</FormLabel>
                      <FormControl>
                        <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                          <option value="">اختر نوع الإطلالة</option>
                          <option value="sea">إطلالة بحر</option>
                          <option value="city">إطلالة مدينة</option>
                          <option value="mountain">إطلالة جبال</option>
                          <option value="garden">إطلالة حديقة</option>
                          <option value="none">غير متوفر</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="property_details.orientation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اتجاه العقار</FormLabel>
                      <FormControl>
                        <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                          <option value="">اختر الاتجاه</option>
                          <option value="north">شمالي</option>
                          <option value="south">جنوبي</option>
                          <option value="east">شرقي</option>
                          <option value="west">غربي</option>
                          <option value="northeast">شمال شرقي</option>
                          <option value="northwest">شمال غربي</option>
                          <option value="southeast">جنوب شرقي</option>
                          <option value="southwest">جنوب غربي</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="property_details.flooring_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع الأرضية</FormLabel>
                      <FormControl>
                        <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                          <option value="">اختر نوع الأرضية</option>
                          <option value="marble">رخام</option>
                          <option value="ceramic">سيراميك</option>
                          <option value="parquet">باركيه</option>
                          <option value="granite">جرانيت</option>
                          <option value="tiles">بلاط</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="property_details.expansion_possible"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>إمكانية التوسعة</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المدينة</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: الشارقة، دبي، عجمان" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Legal & Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle>الوضع القانوني والدفع</CardTitle>
              <CardDescription>معلومات قانونية ومالية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="property_details.legal_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>حالة الملكية</FormLabel>
                      <FormControl>
                        <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                          <option value="">اختر حالة الملكية</option>
                          <option value="freehold">ملكية حرة</option>
                          <option value="leasehold">مؤجرة</option>
                          <option value="mortgage">رهن</option>
                          <option value="under_construction">تحت الإنشاء</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="property_details.has_building_permits"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>تصاريح البناء والتشغيل</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="property_details.monthly_costs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>التكاليف الشهرية (صيانة، خدمات)</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: 500 د.إ شهرياً" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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