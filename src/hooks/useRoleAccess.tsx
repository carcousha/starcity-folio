import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export type UserRole = "admin" | "accountant" | "employee";

// نظام صلاحيات مبسط يعتمد على الأدوار مباشرة
export type PermissionKey = 
  | 'crmAccess' | 'canViewAllClients' | 'canManageClients' | 'canViewAllDeals' | 'canManageDeals'
  | 'canViewAllProperties' | 'canManageProperties' | 'canViewFinancials' | 'canManageExpenses'
  | 'canManageRevenues' | 'canManageCommissions' | 'canManageDebts' | 'canViewTreasury'
  | 'canManageTreasury' | 'canViewAllStaff' | 'canManageStaff' | 'canViewAllCommissions'
  | 'canManageRoles' | 'canViewAllVehicles' | 'canManageVehicles' | 'canViewAllReports'
  | 'canExportReports' | 'canViewActivityLogs';

const rolePermissions: Record<UserRole, PermissionKey[]> = {
  admin: [
    'crmAccess', 'canViewAllClients', 'canManageClients', 'canViewAllDeals', 'canManageDeals',
    'canViewAllProperties', 'canManageProperties', 'canViewFinancials', 'canManageExpenses',
    'canManageRevenues', 'canManageCommissions', 'canManageDebts', 'canViewTreasury',
    'canManageTreasury', 'canViewAllStaff', 'canManageStaff', 'canViewAllCommissions',
    'canManageRoles', 'canViewAllVehicles', 'canManageVehicles', 'canViewAllReports',
    'canExportReports', 'canViewActivityLogs'
  ],
  accountant: [
    'crmAccess', 'canViewAllClients', 'canManageClients', 'canViewAllDeals', 'canManageDeals',
    'canViewFinancials', 'canManageExpenses', 'canManageRevenues', 'canManageCommissions',
    'canManageDebts', 'canViewTreasury', 'canManageTreasury', 'canViewAllCommissions',
    'canViewAllReports', 'canExportReports'
  ],
  employee: [
    'crmAccess', 'canViewAllClients', 'canManageClients', 'canViewAllDeals', 'canManageDeals',
    'canViewActivityLogs'
  ]
};

export const useRoleAccess = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const userRole = profile?.role as UserRole;

  const checkPermission = (permission: PermissionKey): boolean => {
    if (!userRole) return false;
    
    // نظام صلاحيات مبسط يعتمد على الأدوار مباشرة
    return rolePermissions[userRole]?.includes(permission) || false;
  };

  const requirePermission = async (
    permission: PermissionKey,
    redirectPath = "/"
  ) => {
    if (!profile) {
      console.log('No profile found, redirecting to auth');
      toast({
        title: "غير مصرح",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      navigate("/auth");
      return false;
    }

    if (!checkPermission(permission)) {
      console.log('Permission check failed for:', permission);
      toast({
        title: "غير مصرح",
        description: "لا تملك الصلاحية المطلوبة لهذا الإجراء",
        variant: "destructive",
      });
      navigate(redirectPath);
      return false;
    }

    return true;
  };

  const isAdmin = userRole === "admin";
  const isAccountant = userRole === "accountant" || userRole === "admin";
  const isEmployee = userRole === "employee" || userRole === "accountant" || userRole === "admin";

  return {
    userRole,
    checkPermission,
    requirePermission,
    isAdmin,
    isAccountant,
    isEmployee,
  };
};

