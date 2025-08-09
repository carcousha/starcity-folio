import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, Plus, Edit, Eye, MapPin } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

interface RentalProperty {
  id: string;
  property_title: string;
  property_address: string;
  unit_number?: string;
  property_type: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  owner_name: string;
  owner_phone: string;
  owner_email?: string;
  agreed_rent_amount: number;
  commission_percentage?: number;
  status: string;
  notes?: string;
  created_at: string;
}

const RentalProperties = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<RentalProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<RentalProperty | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    property_title: '',
    property_address: '',
    unit_number: '',
    property_type: 'apartment',
    area: '',
    bedrooms: '',
    bathrooms: '',
    owner_name: '',
    owner_phone: '',
    owner_email: '',
    agreed_rent_amount: '',
    commission_percentage: '',
    status: 'available',
    notes: ''
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('rental_properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل العقارات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const propertyData = {
        ...formData,
        property_type: formData.property_type as 'villa' | 'apartment' | 'land' | 'commercial',
        status: formData.status as 'available' | 'rented' | 'sold' | 'reserved',
        area: formData.area ? parseFloat(formData.area) : null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        agreed_rent_amount: parseFloat(formData.agreed_rent_amount),
        commission_percentage: formData.commission_percentage ? parseFloat(formData.commission_percentage) : 0,
        created_by: user.id
      };

      if (editingProperty) {
        const { error } = await supabase
          .from('rental_properties')
          .update(propertyData)
          .eq('id', editingProperty.id);

        if (error) throw error;

        toast({
          title: "تم التحديث",
          description: "تم تحديث بيانات العقار بنجاح",
        });
      } else {
        const { error } = await supabase
          .from('rental_properties')
          .insert([propertyData]);

        if (error) throw error;

        toast({
          title: "تم الإنشاء",
          description: "تم إضافة العقار بنجاح",
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchProperties();
    } catch (error) {
      console.error('Error saving property:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ بيانات العقار",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      property_title: '',
      property_address: '',
      unit_number: '',
      property_type: 'apartment',
      area: '',
      bedrooms: '',
      bathrooms: '',
      owner_name: '',
      owner_phone: '',
      owner_email: '',
      agreed_rent_amount: '',
      commission_percentage: '',
      status: 'available',
      notes: ''
    });
    setEditingProperty(null);
  };

  const handleEdit = (property: RentalProperty) => {
    setEditingProperty(property);
    setFormData({
      property_title: property.property_title,
      property_address: property.property_address,
      unit_number: property.unit_number || '',
      property_type: property.property_type,
      area: property.area?.toString() || '',
      bedrooms: property.bedrooms?.toString() || '',
      bathrooms: property.bathrooms?.toString() || '',
      owner_name: property.owner_name,
      owner_phone: property.owner_phone,
      owner_email: property.owner_email || '',
      agreed_rent_amount: property.agreed_rent_amount.toString(),
      commission_percentage: property.commission_percentage?.toString() || '',
      status: property.status,
      notes: property.notes || ''
    });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'available': { variant: 'default' as const, label: 'متاح' },
      'rented': { variant: 'destructive' as const, label: 'مؤجر' },
      'maintenance': { variant: 'secondary' as const, label: 'صيانة' }
    };
    
    const statusInfo = variants[status as keyof typeof variants] || variants.available;
    
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  const filteredProperties = properties.filter(property =>
    property.property_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.property_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.owner_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة العقارات</h1>
          <p className="text-muted-foreground mt-1">
            إدارة العقارات المتاحة للإيجار
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة عقار جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProperty ? 'تعديل العقار' : 'إضافة عقار جديد'}
              </DialogTitle>
              <DialogDescription>
                {editingProperty ? 'تعديل بيانات العقار' : 'إضافة عقار جديد لنظام الإيجارات'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="property_title">عنوان العقار *</Label>
                  <Input
                    id="property_title"
                    value={formData.property_title}
                    onChange={(e) => setFormData({...formData, property_title: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="property_type">نوع العقار *</Label>
                  <Select value={formData.property_type} onValueChange={(value) => setFormData({...formData, property_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">شقة</SelectItem>
                      <SelectItem value="villa">فيلا</SelectItem>
                      <SelectItem value="commercial">تجاري</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="property_address">العنوان *</Label>
                <Input
                  id="property_address"
                  value={formData.property_address}
                  onChange={(e) => setFormData({...formData, property_address: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="unit_number">رقم الوحدة</Label>
                  <Input
                    id="unit_number"
                    value={formData.unit_number}
                    onChange={(e) => setFormData({...formData, unit_number: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="area">المساحة (م²)</Label>
                  <Input
                    id="area"
                    type="number"
                    value={formData.area}
                    onChange={(e) => setFormData({...formData, area: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="bedrooms">غرف النوم</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({...formData, bedrooms: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="bathrooms">دورات المياه</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({...formData, bathrooms: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="owner_name">اسم المالك *</Label>
                  <Input
                    id="owner_name"
                    value={formData.owner_name}
                    onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="owner_phone">هاتف المالك *</Label>
                  <Input
                    id="owner_phone"
                    value={formData.owner_phone}
                    onChange={(e) => setFormData({...formData, owner_phone: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="owner_email">إيميل المالك</Label>
                <Input
                  id="owner_email"
                  type="email"
                  value={formData.owner_email}
                  onChange={(e) => setFormData({...formData, owner_email: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="agreed_rent_amount">مبلغ الإيجار المتفق عليه *</Label>
                  <CurrencyInput
                    id="agreed_rent_amount"
                    value={Number(formData.agreed_rent_amount || 0)}
                    onValueChange={(num) => setFormData({...formData, agreed_rent_amount: String(num)})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="commission_percentage">نسبة العمولة (%)</Label>
                  <CurrencyInput
                    id="commission_percentage"
                    value={Number(formData.commission_percentage || 0)}
                    onValueChange={(num) => setFormData({...formData, commission_percentage: String(num)})}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">حالة العقار</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">متاح</SelectItem>
                    <SelectItem value="rented">مؤجر</SelectItem>
                    <SelectItem value="sold">مبيع</SelectItem>
                    <SelectItem value="reserved">محجوز</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">
                  {editingProperty ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* البحث والفلاتر */}
      <Card>
        <CardHeader>
          <CardTitle>البحث والفلترة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="البحث في العقارات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جدول العقارات */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة العقارات</CardTitle>
          <CardDescription>
            إجمالي العقارات: {filteredProperties.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العقار</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>المالك</TableHead>
                <TableHead>مبلغ الإيجار</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{property.property_title}</div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <MapPin className="h-3 w-3 ml-1" />
                        {property.property_address}
                        {property.unit_number && ` - وحدة ${property.unit_number}`}
                      </div>
                      {(property.bedrooms || property.bathrooms || property.area) && (
                        <div className="text-sm text-muted-foreground">
                          {property.bedrooms && `${property.bedrooms} غرف`}
                          {property.bathrooms && ` • ${property.bathrooms} حمامات`}
                          {property.area && ` • ${property.area} م²`}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {property.property_type === 'apartment' && 'شقة'}
                      {property.property_type === 'villa' && 'فيلا'}
                      {property.property_type === 'office' && 'مكتب'}
                      {property.property_type === 'shop' && 'محل تجاري'}
                      {property.property_type === 'warehouse' && 'مستودع'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{property.owner_name}</div>
                      <div className="text-sm text-muted-foreground">{property.owner_phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{formatCurrency(property.agreed_rent_amount)}</div>
                    {property.commission_percentage && (
                      <div className="text-sm text-muted-foreground">
                        عمولة: {property.commission_percentage}%
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(property.status)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2 space-x-reverse">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(property)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredProperties.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>لا توجد عقارات متاحة</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RentalProperties;