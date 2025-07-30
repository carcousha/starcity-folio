import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Shield, 
  Settings, 
  Crown,
  Calculator,
  UserCheck,
  AlertTriangle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'accountant' | 'employee';
  is_active: boolean;
  created_at: string;
}

export default function RoleManagement() {
  const { requirePermission } = useRoleAccess();
  const queryClient = useQueryClient();

  // Check permission on component mount
  if (!requirePermission('canManageRoles')) {
    return null;
  }

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserProfile[];
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: 'admin' | 'accountant' | 'employee' }) => {
      const { data, error } = await supabase.rpc('secure_role_change', {
        target_user_id: userId,
        new_role: newRole
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث صلاحيات المستخدم",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الصلاحيات",
        variant: "destructive",
      });
    }
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !isActive })
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث حالة المستخدم",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث حالة المستخدم",
        variant: "destructive",
      });
    }
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Crown;
      case 'accountant': return Calculator;
      case 'employee': return UserCheck;
      default: return Users;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'مدير';
      case 'accountant': return 'محاسب';
      case 'employee': return 'موظف';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'accountant': return 'bg-blue-100 text-blue-800';
      case 'employee': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 space-x-reverse">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة الصلاحيات</h1>
          <p className="text-muted-foreground">تحكم في أدوار وصلاحيات المستخدمين</p>
        </div>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['admin', 'accountant', 'employee'].map((role) => {
          const Icon = getRoleIcon(role);
          const count = users?.filter(user => user.role === role).length || 0;
          
          return (
            <Card key={role}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {getRoleName(role)}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {count}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Users className="h-5 w-5" />
            <span>المستخدمين</span>
          </CardTitle>
          <CardDescription>
            إدارة أدوار وصلاحيات جميع المستخدمين في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users?.map((user) => {
              const RoleIcon = getRoleIcon(user.role);
              
              return (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {user.first_name[0]}{user.last_name[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <Badge className={getRoleColor(user.role)}>
                      <RoleIcon className="h-3 w-3 ml-1" />
                      {getRoleName(user.role)}
                    </Badge>
                    
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "نشط" : "معطل"}
                    </Badge>
                    
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {/* Role Change Buttons */}
                      {user.role !== 'admin' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateRoleMutation.mutate({ 
                            userId: user.user_id, 
                            newRole: 'admin' 
                          })}
                          disabled={updateRoleMutation.isPending}
                        >
                          ترقية لمدير
                        </Button>
                      )}
                      
                      {user.role !== 'accountant' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateRoleMutation.mutate({ 
                            userId: user.user_id, 
                            newRole: 'accountant' 
                          })}
                          disabled={updateRoleMutation.isPending}
                        >
                          تعيين محاسب
                        </Button>
                      )}
                      
                      {user.role !== 'employee' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateRoleMutation.mutate({ 
                            userId: user.user_id, 
                            newRole: 'employee' 
                          })}
                          disabled={updateRoleMutation.isPending}
                        >
                          تعيين موظف
                        </Button>
                      )}
                      
                      {/* Toggle Status Button */}
                      <Button
                        size="sm"
                        variant={user.is_active ? "destructive" : "default"}
                        onClick={() => toggleUserStatusMutation.mutate({ 
                          userId: user.user_id, 
                          isActive: user.is_active 
                        })}
                        disabled={toggleUserStatusMutation.isPending}
                      >
                        {user.is_active ? "تعطيل" : "تفعيل"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Security Notice */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3 space-x-reverse">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-medium text-orange-900">تنبيه أمني</h3>
              <div className="text-sm text-orange-800 space-y-1">
                <p>• تغيير الصلاحيات يؤثر فورًا على إمكانية الوصول للنظام</p>
                <p>• المدير هو الوحيد القادر على تعديل الصلاحيات</p>
                <p>• تعطيل المستخدم يمنعه من تسجيل الدخول للنظام</p>
                <p>• جميع التغييرات يتم تسجيلها في سجل النشاطات</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}