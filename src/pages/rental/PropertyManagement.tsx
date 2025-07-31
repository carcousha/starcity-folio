import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building, 
  Plus, 
  MapPin, 
  Home, 
  CheckCircle,
  AlertTriangle,
  Wrench,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess";

interface PropertyFormData {
  property_title: string;
  owner_name: string;
  area: string;
  plot_number: string;
  building_name: string;
  unit_number: string;
  unit_type: string;
  purpose_of_use: string;
  total_area: number;
  commission_percentage: number;
  special_features: string[];
  notes: string;
}

const AddPropertyForm = () => {
  const [formData, setFormData] = useState<PropertyFormData>({
    property_title: '',
    owner_name: '',
    area: '',
    plot_number: '',
    building_name: '',
    unit_number: '',
    unit_type: '',
    purpose_of_use: '',
    total_area: 0,
    commission_percentage: 2.5,
    special_features: [],
    notes: ''
  });

  const [newFeature, setNewFeature] = useState('');
  const queryClient = useQueryClient();

  const addPropertyMutation = useMutation({
    mutationFn: async (data: PropertyFormData) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('المستخدم غير مسجل');

      const { data: property, error } = await supabase
        .from('rental_properties')
        .insert({
          property_title: data.property_title,
          owner_name: data.owner_name,
          area: data.area,
          plot_number: data.plot_number,
          building_name: data.building_name,
          unit_number: data.unit_number,
          unit_type: data.unit_type,
          purpose_of_use: data.purpose_of_use,
          total_area: data.total_area,
          commission_percentage: data.commission_percentage,
          special_features: data.special_features,
          notes: data.notes,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return property;
    },
    onSuccess: () => {
      toast({
        title: "تم إضافة العقار بنجاح",
        description: "تم حفظ بيانات العقار في النظام"
      });
      
      // إعادة تعيين النموذج
      setFormData({
        property_title: '',
        owner_name: '',
        area: '',
        plot_number: '',
        building_name: '',
        unit_number: '',
        unit_type: '',
        purpose_of_use: '',
        total_area: 0,
        commission_percentage: 2.5,
        special_features: [],
        notes: ''
      });
      
      queryClient.invalidateQueries({ queryKey: ['rental-properties'] });
    },
    onError: (error) => {
      toast({
        title: "خطأ في إضافة العقار",
        description: "حدث خطأ أثناء حفظ بيانات العقار",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.property_title || !formData.owner_name || !formData.area) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    addPropertyMutation.mutate(formData);
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.special_features.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        special_features: [...prev.special_features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      special_features: prev.special_features.filter(f => f !== feature)
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          إضافة عقار جديد
        </CardTitle>
        <CardDescription>
          أدخل بيانات العقار المراد تأجيره
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* المعلومات الأساسية */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">المعلومات الأساسية</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="property_title">عنوان العقار*</Label>
                <Input
                  id="property_title"
                  value={formData.property_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, property_title: e.target.value }))}
                  placeholder="مثال: فيلا في الراشدية"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="owner_name">اسم المالك*</Label>
                <Input
                  id="owner_name"
                  value={formData.owner_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, owner_name: e.target.value }))}
                  placeholder="أدخل اسم المالك"
                  required
                />
              </div>
            </div>
          </div>

          {/* الموقع */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              الموقع
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="area">المنطقة*</Label>
                <Input
                  id="area"
                  value={formData.area}
                  onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                  placeholder="مثال: عجمان، الراشدية"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="plot_number">رقم القطعة</Label>
                <Input
                  id="plot_number"
                  value={formData.plot_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, plot_number: e.target.value }))}
                  placeholder="رقم القطعة"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="building_name">اسم المبنى</Label>
                <Input
                  id="building_name"
                  value={formData.building_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, building_name: e.target.value }))}
                  placeholder="اسم المبنى أو المجمع"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unit_number">رقم الوحدة</Label>
                <Input
                  id="unit_number"
                  value={formData.unit_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit_number: e.target.value }))}
                  placeholder="رقم الشقة أو الوحدة"
                />
              </div>
            </div>
          </div>

          {/* تفاصيل العقار */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Home className="h-5 w-5" />
              تفاصيل العقار
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit_type">نوع الوحدة*</Label>
                <Select value={formData.unit_type} onValueChange={(value) => setFormData(prev => ({ ...prev, unit_type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع الوحدة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="فيلا">فيلا</SelectItem>
                    <SelectItem value="شقة">شقة</SelectItem>
                    <SelectItem value="محل تجاري">محل تجاري</SelectItem>
                    <SelectItem value="مكتب">مكتب</SelectItem>
                    <SelectItem value="مستودع">مستودع</SelectItem>
                    <SelectItem value="أرض">أرض</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="purpose_of_use">أغراض الاستعمال*</Label>
                <Select value={formData.purpose_of_use} onValueChange={(value) => setFormData(prev => ({ ...prev, purpose_of_use: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر غرض الاستعمال" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="سكني">سكني</SelectItem>
                    <SelectItem value="تجاري">تجاري</SelectItem>
                    <SelectItem value="صناعي">صناعي</SelectItem>
                    <SelectItem value="مكتبي">مكتبي</SelectItem>
                    <SelectItem value="مختلط">مختلط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="total_area">المساحة الإجمالية (متر مربع)</Label>
                <Input
                  id="total_area"
                  type="number"
                  value={formData.total_area}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_area: parseFloat(e.target.value) || 0 }))}
                  placeholder="المساحة بالمتر المربع"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="commission_percentage">نسبة العمولة (%)</Label>
                <Input
                  id="commission_percentage"
                  type="number"
                  value={formData.commission_percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, commission_percentage: parseFloat(e.target.value) || 2.5 }))}
                  placeholder="2.5"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {/* المميزات الخاصة */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">المميزات الخاصة</h3>
            
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="أضف ميزة (مثال: حديقة، مسبح، موقف سيارات)"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
              />
              <Button type="button" onClick={addFeature} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {formData.special_features.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.special_features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-2">
                    {feature}
                    <button
                      type="button"
                      onClick={() => removeFeature(feature)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* ملاحظات */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">ملاحظات إضافية</h3>
            
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="أضف أي ملاحظات إضافية حول العقار..."
                rows={3}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={addPropertyMutation.isPending}
          >
            {addPropertyMutation.isPending ? "جارٍ الحفظ..." : "حفظ العقار"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const PropertiesList = () => {
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['rental-properties-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'متاح': { variant: 'default' as const, icon: CheckCircle },
      'مؤجر': { variant: 'secondary' as const, icon: Home },
      'صيانة': { variant: 'outline' as const, icon: Wrench },
      'غير متاح': { variant: 'destructive' as const, icon: AlertTriangle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['متاح'];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          العقارات المسجلة
        </CardTitle>
        <CardDescription>
          عرض وإدارة جميع العقارات المتاحة للإيجار
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">جارٍ التحميل...</div>
        ) : properties.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد عقارات مسجلة بعد
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map((property: any) => (
              <div key={property.id} className="border rounded-lg p-4 bg-card">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-lg">{property.property_title}</h3>
                    <p className="text-sm text-muted-foreground">
                      المالك: {property.owner_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      الموقع: {property.area}
                      {property.building_name && ` - ${property.building_name}`}
                      {property.unit_number && ` - وحدة ${property.unit_number}`}
                    </p>
                  </div>
                  {getStatusBadge(property.property_status)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                  <div className="text-sm">
                    <span className="font-medium">نوع الوحدة:</span>
                    <span className="ml-2">{property.unit_type}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">غرض الاستعمال:</span>
                    <span className="ml-2">{property.purpose_of_use}</span>
                  </div>
                  {property.total_area && (
                    <div className="text-sm">
                      <span className="font-medium">المساحة:</span>
                      <span className="ml-2">{property.total_area} م²</span>
                    </div>
                  )}
                  <div className="text-sm">
                    <span className="font-medium">نسبة العمولة:</span>
                    <span className="ml-2">{property.commission_percentage}%</span>
                  </div>
                </div>

                {property.special_features && property.special_features.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-1">المميزات:</p>
                    <div className="flex flex-wrap gap-1">
                      {property.special_features.map((feature: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {property.notes && (
                  <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                    <strong>ملاحظات:</strong> {property.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function PropertyManagement() {
  const { checkPermission } = useRoleAccess();

  if (!checkPermission('canManageCommissions')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">غير مصرح</h2>
          <p>لا تملك صلاحية إدارة العقارات</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة العقارات</h1>
          <p className="text-muted-foreground">إضافة وإدارة العقارات المتاحة للإيجار</p>
        </div>
      </div>

      <Tabs defaultValue="add-property" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add-property" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            إضافة عقار
          </TabsTrigger>
          <TabsTrigger value="properties-list" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            العقارات المسجلة
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="add-property">
          <AddPropertyForm />
        </TabsContent>
        
        <TabsContent value="properties-list">
          <PropertiesList />
        </TabsContent>
      </Tabs>
    </div>
  );
}