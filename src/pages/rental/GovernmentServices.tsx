import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Filter, 
  Search, 
  FileText, 
  Building2,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  DollarSign,
  Calendar,
  MapPin,
  User,
  Receipt,
  Upload,
  Eye,
  Edit,
  CreditCard,
  BarChart3,
  Play,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { GovernmentServiceForm } from "@/components/rental/GovernmentServiceForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface GovernmentService {
  id: string;
  service_name: string;
  service_type: string;
  government_entity: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  reference_number?: string;
  application_date: Date;
  expected_completion_date?: Date;
  actual_completion_date?: Date;
  official_fees: number;
  cost: number;
  client_id?: string;
  client_name?: string;
  handled_by: string;
  handler_name: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: string;
  created_at: Date;
  notes?: string;
}

interface ServiceTimeline {
  id: string;
  stage_name: string;
  stage_status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  started_at?: Date;
  completed_at?: Date;
  notes?: string;
  stage_order: number;
}

// بيانات تجريبية
const mockServices: GovernmentService[] = [
  {
    id: "1",
    service_name: "تجديد عقد إيجار تجاري",
    service_type: "تجديد عقد",
    government_entity: "بلدية عجمان",
    status: "in_progress",
    reference_number: "AJM-2024-001",
    application_date: new Date("2024-01-15"),
    expected_completion_date: new Date("2024-01-30"),
    official_fees: 2500,
    cost: 3000,
    client_name: "شركة الإمارات للتجارة",
    handled_by: "user1",
    handler_name: "أحمد محمد",
    priority: "high",
    category: "عقود",
    created_at: new Date("2024-01-15")
  },
  {
    id: "2",
    service_name: "تسجيل أرض سكنية",
    service_type: "تسجيل ملكية",
    government_entity: "دائرة الأراضي والأملاك",
    status: "pending",
    reference_number: "LAND-2024-002",
    application_date: new Date("2024-01-20"),
    expected_completion_date: new Date("2024-02-15"),
    official_fees: 15000,
    cost: 16500,
    client_name: "محمد علي الراشد",
    handled_by: "user2",
    handler_name: "فاطمة أحمد",
    priority: "normal",
    category: "أراضي",
    created_at: new Date("2024-01-20")
  },
  {
    id: "3",
    service_name: "استخراج سند ملكية",
    service_type: "استخراج وثيقة",
    government_entity: "دائرة الأراضي والأملاك",
    status: "completed",
    reference_number: "DEED-2024-003",
    application_date: new Date("2024-01-10"),
    expected_completion_date: new Date("2024-01-25"),
    actual_completion_date: new Date("2024-01-24"),
    official_fees: 1200,
    cost: 1500,
    client_name: "نورا سالم المطروشي",
    handled_by: "user1",
    handler_name: "أحمد محمد",
    priority: "normal",
    category: "وثائق",
    created_at: new Date("2024-01-10")
  }
];

const mockTimeline: Record<string, ServiceTimeline[]> = {
  "1": [
    {
      id: "t1",
      stage_name: "تقديم الطلب",
      stage_status: "completed",
      started_at: new Date("2024-01-15"),
      completed_at: new Date("2024-01-15"),
      stage_order: 1
    },
    {
      id: "t2",
      stage_name: "مراجعة المستندات",
      stage_status: "completed",
      started_at: new Date("2024-01-16"),
      completed_at: new Date("2024-01-18"),
      stage_order: 2
    },
    {
      id: "t3",
      stage_name: "الموافقة الأولية",
      stage_status: "in_progress",
      started_at: new Date("2024-01-19"),
      stage_order: 3
    },
    {
      id: "t4",
      stage_name: "دفع الرسوم",
      stage_status: "pending",
      stage_order: 4
    },
    {
      id: "t5",
      stage_name: "استلام الوثيقة",
      stage_status: "pending",
      stage_order: 5
    }
  ]
};

