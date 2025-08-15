import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Plus, Search, Filter, Grid, List, MapPin, Edit, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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
  console.log('LandProperties component rendered');
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [landTypeFilter, setLandTypeFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<LandProperty | null>(null);

  const queryClient = useQueryClient();
  
  // التحقق من اتصال Supabase
  console.log('Supabase client:', supabase);
  
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['land-properties', searchTerm, statusFilter, priceFilter, landTypeFilter],
    queryFn: async () => {
      console.log('Fetching properties with filters:', { searchTerm, statusFilter, priceFilter, landTypeFilter });
      let query = supabase.from('land_properties').select('*');
      
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%,plot_number.ilike.%${searchTerm}%`);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (landTypeFilter !== 'all') {
        query = query.eq('land_type', landTypeFilter);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Query error:', error);
        throw error;
      }
      
      console.log('Properties fetched successfully:', data?.length || 0);
      return data as LandProperty[];
    }
  });
  
  // مراقبة حالة النافذة
  useEffect(() => {
    console.log('Dialog state changed:', isDialogOpen);
  }, [isDialogOpen]);
  
  // مراقبة حالة التعديل
  useEffect(() => {
    console.log('Editing property changed:', editingProperty);
  }, [editingProperty]);
  
  // مراقبة البيانات
  useEffect(() => {
    console.log('Properties data changed:', properties?.length || 0);
  }, [properties]);
  
  // مراقبة حالة التحميل
  useEffect(() => {
    console.log('Loading state changed:', isLoading);
  }, [isLoading]);

  const createMutation = useMutation({
    mutationFn: async (data: Partial<LandProperty>) => {
      console.log('Creating property in database:', data);
      const { error } = await supabase.from('land_properties').insert({
        ...data,
        created_by: (await supabase.auth.getUser()).data.user?.id
      });
      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      console.log('Property created successfully');
    },
    onSuccess: () => {
      console.log('Mutation successful, updating UI');
      queryClient.invalidateQueries({ queryKey: ['land-properties'] });
      setIsDialogOpen(false);
      toast({ title: "تم إضافة الأرض بنجاح" });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast({ title: "خطأ في إضافة الأرض", description: error.message });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<LandProperty> & { id: string }) => {
      console.log('Updating property in database:', { id, ...data });
      const { error } = await supabase.from('land_properties').update(data).eq('id', id);
      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      console.log('Property updated successfully');
    },
    onSuccess: () => {
      console.log('Update mutation successful, updating UI');
      queryClient.invalidateQueries({ queryKey: ['land-properties'] });
      setIsDialogOpen(false);
      setEditingProperty(null);
      toast({ title: "تم تحديث الأرض بنجاح" });
    },
    onError: (error) => {
      console.error('Update mutation error:', error);
      toast({ title: "خطأ في تحديث الأرض", description: error.message });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting property:', id);
      const { error } = await supabase.from('land_properties').delete().eq('id', id);
      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      console.log('Property deleted successfully');
    },
    onSuccess: () => {
      console.log('Delete mutation successful, updating UI');
      queryClient.invalidateQueries({ queryKey: ['land-properties'] });
      toast({ title: "تم حذف الأرض بنجاح" });
    },
    onError: (error) => {
      console.error('Delete mutation error:', error);
      toast({ title: "خطأ في حذف الأرض", description: error.message });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Form submitted!');
    
    const formData = new FormData(e.currentTarget);
    
    const areaSqft = Number(formData.get('area_sqft'));
    const areaSqm = Number(formData.get('area_sqm'));
    
    const data = {
      title: formData.get('title') as string,
      land_type: formData.get('land_type') as 'villa' | 'townhouse' | 'commercial' | 'residential_commercial' | 'residential_buildings',
      location: formData.get('location') as string,
      plot_number: formData.get('plot_number') as string,
      area_sqft: areaSqft,
      area_sqm: areaSqm,
      price: Number(formData.get('price')),
      source_type: formData.get('source_type') as 'owner' | 'broker',
      source_name: formData.get('source_name') as string,
      land_location: formData.get('land_location') as string,
      status: formData.get('status') as 'available' | 'reserved' | 'sold',
      description: formData.get('description') as string,
      internal_notes: formData.get('internal_notes') as string,
    };

    console.log('Form data:', data);

    if (editingProperty) {
      console.log('Updating property:', editingProperty.id);
      updateMutation.mutate({ id: editingProperty.id, ...data });
    } else {
      console.log('Creating new property');
      createMutation.mutate(data);
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
      case 'villa': return 'bg-blue-500';
      case 'townhouse': return 'bg-purple-500';
      case 'commercial': return 'bg-orange-500';
      case 'residential_commercial': return 'bg-teal-500';
      case 'residential_buildings': return 'bg-indigo-500';
      default: return 'bg-gray-500';
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

  const filteredProperties = properties.filter(property => {
    if (priceFilter === 'low') return property.price <= 100000;
    if (priceFilter === 'medium') return property.price > 100000 && property.price <= 500000;
    if (priceFilter === 'high') return property.price > 500000;
    return true;
  });

  return (
    <div className="space-y-6">
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
                    <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                      عنوان الأرض *
                    </Label>
                    <Input 
                      id="title" 
                      name="title" 
                      defaultValue={editingProperty?.title}
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="أدخل عنوان الأرض"
                      required 
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="land_type" className="text-sm font-medium text-gray-700">
                      نوع الأرض *
                    </Label>
                    <Select name="land_type" defaultValue={editingProperty?.land_type || 'villa'}>
                      <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
                </div>
              </div>

              {/* الموقع والقطعة */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full ml-2"></div>
                  الموقع ورقم القطعة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                      الموقع *
                    </Label>
                    <Select name="location" defaultValue={editingProperty?.location || 'الحليو 2'}>
                      <SelectTrigger className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500">
                        <SelectValue placeholder="اختر الموقع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="الحليو 2">الحليو 2</SelectItem>
                        <SelectItem value="الحليو سنتر">الحليو سنتر</SelectItem>
                        <SelectItem value="الحليو 1">الحليو 1</SelectItem>
                        <SelectItem value="الزاهية">الزاهية</SelectItem>
                        <SelectItem value="الباهية">الباهية</SelectItem>
                        <SelectItem value="الياسمين">الياسمين</SelectItem>
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
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="plot_number" className="text-sm font-medium text-gray-700">
                      رقم القطعة *
                    </Label>
                    <Input 
                      id="plot_number" 
                      name="plot_number" 
                      defaultValue={editingProperty?.plot_number}
                      className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                      placeholder="أدخل رقم القطعة"
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* المساحة */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full ml-2"></div>
                  المساحة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="area_sqft" className="text-sm font-medium text-gray-700">
                      المساحة (قدم مربع) *
                    </Label>
                    <Input 
                      id="area_sqft" 
                      name="area_sqft" 
                      type="text"
                      defaultValue={editingProperty?.area_sqft}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*\.?\d*$/.test(value) || value === '') {
                          const sqft = Number(value);
                          if (sqft > 0) {
                            const sqmInput = document.getElementById('area_sqm') as HTMLInputElement;
                            if (sqmInput) {
                              sqmInput.value = convertSqftToSqm(sqft).toString();
                            }
                          }
                        }
                      }}
                      onKeyPress={(e) => {
                        if (!/[\d.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className="h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      placeholder="أدخل المساحة بالقدم"
                      required 
                    />
                    <p className="text-xs text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
                      ⚡ سيتم التحويل التلقائي إلى متر مربع
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="area_sqm" className="text-sm font-medium text-gray-700">
                      المساحة (متر مربع) *
                    </Label>
                    <Input 
                      id="area_sqm" 
                      name="area_sqm" 
                      type="text"
                      defaultValue={editingProperty?.area_sqm}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*\.?\d*$/.test(value) || value === '') {
                          const sqm = Number(value);
                          if (sqm > 0) {
                            const sqftInput = document.getElementById('area_sqft') as HTMLInputElement;
                            if (sqftInput) {
                              sqftInput.value = convertSqmToSqft(sqm).toString();
                            }
                          }
                        }
                      }}
                      onKeyPress={(e) => {
                        if (!/[\d.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className="h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      placeholder="أدخل المساحة بالمتر"
                      required 
                    />
                    <p className="text-xs text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
                      ⚡ سيتم التحويل التلقائي إلى قدم مربع
                    </p>
                  </div>
                </div>
              </div>

              {/* السعر والمصدر */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-100">
                <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full ml-2"></div>
                  السعر والمصدر
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="price" className="text-sm font-medium text-gray-700">
                      السعر (درهم) *
                    </Label>
                    <Input 
                      id="price" 
                      name="price" 
                      type="number"
                      defaultValue={editingProperty?.price}
                      className="h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      placeholder="أدخل السعر"
                      required 
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="source_type" className="text-sm font-medium text-gray-700">
                      المصدر *
                    </Label>
                    <Select name="source_type" defaultValue={editingProperty?.source_type || 'owner'}>
                      <SelectTrigger className="h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                        <SelectValue placeholder="اختر المصدر" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">مالك</SelectItem>
                        <SelectItem value="broker">وسيط</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <Label htmlFor="source_name" className="text-sm font-medium text-gray-700">
                      اسم المصدر *
                    </Label>
                    <Input 
                      id="source_name" 
                      name="source_name" 
                      placeholder={editingProperty?.source_type === 'owner' ? 'اسم المالك' : 'اسم الوسيط'}
                      defaultValue={editingProperty?.source_name}
                      className="h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* الحالة واللوكيشن */}
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-100">
                <h3 className="text-lg font-semibold text-teal-800 mb-4 flex items-center">
                  <div className="w-2 h-2 bg-teal-500 rounded-full ml-2"></div>
                  الحالة والموقع التفصيلي
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                      الحالة *
                    </Label>
                    <Select name="status" defaultValue={editingProperty?.status || 'available'}>
                      <SelectTrigger className="h-11 border-gray-300 focus:border-teal-500 focus:ring-teal-500">
                        <SelectValue placeholder="اختر الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">متاحة</SelectItem>
                        <SelectItem value="reserved">محجوزة</SelectItem>
                        <SelectItem value="sold">مباعة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="land_location" className="text-sm font-medium text-gray-700">
                      لوكيشن الأرض
                    </Label>
                    <Input 
                      id="land_location" 
                      name="land_location" 
                      placeholder="أدخل اللوكيشن التفصيلي"
                      defaultValue={editingProperty?.land_location}
                      className="h-11 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* الوصف والملاحظات */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <div className="w-2 h-2 bg-gray-500 rounded-full ml-2"></div>
                  الوصف والملاحظات
                </h3>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                      الوصف
                    </Label>
                    <Textarea 
                      id="description" 
                      name="description"
                      defaultValue={editingProperty?.description}
                      className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 min-h-[100px]"
                      placeholder="أدخل وصفاً مفصلاً للأرض"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="internal_notes" className="text-sm font-medium text-gray-700">
                      ملاحظات داخلية
                    </Label>
                    <Textarea 
                      id="internal_notes" 
                      name="internal_notes"
                      defaultValue={editingProperty?.internal_notes}
                      className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 min-h-[80px]"
                      placeholder="أدخل ملاحظات داخلية (اختياري)"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex justify-end space-x-3 space-x-reverse pt-6 border-t border-gray-200">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="h-11 px-6 border-gray-300 hover:bg-gray-50"
                >
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="h-11 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {editingProperty ? 'تحديث الأرض' : 'إضافة الأرض'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="البحث في العنوان أو الموقع أو رقم القطعة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="فلترة بالحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="available">متاحة</SelectItem>
            <SelectItem value="reserved">محجوزة</SelectItem>
            <SelectItem value="sold">مباعة</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priceFilter} onValueChange={setPriceFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="فلترة بالسعر" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأسعار</SelectItem>
            <SelectItem value="low">أقل من 100,000</SelectItem>
            <SelectItem value="medium">100,000 - 500,000</SelectItem>
            <SelectItem value="high">أكثر من 500,000</SelectItem>
          </SelectContent>
        </Select>

        <Select value={landTypeFilter} onValueChange={setLandTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="فلترة بنوع الأرض" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأنواع</SelectItem>
            <SelectItem value="villa">فيلا مستقلة</SelectItem>
            <SelectItem value="townhouse">تاون هاوس</SelectItem>
            <SelectItem value="commercial">تجاري</SelectItem>
            <SelectItem value="residential_commercial">سكني تجاري</SelectItem>
            <SelectItem value="residential_buildings">سكني بنايات</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex border rounded-lg">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Properties Display */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProperties.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد أراضي</h3>
            <p className="text-muted-foreground mb-4">لم يتم العثور على أراضي تطابق معايير البحث</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة أول أرض
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <Card key={property.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{property.title}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3 ml-1" />
                      {property.location}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={`${getLandTypeColor(property.land_type)} text-white text-xs`}>
                        {getLandTypeLabel(property.land_type)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        قطعة {property.plot_number}
                      </Badge>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(property.status)} text-white`}>
                    {getStatusLabel(property.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">المساحة:</span>
                    <span className="font-medium">{property.area_sqft?.toLocaleString()} قدم²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">المساحة:</span>
                    <span className="font-medium">{property.area_sqm?.toLocaleString()} م²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">السعر:</span>
                    <span className="font-bold text-primary">{formatCurrency(property.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">المصدر:</span>
                    <span className="text-sm">{property.source_name || (property.source_type === 'owner' ? 'مالك' : 'وسيط')}</span>
                  </div>
                  {property.land_location && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">اللوكيشن:</span>
                      <span className="text-sm">{property.land_location}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2 space-x-reverse mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingProperty(property);
                      setIsDialogOpen(true);
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
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-right p-4">العنوان</th>
                    <th className="text-right p-4">النوع</th>
                    <th className="text-right p-4">الموقع</th>
                    <th className="text-right p-4">رقم القطعة</th>
                    <th className="text-right p-4">المساحة</th>
                    <th className="text-right p-4">السعر</th>
                    <th className="text-right p-4">الحالة</th>
                    <th className="text-right p-4">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.map((property) => (
                    <tr key={property.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 font-medium">{property.title}</td>
                      <td className="p-4">
                        <Badge className={`${getLandTypeColor(property.land_type)} text-white text-xs`}>
                          {getLandTypeLabel(property.land_type)}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">{property.location}</td>
                      <td className="p-4">{property.plot_number}</td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div>{property.area_sqft?.toLocaleString()} قدم²</div>
                          <div className="text-muted-foreground">{property.area_sqm?.toLocaleString()} م²</div>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-primary">{formatCurrency(property.price)}</td>
                      <td className="p-4">
                        <Badge className={`${getStatusColor(property.status)} text-white`}>
                          {getStatusLabel(property.status)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2 space-x-reverse">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingProperty(property);
                              setIsDialogOpen(true);
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}