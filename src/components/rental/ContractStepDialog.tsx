import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar, DollarSign, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ContractStepDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  tenantName: string;
  onContractCreated: () => void;
}

interface ContractFormData {
  unit_number: string;
  contract_type: string;
  contract_start_date: string;
  contract_end_date: string;
  rent_amount: number;
  security_deposit: number;
  payment_method: string;
  installment_frequency: string;
  installments_count: number;
}

export function ContractStepDialog({ 
  open, 
  onOpenChange, 
  tenantId, 
  tenantName, 
  onContractCreated 
}: ContractStepDialogProps) {
  const [formData, setFormData] = useState<ContractFormData>({
    unit_number: '',
    contract_type: 'سكني',
    contract_start_date: '',
    contract_end_date: '',
    rent_amount: 0,
    security_deposit: 0,
    payment_method: 'شيك',
    installment_frequency: 'سنوي',
    installments_count: 1
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.unit_number || !formData.contract_start_date || !formData.contract_end_date || !formData.rent_amount) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('المستخدم غير مسجل');

      // توليد رقم العقد
      const contractNumber = `CON-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

      // حساب مدة العقد بالأشهر
      const startDate = new Date(formData.contract_start_date);
      const endDate = new Date(formData.contract_end_date);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));

      // إنشاء العقد
      const { data: contract, error: contractError } = await supabase
        .from('rental_contracts')
        .insert({
          contract_number: contractNumber,
          tenant_id: tenantId,
          unit_type: formData.contract_type,
          start_date: formData.contract_start_date,
          end_date: formData.contract_end_date,
          rent_amount: formData.rent_amount,
          security_deposit: formData.security_deposit,
          payment_method: formData.payment_method,
          installment_frequency: formData.installment_frequency,
          installments_count: formData.installments_count,
          contract_duration_months: diffMonths,
          unit_number: formData.unit_number,
          created_by: user.id
        })
        .select()
        .single();

      if (contractError) throw contractError;

      // تحديث بيانات المستأجر
      const { error: tenantError } = await supabase
        .from('rental_tenants')
        .update({
          unit_number: formData.unit_number,
          contract_start_date: formData.contract_start_date,
          contract_end_date: formData.contract_end_date,
          rent_value: formData.rent_amount,
          security_deposit: formData.security_deposit,
          contract_type: formData.contract_type,
          contract_duration: diffMonths,
          payment_method: formData.payment_method,
          installment_frequency: formData.installment_frequency,
          installments_count: formData.installments_count,
          status: 'active'
        })
        .eq('id', tenantId);

      if (tenantError) throw tenantError;

      toast({
        title: "تم إنشاء العقد بنجاح",
        description: `تم إنشاء العقد رقم ${contractNumber} وترحيل المعاملة الحكومية تلقائياً`,
      });

      onContractCreated();
      onOpenChange(false);
      
      // إعادة تعيين النموذج
      setFormData({
        unit_number: '',
        contract_type: 'سكني',
        contract_start_date: '',
        contract_end_date: '',
        rent_amount: 0,
        security_deposit: 0,
        payment_method: 'شيك',
        installment_frequency: 'سنوي',
        installments_count: 1
      });

    } catch (error: any) {
      console.error('Error creating contract:', error);
      toast({
        title: "خطأ في إنشاء العقد",
        description: error.message || "حدث خطأ أثناء إنشاء العقد",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            إنشاء عقد إيجار للمستأجر: {tenantName}
          </DialogTitle>
          <DialogDescription>
            أدخل بيانات العقد وسيتم إنشاء المعاملة الحكومية تلقائياً
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* بيانات الوحدة والعقد */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">بيانات الوحدة والعقد</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit_number">رقم الوحدة / العقار*</Label>
                  <Input
                    id="unit_number"
                    value={formData.unit_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit_number: e.target.value }))}
                    placeholder="مثال: شقة 101، فيلا A5"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contract_type">نوع العقد*</Label>
                  <Select value={formData.contract_type} onValueChange={(value) => setFormData(prev => ({ ...prev, contract_type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع العقد" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="سكني">سكني</SelectItem>
                      <SelectItem value="تجاري">تجاري</SelectItem>
                      <SelectItem value="فيلا">فيلا</SelectItem>
                      <SelectItem value="مكتب">مكتب</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* تواريخ العقد */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                تواريخ العقد
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contract_start_date">تاريخ بداية العقد*</Label>
                  <Input
                    id="contract_start_date"
                    type="date"
                    value={formData.contract_start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, contract_start_date: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contract_end_date">تاريخ نهاية العقد*</Label>
                  <Input
                    id="contract_end_date"
                    type="date"
                    value={formData.contract_end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, contract_end_date: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* التفاصيل المالية */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                التفاصيل المالية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rent_amount">قيمة الإيجار (د.إ)*</Label>
                  <Input
                    id="rent_amount"
                    type="number"
                    value={formData.rent_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, rent_amount: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="security_deposit">مبلغ التأمين (د.إ)</Label>
                  <Input
                    id="security_deposit"
                    type="number"
                    value={formData.security_deposit}
                    onChange={(e) => setFormData(prev => ({ ...prev, security_deposit: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_method">طريقة الدفع*</Label>
                  <Select value={formData.payment_method} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر طريقة الدفع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="شيك">شيك</SelectItem>
                      <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                      <SelectItem value="نقدي">نقدي</SelectItem>
                      <SelectItem value="بطاقة">بطاقة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="installment_frequency">تردد الدفع</Label>
                  <Select value={formData.installment_frequency} onValueChange={(value) => setFormData(prev => ({ ...prev, installment_frequency: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر تردد الدفع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="شهري">شهري</SelectItem>
                      <SelectItem value="ربع سنوي">ربع سنوي</SelectItem>
                      <SelectItem value="نصف سنوي">نصف سنوي</SelectItem>
                      <SelectItem value="سنوي">سنوي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="installments_count">عدد الدفعات</Label>
                  <Input
                    id="installments_count"
                    type="number"
                    value={formData.installments_count}
                    onChange={(e) => setFormData(prev => ({ ...prev, installments_count: parseInt(e.target.value) || 1 }))}
                    placeholder="1"
                    min="1"
                    max="12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* تنبيه مهم */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 mb-2">ماذا سيحدث بعد إنشاء العقد:</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• سيتم إنشاء المعاملة الحكومية تلقائياً في نظام الخدمات الحكومية</li>
                    <li>• ستبدأ المعاملة بمرحلة "صرف صحي" كأول خطوة</li>
                    <li>• سيتم توليد رقم مرجعي تلقائي (AJM-2024-XXX)</li>
                    <li>• يمكن متابعة تقدم المعاملة من صفحة الخدمات الحكومية</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "جارٍ إنشاء العقد..." : "إنشاء العقد والمعاملة الحكومية"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}