export default function GovernmentServices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showNewServiceDialog, setShowNewServiceDialog] = useState(false);

  const queryClient = useQueryClient();

  // Mutation لإضافة معاملة جديدة
  const addServiceMutation = useMutation({
    mutationFn: async (serviceData: any) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('government_services')
        .insert([{
          service_name: serviceData.service_name,
          service_type: serviceData.service_type,
          government_entity: serviceData.government_entity,
          category: serviceData.category,
          priority: serviceData.priority,
          official_fees: serviceData.official_fees,
          cost: serviceData.cost,
          expected_completion_date: serviceData.expected_completion_date,
          due_date: serviceData.due_date,
          notes: serviceData.notes,
          handled_by: userData.user?.id,
          application_date: new Date().toISOString().split('T')[0],
          status: 'pending',
          contract_id: '00000000-0000-0000-0000-000000000000' // معرف عقد افتراضي
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setShowNewServiceDialog(false);
      queryClient.invalidateQueries({ queryKey: ['government-services'] });
      toast({
        title: "تم إضافة المعاملة بنجاح",
        description: "تم إضافة المعاملة الحكومية الجديدة"
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إضافة المعاملة",
        description: error.message || "حدث خطأ أثناء إضافة المعاملة",
        variant: "destructive"
      });
    }
  });

  // جلب الخدمات الحكومية من قاعدة البيانات
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['government-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('government_services')
        .select(`
          *,
          profiles!handled_by(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // Mutation لتحديث مرحلة المعاملة
  const advanceStageMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const { data, error } = await supabase.rpc('advance_workflow_stage', {
        service_id_param: serviceId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث المرحلة بنجاح",
        description: "تم الانتقال للمرحلة التالية في سير العمل"
      });
      queryClient.invalidateQueries({ queryKey: ['government-services'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تحديث المرحلة",
        description: error.message || "حدث خطأ أثناء تحديث المرحلة",
        variant: "destructive"
      });
    }
  });

  // تصفية الخدمات
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = service.service_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           service.reference_number?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || service.status === statusFilter;
      const matchesEntity = entityFilter === "all" || service.government_entity === entityFilter;
      
      return matchesSearch && matchesStatus && matchesEntity;
    });
  }, [services, searchTerm, statusFilter, entityFilter]);

  // حساب الإحصائيات
  const statistics = useMemo(() => {
    const total = services.length;
    const pending = services.filter(s => s.status === 'pending').length;
    const inProgress = services.filter(s => s.status === 'in_progress').length;
    const completed = services.filter(s => s.status === 'completed').length;
    const rejected = services.filter(s => s.status === 'rejected').length;
    const totalFees = services.reduce((sum, s) => sum + (s.official_fees || 0), 0);
    const totalCosts = services.reduce((sum, s) => sum + (s.cost || 0), 0);

    return {
      total,
      pending,
      inProgress,
      completed,
      rejected,
      totalFees,
      totalCosts
    };
  }, [services]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="w-3 h-3 ml-1" />
            قيد الإجراء
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <AlertCircle className="w-3 h-3 ml-1" />
            قيد المراجعة
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 ml-1" />
            مكتملة
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="w-3 h-3 ml-1" />
            مرفوضة
          </Badge>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">عاجل</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">مرتفع</Badge>;
      case 'normal':
        return <Badge variant="secondary">عادي</Badge>;
      case 'low':
        return <Badge variant="outline">منخفض</Badge>;
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTimelineProgress = (serviceId: string) => {
    const timeline = mockTimeline[serviceId] || [];
    const completed = timeline.filter(t => t.stage_status === 'completed').length;
    const total = timeline.length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50/30" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-tajawal">الخدمات الحكومية</h1>
          <p className="text-gray-600 mt-1 font-tajawal">إدارة ومتابعة جميع المعاملات الحكومية</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Dialog open={showNewServiceDialog} onOpenChange={setShowNewServiceDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-tajawal">
                <Plus className="w-4 h-4 ml-2" />
                إضافة معاملة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle className="font-tajawal">إضافة معاملة حكومية جديدة</DialogTitle>
                <DialogDescription className="font-tajawal">
                  أدخل بيانات المعاملة الحكومية الجديدة
                </DialogDescription>
              </DialogHeader>
              <GovernmentServiceForm 
                onSubmit={(data) => addServiceMutation.mutate(data)}
                onCancel={() => setShowNewServiceDialog(false)}
                loading={addServiceMutation.isPending}
              />
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" className="font-tajawal">
            <BarChart3 className="w-4 h-4 ml-2" />
            التقارير
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 font-tajawal">إجمالي المعاملات</p>
                <p className="text-2xl font-bold text-gray-900 font-tajawal">{statistics.total}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 font-tajawal">قيد الإجراء</p>
                <p className="text-2xl font-bold text-yellow-600 font-tajawal">{statistics.pending}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 font-tajawal">قيد المراجعة</p>
                <p className="text-2xl font-bold text-blue-600 font-tajawal">{statistics.inProgress}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 font-tajawal">مكتملة</p>
                <p className="text-2xl font-bold text-green-600 font-tajawal">{statistics.completed}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 font-tajawal">إجمالي الرسوم</p>
                <p className="text-xl font-bold text-purple-600 font-tajawal">{formatCurrency(statistics.totalFees)}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 font-tajawal">إجمالي التكاليف</p>
                <p className="text-xl font-bold text-indigo-600 font-tajawal">{formatCurrency(statistics.totalCosts)}</p>
              </div>
              <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Receipt className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث في المعاملات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 font-tajawal"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 font-tajawal">
                  <Filter className="w-4 h-4 ml-2" />
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-tajawal">جميع الحالات</SelectItem>
                  <SelectItem value="pending" className="font-tajawal">قيد الإجراء</SelectItem>
                  <SelectItem value="in_progress" className="font-tajawal">قيد المراجعة</SelectItem>
                  <SelectItem value="completed" className="font-tajawal">مكتملة</SelectItem>
                  <SelectItem value="rejected" className="font-tajawal">مرفوضة</SelectItem>
                </SelectContent>
              </Select>

              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-48 font-tajawal">
                  <Building2 className="w-4 h-4 ml-2" />
                  <SelectValue placeholder="الجهة الحكومية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-tajawal">جميع الجهات</SelectItem>
                  <SelectItem value="بلدية عجمان" className="font-tajawal">بلدية عجمان</SelectItem>
                  <SelectItem value="دائرة الأراضي والأملاك" className="font-tajawal">دائرة الأراضي والأملاك</SelectItem>
                  <SelectItem value="دائرة التنمية الاقتصادية" className="font-tajawal">دائرة التنمية الاقتصادية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="font-tajawal">جدول المعاملات الحكومية</CardTitle>
          <CardDescription className="font-tajawal">
            عرض وإدارة جميع المعاملات الحكومية مع تفاصيلها
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="text-right font-tajawal font-semibold">اسم المعاملة</TableHead>
                  <TableHead className="text-right font-tajawal font-semibold">الجهة الحكومية</TableHead>
                  <TableHead className="text-right font-tajawal font-semibold">العميل</TableHead>
                  <TableHead className="text-right font-tajawal font-semibold">رقم المرجع</TableHead>
                  <TableHead className="text-right font-tajawal font-semibold">المرحلة الحالية</TableHead>
                  <TableHead className="text-right font-tajawal font-semibold">نسبة الإنجاز</TableHead>
                  <TableHead className="text-right font-tajawal font-semibold">تاريخ بداية العقد</TableHead>
                  <TableHead className="text-right font-tajawal font-semibold">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-medium font-tajawal">
                      <div>
                        <p className="font-semibold">{service.service_name}</p>
                        <p className="text-sm text-gray-500">{service.service_type}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-tajawal">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        {service.government_entity}
                      </div>
                    </TableCell>
                    <TableCell className="font-tajawal">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        {service.client_id || 'غير محدد'}
                      </div>
                    </TableCell>
                    <TableCell className="font-tajawal text-blue-600 font-medium">
                      {service.reference_number || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-tajawal">
                        {service.workflow_stage || 'صرف صحي'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={service.progress_percentage || 33.33} className="w-16" />
                        <span className="text-sm font-medium">{Math.round(service.progress_percentage || 33.33)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-tajawal">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {service.contract_start_date ? 
                          format(new Date(service.contract_start_date), 'dd/MM/yyyy', { locale: ar }) : 
                          'غير محدد'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedService(service)}
                            >
                              <Eye className="w-3 h-3 ml-1" />
                              عرض
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle className="font-tajawal">{service.service_name}</DialogTitle>
                              <DialogDescription className="font-tajawal">
                                تفاصيل المعاملة الحكومية ومراحل التنفيذ
                              </DialogDescription>
                            </DialogHeader>
                            
                            <Tabs defaultValue="details" className="w-full">
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="details" className="font-tajawal">التفاصيل</TabsTrigger>
                                <TabsTrigger value="timeline" className="font-tajawal">المراحل</TabsTrigger>
                                <TabsTrigger value="documents" className="font-tajawal">المستندات</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="details" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-3">
                                    <div>
                                      <label className="text-sm font-medium text-gray-600 font-tajawal">اسم المعاملة</label>
                                      <p className="font-tajawal">{service.service_name}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-600 font-tajawal">الجهة الحكومية</label>
                                      <p className="font-tajawal">{service.government_entity}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-600 font-tajawal">العميل</label>
                                      <p className="font-tajawal">{service.client_id || 'غير محدد'}</p>
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <div>
                                      <label className="text-sm font-medium text-gray-600 font-tajawal">الرسوم الرسمية</label>
                                      <p className="font-tajawal">{formatCurrency(service.official_fees)}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-600 font-tajawal">إجمالي التكلفة</label>
                                      <p className="font-tajawal">{formatCurrency(service.cost)}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-600 font-tajawal">الحالة</label>
                                      <div>{getStatusBadge(service.status)}</div>
                                    </div>
                                  </div>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="timeline" className="space-y-4">
                                <div className="space-y-4">
                                  {mockTimeline[service.id]?.map((stage, index) => (
                                    <div key={stage.id} className="flex items-start gap-4">
                                      <div className="flex flex-col items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                          stage.stage_status === 'completed' ? 'bg-green-100 text-green-600' :
                                          stage.stage_status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                                          'bg-gray-100 text-gray-400'
                                        }`}>
                                          {stage.stage_status === 'completed' ? (
                                            <CheckCircle className="w-4 h-4" />
                                          ) : stage.stage_status === 'in_progress' ? (
                                            <Clock className="w-4 h-4" />
                                          ) : (
                                            <div className="w-2 h-2 rounded-full bg-current"></div>
                                          )}
                                        </div>
                                        {index < (mockTimeline[service.id]?.length || 0) - 1 && (
                                          <div className="w-px h-8 bg-gray-200 mt-2"></div>
                                        )}
                                      </div>
                                      <div className="flex-1">
                                        <h4 className="font-medium font-tajawal">{stage.stage_name}</h4>
                                        <p className="text-sm text-gray-500 font-tajawal">
                                          {stage.stage_status === 'completed' && stage.completed_at ? 
                                            `مكتملة في ${format(stage.completed_at, 'dd/MM/yyyy', { locale: ar })}` :
                                            stage.stage_status === 'in_progress' ? 'قيد التنفيذ' :
                                            'في الانتظار'
                                          }
                                        </p>
                                        {stage.notes && (
                                          <p className="text-sm text-gray-600 mt-1 font-tajawal">{stage.notes}</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="documents" className="space-y-4">
                                <div className="text-center py-8">
                                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                  <p className="text-gray-600 font-tajawal">لا توجد مستندات مرفقة</p>
                                  <Button className="mt-4 font-tajawal">
                                    <Upload className="w-4 h-4 ml-2" />
                                    رفع مستند
                                  </Button>
                                </div>
                              </TabsContent>
                            </Tabs>
                          </DialogContent>
                        </Dialog>
                        
                        <Button size="sm" variant="outline">
                          <Edit className="w-3 h-3 ml-1" />
                          تعديل
                        </Button>
                        
                        {service.status !== 'completed' && (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => advanceStageMutation.mutate(service.id)}
                            disabled={advanceStageMutation.isPending}
                          >
                            <Play className="w-3 h-3 ml-1" />
                            تم
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 font-tajawal">لا توجد معاملات</h3>
              <p className="text-gray-600 font-tajawal">لم يتم العثور على معاملات تطابق البحث المحدد</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}