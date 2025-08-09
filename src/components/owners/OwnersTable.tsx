import React from "react";
import { PropertyOwner } from "@/types/owners";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, Phone, MessageCircle, Building, DollarSign, User, Mail, MapPin } from "lucide-react";

interface OwnersTableProps {
  owners: PropertyOwner[];
  onEdit: (owner: PropertyOwner) => void;
  onView: (owner: PropertyOwner) => void;
  onOpenWhatsApp: (phoneNumbers: string[]) => void;
}

export const OwnersTable: React.FC<OwnersTableProps> = ({
  owners,
  onEdit,
  onView,
  onOpenWhatsApp,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPhoneNumbers = (numbers: any) => {
    if (Array.isArray(numbers)) {
      return numbers.join(", ");
    }
    return numbers || "";
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">الإجراءات</TableHead>
            <TableHead className="text-right">اسم المالك</TableHead>
            <TableHead className="text-right">النوع</TableHead>
            <TableHead className="text-right">رقم الهاتف</TableHead>
            <TableHead className="text-right">البريد الإلكتروني</TableHead>
            <TableHead className="text-right">العنوان</TableHead>
            <TableHead className="text-right">عدد العقارات</TableHead>
            <TableHead className="text-right">قيمة العقارات</TableHead>
            <TableHead className="text-right">الموظف المسؤول</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {owners.map((owner) => (
            <TableRow key={owner.id}>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(owner)}
                    title="عرض التفاصيل"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(owner)}
                    title="تعديل"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {Array.isArray(owner.mobile_numbers) && owner.mobile_numbers.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenWhatsApp(owner.mobile_numbers)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      title="إرسال رسالة واتساب"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <div className="font-medium text-right">{owner.full_name}</div>
                {owner.nationality && (
                  <div className="text-sm text-muted-foreground text-right">
                    {owner.nationality}
                  </div>
                )}
              </TableCell>
              
              <TableCell>
                <Badge variant={owner.owner_type === "individual" ? "default" : "secondary"}>
                  {owner.owner_type === "individual" ? "فرد" : "شركة"}
                </Badge>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2 text-right" dir="rtl">
                  <Phone className="h-4 w-4" />
                  <span>{formatPhoneNumbers(owner.mobile_numbers)}</span>
                </div>
              </TableCell>
              
              <TableCell>
                {owner.email && (
                  <div className="flex items-center gap-2 text-right" dir="rtl">
                    <Mail className="h-4 w-4" />
                    <span>{owner.email}</span>
                  </div>
                )}
              </TableCell>
              
              <TableCell>
                {owner.address && (
                  <div className="flex items-center gap-2 text-right max-w-xs" dir="rtl">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{owner.address}</span>
                  </div>
                )}
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2 justify-end">
                  <Building className="h-4 w-4 text-primary" />
                  <span className="font-medium">{owner.total_properties_count || 0}</span>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2 justify-end">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="font-medium">
                    {owner.total_properties_value > 0 
                      ? formatCurrency(owner.total_properties_value)
                      : "0 د.إ"
                    }
                  </span>
                </div>
              </TableCell>
              
              <TableCell>
                {owner.assigned_employee_profile && (
                  <div className="flex items-center gap-2 text-right">
                    <User className="h-4 w-4" />
                    <span className="text-sm">
                      {owner.assigned_employee_profile.first_name} {owner.assigned_employee_profile.last_name}
                    </span>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {owners.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          لا توجد بيانات للعرض
        </div>
      )}
    </div>
  );
};