import React, { useState, useEffect, useCallback } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Grid, List, MapPin, Edit, Trash2, Upload, X, Loader2, FileText, FileSpreadsheet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
// Remove lodash import since it's not installed

interface LandProperty {
  id: string;
  title: string;
  land_type: 'villa' | 'townhouse' | 'commercial' | 'residential_commercial' | 'residential_buildings';
  location: string;
  plot_number: string;
  area_sqft: number;
  area_sqm: number;
  price: number;
  source_type: 'owner' | 'broker';
  source_name: string;
  land_location?: string;
  status: 'available' | 'reserved' | 'sold';
  images: string[];
  internal_notes?: string;
  description?: string;
  created_at: string;
}

export function LandProperties() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<LandProperty | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState(''); // NEW: رابط الصورة
  const [imageUrlError, setImageUrlError] = useState<string | null>(null); // NEW: خطأ رابط
  const ITEMS_PER_PAGE = 20;

  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['land-properties'], type: 'all' });
  }, [queryClient]);

  const {
    data,
    isLoading,
    error,  // <-- Add error to destructuring
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['land-properties'],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data: properties, error, count } = await supabase
        .from('land_properties')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      return {
        items: properties || [],
        count: count || 0,
        nextPage: properties?.length === ITEMS_PER_PAGE ? pageParam + 1 : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const properties = React.useMemo(() => {
    return data?.pages.flatMap(page => page.items) ?? [];
  }, [data]);

  // Custom debounce implementation for search
  const [searchTerm, setSearchTerm] = useState('');
  const searchTimeoutRef = React.useRef<NodeJS.Timeout>();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(value);
    }, 500);
  };

  // التحقق من وجود رقم قطعة الأرض
  const checkPlotNumberExists = async (plotNumber: string, excludeId?: string) => {
    let query = supabase.from('land_properties').select('id').eq('plot_number', plotNumber);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query.single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking plot number:', error);
      return false;
    }
    
    return !!data; // true if exists, false if not
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    setIsUploading(true);
    setUploadError(null);
    const uploadedUrls: string[] = [];

    // ترتيب الباكتات المحتملة (جرب الأكثر احتمالاً أولاً)
    const candidateBuckets = ['land-images', 'images', 'documents', 'public'];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');

      console.log('⌛ بدء رفع الصور للمستخدم:', user.id);

      for (const file of files) {
        const fileExt = file.name.split('.').pop() || 'bin';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        let fileUploaded = false;
        let lastBucketError: string | null = null;

        for (const bucket of candidateBuckets) {
          const filePath = `land-sales/${user.id}/${fileName}`;
          console.log(`محاولة رفع ${file.name} إلى الباكت: ${bucket} (المسار: ${filePath})`);

          // محاولة الرفع
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, { cacheControl: '3600', upsert: false });

          if (uploadError) {
            console.warn(`خطأ في رفع إلى ${bucket}:`, uploadError);
            lastBucketError = uploadError.message || String(uploadError);

            // إذا الباكت غير موجود نجرب الباكت التالي
            if ((uploadError.message || '').toLowerCase().includes('bucket not found')) {
              continue; // حاول الباكت التالي
            }

            // إذا خطأ RLS (row-level security) أعرض إرشاد واضح
            if ((uploadError.message || '').toLowerCase().includes('row-level') ||
                (uploadError.message || '').toLowerCase().includes('violates row-level')) {
              setUploadError('الرفع محجوب بسياسات RLS. تأكد من سياسة storage.objects أو اجعل الباكت مؤقتًا public للاختبار.');
              throw uploadError;
            }

            // أخطاء أخرى: حاول الباكت التالي أيضاً
            continue;
          }

          // لو تم الرفع بنجاح، نحاول الحصول على رابط عام
          try {
            const { data: publicData, error: publicErr } = supabase.storage
              .from(bucket)
              .getPublicUrl(filePath);

            const publicUrl = (publicData as any)?.publicUrl ?? null;
            if (publicErr) {
              console.warn('خطأ عند الحصول على publicUrl:', publicErr);
            }

            uploadedUrls.push(publicUrl ?? '');
            fileUploaded = true;

            toast({
              title: "تم رفع الصورة",
              description: file.name,
            });

            console.log(`✅ تم رفع ${file.name} إلى ${bucket}`, { publicUrl });
            break; // لا حاجة لتجرّب باكت آخر لهذا الملف
          } catch (errPublic) {
            console.warn('تحذير: لم نتمكن من الحصول على publicUrl بعد الرفع:', errPublic);
            uploadedUrls.push(''); // نضيف عنصر فارغ للحفاظ على الترتيب
            fileUploaded = true;
            break;
          }
        }

        if (!fileUploaded) {
          const msg = lastBucketError || `Upload failed for ${file.name}: no usable bucket/permissions.`;
          console.error(msg);
          setUploadError(`خطأ في رفع ${file.name}: ${msg}`);
          // نتابع لباقي الملفات بدل الإنهاء فوراً
        }
      }
    } catch (err: any) {
      console.error('خطأ عام أثناء الرفع:', err);
      setUploadError(err.message || 'حدث خطأ أثناء رفع الصور');
      toast({
        title: "خطأ في رفع الصور",
        description: err.message || "حدث خطأ أثناء رفع الصور",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      console.log('🏁 انتهت عملية الرفع؛ روابط:', uploadedUrls);
    }

    return uploadedUrls;
  };

  const createMutation = useMutation({
    mutationFn: async (data: Partial<LandProperty>) => {
      // التحقق من وجود رقم القطعة
      if (data.plot_number) {
        const exists = await checkPlotNumberExists(data.plot_number);
        if (exists) {
          throw new Error('رقم القطعة موجود مسبقاً، يرجى استخدام رقم آخر');
        }
      }

      const { error } = await supabase.from('land_properties').insert({
        ...data,
        created_by: (await supabase.auth.getUser()).data.user?.id
      });
      
      if (error) {
        console.error('Database error:', error);
        throw new Error(error.message || 'حدث خطأ في قاعدة البيانات');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-properties'] });
      handleDialogClose();
      toast({ title: "تم إضافة الأرض بنجاح" });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      setIsSubmitting(false);
      handleError(error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<LandProperty> & { id: string }) => {
      // التحقق من وجود رقم القطعة (مع استثناء الأرض الحالية)
      if (data.plot_number) {
        const exists = await checkPlotNumberExists(data.plot_number, id);
        if (exists) {
          throw new Error('رقم القطعة موجود مسبقاً، يرجى استخدام رقم آخر');
        }
      }

      const { error } = await supabase.from('land_properties').update(data).eq('id', id);
      if (error) {
        console.error('Database error:', error);
        throw new Error(error.message || 'حدث خطأ في قاعدة البيانات');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-properties'] });
      handleDialogClose();
      toast({ title: "تم تحديث الأرض بنجاح" });
    },
    onError: (error) => {
      console.error('Update mutation error:', error);
      setIsSubmitting(false);
      handleError(error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('land_properties').delete().eq('id', id);
      if (error) {
        console.error('Database error:', error);
        throw new Error(error.message || 'حدث خطأ في حذف الأرض');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-properties'] });
      toast({ title: "تم حذف الأرض بنجاح" });
    },
    onError: (error) => {
      console.error('Delete mutation error:', error);
      handleError(error);
    }
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      
      const areaSqft = Number(formData.get('area_sqft')) || 0;
      const areaSqm = Number(formData.get('area_sqm'));
      const price = Number(formData.get('price'));
      
      // التحقق من صحة البيانات المطلوبة
      const title = formData.get('title') as string;
      const location = formData.get('location') as string;
      const plotNumber = formData.get('plot_number') as string;
      
      if (!title?.trim()) {
        toast({
          title: "خطأ في البيانات",
          description: "يجب إدخال عنوان الأرض",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      if (!location?.trim()) {
        toast({
          title: "خطأ في البيانات", 
          description: "يجب اختيار موقع الأرض",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      if (!plotNumber?.trim()) {
        toast({
          title: "خطأ في البيانات",
          description: "يجب إدخال رقم القطعة",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      if (!areaSqm || areaSqm <= 0) {
        toast({
          title: "خطأ في البيانات",
          description: "يجب إدخال مساحة صحيحة بالمتر المربع",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      if (!price || price <= 0) {
        toast({
          title: "خطأ في البيانات",
          description: "يجب إدخال سعر صحيح",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      const data = {
        title: title.trim(),
        land_type: formData.get('land_type') as 'villa' | 'townhouse' | 'commercial' | 'residential_commercial' | 'residential_buildings',
        location: location.trim(),
        plot_number: plotNumber.trim(),
        area_sqft: areaSqft,
        area_sqm: areaSqm,
        price: price,
        source_type: formData.get('source_type') as 'owner' | 'broker',
        source_name: (formData.get('source_name') as string)?.trim() || '',
        status: (formData.get('status') as 'available' | 'reserved' | 'sold') || 'available',
        description: (formData.get('description') as string)?.trim() || '',
        internal_notes: (formData.get('internal_notes') as string)?.trim() || '',
        images: uploadedImages,
      };

      if (editingProperty) {
        await updateMutation.mutateAsync({ id: editingProperty.id, ...data });
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setIsSubmitting(false);
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive"
      });
    }
  };

  // معالجة رفع الصور
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // التحقق من حجم الملفات
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validFiles = Array.from(files).filter(file => {
      if (file.size > maxSize) {
        toast({
          title: "ملف كبير جداً",
          description: `${file.name} أكبر من 5MB`,
          variant: "destructive"
        });
        return false;
      }
      return true;
    });
    
    if (validFiles.length === 0) return;
    
    const urls = await uploadImages(validFiles);
    setUploadedImages(prev => [...prev, ...urls]);
    
    // إعادة تعيين input
    e.target.value = '';
  };

  // حذف صورة
  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  // دالة معالجة النشر
  const handlePublish = (propertyId: string) => {
    // TODO: سيتم تطوير هذه الدالة لاحقاً
    toast({
      title: "تم النشر",
      description: "سيتم تطوير ميزة النشر قريباً",
    });
  };

  // معالجة الأخطاء
  const handleError = (error: any) => {
    console.error('Error:', error);
    toast({
      title: "حدث خطأ",
      description: error.message || "حدث خطأ غير متوقع",
      variant: "destructive"
    });
  };

  // تنظيف البيانات عند إغلاق النافذة
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingProperty(null);
    setUploadedImages([]);
    setIsSubmitting(false);
  };

  // إظهار/إخفاء حقل الموقع المخصص
  const handleLocationChange = (value: string) => {
    const customField = document.getElementById('customLocationField');
    if (customField) {
      if (value === 'other') {
        customField.style.display = 'block';
      } else {
        customField.style.display = 'none';
        // إعادة تعيين حقل الموقع المخصص
        const customInput = document.getElementById('custom_location') as HTMLInputElement;
        if (customInput) {
          customInput.value = '';
        }
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'reserved': return 'bg-yellow-500';
      case 'sold': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'متاحة';
      case 'reserved': return 'محجوزة';
      case 'sold': return 'مباعة';
      default: return status;
    }
  };

  const getLandTypeColor = (landType: string) => {
    switch (landType) {
      case 'villa': return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'townhouse': return 'bg-gradient-to-r from-purple-500 to-purple-600';
      case 'commercial': return 'bg-gradient-to-r from-orange-500 to-orange-600';
      case 'residential_commercial': return 'bg-gradient-to-r from-teal-500 to-teal-600';
      case 'residential_buildings': return 'bg-gradient-to-r from-indigo-500 to-indigo-600';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  const getLandTypeLabel = (landType: string) => {
    switch (landType) {
      case 'villa': return 'فيلا مستقلة';
      case 'townhouse': return 'تاون هاوس';
      case 'commercial': return 'تجاري';
      case 'residential_commercial': return 'سكني تجاري';
      case 'residential_buildings': return 'سكني بنايات';
      default: return landType;
    }
  };

  // تحويل القدم المربع إلى متر مربع
  const convertSqftToSqm = (sqft: number) => {
    return Math.round(sqft * 0.092903 * 100) / 100;
  };

  // تحويل المتر المربع إلى قدم مربع
  const convertSqmToSqft = (sqm: number) => {
    return Math.round(sqm / 0.092903 * 100) / 100;
  };

  // تصدير إلى Excel
  const exportToExcel = (data: LandProperty[]) => {
    const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
      'رقم القطعة': item.plot_number,
      'العنوان': item.title,
      'الموقع': item.location,
      'نوع الأرض': getLandTypeLabel(item.land_type),
      'المساحة (م²)': item.area_sqm,
      'المساحة (قدم²)': item.area_sqft,
      'السعر': item.price,
      'الحالة': getStatusLabel(item.status),
      'المصدر': item.source_name
    })));
    
    const workbook = XLSX.utils.book_new();
  };

  // تصدير إلى PDF
  const exportToPDF = (data: LandProperty[]) => {
    const doc = new jsPDF();
    
    doc.setFont("Arial");
    doc.setFontSize(16);
    doc.text("تقرير الأراضي", 105, 20, { align: "center" });
    
    let y = 40;
    data.forEach((item, index) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${item.title}`, 20, y);
      doc.setFontSize(10);
      doc.text(`الموقع: ${item.location} | السعر: ${formatCurrency(item.price)}`, 20, y + 7);
      y += 20;
    });
    
    doc.save("الأراضي.pdf");
  };

  // تحميل المزيد من البيانات
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // تحسين الأداء عند التمرير
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000) {
          loadMore();
        }
      }, 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [loadMore]);

  // مراقبة التمرير
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 500) {
        loadMore();
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  return (
    <div className="space-y-6">
{/* Debug Information - Removed since everything is working */}
      
      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <PageHeader 
          title="إدارة الأراضي" 
          description="عرض وإدارة جميع الأراضي المتاحة للبيع"
        />
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingProperty(null);
              setIsDialogOpen(true);
              setUploadedImages([]);
              // إعادة تعيين حقل الموقع المخصص
              setTimeout(() => {
                const customField = document.getElementById('customLocationField');
                if (customField) {
                  customField.style.display = 'none';
                }
              }, 100);
            }}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة أرض جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="text-center pb-6 border-b border-gray-200">
              <DialogTitle className="text-2xl font-bold text-gray-800">
                {editingProperty ? 'تعديل الأرض' : 'إضافة أرض جديدة'}
              </DialogTitle>
              <p className="text-gray-600 mt-2">
                {editingProperty ? 'قم بتحديث معلومات الأرض' : 'أدخل تفاصيل الأرض الجديدة'}
              </p>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-8 pt-6">
              {/* معلومات أساسية */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                  المعلومات الأساسية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="title">عنوان الأرض *</Label>
                    <Input
                      id="title"
                      name="title"
                      defaultValue={editingProperty?.title}
                      required
                      placeholder="أدخل عنوان الأرض"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="land_type">نوع الأرض *</Label>
                    <Select name="land_type" defaultValue={editingProperty?.land_type} required>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع الأرض" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="villa">فيلا مستقلة</SelectItem>
                        <SelectItem value="townhouse">تاون هاوس</SelectItem>
                        <SelectItem value="commercial">تجاري</SelectItem>
                        <SelectItem value="residential_commercial">سكني تجاري</SelectItem>
                        <SelectItem value="residential_buildings">سكني بنايات</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="plot_number">رقم القطعة *</Label>
                    <Input
                      id="plot_number"
                      name="plot_number"
                      defaultValue={editingProperty?.plot_number}
                      required
                      placeholder="أدخل رقم القطعة"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="location">الموقع *</Label>
                    <Select name="location" defaultValue={editingProperty?.location} required onValueChange={handleLocationChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الموقع أو اكتب موقع جديد" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="الحليو">الحليو</SelectItem>
                        <SelectItem value="الحليو 2">الحليو 2</SelectItem>
                        <SelectItem value="الحليو سنتر">الحليو سنتر</SelectItem>
                        <SelectItem value="الحليو 1">الحليو 1</SelectItem>
                        <SelectItem value="الزاهية">الزاهية</SelectItem>
                        <SelectItem value="الياسمين">الياسمين</SelectItem>
                        <SelectItem value="الباهية">الباهية</SelectItem>
                        <SelectItem value="الروضة">الروضة</SelectItem>
                        <SelectItem value="الجرف">الجرف</SelectItem>
                        <SelectItem value="الحميدية">الحميدية</SelectItem>
                        <SelectItem value="العامرة">العامرة</SelectItem>
                        <SelectItem value="الرقايب">الرقايب</SelectItem>
                        <SelectItem value="المويهات">المويهات</SelectItem>
                        <SelectItem value="صناعية الجرف">صناعية الجرف</SelectItem>
                        <SelectItem value="الراشدية">الراشدية</SelectItem>
                        <SelectItem value="صناعية عجمان">صناعية عجمان</SelectItem>
                        <SelectItem value="النعيمية">النعيمية</SelectItem>
                        <SelectItem value="الرميلة">الرميلة</SelectItem>
                        <SelectItem value="other">موقع آخر...</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* حقل الموقع المخصص - يظهر فقط عند اختيار "موقع آخر" */}
                  <div className="space-y-3" id="customLocationField" style={{ display: 'none' }}>
                    <Label htmlFor="custom_location">اكتب الموقع المخصص</Label>
                    <Input
                      id="custom_location"
                      name="custom_location"
                      placeholder="اكتب اسم الموقع المخصص"
                      onChange={(e) => {
                        const locationSelect = document.getElementById('location') as HTMLSelectElement;
                        if (locationSelect) {
                          locationSelect.value = e.target.value;
                        }
                      }}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="area_sqm">المساحة (متر مربع) *</Label>
                    <Input
                      id="area_sqm"
                      name="area_sqm"
                      type="number"
                      step="0.01"
                      defaultValue={editingProperty?.area_sqm}
                      required
                      placeholder="أدخل المساحة بالمتر المربع"
                      onChange={(e) => {
                        const sqm = Number(e.target.value);
                        if (sqm > 0) {
                          const sqftInput = document.getElementById('area_sqft') as HTMLInputElement;
                          if (sqftInput) {
                            sqftInput.value = convertSqmToSqft(sqm).toString();
                          }
                        }
                      }}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="area_sqft">المساحة (قدم مربع)</Label>
                    <Input
                      id="area_sqft"
                      name="area_sqft"
                      type="number"
                      step="0.01"
                      defaultValue={editingProperty?.area_sqft}
                      placeholder="أدخل المساحة بالقدم المربع"
                      onChange={(e) => {
                        const sqft = Number(e.target.value);
                        if (sqft > 0) {
                          const sqmInput = document.getElementById('area_sqm') as HTMLInputElement;
                          if (sqmInput) {
                            sqmInput.value = convertSqftToSqm(sqft).toString();
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* معلومات مالية */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full ml-2"></div>
                  المعلومات المالية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="price">السعر *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      defaultValue={editingProperty?.price}
                      required
                      placeholder="أدخل السعر"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="source_type">مصدر العرض *</Label>
                    <Select name="source_type" defaultValue={editingProperty?.source_type} required>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر مصدر العرض" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">مالك</SelectItem>
                        <SelectItem value="broker">وسيط</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="source_name">اسم المصدر *</Label>
                    <Input
                      id="source_name"
                      name="source_name"
                      defaultValue={editingProperty?.source_name}
                      required
                      placeholder="أدخل اسم المالك أو الوسيط"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="status">الحالة *</Label>
                    <Select name="status" defaultValue={editingProperty?.status || 'available'} required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">متاحة</SelectItem>
                        <SelectItem value="reserved">محجوزة</SelectItem>
                        <SelectItem value="sold">مباعة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* رفع الصور */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full ml-2"></div>
                  صور الأرض
                </h3>
                
                {/* عرض الصور المرفوعة */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`صورة ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* زر رفع الصور */}
                <div className="space-y-3">
                  <Label htmlFor="images">رفع صور الأرض</Label>
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <Input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                    {isUploading && (
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">جاري رفع الصور...</span>
                      </div>
                    )}
                  </div>

                  {/* NEW: show upload error / guidance */}
                  {uploadError && (
                    <div className="mt-2 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
                      <div className="font-medium">خطأ في رفع الصور</div>
                      <div>{uploadError}</div>
                      <div className="mt-2 text-xs text-red-600">
                        تحقق من وجود bucket باسم "images" في Supabase وأن إعدادات RLS/permissions تسمح بالرفع.
                        (يمكن مؤقتاً تحويل الباكت إلى public للاختبار)
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground">
                    يمكنك رفع عدة صور في نفس الوقت
                  </p>
                </div>
              </div>

              {/* معلومات إضافية */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-100">
                <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full ml-2"></div>
                  معلومات إضافية
                </h3>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="land_location">موقع تفصيلي</Label>
                    <Input
                      id="land_location"
                      name="land_location"
                      defaultValue={editingProperty?.land_location}
                      placeholder="أدخل موقع تفصيلي للأرض"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="description">وصف الأرض</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={editingProperty?.description}
                      placeholder="أدخل وصف تفصيلي للأرض"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="internal_notes">ملاحظات داخلية</Label>
                    <Textarea
                      id="internal_notes"
                      name="internal_notes"
                      defaultValue={editingProperty?.internal_notes}
                      placeholder="أدخل ملاحظات داخلية"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* أزرار الإرسال */}
              <div className="flex justify-end space-x-4 space-x-reverse pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      {editingProperty ? 'جاري التحديث...' : 'جاري الإضافة...'}
                    </>
                  ) : (
                    editingProperty ? 'تحديث الأرض' : 'إضافة الأرض'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">إجمالي الأراضي</p>
                <p className="text-2xl font-bold text-blue-800">{properties.length}</p>
              </div>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <MapPin className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">متاحة للبيع</p>
                <p className="text-2xl font-bold text-green-800">
                  {properties.filter(p => p.status === 'available').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">محجوزة</p>
                <p className="text-2xl font-bold text-yellow-800">
                  {properties.filter(p => p.status === 'reserved').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">مباعة</p>
                <p className="text-2xl font-bold text-red-800">
                  {properties.filter(p => p.status === 'sold').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Properties Table/Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>الأراضي المتاحة</span>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>جاري تحميل الأراضي...</span>
              </div>
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              لا توجد أراضي متاحة
            </div>
          ) : viewMode === 'list' ? (
            // عرض الجدول - العرض الأساسي
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-right p-4 font-semibold">صورة الأرض</th>
                    <th className="text-right p-4 font-semibold">رقم قطعة الأرض</th>
                    <th className="text-right p-4 font-semibold">الموقع</th>
                    <th className="text-right p-4 font-semibold">نوع الأرض</th>
                    <th className="text-right p-4 font-semibold">المساحة</th>
                    <th className="text-right p-4 font-semibold">السعر</th>
                    <th className="text-right p-4 font-semibold">الحالة</th>
                    <th className="text-right p-4 font-semibold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((property) => (
                    <tr key={property.id} className="border-b hover:bg-muted/50 transition-colors">
                      {/* صورة الأرض */}
                      <td className="p-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted border">
                          {property.images && property.images.length > 0 ? (
                            <img
                              src={property.images[0]}
                              alt={property.title}
                              className="w-full h-full object-cover hover:scale-110 transition-transform cursor-pointer"
                              onClick={() => window.open(property.images[0], '_blank')}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <MapPin className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {/* رقم قطعة الأرض */}
                      <td className="p-4">
                        <div className="font-medium text-primary bg-primary/10 px-2 py-1 rounded-md inline-block">
                          {property.plot_number || 'غير محدد'}
                        </div>
                      </td>
                      
                      {/* الموقع */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="font-medium">{property.location}</div>
                          {property.land_location && (
                            <div className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                              {property.land_location}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {/* نوع الأرض */}
                      <td className="p-4">
                        <Badge className={`${getLandTypeColor(property.land_type)} text-white text-xs`}>
                          {getLandTypeLabel(property.land_type)}
                        </Badge>
                      </td>
                      
                      {/* المساحة */}
                      <td className="p-4">
                        <div className="space-y-1">
                          {property.area_sqm && (
                            <div className="font-medium bg-blue-50 px-2 py-1 rounded">
                              {property.area_sqm.toLocaleString()} م²
                            </div>
                          )}
                          {property.area_sqft && (
                            <div className="text-sm text-muted-foreground bg-gray-50 px-2 py-1 rounded">
                              {property.area_sqft.toLocaleString()} قدم²
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {/* السعر */}
                      <td className="p-4">
                        <div className="font-bold text-primary bg-green-50 px-2 py-1 rounded">
                          {formatCurrency(property.price)}
                        </div>
                      </td>
                      
                      {/* الحالة */}
                      <td className="p-4">
                        <Badge className={`${getStatusColor(property.status)} text-white text-xs`}>
                          {getStatusLabel(property.status)}
                        </Badge>
                      </td>
                      
                      {/* الإجراءات */}
                      <td className="p-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {/* زر النشر */}
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700 text-white text-xs"
                            onClick={() => handlePublish(property.id)}
                          >
                            نشر
                          </Button>
                          
                          {/* زر التعديل */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingProperty(property);
                              setUploadedImages(property.images || []);
                              setIsDialogOpen(true);
                              // إعادة تعيين حقل الموقع المخصص
                              setTimeout(() => {
                                const customField = document.getElementById('customLocationField');
                                if (customField) {
                                  const knownLocations = [
                                    'الحليو', 'الحليو 2', 'الحليو سنتر', 'الحليو 1',
                                    'الزاهية', 'الياسمين', 'الباهية',
                                    'الروضة', 'الجرف', 'الحميدية', 'العامرة', 'الرقايب',
                                    'المويهات', 'صناعية الجرف', 'الراشدية', 'صناعية عجمان', 'النعيمية', 'الرميلة'
                                  ];
                                  if (property.location && !knownLocations.includes(property.location)) {
                                    customField.style.display = 'block';
                                    const customInput = document.getElementById('custom_location') as HTMLInputElement;
                                    if (customInput) {
                                      customInput.value = property.location;
                                    }
                                  } else {
                                    customField.style.display = 'none';
                                  }
                                }
                              }, 100);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          
                          {/* زر الحذف */}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteMutation.mutate(property.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // عرض الكروت - العرض الثانوي
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {properties.map((property) => (
                <Card key={property.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted overflow-hidden">
                    {property.images && property.images.length > 0 ? (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <MapPin className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className={`${getStatusColor(property.status)} text-white`}>
                          {getStatusLabel(property.status)}
                        </Badge>
                        <Badge className={`${getLandTypeColor(property.land_type)} text-white`}>
                          {getLandTypeLabel(property.land_type)}
                        </Badge>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-lg">{property.title}</h3>
                        <p className="text-muted-foreground">{property.location}</p>
                      </div>
                      
                      {property.plot_number && (
                        <div className="text-sm">
                          <span className="font-medium">رقم القطعة:</span> {property.plot_number}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm">
                        <span>المساحة: {property.area_sqm?.toLocaleString()} م²</span>
                        <span className="font-bold text-primary">
                          {formatCurrency(property.price)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700 text-white flex-1"
                          onClick={() => handlePublish(property.id)}
                        >
                          نشر
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingProperty(property);
                            setUploadedImages(property.images || []);
                            setIsDialogOpen(true);
                            // إعادة تعيين حقل الموقع المخصص
                            setTimeout(() => {
                              const customField = document.getElementById('customLocationField');
                              if (customField) {
                                const knownLocations = [
                                  'الحليو', 'الحليو 2', 'الحليو سنتر', 'الحليو 1',
                                  'الزاهية', 'الياسمين', 'الباهية',
                                  'الروضة', 'الجرف', 'الحميدية', 'العامرة', 'الرقايب',
                                  'المويهات', 'صناعية الجرف', 'الراشدية', 'صناعية عجمان', 'النعيمية', 'الرميلة'
                                ];
                                if (property.location && !knownLocations.includes(property.location)) {
                                  customField.style.display = 'block';
                                  const customInput = document.getElementById('custom_location') as HTMLInputElement;
                                  if (customInput) {
                                    customInput.value = property.location;
                                  }
                                } else {
                                  customField.style.display = 'none';
                                }
                              }
                            }, 100);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(property.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {isFetchingNextPage && (
            <div className="flex items-center justify-center p-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>جاري تحميل المزيد...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Buttons */}
      <div className="flex items-center space-x-2 space-x-reverse">
        <Button
          size="sm"
          variant="outline"
          onClick={() => exportToExcel(properties)}
          className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
        >
          <FileSpreadsheet className="h-4 w-4 ml-2" />
          تصدير Excel
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => exportToPDF(properties)}
          className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
        >
          <FileText className="h-4 w-4 ml-2" />
          تصدير PDF
        </Button>
      </div>
    </div>
  );
}