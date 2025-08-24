import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { contactSyncService } from "@/services/contactSyncService";

interface OwnerFormProps {
  owner?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface Employee {
  user_id: string;
  first_name: string;
  last_name: string;
}

export const OwnerForm = ({ owner, onSuccess, onCancel }: OwnerFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [mobileNumbers, setMobileNumbers] = useState<string[]>(
    owner?.mobile_numbers || [""]
  );

  const [formData, setFormData] = useState({
    full_name: owner?.full_name || "",
    owner_type: owner?.owner_type || "individual",
    address: owner?.address || "",
    internal_notes: owner?.internal_notes || "",
    email: owner?.email || "",
    nationality: owner?.nationality || "",
    id_number: owner?.id_number || "",
    assigned_employee: owner?.assigned_employee || "",
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name")
        .eq("is_active", true)
        .order("first_name");

      setEmployees(data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const addMobileNumber = () => {
    setMobileNumbers([...mobileNumbers, ""]);
  };

  const removeMobileNumber = (index: number) => {
    if (mobileNumbers.length > 1) {
      setMobileNumbers(mobileNumbers.filter((_, i) => i !== index));
    }
  };

  const updateMobileNumber = (index: number, value: string) => {
    const updated = [...mobileNumbers];
    updated[index] = value;
    setMobileNumbers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Filter out empty mobile numbers
      const validMobileNumbers = mobileNumbers.filter(num => num.trim());

      if (validMobileNumbers.length === 0) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "يجب إدخال رقم هاتف واحد على الأقل",
        });
        setLoading(false);
        return;
      }

      const ownerData = {
        ...formData,
        mobile_numbers: validMobileNumbers,
        created_by: user?.id,
        assigned_employee: formData.assigned_employee || user?.id,
      };

      let result;
      if (owner?.id) {
        // Update existing owner
        result = await supabase
          .from("property_owners")
          .update(ownerData)
          .eq("id", owner.id)
          .select()
          .single();
      } else {
        // Create new owner
        result = await supabase
          .from("property_owners")
          .insert([ownerData])
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      // مزامنة مع WhatsApp
      try {
        if (result.data) {
          const ownerContact = {
            id: result.data.id,
            name: result.data.full_name,
            phone: result.data.mobile_numbers[0], // أول رقم هاتف
            email: result.data.email,
            whatsapp_number: result.data.mobile_numbers[0],
            id_number: result.data.id_number,
            notes: result.data.internal_notes
          };
          
          await contactSyncService.syncOwnerToWhatsApp(ownerContact);
          
          toast({
            title: "نجح الحفظ",
            description: owner?.id ? "تم تحديث بيانات المالك ومزامنته مع WhatsApp" : "تم إضافة المالك ومزامنته مع WhatsApp",
          });
        }
      } catch (syncError) {
        toast({
          title: "نجح الحفظ",
          description: owner?.id ? "تم تحديث بيانات المالك (فشل في المزامنة مع WhatsApp)" : "تم إضافة المالك (فشل في المزامنة مع WhatsApp)",
        });
      }

      onSuccess?.();
    } catch (error: any) {
      console.error("Error saving owner:", error);
      toast({
        variant: "destructive",
        title: "خطأ في الحفظ",
        description: error.message || "حدث خطأ أثناء حفظ البيانات",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-right">
          {owner?.id ? "تعديل بيانات المالك" : "إضافة مالك جديد"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-right block">
                اسم المالك الكامل *
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                className="text-right"
                required
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner_type" className="text-right block">
                نوع المالك *
              </Label>
              <Select
                value={formData.owner_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, owner_type: value })
                }
              >
                <SelectTrigger className="text-right" dir="rtl">
                  <SelectValue placeholder="اختر نوع المالك" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">فرد</SelectItem>
                  <SelectItem value="company">شركة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mobile Numbers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Button
                type="button"
                onClick={addMobileNumber}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                إضافة رقم هاتف
              </Button>
              <Label className="text-right">أرقام الهاتف *</Label>
            </div>
            {mobileNumbers.map((number, index) => (
              <div key={index} className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => removeMobileNumber(index)}
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0"
                  disabled={mobileNumbers.length === 1}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Input
                  value={number}
                  onChange={(e) => updateMobileNumber(index, e.target.value)}
                  placeholder="رقم الهاتف"
                  className="text-right"
                  dir="rtl"
                  required={index === 0}
                />
              </div>
            ))}
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-right block">
                البريد الإلكتروني
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="text-right"
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationality" className="text-right block">
                الجنسية
              </Label>
              <Input
                id="nationality"
                value={formData.nationality}
                onChange={(e) =>
                  setFormData({ ...formData, nationality: e.target.value })
                }
                className="text-right"
                dir="rtl"
              />
            </div>
          </div>

          {/* ID and Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="id_number" className="text-right block">
                رقم الهوية / سجل تجاري
              </Label>
              <Input
                id="id_number"
                value={formData.id_number}
                onChange={(e) =>
                  setFormData({ ...formData, id_number: e.target.value })
                }
                className="text-right"
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_employee" className="text-right block">
                الموظف المسؤول
              </Label>
              <Select
                value={formData.assigned_employee}
                onValueChange={(value) =>
                  setFormData({ ...formData, assigned_employee: value })
                }
              >
                <SelectTrigger className="text-right" dir="rtl">
                  <SelectValue placeholder="اختر الموظف المسؤول" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.user_id} value={employee.user_id}>
                      {employee.first_name} {employee.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-right block">
              العنوان
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="text-right"
              dir="rtl"
              rows={3}
            />
          </div>

          {/* Internal Notes */}
          <div className="space-y-2">
            <Label htmlFor="internal_notes" className="text-right block">
              ملاحظات داخلية
            </Label>
            <Textarea
              id="internal_notes"
              value={formData.internal_notes}
              onChange={(e) =>
                setFormData({ ...formData, internal_notes: e.target.value })
              }
              className="text-right"
              dir="rtl"
              rows={4}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                إلغاء
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {owner?.id ? "تحديث البيانات" : "حفظ البيانات"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};