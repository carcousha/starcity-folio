import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Building, 
  Search,
  MapPin,
  DollarSign,
  User,
  Filter,
  Eye,
  Camera,
  Home
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function MyProperties() {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const { data: propertiesData, isLoading } = useQuery({
    queryKey: ['my-properties', profile?.user_id],
    queryFn: async () => {
      if (!profile) return [];
      
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .or(`assigned_to.eq.${profile.user_id},created_by.eq.${profile.user_id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile
  });

  const filteredProperties = propertiesData?.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (property.description && property.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = selectedType === "all" || property.property_type === selectedType;
    const matchesStatus = selectedStatus === "all" || property.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800">متاح</Badge>;
      case 'sold':
        return <Badge className="bg-blue-100 text-blue-800">مباع</Badge>;
      case 'rented':
        return <Badge className="bg-purple-100 text-purple-800">مؤجر</Badge>;
      case 'reserved':
        return <Badge className="bg-yellow-100 text-yellow-800">محجوز</Badge>;
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800">معلق</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPropertyTypeIcon = (type: string) => {
    switch (type) {
      case 'apartment':
        return <Building className="h-5 w-5 text-blue-600" />;
      case 'villa':
        return <Home className="h-5 w-5 text-green-600" />;
      case 'office':
        return <Building className="h-5 w-5 text-purple-600" />;
      case 'shop':
        return <Building className="h-5 w-5 text-orange-600" />;
      default:
        return <Building className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPropertyTypeName = (type: string) => {
    switch (type) {
      case 'apartment': return 'شقة';
      case 'villa': return 'فيلا';
      case 'office': return 'مكتب';
      case 'shop': return 'محل';
      case 'land': return 'أرض';
      default: return type;
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <Building className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">عقاراتي</h1>
            <p className="text-muted-foreground">العقارات المسؤول عنها والمخصصة لي</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="البحث بالعنوان أو الموقع أو الوصف"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">جميع الأنواع</option>
                <option value="apartment">شقة</option>
                <option value="villa">فيلا</option>
                <option value="office">مكتب</option>
                <option value="shop">محل</option>
                <option value="land">أرض</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">جميع الحالات</option>
                <option value="available">متاح</option>
                <option value="sold">مباع</option>
                <option value="rented">مؤجر</option>
                <option value="reserved">محجوز</option>
                <option value="pending">معلق</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">إجمالي العقارات</p>
                <p className="text-2xl font-bold text-foreground">{filteredProperties.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">العقارات المتاحة</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredProperties.filter(p => p.status === 'available').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <Home className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">العقارات المباعة</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredProperties.filter(p => p.status === 'sold').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-50">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">متوسط السعر</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredProperties.length > 0 
                    ? Math.round(filteredProperties.reduce((sum, p) => sum + Number(p.price), 0) / filteredProperties.length).toLocaleString()
                    : 0
                  } د.إ
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-50">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Properties List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Building className="h-5 w-5" />
            <span>قائمة العقارات</span>
          </CardTitle>
          <CardDescription>
            جميع العقارات المخصصة لي مع تفاصيل كل عقار
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">جارٍ التحميل...</p>
            </div>
          ) : !filteredProperties.length ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد عقارات مطابقة للبحث</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <div key={property.id} className="border rounded-lg overflow-hidden">
                  {/* Property Image */}
                  <div className="h-48 bg-gray-100 flex items-center justify-center">
                    {property.images && property.images.length > 0 ? (
                      <img 
                        src={property.images[0]} 
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Property Details */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {getPropertyTypeIcon(property.property_type)}
                        <span className="text-sm font-medium">
                          {getPropertyTypeName(property.property_type)}
                        </span>
                      </div>
                      {getStatusBadge(property.status)}
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-2">{property.title}</h3>
                    
                    <div className="flex items-center space-x-2 space-x-reverse mb-3 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{property.location}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 space-x-reverse mb-4">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="text-xl font-bold text-green-600">
                        {Number(property.price).toLocaleString()} د.إ
                      </span>
                    </div>
                    
                    {property.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {property.description}
                      </p>
                    )}
                    
                    {/* Property Features */}
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
                      {property.bedrooms && (
                        <div>غرف النوم: {property.bedrooms}</div>
                      )}
                      {property.bathrooms && (
                        <div>الحمامات: {property.bathrooms}</div>
                      )}
                      {property.area && (
                        <div>المساحة: {property.area} م²</div>
                      )}
                    </div>
                    
                    {/* Action Button */}
                    <Button className="w-full" variant="outline">
                      <Eye className="h-4 w-4 ml-2" />
                      عرض التفاصيل
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}