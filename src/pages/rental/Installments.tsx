import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Filter, 
  Search, 
  CreditCard, 
  Edit, 
  Printer, 
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Installment {
  id: string;
  installmentNumber: number;
  dueDate: Date;
  amount: number;
  status: 'paid' | 'overdue' | 'upcoming';
  paidDate?: Date;
  contractNumber: string;
  tenantName: string;
  propertyTitle: string;
}

// بيانات تجريبية للأقساط
const mockInstallments: Installment[] = [
  {
    id: "1",
    installmentNumber: 1,
    dueDate: new Date("2024-01-15"),
    amount: 25000,
    status: "paid",
    paidDate: new Date("2024-01-14"),
    contractNumber: "RNT-2024-001",
    tenantName: "أحمد محمد الراشد",
    propertyTitle: "شقة 3 غرف - برج الإمارات"
  },
  {
    id: "2", 
    installmentNumber: 2,
    dueDate: new Date("2024-02-15"),
    amount: 25000,
    status: "paid",
    paidDate: new Date("2024-02-13"),
    contractNumber: "RNT-2024-001",
    tenantName: "أحمد محمد الراشد",
    propertyTitle: "شقة 3 غرف - برج الإمارات"
  },
  {
    id: "3",
    installmentNumber: 3,
    dueDate: new Date("2024-03-15"),
    amount: 25000,
    status: "overdue",
    contractNumber: "RNT-2024-001",
    tenantName: "أحمد محمد الراشد",
    propertyTitle: "شقة 3 غرف - برج الإمارات"
  },
  {
    id: "4",
    installmentNumber: 4,
    dueDate: new Date("2024-04-15"),
    amount: 25000,
    status: "upcoming",
    contractNumber: "RNT-2024-001",
    tenantName: "أحمد محمد الراشد",
    propertyTitle: "شقة 3 غرف - برج الإمارات"
  },
  {
    id: "5",
    installmentNumber: 1,
    dueDate: new Date("2024-01-20"),
    amount: 30000,
    status: "paid",
    paidDate: new Date("2024-01-19"),
    contractNumber: "RNT-2024-002",
    tenantName: "فاطمة علي النعيمي",
    propertyTitle: "فيلا 4 غرف - حي الصفا"
  },
  {
    id: "6",
    installmentNumber: 2,
    dueDate: new Date("2024-02-20"),
    amount: 30000,
    status: "overdue",
    contractNumber: "RNT-2024-002",
    tenantName: "فاطمة علي النعيمي",
    propertyTitle: "فيلا 4 غرف - حي الصفا"
  },
  {
    id: "7",
    installmentNumber: 3,
    dueDate: new Date("2024-03-20"),
    amount: 30000,
    status: "upcoming",
    contractNumber: "RNT-2024-002",
    tenantName: "فاطمة علي النعيمي",
    propertyTitle: "فيلا 4 غرف - حي الصفا"
  }
];

