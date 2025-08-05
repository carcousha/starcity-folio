import { useRoleAccess } from "@/hooks/useRoleAccess";
import { AlertTriangle } from "lucide-react";
import CommissionManagementNew from "@/components/CommissionManagementNew";

const Commissions = () => {
  const { checkPermission } = useRoleAccess();

  if (!checkPermission('canManageCommissions')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">غير مصرح</h1>
          <p className="text-muted-foreground">لا تملك الصلاحية لإدارة العمولات</p>
        </div>
      </div>
    );
  }

  return <CommissionManagementNew />;
};

export default Commissions;