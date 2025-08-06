import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, DollarSign, Calendar, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface Debt {
  id: string;
  debtor_name: string;
  amount: number;
  description: string;
  due_date: string;
  priority_level: number;
  debt_category: string;
}

interface Employee {
  employee_id: string;
  calculated_share: number;
  first_name: string;
  last_name: string;
}

interface CommissionDebtDeductionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  onDeductionDecision: (deductionDecisions: any[]) => void;
}

interface DeductionDecision {
  employee_id: string;
  debt_id: string;
  action: 'deduct' | 'defer';
  deduction_amount?: number;
  defer_reason?: string;
}

const CommissionDebtDeductionDialog: React.FC<CommissionDebtDeductionDialogProps> = ({
  open,
  onOpenChange,
  employees,
  onDeductionDecision
}) => {
  const [deductionDecisions, setDeductionDecisions] = useState<{ [key: string]: DeductionDecision[] }>({});
  const [deferReasons, setDeferReasons] = useState<{ [key: string]: string }>({});

  // Fetch debts for each employee
  const { data: employeeDebts, isLoading } = useQuery({
    queryKey: ['employee-debts-for-deduction', employees.map(e => e.employee_id)],
    queryFn: async () => {
      if (employees.length === 0) return {};
      
      const employeeIds = employees.map(e => e.employee_id);
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .in('debtor_id', employeeIds)
        .eq('status', 'pending')
        .eq('auto_deduct_from_commission', true)
        .order('priority_level', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group debts by employee
      const grouped: { [key: string]: Debt[] } = {};
      data.forEach(debt => {
        if (!grouped[debt.debtor_id]) {
          grouped[debt.debtor_id] = [];
        }
        grouped[debt.debtor_id].push(debt);
      });

      return grouped;
    },
    enabled: open && employees.length > 0
  });

  // Process deduction decisions
  const processDeductionsMutation = useMutation({
    mutationFn: async (decisions: DeductionDecision[]) => {
      const { data, error } = await supabase.rpc('process_commission_debt_deduction_decisions', {
        p_decisions: JSON.stringify(decisions)
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "تم معالجة قرارات الخصم",
        description: "تم تطبيق قراراتك بنجاح",
      });
      onDeductionDecision(Object.values(deductionDecisions).flat());
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في معالجة الخصم",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleDeductionChange = (employeeId: string, debtId: string, action: 'deduct' | 'defer', amount?: number) => {
    setDeductionDecisions(prev => {
      const newDecisions = { ...prev };
      if (!newDecisions[employeeId]) {
        newDecisions[employeeId] = [];
      }
      
      // Remove existing decision for this debt
      newDecisions[employeeId] = newDecisions[employeeId].filter(d => d.debt_id !== debtId);
      
      // Add new decision
      const decision: DeductionDecision = {
        employee_id: employeeId,
        debt_id: debtId,
        action,
        deduction_amount: amount,
        defer_reason: action === 'defer' ? deferReasons[`${employeeId}-${debtId}`] : undefined
      };
      
      newDecisions[employeeId].push(decision);
      
      return newDecisions;
    });
  };

  const handleConfirmDecisions = () => {
    const allDecisions = Object.values(deductionDecisions).flat();
    processDeductionsMutation.mutate(allDecisions);
  };

  const getEmployeeData = (employeeId: string) => {
    return employees.find(e => e.employee_id === employeeId);
  };

  const getTotalDebtsForEmployee = (employeeId: string) => {
    return employeeDebts?.[employeeId]?.reduce((sum, debt) => sum + debt.amount, 0) || 0;
  };

  const hasDebts = employeeDebts && Object.keys(employeeDebts).length > 0;

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              جاري تحميل المديونيات...
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            قرار خصم المديونيات من العمولات
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            يوجد مديونيات على بعض الموظفين. اختر ما إذا كنت تريد خصمها من العمولة أم تأجيلها
          </p>
        </DialogHeader>

        {!hasDebts ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">لا توجد مديونيات قابلة للخصم على الموظفين المحددين</p>
            <Button onClick={() => onOpenChange(false)} className="mt-4">
              إغلاق
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(employeeDebts || {}).map(([employeeId, debts]) => {
              const employeeData = getEmployeeData(employeeId);
              const totalDebts = getTotalDebtsForEmployee(employeeId);
              
              return (
                <Card key={employeeId} className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{employeeData?.first_name} {employeeData?.last_name}</span>
                        <Badge variant="secondary">
                          العمولة: {employeeData?.calculated_share} د.إ
                        </Badge>
                      </div>
                      <Badge variant="destructive">
                        إجمالي المديونيات: {totalDebts} د.إ
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {debts.map((debt) => (
                      <Card key={debt.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="space-y-1">
                              <h4 className="font-medium">{debt.description}</h4>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {debt.amount} د.إ
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(debt.due_date).toLocaleDateString('ar-EG')}
                                </span>
                                <Badge 
                                  variant={debt.priority_level > 3 ? "destructive" : debt.priority_level > 1 ? "default" : "secondary"}
                                >
                                  أولوية {debt.priority_level}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <Separator className="my-3" />

                          <div className="space-y-3">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <Checkbox
                                id={`deduct-${debt.id}`}
                                checked={deductionDecisions[employeeId]?.some(d => d.debt_id === debt.id && d.action === 'deduct')}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    handleDeductionChange(employeeId, debt.id, 'deduct', Math.min(debt.amount, employeeData?.calculated_share || 0));
                                  }
                                }}
                              />
                              <label htmlFor={`deduct-${debt.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                خصم من العمولة ({Math.min(debt.amount, employeeData?.calculated_share || 0)} د.إ)
                              </label>
                            </div>

                            <div className="flex items-start space-x-2 space-x-reverse">
                              <Checkbox
                                id={`defer-${debt.id}`}
                                checked={deductionDecisions[employeeId]?.some(d => d.debt_id === debt.id && d.action === 'defer')}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    handleDeductionChange(employeeId, debt.id, 'defer');
                                  }
                                }}
                              />
                              <div className="grid gap-1.5 leading-none">
                                <label htmlFor={`defer-${debt.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                  تأجيل الخصم للشهر القادم
                                </label>
                                {deductionDecisions[employeeId]?.some(d => d.debt_id === debt.id && d.action === 'defer') && (
                                  <Textarea
                                    placeholder="سبب التأجيل (اختياري)"
                                    value={deferReasons[`${employeeId}-${debt.id}`] || ''}
                                    onChange={(e) => setDeferReasons(prev => ({
                                      ...prev,
                                      [`${employeeId}-${debt.id}`]: e.target.value
                                    }))}
                                    className="mt-2"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              );
            })}

            <Separator />

            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                إلغاء
              </Button>
              <Button 
                onClick={handleConfirmDecisions}
                disabled={processDeductionsMutation.isPending}
              >
                {processDeductionsMutation.isPending ? "جاري المعالجة..." : "تأكيد القرارات"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CommissionDebtDeductionDialog;