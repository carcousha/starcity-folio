import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'accountant' | 'employee';

export interface RolePermissions {
  // CRM Permissions
  crmAccess: boolean;
  canViewAllClients: boolean;
  canManageClients: boolean;
  canViewAllDeals: boolean;
  canManageDeals: boolean;
  canViewAllProperties: boolean;
  canManageProperties: boolean;
  
  // Accounting Permissions
  canViewFinancials: boolean;
  canManageExpenses: boolean;
  canManageRevenues: boolean;
  canManageCommissions: boolean;
  canManageDebts: boolean;
  canViewTreasury: boolean;
  canManageTreasury: boolean;
  
  // Staff Permissions
  canViewAllStaff: boolean;
  canManageStaff: boolean;
  canViewAllCommissions: boolean;
  canManageRoles: boolean;
  
  // Vehicle Permissions
  canViewAllVehicles: boolean;
  canManageVehicles: boolean;
  
  // Reports Permissions
  canViewAllReports: boolean;
  canExportReports: boolean;
  
  // Activity Log Permissions
  canViewActivityLogs: boolean;
}

const rolePermissions: Record<UserRole, RolePermissions> = {
  admin: {
    // Full access to everything
    crmAccess: true,
    canViewAllClients: true,
    canManageClients: true,
    canViewAllDeals: true,
    canManageDeals: true,
    canViewAllProperties: true,
    canManageProperties: true,
    canViewFinancials: true,
    canManageExpenses: true,
    canManageRevenues: true,
    canManageCommissions: true,
    canManageDebts: true,
    canViewTreasury: true,
    canManageTreasury: true,
    canViewAllStaff: true,
    canManageStaff: true,
    canViewAllCommissions: true,
    canManageRoles: true,
    canViewAllVehicles: true,
    canManageVehicles: true,
    canViewAllReports: true,
    canExportReports: true,
    canViewActivityLogs: true,
  },
  accountant: {
    // Financial modules only
    crmAccess: true,
    canViewAllClients: false,
    canManageClients: false,
    canViewAllDeals: false,
    canManageDeals: false,
    canViewAllProperties: false,
    canManageProperties: false,
    canViewFinancials: true,
    canManageExpenses: true,
    canManageRevenues: true,
    canManageCommissions: true,
    canManageDebts: true,
    canViewTreasury: true,
    canManageTreasury: true,
    canViewAllStaff: false,
    canManageStaff: false,
    canViewAllCommissions: true,
    canManageRoles: false,
    canViewAllVehicles: true,
    canManageVehicles: true,
    canViewAllReports: true,
    canExportReports: true,
    canViewActivityLogs: true,
  },
  employee: {
    // Limited access to own data only
    crmAccess: true,
    canViewAllClients: false,
    canManageClients: false,
    canViewAllDeals: false,
    canManageDeals: false,
    canViewAllProperties: false,
    canManageProperties: false,
    canViewFinancials: false,
    canManageExpenses: false,
    canManageRevenues: false,
    canManageCommissions: false,
    canManageDebts: false,
    canViewTreasury: false,
    canManageTreasury: false,
    canViewAllStaff: false,
    canManageStaff: false,
    canViewAllCommissions: false,
    canManageRoles: false,
    canViewAllVehicles: false,
    canManageVehicles: false,
    canViewAllReports: false,
    canExportReports: false,
    canViewActivityLogs: true, // السماح للموظفين برؤية سجل النشاطات
  },
};

export const useRoleAccess = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const userRole = profile?.role as UserRole;
  const permissions = userRole ? rolePermissions[userRole] : rolePermissions.employee;

  const checkPermission = (permission: keyof RolePermissions): boolean => {
    return permissions[permission];
  };

  const requirePermission = async (permission: keyof RolePermissions, redirectPath = '/') => {
    if (!profile) {
      toast({
        title: "غير مصرح",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      navigate('/auth');
      return false;
    }

    // Server-side permission validation - CRITICAL: No client-side fallback
    try {
      const { data: hasValidRole, error } = await supabase.rpc('validate_user_role', {
        required_role: userRole
      });

      if (error) {
        console.error('Permission validation error:', error);
        toast({
          title: "خطأ في التحقق من الصلاحيات",
          description: "حدث خطأ في التحقق من صلاحياتك",
          variant: "destructive",
        });
        navigate(redirectPath);
        return false;
      }

      if (!hasValidRole) {
        toast({
          title: "غير مصرح",
          description: "لا تملك الصلاحية للوصول لهذه الصفحة",
          variant: "destructive",
        });
        navigate(redirectPath);
        return false;
      }

      // Additional permission check based on role
      if (!checkPermission(permission)) {
        toast({
          title: "غير مصرح",
          description: "لا تملك الصلاحية للوصول لهذه الصفحة",
          variant: "destructive",
        });
        navigate(redirectPath);
        return false;
      }
    } catch (error) {
      console.error('Critical permission validation error:', error);
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

  const isAdmin = userRole === 'admin';
  const isAccountant = userRole === 'accountant';
  const isEmployee = userRole === 'employee';

  return {
    userRole,
    permissions,
    checkPermission,
    requirePermission,
    isAdmin,
    isAccountant,
    isEmployee,
  };
};