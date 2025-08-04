import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "./usePermissions";

export type UserRole = "admin" | "accountant" | "employee";

const permissionMap = {
  crmAccess: { module: "crm", action: "access" },
  canViewAllClients: { module: "clients", action: "view_all" },
  canManageClients: { module: "clients", action: "manage" },
  canViewAllDeals: { module: "deals", action: "view_all" },
  canManageDeals: { module: "deals", action: "manage" },
  canViewAllProperties: { module: "properties", action: "view_all" },
  canManageProperties: { module: "properties", action: "manage" },
  canViewFinancials: { module: "financials", action: "view" },
  canManageExpenses: { module: "expenses", action: "manage" },
  canManageRevenues: { module: "revenues", action: "manage" },
  canManageCommissions: { module: "commissions", action: "manage" },
  canManageDebts: { module: "debts", action: "manage" },
  canViewTreasury: { module: "treasury", action: "view" },
  canManageTreasury: { module: "treasury", action: "manage" },
  canViewAllStaff: { module: "staff", action: "view_all" },
  canManageStaff: { module: "staff", action: "manage" },
  canViewAllCommissions: { module: "commissions", action: "view_all" },
  canManageRoles: { module: "roles", action: "manage" },
  canViewAllVehicles: { module: "vehicles", action: "view_all" },
  canManageVehicles: { module: "vehicles", action: "manage" },
  canViewAllReports: { module: "reports", action: "view_all" },
  canExportReports: { module: "reports", action: "export" },
  canViewActivityLogs: { module: "activity_logs", action: "view" },
} as const;

export type PermissionKey = keyof typeof permissionMap;

export const useRoleAccess = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { permissions, checkPermission: serverCheckPermission } = usePermissions();

  const userRole = profile?.role as UserRole;

  const checkPermission = (permission: PermissionKey): boolean => {
    const mapping = permissionMap[permission];
    const perm = permissions.find(
      (p) =>
        p.module_name === mapping.module &&
        p.action_type === mapping.action &&
        p.is_active
    );

    if (!perm) return false;

    if (userRole && perm.allowed_roles.includes(userRole)) return true;

    if (profile?.user_id && perm.allowed_users.includes(profile.user_id)) return true;

    return false;
  };

  const requirePermission = async (
    permission: PermissionKey,
    redirectPath = "/"
  ) => {
    if (!profile) {
      toast({
        title: "غير مصرح",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      navigate("/auth");
      return false;
    }

    const mapping = permissionMap[permission];

    try {
      const hasPermission = await serverCheckPermission(
        mapping.module,
        mapping.action
      );

      if (!hasPermission) {
        toast({
          title: "غير مصرح",
          description: "لا تملك الصلاحية المطلوبة لهذا الإجراء",
          variant: "destructive",
        });
        navigate(redirectPath);
        return false;
      }

      if (!checkPermission(permission)) {
        toast({
          title: "غير مصرح",
          description: "لا تملك الصلاحية المطلوبة لهذا الإجراء",
          variant: "destructive",
        });
        navigate(redirectPath);
        return false;
      }
    } catch (error) {
      console.error("Permission validation error:", error);
      toast({
        title: "خطأ أمني",
        description: "فشل في التحقق من الصلاحيات",
        variant: "destructive",
      });
      navigate(redirectPath);
      return false;
    }

    return true;
  };

  const isAdmin = userRole === "admin";
  const isAccountant = userRole === "accountant";
  const isEmployee = userRole === "employee";

  return {
    userRole,
    checkPermission,
    requirePermission,
    isAdmin,
    isAccountant,
    isEmployee,
  };
};

