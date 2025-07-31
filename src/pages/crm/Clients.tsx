import { useState, useEffect } from "react";
import { Plus, Search, Filter, Phone, Mail, MapPin, Calendar, Edit, Trash2, Users, Globe, DollarSign, Building, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ClientForm from "@/components/crm/ClientForm";

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  nationality?: string;
  preferred_language?: string;
  preferred_contact_method?: string;
  property_type_interest?: string;
  purchase_purpose?: string;
  budget_min?: number;
  budget_max?: number;
  preferred_location?: string;
  planned_purchase_date?: string;
  client_status?: string;
  source?: string;
  preferred_payment_method?: string;
  last_contacted?: string;
  previous_deals_count?: number;
  preferences?: string;
  notes?: string;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  created_by?: string;
}

const CLIENT_STATUSES = [
  { value: 'new', label: 'جديد' },
  { value: 'contacted', label: 'تم التواصل' },
  { value: 'negotiating', label: 'قيد التفاوض' },
  { value: 'deal_closed', label: 'صفقة ناجحة' },
  { value: 'deal_lost', label: 'صفقة ضائعة' }
];

const SOURCES = [
  { value: 'google_ads', label: 'إعلان جوجل' },
  { value: 'whatsapp', label: 'واتساب' },
  { value: 'referral', label: 'توصية' },
  { value: 'exhibition', label: 'معرض عقاري' },
  { value: 'website', label: 'موقع الويب' },
  { value: 'social_media', label: 'وسائل التواصل' }
];

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      let query = supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq('client_status', statusFilter);
      }

      if (sourceFilter && sourceFilter !== "all") {
        query = query.eq('source', sourceFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل بيانات العملاء",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [statusFilter, sourceFilter]);

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsDialogOpen(true);
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;
      
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف العميل بنجاح",
      });
      
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في حذف العميل",
        variant: "destructive",
      });
    }
  };

  const canEditClient = (client: Client) => {
    return user && (client.assigned_to === user.id || client.created_by === user.id);
  };

  const canDeleteClient = (client: Client) => {
    return user && (client.assigned_to === user.id || client.created_by === user.id);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.nationality && client.nationality.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status?: string) => {
    const statusConfig = CLIENT_STATUSES.find(s => s.value === status);
    const variant = status === 'deal_closed' ? 'default' : 
                   status === 'deal_lost' ? 'destructive' : 
                   status === 'negotiating' ? 'secondary' : 'outline';
    
    return (
      <Badge variant={variant}>
        {statusConfig?.label || 'غير محدد'}
      </Badge>
    );
  };

  const getSourceLabel = (source?: string) => {
    const sourceConfig = SOURCES.find(s => s.value === source);
    return sourceConfig?.label || source || 'غير محدد';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة العملاء</h1>
          <p className="text-muted-foreground">إدارة قاعدة بيانات العملاء والتواصل معهم</p>
        </div>
        
        <Button 
          onClick={() => {
            setEditingClient(null);
            setIsDialogOpen(true);
          }}
          className="bg-yellow-500 hover:bg-yellow-600 text-white"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة عميل جديد
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في العملاء..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <div className="min-w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  {CLIENT_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-48">
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع المصادر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المصادر</SelectItem>
                  {SOURCES.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة العملاء ({filteredClients.length})</CardTitle>
          <CardDescription>
            جميع العملاء المسجلين في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">الهاتف</TableHead>
                <TableHead className="text-right">الجنسية</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">المصدر</TableHead>
                <TableHead className="text-right">نوع العقار</TableHead>
                <TableHead className="text-right">الميزانية</TableHead>
                <TableHead className="text-right">تاريخ الإضافة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{client.name}</span>
                      {client.email && (
                        <span className="text-sm text-muted-foreground flex items-center">
                          <Mail className="h-3 w-3 ml-1" />
                          {client.email}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 ml-2 text-muted-foreground" />
                      {client.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 ml-2 text-muted-foreground" />
                      {client.nationality || 'غير محدد'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(client.client_status)}
                  </TableCell>
                  <TableCell>
                    {getSourceLabel(client.source)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Building className="h-4 w-4 ml-2 text-muted-foreground" />
                      {client.property_type_interest || 'غير محدد'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {client.budget_min || client.budget_max ? (
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 ml-2 text-muted-foreground" />
                        <span className="text-sm">
                          {client.budget_min ? `${client.budget_min.toLocaleString()}` : '0'} - 
                          {client.budget_max ? ` ${client.budget_max.toLocaleString()}` : ' ∞'} درهم
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">غير محدد</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 ml-2 text-muted-foreground" />
                      {new Date(client.created_at).toLocaleDateString('ar-AE')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {canEditClient(client) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(client)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDeleteClient(client) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(client.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredClients.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد عملاء</p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchTerm ? 'لا توجد نتائج للبحث' : 'ابدأ بإضافة أول عميل'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">
            {editingClient ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
          </DialogTitle>
          <ClientForm
            client={editingClient}
            onSuccess={() => {
              setIsDialogOpen(false);
              setEditingClient(null);
              fetchClients();
            }}
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingClient(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}