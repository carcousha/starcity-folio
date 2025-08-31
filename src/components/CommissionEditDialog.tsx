import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Save, X } from "lucide-react";

interface Commission {
  id: string;
  client_name: string;
  total_commission: number;
  office_share: number;
  remaining_for_employees: number;
  status: string;
  distribution_type: string;
  notes: string;
  amount: number;
  percentage: number;
}

interface CommissionEditDialogProps {
  commission: Commission | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCommission: Partial<Commission>) => void;
}

const CommissionEditDialog = ({ commission, isOpen, onClose, onSave }: CommissionEditDialogProps) => {
  const [formData, setFormData] = useState({
    client_name: '',
    amount: 0,
    percentage: 0,
    total_commission: 0,
    distribution_type: 'equal' as 'equal' | 'custom',
    notes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (commission) {
      setFormData({
        client_name: commission.client_name || '',
        amount: commission.amount || 0,
        percentage: commission.percentage || 0,
        total_commission: commission.total_commission || 0,
        distribution_type: commission.distribution_type as 'equal' | 'custom' || 'equal',
        notes: commission.notes || ''
      });
    }
  }, [commission]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_name) {
      toast({
        title: "خطأ",
        description: "اسم العميل مطلوب",
        variant: "destructive",
      });
      return;
    }

    if (formData.amount <= 0) {
      toast({
        title: "خطأ",
        description: "مبلغ الصفقة يجب أن يكون أكبر من صفر",
        variant: "destructive",
      });
      return;
    }

    if (formData.percentage <= 0) {
      toast({
        title: "خطأ",
        description: "نسبة العمولة يجب أن تكون أكبر من صفر",
        variant: "destructive",
      });
      return;
    }

    // Calculate new commission amounts
    const newTotalCommission = (formData.amount * formData.percentage) / 100;
    const newOfficeShare = newTotalCommission * 0.5;
    const newEmployeeShare = newTotalCommission * 0.5;

    const updatedCommission = {
      ...formData,
      total_commission: newTotalCommission,
      office_share: newOfficeShare,
      remaining_for_employees: newEmployeeShare
    };

    onSave(updatedCommission);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-calculate commission when amount or percentage changes
    if (field === 'amount' || field === 'percentage') {
      const amount = field === 'amount' ? parseFloat(value) || 0 : formData.amount;
      const percentage = field === 'percentage' ? parseFloat(value) || 0 : formData.percentage;
      const newTotal = (amount * percentage) / 100;
      
      setFormData(prev => ({
        ...prev,
        [field]: field === 'amount' || field === 'percentage' ? parseFloat(value) || 0 : value,
        total_commission: newTotal
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            تعديل العمولة
          </DialogTitle>
          <DialogDescription>
            قم بتعديل بيانات العمولة المحددة
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client_name">اسم العميل *</Label>
            <Input
              id="client_name"
              value={formData.client_name}
              onChange={(e) => handleInputChange('client_name', e.target.value)}
              placeholder="أدخل اسم العميل"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">مبلغ الصفقة *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="percentage">نسبة العمولة % *</Label>
              <Input
                id="percentage"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.percentage}
                onChange={(e) => handleInputChange('percentage', e.target.value)}
                placeholder="2.5"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_commission">إجمالي العمولة</Label>
            <Input
              id="total_commission"
              type="number"
              value={formData.total_commission.toFixed(2)}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              يتم حساب هذا المبلغ تلقائياً (مبلغ الصفقة × نسبة العمولة)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="distribution_type">نوع التوزيع</Label>
            <Select
              value={formData.distribution_type}
              onValueChange={(value) => handleInputChange('distribution_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equal">توزيع متساوي</SelectItem>
                <SelectItem value="custom">نسب مخصصة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="أدخل أي ملاحظات إضافية"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              حفظ التغييرات
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CommissionEditDialog;