export default function Installments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // تصفية الأقساط حسب البحث والحالة
  const filteredInstallments = useMemo(() => {
    return mockInstallments.filter(installment => {
      const matchesSearch = installment.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           installment.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           installment.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || installment.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  // حساب الإحصائيات
  const statistics = useMemo(() => {
    const totalAmount = mockInstallments.reduce((sum, inst) => sum + inst.amount, 0);
    const paidAmount = mockInstallments
      .filter(inst => inst.status === 'paid')
      .reduce((sum, inst) => sum + inst.amount, 0);
    const overdueAmount = mockInstallments
      .filter(inst => inst.status === 'overdue')
      .reduce((sum, inst) => sum + inst.amount, 0);
    const upcomingAmount = mockInstallments
      .filter(inst => inst.status === 'upcoming')
      .reduce((sum, inst) => sum + inst.amount, 0);

    return {
      total: totalAmount,
      paid: paidAmount,
      overdue: overdueAmount,
      upcoming: upcomingAmount,
      paidCount: mockInstallments.filter(inst => inst.status === 'paid').length,
      overdueCount: mockInstallments.filter(inst => inst.status === 'overdue').length,
      upcomingCount: mockInstallments.filter(inst => inst.status === 'upcoming').length
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 ml-1" />
            مدفوع
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <AlertCircle className="w-3 h-3 ml-1" />
            متأخر
          </Badge>
        );
      case 'upcoming':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="w-3 h-3 ml-1" />
            قادم
          </Badge>
        );
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

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50/30" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-tajawal">إدارة الأقساط</h1>
          <p className="text-gray-600 mt-1 font-tajawal">إدارة وتتبع جميع أقساط الإيجار</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-tajawal">
            <Plus className="w-4 h-4 ml-2" />
            إضافة قسط جديد
          </Button>
          <Button variant="outline" className="font-tajawal">
            <FileText className="w-4 h-4 ml-2" />
            تصدير التقرير
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 font-tajawal">إجمالي الأقساط</p>
                <p className="text-2xl font-bold text-gray-900 font-tajawal">{formatCurrency(statistics.total)}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 font-tajawal">الأقساط المدفوعة</p>
                <p className="text-2xl font-bold text-green-600 font-tajawal">{formatCurrency(statistics.paid)}</p>
                <p className="text-xs text-gray-500 font-tajawal">{statistics.paidCount} قسط</p>
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
                <p className="text-sm font-medium text-gray-600 font-tajawal">الأقساط المتأخرة</p>
                <p className="text-2xl font-bold text-red-600 font-tajawal">{formatCurrency(statistics.overdue)}</p>
                <p className="text-xs text-gray-500 font-tajawal">{statistics.overdueCount} قسط</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 font-tajawal">الأقساط القادمة</p>
                <p className="text-2xl font-bold text-yellow-600 font-tajawal">{formatCurrency(statistics.upcoming)}</p>
                <p className="text-xs text-gray-500 font-tajawal">{statistics.upcomingCount} قسط</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث في الأقساط..."
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
                  <SelectValue placeholder="حالة القسط" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-tajawal">جميع الأقساط</SelectItem>
                  <SelectItem value="paid" className="font-tajawal">مدفوع</SelectItem>
                  <SelectItem value="overdue" className="font-tajawal">متأخر</SelectItem>
                  <SelectItem value="upcoming" className="font-tajawal">قادم</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installments Table */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="font-tajawal">جدول الأقساط</CardTitle>
          <CardDescription className="font-tajawal">
            عرض وإدارة جميع أقساط الإيجار مع حالاتها المختلفة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="text-right font-tajawal font-semibold">رقم القسط</TableHead>
                  <TableHead className="text-right font-tajawal font-semibold">رقم العقد</TableHead>
                  <TableHead className="text-right font-tajawal font-semibold">المستأجر</TableHead>
                  <TableHead className="text-right font-tajawal font-semibold">العقار</TableHead>
                  <TableHead className="text-right font-tajawal font-semibold">تاريخ الاستحقاق</TableHead>
                  <TableHead className="text-right font-tajawal font-semibold">المبلغ</TableHead>
                  <TableHead className="text-right font-tajawal font-semibold">الحالة</TableHead>
                  <TableHead className="text-right font-tajawal font-semibold">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstallments.map((installment) => (
                  <TableRow key={installment.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-medium font-tajawal">
                      #{installment.installmentNumber}
                    </TableCell>
                    <TableCell className="font-tajawal text-blue-600 font-medium">
                      {installment.contractNumber}
                    </TableCell>
                    <TableCell className="font-tajawal">
                      {installment.tenantName}
                    </TableCell>
                    <TableCell className="font-tajawal text-sm text-gray-600">
                      {installment.propertyTitle}
                    </TableCell>
                    <TableCell className="font-tajawal">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {format(installment.dueDate, 'dd/MM/yyyy', { locale: ar })}
                      </div>
                    </TableCell>
                    <TableCell className="font-tajawal font-semibold">
                      {formatCurrency(installment.amount)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(installment.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {installment.status !== 'paid' && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                            <CreditCard className="w-3 h-3 ml-1" />
                            تحصيل
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Edit className="w-3 h-3 ml-1" />
                          تعديل
                        </Button>
                        <Button size="sm" variant="outline">
                          <Printer className="w-3 h-3 ml-1" />
                          طباعة
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredInstallments.length === 0 && (
            <div className="text-center py-12">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 font-tajawal">لا توجد أقساط</h3>
              <p className="text-gray-600 font-tajawal">لم يتم العثور على أقساط تطابق البحث المحدد</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}