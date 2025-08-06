import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoadingButton } from "@/components/ui/loading-button";
import { AlertTriangle, Info } from "lucide-react";

interface BulkActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  selectedCount: number;
  actionType: "delete" | "edit" | "transfer" | "changeCategory" | "approve" | "reject" | "export";
  onConfirm: (data?: any) => Promise<void>;
  options?: Array<{ value: string; label: string }>;
  loading?: boolean;
}

const BulkActionDialog: React.FC<BulkActionDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  selectedCount,
  actionType,
  onConfirm,
  options = [],
  loading = false
}) => {
  const [formData, setFormData] = useState<any>({});

  const handleConfirm = async () => {
    await onConfirm(formData);
    setFormData({});
  };

  const isDestructive = actionType === "delete" || actionType === "reject";
  const requiresInput = ["transfer", "changeCategory", "edit"].includes(actionType);
  const isExport = actionType === "export";

  const renderFormFields = () => {
    switch (actionType) {
      case "transfer":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="destination">نقل إلى</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, destination: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الوجهة" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="transferReason">سبب النقل</Label>
              <Textarea
                id="transferReason"
                placeholder="اختياري"
                value={formData.transferReason || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, transferReason: e.target.value }))}
              />
            </div>
          </div>
        );

      case "changeCategory":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="newCategory">الفئة الجديدة</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, newCategory: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفئة الجديدة" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "edit":
        return (
          <div className="space-y-4">
            {options.map((field) => (
              <div key={field.value}>
                <Label htmlFor={field.value}>{field.label}</Label>
                <Input
                  id={field.value}
                  value={formData[field.value] || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, [field.value]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isDestructive ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <Info className="h-5 w-5 text-primary" />
            )}
            <DialogTitle>{title}</DialogTitle>
          </div>
          {description && (
            <DialogDescription className="text-right">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span>العناصر المحددة:</span>
            <Badge variant="secondary">{selectedCount} عنصر</Badge>
          </div>

          {requiresInput && renderFormFields()}

          {isDestructive && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive font-medium">
                تحذير: هذه العملية لا يمكن التراجع عنها
              </p>
            </div>
          )}

          {isExport && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
              <p className="text-sm text-primary font-medium">
                سيتم تحميل ملف CSV يحتوي على العناصر المحددة
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            إلغاء
          </Button>
          <LoadingButton
            variant={isDestructive ? "destructive" : "default"}
            onClick={handleConfirm}
            loading={loading}
            disabled={requiresInput && !formData.destination && !formData.newCategory}
          >
            {isExport ? "تحميل الملف" : "تأكيد العملية"}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { BulkActionDialog };