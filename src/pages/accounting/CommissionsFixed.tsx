// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Calculator, CheckCircle, DollarSign, TrendingUp, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess";

interface Deal {
  id: string;
  client_id: string;
  property_id: string;
  amount: number;
  commission_rate: number;
  commission_amount: number | null;
  status: string;
  handled_by: string;
  commission_calculated: boolean;
  clients: { name: string } | null;
  properties: { title: string } | null;
  profiles: { first_name: string; last_name: string } | null;
}

interface DealCommission {
  id: string;
  deal_id: string;
  commission_amount: number;
  office_share: number;
  employee_share: number;
  status: string;
  client_name: string | null;
  property_title: string | null;
  created_at: string;
  handled_by: string;
  profiles: { first_name: string; last_name: string } | null;
}

export const CommissionsFixed = () => {
  const { checkPermission } = useRoleAccess();
  const queryClient = useQueryClient();
  const [selectedDeal, setSelectedDeal] = useState<string>("");
  const [customRate, setCustomRate] = useState<number>(2.5);

  // جلب الصفقات المكتملة
  const { data: deals = [], isLoading: dealsLoading } = useQuery({
    queryKey: ['closed-deals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          clients(name),
          properties(title),
          profiles(first_name, last_name)
        `)
        .eq('status', 'closed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any[];
    },
    enabled: checkPermission('canManageCommissions')
  });

  // جلب العمولات المحسوبة
  const { data: commissions = [], isLoading: commissionsLoading } = useQuery({
    queryKey: ['deal-commissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deal_commissions')
        .select(`
          *,
          profiles(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DealCommission[];
    },
    enabled: checkPermission('canManageCommissions')
  });

  // حساب العمولة
  const calculateCommissionMutation = useMutation({
    mutationFn: async (dealId: string) => {
      const { data, error } = await supabase.rpc('calculate_deal_commission', {
        deal_id_param: dealId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast({
        title: "تم حساب العمولة بنجاح",
        description: `العمولة الإجمالية: ${data?.total_commission || 0} د.إ`,
      });
      queryClient.invalidateQueries({ queryKey: ['deal-commissions'] });
      queryClient.invalidateQueries({ queryKey: ['closed-deals'] });
      setSelectedDeal("");
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حساب العمولة",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    }
  });

  // اعتماد العمولة
  const approveCommissionMutation = useMutation({
    mutationFn: async (commissionId: string) => {
      const { data, error } = await supabase.rpc('approve_commission', {
        commission_id_param: commissionId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "تم اعتماد العمولة",
        description: "تم اعتماد العمولة وإضافتها للموظف",
      });
      queryClient.invalidateQueries({ queryKey: ['deal-commissions'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في اعتماد العمولة",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    }
  });

  const handleCalculateCommission = () => {
    if (!selectedDeal) {
      toast({
        title: "يرجى اختيار صفقة",
        description: "يجب اختيار صفقة لحساب العمولة",
        variant: "destructive",
      });
      return;
    }

    calculateCommissionMutation.mutate(selectedDeal);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "في الانتظار", variant: "secondary" as const },
      approved: { label: "معتمدة", variant: "default" as const },
      paid: { label: "مدفوعة", variant: "outline" as const },
      cancelled: { label: "ملغية", variant: "destructive" as const }
    };

    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  // إحصائيات سريعة
  const totalCommissions = commissions.reduce((sum, comm) => sum + comm.commission_amount, 0);
  const pendingCommissions = commissions.filter(c => c.status === 'pending').length;
  const approvedCommissions = commissions.filter(c => c.status === 'approved').length;

  if (!checkPermission('canManageCommissions')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">غير مصرح</h2>
          <p>لا تملك صلاحية إدارة العمولات</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العمولات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCommissions.toFixed(2)} د.إ</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">في الانتظار</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCommissions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معتمدة</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCommissions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد العمولات</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{commissions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* حساب عمولة جديدة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            حساب عمولة جديدة
          </CardTitle>
          <CardDescription>
            اختر صفقة مكتملة لحساب العمولة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deal-select">اختيار الصفقة</Label>
              <Select value={selectedDeal} onValueChange={setSelectedDeal}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر صفقة..." />
                </SelectTrigger>
                <SelectContent>
                  {deals
                    .filter(deal => !deal.commission_calculated)
                    .map((deal) => (
                    <SelectItem key={deal.id} value={deal.id}>
                      {deal.clients?.name || 'عميل غير محدد'} - {deal.amount.toFixed(2)} د.إ
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission-rate">نسبة العمولة (%)</Label>
              <Input
                id="commission-rate"
                type="number"
                step="0.1"
                value={customRate}
                onChange={(e) => setCustomRate(Number(e.target.value))}
                placeholder="2.5"
              />
            </div>
          </div>

          <Button
            onClick={handleCalculateCommission}
            disabled={!selectedDeal || calculateCommissionMutation.isPending}
            className="w-full md:w-auto"
          >
            {calculateCommissionMutation.isPending ? "جارٍ الحساب..." : "حساب العمولة"}
          </Button>
        </CardContent>
      </Card>

      {/* قائمة العمولات */}
      <Card>
        <CardHeader>
          <CardTitle>العمولات المحسوبة</CardTitle>
          <CardDescription>
            جميع العمولات المحسوبة من الصفقات
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commissionsLoading ? (
            <div className="text-center py-8">جارٍ التحميل...</div>
          ) : commissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد عمولات محسوبة حتى الآن
            </div>
          ) : (
            <div className="space-y-4">
              {commissions.map((commission) => (
                <div
                  key={commission.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-medium">
                        {commission.client_name || 'عميل غير محدد'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {commission.property_title || 'عقار غير محدد'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        الموظف: {commission.profiles?.first_name} {commission.profiles?.last_name}
                      </p>
                    </div>
                    <Badge variant={getStatusBadge(commission.status).variant}>
                      {getStatusBadge(commission.status).label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">العمولة الإجمالية:</span>
                      <p>{commission.commission_amount.toFixed(2)} د.إ</p>
                    </div>
                    <div>
                      <span className="font-medium">نصيب المكتب:</span>
                      <p>{commission.office_share.toFixed(2)} د.إ</p>
                    </div>
                    <div>
                      <span className="font-medium">نصيب الموظف:</span>
                      <p>{commission.employee_share.toFixed(2)} د.إ</p>
                    </div>
                  </div>

                  {commission.status === 'pending' && (
                    <div className="pt-2">
                      <Button
                        size="sm"
                        onClick={() => approveCommissionMutation.mutate(commission.id)}
                        disabled={approveCommissionMutation.isPending}
                      >
                        {approveCommissionMutation.isPending ? "جارٍ الاعتماد..." : "اعتماد العمولة"}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};