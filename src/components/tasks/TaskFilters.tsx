// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface TaskFilters {
  status: string;
  priority: string;
  assignedTo: string;
  dueDateRange: string;
}

interface TaskFiltersProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
}

const TaskFilters = ({ filters, onFiltersChange }: TaskFiltersProps) => {
  // جلب قائمة الموظفين
  const { data: employees = [] } = useQuery({
    queryKey: ['employees-for-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .eq('is_active', true)
        .order('first_name');

      if (error) throw error;
      return data;
    }
  });

  const handleFilterChange = (key: keyof TaskFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const resetFilters = () => {
    onFiltersChange({
      status: 'all',
      priority: 'all',
      assignedTo: 'all',
      dueDateRange: 'all'
    });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">فلترة المهام</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetFilters}
            className="h-8"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            إعادة تعيين
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* فلتر الحالة */}
          <div className="space-y-2">
            <Label htmlFor="status-filter">الحالة</Label>
            <Select 
              value={filters.status} 
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="new">جديدة</SelectItem>
                <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                <SelectItem value="completed">مكتملة</SelectItem>
                <SelectItem value="cancelled">ملغية</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* فلتر الأولوية */}
          <div className="space-y-2">
            <Label htmlFor="priority-filter">الأولوية</Label>
            <Select 
              value={filters.priority} 
              onValueChange={(value) => handleFilterChange('priority', value)}
            >
              <SelectTrigger id="priority-filter">
                <SelectValue placeholder="اختر الأولوية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأولويات</SelectItem>
                <SelectItem value="urgent">عاجل</SelectItem>
                <SelectItem value="high">عالي</SelectItem>
                <SelectItem value="normal">عادي</SelectItem>
                <SelectItem value="low">منخفض</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* فلتر الموظف المعيَّن */}
          <div className="space-y-2">
            <Label htmlFor="assignee-filter">المُعيَّن إليه</Label>
            <Select 
              value={filters.assignedTo} 
              onValueChange={(value) => handleFilterChange('assignedTo', value)}
            >
              <SelectTrigger id="assignee-filter">
                <SelectValue placeholder="اختر الموظف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الموظفين</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.user_id} value={employee.user_id}>
                    {employee.first_name} {employee.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* فلتر تاريخ الاستحقاق */}
          <div className="space-y-2">
            <Label htmlFor="duedate-filter">تاريخ الاستحقاق</Label>
            <Select 
              value={filters.dueDateRange} 
              onValueChange={(value) => handleFilterChange('dueDateRange', value)}
            >
              <SelectTrigger id="duedate-filter">
                <SelectValue placeholder="اختر المدى الزمني" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع التواريخ</SelectItem>
                <SelectItem value="overdue">متأخرة</SelectItem>
                <SelectItem value="today">اليوم</SelectItem>
                <SelectItem value="this_week">هذا الأسبوع</SelectItem>
                <SelectItem value="this_month">هذا الشهر</SelectItem>
                <SelectItem value="no_date">بدون تاريخ استحقاق</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskFilters;