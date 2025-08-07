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

interface RequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const REQUEST_TYPES = [
  { value: "leave", label: "إجازة" },
  { value: "training", label: "تدريب" },
  { value: "equipment", label: "معدات" },
  { value: "salary_advance", label: "سلفة راتب" },
  { value: "overtime", label: "ساعات إضافية" },
  { value: "transfer", label: "نقل" },
  { value: "promotion", label: "ترقية" },
  { value: "other", label: "أخرى" }
];

const PRIORITY_LEVELS = [
  { value: "low", label: "منخفضة" },
  { value: "medium", label: "متوسطة" },
  { value: "high", label: "عالية" },
  { value: "urgent", label: "عاجلة" }
];

export function RequestDialog({ open, onOpenChange, onSuccess }: RequestDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    request_type: "",
    title: "",
    description: "",
    priority: "medium",
    requested_date: null as Date | null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("employee_requests")
        .insert({
          employee_id: user.id,
          request_type: formData.request_type,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          requested_date: formData.requested_date?.toISOString().split('T')[0] || null
        });

      if (error) throw error;

      toast({
        title: "تم إرسال الطلب",
        description: "تم تقديم طلبك بنجاح وسيتم مراجعته قريباً",
      });

      setFormData({
        request_type: "",
        title: "",
        description: "",
        priority: "medium",
        requested_date: null
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating request:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال الطلب",
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
          <DialogTitle>طلب إداري جديد</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="request_type">نوع الطلب</Label>
            <Select 
              value={formData.request_type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, request_type: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع الطلب" />
              </SelectTrigger>
              <SelectContent>
                {REQUEST_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">عنوان الطلب</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="أدخل عنوان الطلب"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">تفاصيل الطلب</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="اشرح تفاصيل طلبك"
              rows={4}
            />
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
            <Label>التاريخ المطلوب (اختياري)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.requested_date ? (
                    format(formData.requested_date, "PPP", { locale: ar })
                  ) : (
                    <span>اختر التاريخ</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.requested_date}
                  onSelect={(date) => setFormData(prev => ({ ...prev, requested_date: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "جارٍ الإرسال..." : "إرسال الطلب"}
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