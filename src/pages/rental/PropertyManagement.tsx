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
  title: string;
  location: string;
  property_type: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  features: string[];
  description: string;
  status: string;
  agreed_rent_amount: number;
  commission_percentage: number;
}

const AddPropertyForm = () => {
  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    location: '',
    property_type: '',
    price: 0,
    area: 0,
    bedrooms: 0,
    bathrooms: 0,
    features: [],
    description: '',
    status: 'متاح',
    agreed_rent_amount: 0,
    commission_percentage: 2.5
  });

  const [newFeature, setNewFeature] = useState('');
  const queryClient = useQueryClient();

  const addPropertyMutation = useMutation({
    mutationFn: async (data: PropertyFormData) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('المستخدم غير مسجل');

      const { data: property, error } = await supabase
        .from('properties')
        .insert({
          title: data.title,
          location: data.location,
          property_type: data.property_type as 'villa' | 'apartment' | 'land' | 'commercial',
          area: data.area,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          features: data.features,
          description: data.description,
          status: data.status as 'available' | 'rented' | 'sold' | 'reserved',
          price: data.agreed_rent_amount,
          created_by: user.id,
          listed_by: user.id
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
        title: '',
        location: '',
        property_type: '',
        price: 0,
        area: 0,
        bedrooms: 0,
        bathrooms: 0,
        features: [],
        description: '',
    status: 'available',
        agreed_rent_amount: 0,
        commission_percentage: 2.5
      });
      
      queryClient.invalidateQueries({ queryKey: ['properties'] });
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
    
    if (!formData.title || !formData.location || !formData.property_type) {
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
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature)
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
                <Label htmlFor="title">عنوان العقار*</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="مثال: فيلا في الراشدية"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">الموقع*</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="مثال: عجمان، الراشدية"
                  required
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
                <Label htmlFor="property_type">نوع العقار*</Label>
                <Select value={formData.property_type} onValueChange={(value) => setFormData(prev => ({ ...prev, property_type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع العقار" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="villa">فيلا</SelectItem>
                    <SelectItem value="apartment">شقة</SelectItem>
                    <SelectItem value="commercial">تجاري</SelectItem>
                    <SelectItem value="land">أرض</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="area">المساحة (متر مربع)</Label>
                <Input
                  id="area"
                  type="number"
                  value={formData.area}
                  onChange={(e) => setFormData(prev => ({ ...prev, area: parseFloat(e.target.value) || 0 }))}
                  placeholder="المساحة بالمتر المربع"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bedrooms">عدد غرف النوم</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: parseInt(e.target.value) || 0 }))}
                  placeholder="عدد غرف النوم"
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bathrooms">عدد دورات المياه</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: parseInt(e.target.value) || 0 }))}
                  placeholder="عدد دورات المياه"
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">السعر المطلوب (د.إ)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="السعر المطلوب"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="agreed_rent_amount">قيمة الإيجار المتفق عليها (د.إ)</Label>
                <Input
                  id="agreed_rent_amount"
                  type="number"
                  value={formData.agreed_rent_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, agreed_rent_amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="قيمة الإيجار المتفق عليها"
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
            
            {formData.features.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.features.map((feature, index) => (
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
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="أضف وصف تفصيلي للعقار..."
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
    queryKey: ['properties-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
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
                    <h3 className="font-medium text-lg">{property.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      الموقع: {property.location}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      النوع: {property.property_type}
                    </p>
                  </div>
                  {getStatusBadge(property.status)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                  <div className="text-sm">
                    <span className="font-medium">المساحة:</span>
                    <span className="ml-2">{property.area} م²</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">غرف النوم:</span>
                    <span className="ml-2">{property.bedrooms}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">دورات المياه:</span>
                    <span className="ml-2">{property.bathrooms}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">نسبة العمولة:</span>
                    <span className="ml-2">{property.commission_percentage}%</span>
                  </div>
                </div>

                {property.agreed_rent_amount > 0 && (
                  <div className="text-sm mb-3">
                    <span className="font-medium">قيمة الإيجار المتفق عليها:</span>
                    <span className="ml-2 text-green-600 font-bold">
                      {property.agreed_rent_amount.toLocaleString()} د.إ
                    </span>
                  </div>
                )}

                {property.features && property.features.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-1">المميزات:</p>
                    <div className="flex flex-wrap gap-1">
                      {property.features.map((feature: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {property.description && (
                  <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                    <strong>الوصف:</strong> {property.description}
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