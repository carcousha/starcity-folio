// @ts-nocheck
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  User, 
  Calendar,
  FileText,
  DollarSign,
  MessageSquare,
  Plus,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Owner {
  id: string;
  full_name: string;
  mobile_numbers: any;
  owner_type: string;
  address?: string;
  email?: string;
  nationality?: string;
  id_number?: string;
  internal_notes?: string;
  total_properties_count: number;
  total_properties_value: number;
  last_contact_date?: string;
  created_at: string;
  is_active: boolean;
  profiles?: any;
}

interface Property {
  id: string;
  title: string;
  property_type: string;
  property_status: string;
  total_price: number;
  emirate: string;
  area_community: string;
  created_at: string;
}

interface Communication {
  id: string;
  communication_type: string;
  subject?: string;
  description: string;
  scheduled_date?: string;
  completed_date?: string;
  status: string;
  created_at: string;
}

interface OwnerDetailsProps {
  owner: Owner;
  onClose: () => void;
}

export const OwnerDetails = ({ owner, onClose }: OwnerDetailsProps) => {
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOwnerData();
  }, [owner.id]);

  const fetchOwnerData = async () => {
    try {
      setLoading(true);
      
      // Fetch properties
      const { data: propertiesData } = await supabase
        .from("crm_properties")
        .select("id, title, property_type, property_status, total_price, emirate, area_community, created_at")
        .eq("property_owner_id", owner.id)
        .order("created_at", { ascending: false });

      // Fetch communications
      const { data: communicationsData } = await supabase
        .from("owner_communications")
        .select("*")
        .eq("owner_id", owner.id)
        .order("created_at", { ascending: false })
        .limit(10);

      setProperties(propertiesData || []);
      setCommunications(communicationsData || []);
    } catch (error: any) {
      console.error("Error fetching owner data:", error);
      toast({
        variant: "destructive",
        title: "خطأ في تحميل البيانات",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMMM yyyy", { locale: ar });
  };

  const getCommunicationTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      call: "مكالمة",
      message: "رسالة",
      meeting: "اجتماع",
      email: "بريد إلكتروني",
      whatsapp: "واتساب"
    };
    return types[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any }> = {
      pending: { label: "معلق", variant: "outline" },
      completed: { label: "مكتمل", variant: "default" },
      cancelled: { label: "ملغي", variant: "destructive" }
    };
    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPropertyStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any }> = {
      available: { label: "متوفر", variant: "default" },
      reserved: { label: "محجوز", variant: "secondary" },
      sold: { label: "مباع", variant: "destructive" },
      under_construction: { label: "تحت الإنشاء", variant: "outline" }
    };
    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Owner Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                إضافة تواصل
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                إضافة مستند
              </Button>
            </div>
            <div className="text-right">
              <CardTitle className="text-2xl">{owner.full_name}</CardTitle>
              <div className="flex gap-2 mt-2">
                <Badge
                  variant={owner.owner_type === "individual" ? "default" : "secondary"}
                >
                  {owner.owner_type === "individual" ? "فرد" : "شركة"}
                </Badge>
                {owner.nationality && (
                  <Badge variant="outline">{owner.nationality}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Contact Information */}
            <div className="space-y-3">
              <h4 className="font-semibold text-right">معلومات التواصل</h4>
              {owner.mobile_numbers.map((number, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-right" dir="rtl">{number}</span>
                </div>
              ))}
              
              {owner.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-right" dir="rtl">{owner.email}</span>
                </div>
              )}

              {owner.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-right" dir="rtl">{owner.address}</span>
                </div>
              )}
            </div>

            {/* Statistics */}
            <div className="space-y-3">
              <h4 className="font-semibold text-right">الإحصائيات</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-primary" />
                  <span>{owner.total_properties_count} عقار</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span>{formatCurrency(owner.total_properties_value)}</span>
                </div>
                {owner.last_contact_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>آخر تواصل: {formatDate(owner.last_contact_date)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-3">
              <h4 className="font-semibold text-right">معلومات إضافية</h4>
              {owner.id_number && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-right">هوية/سجل: {owner.id_number}</span>
                </div>
              )}
              
              {owner.profiles && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-right">
                    الموظف: {owner.profiles.first_name} {owner.profiles.last_name}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-right">تاريخ الإضافة: {formatDate(owner.created_at)}</span>
              </div>
            </div>

            {/* Internal Notes */}
            {owner.internal_notes && (
              <div className="space-y-3">
                <h4 className="font-semibold text-right">ملاحظات داخلية</h4>
                <p className="text-sm text-muted-foreground text-right" dir="rtl">
                  {owner.internal_notes}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information */}
      <Tabs defaultValue="properties" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="properties">العقارات ({properties.length})</TabsTrigger>
          <TabsTrigger value="communications">التواصل ({communications.length})</TabsTrigger>
          <TabsTrigger value="documents">المستندات</TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="space-y-4">
          {properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {properties.map((property) => (
                <Card key={property.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <div className="text-right">
                        <h4 className="font-semibold">{property.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {property.emirate} - {property.area_community}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        {getPropertyStatusBadge(property.property_status)}
                        <span className="text-sm font-medium">{property.property_type}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(property.created_at)}
                        </span>
                        <span className="font-semibold">
                          {formatCurrency(property.total_price)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد عقارات مرتبطة بهذا المالك</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="communications" className="space-y-4">
          {communications.length > 0 ? (
            <div className="space-y-4">
              {communications.map((comm) => (
                <Card key={comm.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {getCommunicationTypeLabel(comm.communication_type)}
                        </Badge>
                        {getStatusBadge(comm.status)}
                      </div>
                      <div className="text-right">
                        {comm.subject && (
                          <h4 className="font-semibold">{comm.subject}</h4>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {formatDate(comm.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-right" dir="rtl">{comm.description}</p>
                    
                    {comm.scheduled_date && (
                      <p className="text-sm text-muted-foreground text-right mt-2">
                        موعد مجدول: {formatDate(comm.scheduled_date)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا يوجد سجل تواصل مع هذا المالك</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد مستندات مرفوعة</p>
              <Button variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                رفع مستند
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};