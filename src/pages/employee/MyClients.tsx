import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Plus,
  MessageSquare,
  User,
  Filter
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function MyClients() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [noteText, setNoteText] = useState("");
  const [activeClientId, setActiveClientId] = useState<string | null>(null);

  const { data: clientsData, isLoading } = useQuery({
    queryKey: ['my-clients', profile?.user_id],
    queryFn: async () => {
      if (!profile) return [];
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .or(`assigned_to.eq.${profile.user_id},created_by.eq.${profile.user_id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ clientId, updates }: { clientId: string; updates: any }) => {
      const { error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-clients'] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات العميل بنجاح",
      });
    }
  });

  const filteredClients = clientsData?.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone.includes(searchTerm) ||
                         (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = selectedStatus === "all" || client.client_status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handleStatusUpdate = (clientId: string, newStatus: string) => {
    updateClientMutation.mutate({
      clientId,
      updates: { 
        client_status: newStatus,
        last_contacted: new Date().toISOString().split('T')[0]
      }
    });
  };

  const handleAddNote = (clientId: string) => {
    if (!noteText.trim()) return;
    
    const client = clientsData?.find(c => c.id === clientId);
    const currentNotes = client?.internal_notes || "";
    const newNote = `${new Date().toLocaleDateString('ar-AE')} - ${noteText}`;
    const updatedNotes = currentNotes ? `${currentNotes}\n${newNote}` : newNote;
    
    updateClientMutation.mutate({
      clientId,
      updates: { internal_notes: updatedNotes }
    });
    
    setNoteText("");
    setActiveClientId(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
      case 'potential':
        return <Badge className="bg-blue-100 text-blue-800">محتمل</Badge>;
      case 'cold':
        return <Badge className="bg-gray-100 text-gray-800">بارد</Badge>;
      case 'hot':
        return <Badge className="bg-red-100 text-red-800">ساخن</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">عملائي</h1>
            <p className="text-muted-foreground">إدارة العملاء المخصصين لي</p>
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
                placeholder="البحث بالاسم أو الهاتف أو البريد الإلكتروني"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">جميع الحالات</option>
                <option value="new">جديد</option>
                <option value="active">نشط</option>
                <option value="potential">محتمل</option>
                <option value="hot">ساخن</option>
                <option value="cold">بارد</option>
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
                <p className="text-sm font-medium text-muted-foreground">إجمالي العملاء</p>
                <p className="text-2xl font-bold text-foreground">{filteredClients.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">العملاء النشطين</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredClients.filter(c => c.client_status === 'active').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <User className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">العملاء المحتملين</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredClients.filter(c => c.client_status === 'potential').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-50">
                <MessageSquare className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">العملاء الساخنين</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredClients.filter(c => c.client_status === 'hot').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-50">
                <Phone className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Users className="h-5 w-5" />
            <span>قائمة العملاء</span>
          </CardTitle>
          <CardDescription>
            جميع العملاء المخصصين لي مع إمكانية إضافة الملاحظات وتحديث الحالة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">جارٍ التحميل...</p>
            </div>
          ) : !filteredClients.length ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد عملاء مطابقين للبحث</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClients.map((client) => (
                <div key={client.id} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-lg mb-2">
                        {client.name}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{client.phone}</span>
                        </div>
                        {client.email && (
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{client.email}</span>
                          </div>
                        )}
                        {client.address && (
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{client.address}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>آخر تواصل: {client.last_contacted ? new Date(client.last_contacted).toLocaleDateString('ar-AE') : 'لم يتم التواصل'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {getStatusBadge(client.client_status)}
                    </div>
                  </div>

                  {/* Status Update Buttons */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStatusUpdate(client.id, 'active')}
                      disabled={updateClientMutation.isPending}
                    >
                      نشط
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStatusUpdate(client.id, 'potential')}
                      disabled={updateClientMutation.isPending}
                    >
                      محتمل
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStatusUpdate(client.id, 'hot')}
                      disabled={updateClientMutation.isPending}
                    >
                      ساخن
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStatusUpdate(client.id, 'cold')}
                      disabled={updateClientMutation.isPending}
                    >
                      بارد
                    </Button>
                  </div>

                  {/* Notes Section */}
                  {client.internal_notes && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">الملاحظات الداخلية:</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {client.internal_notes}
                      </p>
                    </div>
                  )}

                  {/* Add Note */}
                  {activeClientId === client.id ? (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="إضافة ملاحظة جديدة..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        rows={3}
                      />
                      <div className="flex space-x-2 space-x-reverse">
                        <Button 
                          size="sm" 
                          onClick={() => handleAddNote(client.id)}
                          disabled={!noteText.trim() || updateClientMutation.isPending}
                        >
                          حفظ الملاحظة
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setActiveClientId(null);
                            setNoteText("");
                          }}
                        >
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setActiveClientId(client.id)}
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة ملاحظة
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}