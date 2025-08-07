import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ComplaintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const COMPLAINT_CATEGORIES = [
  { value: "workplace_environment", label: "بيئة العمل" },
  { value: "harassment", label: "تحرش" },
  { value: "discrimination", label: "تمييز" },
  { value: "safety", label: "الأمان والسلامة" },
  { value: "management", label: "الإدارة" },
  { value: "colleagues", label: "الزملاء" },
  { value: "salary_benefits", label: "الراتب والمزايا" },
  { value: "work_conditions", label: "ظروف العمل" },
  { value: "other", label: "أخرى" }
];

const DEPARTMENTS = [
  { value: "hr", label: "الموارد البشرية" },
  { value: "finance", label: "المالية" },
  { value: "sales", label: "المبيعات" },
  { value: "marketing", label: "التسويق" },
  { value: "operations", label: "العمليات" },
  { value: "it", label: "تكنولوجيا المعلومات" },
  { value: "management", label: "الإدارة العليا" },
  { value: "other", label: "أخرى" }
];

const PRIORITY_LEVELS = [
  { value: "low", label: "منخفضة" },
  { value: "medium", label: "متوسطة" },
  { value: "high", label: "عالية" },
  { value: "urgent", label: "عاجلة" }
];

export function ComplaintDialog({ open, onOpenChange, onSuccess }: ComplaintDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    complaint_category: "",
    title: "",
    description: "",
    priority: "medium",
    department: "",
    incident_date: null as Date | null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("employee_complaints")
        .insert({
          employee_id: user.id,
          complaint_category: formData.complaint_category,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          department: formData.department,
          incident_date: formData.incident_date?.toISOString().split('T')[0] || null
        });

      if (error) throw error;

      toast({
        title: "تم تقديم الشكوى",
        description: "تم تقديم شكواك بنجاح وسيتم التحقيق فيها قريباً",
      });

      setFormData({
        complaint_category: "",
        title: "",
        description: "",
        priority: "medium",
        department: "",
        incident_date: null
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating complaint:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تقديم الشكوى",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>شكوى جديدة</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="complaint_category">فئة الشكوى</Label>
            <Select 
              value={formData.complaint_category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, complaint_category: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر فئة الشكوى" />
              </SelectTrigger>
              <SelectContent>
                {COMPLAINT_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">عنوان الشكوى</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="أدخل عنوان الشكوى"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">تفاصيل الشكوى</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="اشرح تفاصيل الشكوى بوضوح"
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">القسم المعني</Label>
            <Select 
              value={formData.department} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر القسم المعني" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept.value} value={dept.value}>
                    {dept.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">الأولوية</Label>
            <Select 
              value={formData.priority} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_LEVELS.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>تاريخ الحادثة (اختياري)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.incident_date ? (
                    format(formData.incident_date, "PPP", { locale: ar })
                  ) : (
                    <span>اختر التاريخ</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.incident_date}
                  onSelect={(date) => setFormData(prev => ({ ...prev, incident_date: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "جارٍ التقديم..." : "تقديم الشكوى"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}