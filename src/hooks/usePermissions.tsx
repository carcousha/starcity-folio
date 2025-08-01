import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PermissionSetting {
  id: string;
  module_name: string;
  action_type: string;
  allowed_roles: string[];
  allowed_users: string[];
  is_active: boolean;
}

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<PermissionSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // جلب الصلاحيات من قاعدة البيانات
  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('permission_settings')
        .select('*')
        .order('module_name', { ascending: true });

      if (error) throw error;
      setPermissions(data || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل إعدادات الصلاحيات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // التحقق من صلاحية محددة
  const checkPermission = async (moduleName: string, actionType: string) => {
    try {
      const { data, error } = await supabase
        .rpc('check_module_permission', {
          module_name_param: moduleName,
          action_type_param: actionType
        });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  };

  // تحديث الصلاحيات
  const updatePermission = async (
    id: string, 
    allowedRoles: string[], 
    allowedUsers: string[] = []
  ) => {
    try {
      const { error } = await supabase
        .from('permission_settings')
        .update({
          allowed_roles: allowedRoles,
          allowed_users: allowedUsers,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // تحديث البيانات المحلية
      setPermissions(prev => 
        prev.map(p => 
          p.id === id 
            ? { ...p, allowed_roles: allowedRoles, allowed_users: allowedUsers }
            : p
        )
      );

      toast({
        title: "تم الحفظ",
        description: "تم تحديث الصلاحية بنجاح",
      });

      return true;
    } catch (error) {
      console.error('Error updating permission:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث الصلاحية",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  return {
    permissions,
    loading,
    checkPermission,
    updatePermission,
    refreshPermissions: fetchPermissions
  };
};

// Hook لاستخدام التحقق من الصلاحيات في المكونات
export const useModulePermission = (moduleName: string, actionType: string) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPerm = async () => {
      try {
        const { data, error } = await supabase
          .rpc('check_module_permission', {
            module_name_param: moduleName,
            action_type_param: actionType
          });

        if (error) throw error;
        setHasPermission(data || false);
      } catch (error) {
        console.error('Error checking permission:', error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    checkPerm();
  }, [moduleName, actionType]);

  return { hasPermission, loading };
};