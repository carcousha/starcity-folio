import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Download,
  Eye,
  Search,
  Calendar,
  User,
  Building,
  DollarSign,
  FileText,
  Trash2,
  Filter,
  ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GeneratedContract {
  id: string;
  contract_number: string;
  tenant_name: string;
  property_title: string;
  owner_name?: string;
  area?: string;
  unit_number?: string;
  unit_type?: string;
  rent_amount: number;
  start_date: string;
  end_date: string;
  payment_method: string;
  installments_count: number;
  contract_status: string;
  generated_pdf_path: string;
  created_at: string;
  created_by: string;
}

const GeneratedContractsList = () => {
  const { isAdmin, isAccountant } = useRoleAccess();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');

  // جلب العقود المولدة
  const { data: contracts = [], isLoading, error } = useQuery({
    queryKey: ['generated-contracts', searchTerm, statusFilter, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('rental_contracts')
        .select('*')
        .not('generated_pdf_path', 'is', null);

      // تطبيق فلاتر البحث
      if (searchTerm) {
        query = query.or(`tenant_name.ilike.%${searchTerm}%,contract_number.ilike.%${searchTerm}%,area.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('contract_status', statusFilter);
      }

      // ترتيب النتائج
      const [sortField, sortDirection] = sortBy.split(':');
      query = query.order(sortField, { ascending: sortDirection === 'asc' });

      const { data, error } = await query;
      
      if (error) throw error;
      return data as any[];
    },
    enabled: isAdmin || isAccountant
  });

  // متحول لتحميل العقد
  const downloadContractMutation = useMutation({
    mutationFn: async (contract: GeneratedContract) => {
      const { data, error } = await supabase.storage
        .from('generated-contracts')
        .createSignedUrl(contract.generated_pdf_path, 3600);
      
      if (error) throw error;
      return data.signedUrl;
    },
    onSuccess: (url) => {
      window.open(url, '_blank');
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تحميل العقد",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // متحول لحذف العقد
  const deleteContractMutation = useMutation({
    mutationFn: async (contractId: string) => {
      const { error } = await supabase
        .from('rental_contracts')
        .delete()
        .eq('id', contractId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "تم حذف العقد بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['generated-contracts'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حذف العقد",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleDownload = (contract: GeneratedContract) => {
    downloadContractMutation.mutate(contract);
  };

  const handleDelete = (contractId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العقد؟')) {
      deleteContractMutation.mutate(contractId);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'generated': { label: 'مولد', variant: 'default' as const },
      'active': { label: 'فعال', variant: 'default' as const },
      'expired': { label: 'منتهي', variant: 'destructive' as const },
      'cancelled': { label: 'ملغي', variant: 'destructive' as const },
      'draft': { label: 'مسودة', variant: 'secondary' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'default' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-AE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isAdmin && !isAccountant) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            ليس لديك صلاحية لعرض العقود المولدة
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-destructive">
            خطأ في تحميل العقود: {(error as Error).message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            العقود المولدة ({contracts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* أدوات البحث والفلترة */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث بالاسم، رقم العقد، أو المنطقة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="فلترة بالحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="generated">مولد</SelectItem>
                <SelectItem value="active">فعال</SelectItem>
                <SelectItem value="expired">منتهي</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="ترتيب حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at:desc">الأحدث أولاً</SelectItem>
                <SelectItem value="created_at:asc">الأقدم أولاً</SelectItem>
                <SelectItem value="tenant_name:asc">اسم المستأجر أ-ي</SelectItem>
                <SelectItem value="tenant_name:desc">اسم المستأجر ي-أ</SelectItem>
                <SelectItem value="rent_amount:desc">الإيجار (الأعلى أولاً)</SelectItem>
                <SelectItem value="rent_amount:asc">الإيجار (الأقل أولاً)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* قائمة العقود */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                لا توجد عقود مولدة
              </h3>
              <p className="text-muted-foreground">
                قم بإنشاء عقد جديد لظهوره هنا
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {contracts.map((contract) => (
                <Card key={contract.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* معلومات العقد الأساسية */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{contract.contract_number}</h3>
                          {getStatusBadge(contract.contract_status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">المستأجر:</span>
                            <span>{contract.tenant_name}</span>
                          </div>
                          
                          {contract.owner_name && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">المالك:</span>
                              <span>{contract.owner_name}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">العقار:</span>
                            <span>{contract.area} - وحدة {contract.unit_number}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">الإيجار:</span>
                            <span className="font-semibold text-green-600">
                              {formatCurrency(contract.rent_amount)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">المدة:</span>
                            <span>{formatDate(contract.start_date)} - {formatDate(contract.end_date)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-medium">السداد:</span>
                            <span>{contract.payment_method} ({contract.installments_count} دفعات)</span>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          تم الإنشاء في: {formatDate(contract.created_at)}
                        </div>
                      </div>

                      {/* أزرار الإجراءات */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(contract)}
                          disabled={downloadContractMutation.isPending}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          تحميل PDF
                        </Button>
                        
                        {isAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(contract.id)}
                            disabled={deleteContractMutation.isPending}
                            className="flex items-center gap-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            حذف
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* إحصائيات سريعة */}
      {contracts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {contracts.length}
              </div>
              <div className="text-sm text-muted-foreground">إجمالي العقود</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {contracts.filter(c => c.contract_status === 'active').length}
              </div>
              <div className="text-sm text-muted-foreground">عقود فعالة</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(
                  contracts.reduce((sum, contract) => sum + contract.rent_amount, 0)
                )}
              </div>
              <div className="text-sm text-muted-foreground">إجمالي الإيجارات</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {contracts.filter(c => 
                  new Date(c.end_date) > new Date() && 
                  new Date(c.end_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                ).length}
              </div>
              <div className="text-sm text-muted-foreground">تنتهي خلال 30 يوم</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GeneratedContractsList;