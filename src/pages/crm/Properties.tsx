import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Filter, Building2, Eye, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PropertyForm } from '@/components/crm/PropertyForm';

interface Property {
  id: string;
  title: string;
  property_type: string;
  property_status: string;
  transaction_type: string;
  emirate: string;
  area_community: string;
  total_price: number;
  bedrooms?: number;
  bathrooms?: number;
  built_up_area?: number;
  plot_area?: number;
  photos: string[];
  assigned_employee: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
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

export default function Properties() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const { toast } = useToast();

  const { data: properties = [], isLoading, refetch } = useQuery({
    queryKey: ['crm-properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_properties')
        .select(`
          *,
          profiles!crm_properties_assigned_employee_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data?.map(item => ({
        ...item,
        photos: Array.isArray(item.photos) ? item.photos : [],
        profiles: item.profiles || undefined
      })) as Property[] || [];
    }
  });

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.area_community.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || property.property_type === filterType;
    const matchesStatus = filterStatus === 'all' || property.property_status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('crm_properties')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف العقار",
        variant: "destructive"
      });
    } else {
      toast({
        title: "تم الحذف",
        description: "تم حذف العقار بنجاح"
      });
      refetch();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'sold':
        return 'bg-red-100 text-red-800';
      case 'under_construction':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-AE', { 
      style: 'currency', 
      currency: 'AED' 
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة العقارات</h1>
          <p className="text-muted-foreground">
            إدارة وتنظيم العقارات المتاحة للبيع والإيجار
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedProperty(null)}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة عقار جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {selectedProperty ? 'تعديل العقار' : 'إضافة عقار جديد'}
              </DialogTitle>
            </DialogHeader>
            <PropertyForm 
              property={selectedProperty}
              onSuccess={() => {
                setIsDialogOpen(false);
                setSelectedProperty(null);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            البحث والفلترة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في العقارات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="all">جميع الأنواع</option>
              {Object.entries(propertyTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="all">جميع الحالات</option>
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setFilterType('all');
              setFilterStatus('all');
            }}>
              مسح الفلاتر
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
          <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-gray-100 relative">
              {property.photos && property.photos.length > 0 ? (
                <img 
                  src={property.photos[0]} 
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building2 className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Badge className={getStatusColor(property.property_status)}>
                  {statusLabels[property.property_status]}
                </Badge>
              </div>
            </div>
            
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{property.title}</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => {
                      setSelectedProperty(property);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleDelete(property.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                {propertyTypeLabels[property.property_type]} • {emirateLabels[property.emirate]} • {property.area_community}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-2xl font-bold text-primary">
                {formatPrice(property.total_price)}
              </div>
              
              {property.property_type !== 'land' && (
                <div className="flex gap-4 text-sm text-muted-foreground">
                  {property.bedrooms && (
                    <span>{property.bedrooms} غرف نوم</span>
                  )}
                  {property.bathrooms && (
                    <span>{property.bathrooms} حمامات</span>
                  )}
                  {property.built_up_area && (
                    <span>{property.built_up_area} م²</span>
                  )}
                </div>
              )}
              
              {property.plot_area && (
                <div className="text-sm text-muted-foreground">
                  مساحة الأرض: {property.plot_area} م²
                </div>
              )}
              
              <div className="flex justify-between items-center text-sm">
                <Badge variant="outline">
                  {transactionTypeLabels[property.transaction_type]}
                </Badge>
                {property.profiles && (
                  <span className="text-muted-foreground">
                    {property.profiles.first_name} {property.profiles.last_name}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد عقارات</h3>
            <p className="text-muted-foreground mb-4">
              لم يتم العثور على عقارات مطابقة لمعايير البحث
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة العقار الأول
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}