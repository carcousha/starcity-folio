import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Calculator, Users, DollarSign, AlertTriangle, Building2, User, Eye, CheckCircle, Percent } from "lucide-react";

interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
}

interface CommissionDistributionFormProps {
  totalCommission: number;
  selectedEmployees: Employee[];
  onDistributionChange: (distribution: any) => void;
  showVisualization?: boolean;
}

// Commission Distribution Logic
const calculateCommissionDistribution = (totalCommission: number, employees: any[], managerPercentages: any = {}) => {
  const OFFICE_PERCENTAGE = 50; // Fixed 50% for office
  
  // Step 1: Calculate office share (fixed 50%)
  const officeShare = (totalCommission * OFFICE_PERCENTAGE) / 100;
  const employeeShare = totalCommission - officeShare;

  // Step 2: Calculate employee distributions
  const employeeDistributions: any[] = [];

  if (employees.length === 1) {
    // Case A: Single Employee
    const employee = employees[0];
    const managerPercentage = managerPercentages[employee.employee_id] || 100;
    const employeeAmount = (employeeShare * managerPercentage) / 100;

    employeeDistributions.push({
      id: `${employee.id}_commission`,
      employee_id: employee.employee_id,
      commission_id: employee.id,
      percentage: managerPercentage,
      amount: employeeAmount,
      manager_percentage: managerPercentage
    });
  } else if (employees.length > 1) {
    // Case B: Multiple Employees
    if (managerPercentages && Object.keys(managerPercentages).length > 0) {
      // Manager has set custom percentages
      employees.forEach(employee => {
        const managerPercentage = managerPercentages[employee.employee_id] || 0;
        const employeeAmount = (employeeShare * managerPercentage) / 100;

        employeeDistributions.push({
          id: `${employee.id}_commission`,
          employee_id: employee.employee_id,
          commission_id: employee.id,
          percentage: managerPercentage,
          amount: employeeAmount,
          manager_percentage: managerPercentage
        });
      });
    } else {
      // Equal distribution among employees
      const equalPercentage = 100 / employees.length;
      
      employees.forEach(employee => {
        const employeeAmount = (employeeShare * equalPercentage) / 100;

        employeeDistributions.push({
          id: `${employee.id}_commission`,
          employee_id: employee.employee_id,
          commission_id: employee.id,
          percentage: equalPercentage,
          amount: employeeAmount,
          manager_percentage: equalPercentage
        });
      });
    }
  }

  // Step 3: Calculate remaining amount that goes back to office
  const distributedAmount = employeeDistributions.reduce((sum, emp) => sum + emp.amount, 0);
  const remainingAmount = employeeShare - distributedAmount;

  return {
    total_commission: totalCommission,
    office_share: officeShare + remainingAmount, // Office gets fixed share + remaining
    employee_share: employeeShare,
    employees: employeeDistributions,
    remaining_amount: remainingAmount
  };
};

export const CommissionDistributionForm = ({ 
  totalCommission, 
  selectedEmployees, 
  onDistributionChange,
  showVisualization = false
}: CommissionDistributionFormProps) => {
  const [managerPercentages, setManagerPercentages] = useState<{ [key: string]: number }>({});
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(showVisualization);

  // Initialize percentages for single employee or equal distribution
  useEffect(() => {
    if (selectedEmployees.length > 0) {
      const initialPercentages: { [key: string]: number } = {};
      
      if (selectedEmployees.length === 1) {
        // Single employee gets 100% by default
        initialPercentages[selectedEmployees[0].employee_id] = 100;
      } else {
        // Multiple employees get equal distribution by default
        const equalPercentage = 100 / selectedEmployees.length;
        selectedEmployees.forEach(emp => {
          initialPercentages[emp.employee_id] = equalPercentage;
        });
      }
      
      setManagerPercentages(initialPercentages);
    }
  }, [selectedEmployees]);

  // Calculate distribution whenever inputs change
  useEffect(() => {
    if (selectedEmployees.length > 0) {
      const employees = selectedEmployees.map((emp, index) => ({
        id: `temp_${index}`,
        employee_id: emp.employee_id
      }));
      
      const distribution = calculateCommissionDistribution(
        totalCommission, 
        employees, 
        managerPercentages
      );
      
      onDistributionChange(distribution);
    }
  }, [totalCommission, selectedEmployees, managerPercentages, onDistributionChange]);

  const handlePercentageChange = (employeeId: string, percentage: string) => {
    const numPercentage = parseFloat(percentage) || 0;
    setManagerPercentages(prev => ({
      ...prev,
      [employeeId]: numPercentage
    }));
  };

  const getTotalPercentage = () => {
    return Object.values(managerPercentages).reduce((sum, percentage) => sum + percentage, 0);
  };

  const isValidPercentages = () => {
    return getTotalPercentage() <= 100;
  };

  if (selectedEmployees.length === 0 || totalCommission <= 0) {
    return null;
  }

  const employees = selectedEmployees.map((emp, index) => ({
    id: `temp_${index}`,
    employee_id: emp.employee_id
  }));
  
  const distribution = calculateCommissionDistribution(
    totalCommission, 
    employees, 
    managerPercentages
  );

  // Prepare chart data
  const officeShare = (totalCommission * 50) / 100;
  const employeeShare = totalCommission - officeShare;
  
  const chartData = [
    {
      name: 'المكتب',
      value: 50,
      amount: distribution.office_share,
      color: '#0066CC'
    },
    ...Object.entries(managerPercentages).map(([employeeId, percentage], index) => {
      const employee = selectedEmployees.find(emp => emp.employee_id === employeeId);
      const colors = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];
      return {
        name: employee ? `${employee.first_name} ${employee.last_name}` : `موظف ${index + 1}`,
        value: percentage / 2, // Convert to percentage of total (since employees get 50%)
        amount: (employeeShare * percentage) / 100,
        color: colors[index % colors.length]
      };
    })
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-blue-600">{data.value}% - {data.amount.toFixed(2)} د.إ</p>
        </div>
      );
    }
    return null;
  };

  const unusedPercentage = 100 - getTotalPercentage();

  return (
    <div className="space-y-6">
      {/* Visualization */}
      {showVisualization && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              معاينة التوزيع
            </CardTitle>
            <CardDescription>
              مخطط دائري يوضح توزيع العمولة في الوقت الحقيقي
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart */}
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <h4 className="font-medium text-lg">تفاصيل التوزيع</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-600 rounded"></div>
                      <span className="font-medium">المكتب</span>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-blue-600">{distribution.office_share.toFixed(2)} د.إ</div>
                      <div className="text-sm text-gray-600">50%</div>
                    </div>
                  </div>

                  {distribution.employees.map((empDist, index) => {
                    const employee = selectedEmployees.find(emp => emp.employee_id === empDist.employee_id);
                    const colors = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];
                    
                    return (
                      <div key={empDist.employee_id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded" 
                            style={{ backgroundColor: colors[index % colors.length] }}
                          ></div>
                          <span className="font-medium">
                            {employee ? `${employee.first_name} ${employee.last_name}` : `موظف ${index + 1}`}
                          </span>
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-green-600">{empDist.amount.toFixed(2)} د.إ</div>
                          <div className="text-sm text-gray-600">{empDist.percentage}%</div>
                        </div>
                      </div>
                    );
                  })}

                  {unusedPercentage > 0 && (
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <span className="font-medium text-yellow-800">نسبة غير مستخدمة تعود للمكتب</span>
                      <div className="text-left">
                        <div className="font-bold text-yellow-600">{distribution.remaining_amount.toFixed(2)} د.إ</div>
                        <div className="text-sm text-gray-600">{unusedPercentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Validation Alert */}
            {!isValidPercentages() && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  تحذير: إجمالي النسب ({getTotalPercentage()}%) يتجاوز 100%. يرجى تعديل النسب.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {showVisualization ? "تخصيص النسب" : "معاينة توزيع العمولة - النظام الجديد 50/50"}
          </CardTitle>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {showVisualization ? "قم بتعديل النسب ومشاهدة النتائج مباشرة" : "التقسيم الثابت: 50% للمكتب + 50% للموظفين (أي نسبة غير مستخدمة تعود للمكتب)"}
            </p>
            
            {selectedEmployees.length > 1 && (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant={!isCustomMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsCustomMode(false)}
                  className="text-xs"
                >
                  توزيع متساوي
                </Button>
                <Button
                  type="button"
                  variant={isCustomMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsCustomMode(true)}
                  className="text-xs"
                >
                  نسب مخصصة
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Office Share Display */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800">🏢 نصيب المكتب (ثابت 50%)</span>
                </div>
                <Badge variant="secondary" className="text-lg bg-blue-100 text-blue-800">
                  {distribution.office_share.toFixed(2)} د.إ
                </Badge>
              </div>
              <div className="text-sm text-blue-700 space-y-1">
                <div className="flex justify-between">
                  <span>النصيب الأساسي (50%):</span>
                  <span>{(totalCommission * 0.5).toFixed(2)} د.إ</span>
                </div>
                {distribution.remaining_amount > 0 && (
                  <div className="flex justify-between">
                    <span>المبلغ المتبقي من الموظفين:</span>
                    <span className="font-medium">+{distribution.remaining_amount.toFixed(2)} د.إ</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Employee Share Display */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">👤 نصيب الموظفين (50%)</span>
                </div>
                <Badge variant="secondary" className="text-lg bg-green-100 text-green-800">
                  {distribution.employee_share.toFixed(2)} د.إ
                </Badge>
              </div>

              {/* Employee Distribution */}
              <div className="space-y-3">
                {selectedEmployees.map((employee, index) => {
                  const empDistribution = distribution.employees[index];
                  
                  return (
                    <div key={employee.employee_id} className="border border-green-200 rounded-lg p-3 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-green-800">
                          {employee.first_name} {employee.last_name}
                        </span>
                        <Badge variant="outline" className="text-lg border-green-300 text-green-700">
                          {empDistribution?.amount.toFixed(2) || '0.00'} د.إ
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Label htmlFor={`percentage-${employee.employee_id}`} className="text-sm text-green-700 min-w-fit">
                          النسبة من نصيب الموظفين:
                        </Label>
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            id={`percentage-${employee.employee_id}`}
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={managerPercentages[employee.employee_id] || 0}
                            onChange={(e) => handlePercentageChange(employee.employee_id, e.target.value)}
                            className="w-20 text-center"
                            disabled={!isCustomMode && selectedEmployees.length > 1}
                          />
                          <span className="text-sm text-green-700">%</span>
                          <span className="text-xs text-muted-foreground">
                            = {((managerPercentages[employee.employee_id] || 0) * distribution.employee_share / 100).toFixed(2)} د.إ
                          </span>
                        </div>
                      </div>
                      
                      {!isCustomMode && selectedEmployees.length > 1 && (
                        <p className="text-xs text-blue-600 mt-1">
                          التوزيع متساوي: {(100 / selectedEmployees.length).toFixed(1)}% لكل موظف
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Percentage Validation */}
              <div className="mt-4 p-3 bg-white border border-green-200 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-800">إجمالي النسب:</span>
                  <Badge variant={isValidPercentages() ? "default" : "destructive"} className={isValidPercentages() ? "bg-green-600" : ""}>
                    {getTotalPercentage().toFixed(1)}%
                  </Badge>
                </div>
                
                {!isValidPercentages() && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">إجمالي النسب لا يمكن أن يتجاوز 100%</span>
                  </div>
                )}
                
                {getTotalPercentage() < 100 && isValidPercentages() && (
                  <div className="text-sm text-orange-600">
                    <span className="font-medium">المبلغ المتبقي:</span> {(100 - getTotalPercentage()).toFixed(1)}% 
                    ({((100 - getTotalPercentage()) * distribution.employee_share / 100).toFixed(2)} د.إ) 
                    سيعود للمكتب
                  </div>
                )}
                
                {getTotalPercentage() === 100 && (
                  <div className="text-sm text-green-600">
                    ✅ تم توزيع كامل نصيب الموظفين
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <h4 className="font-medium mb-3 text-gray-800">ملخص التوزيع النهائي</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-600">إجمالي العمولة:</span>
                  <span className="font-bold text-lg">{distribution.total_commission.toFixed(2)} د.إ</span>
                </div>
                <hr className="border-gray-300" />
                <div className="flex justify-between items-center py-1">
                  <span className="text-blue-600">🏢 نصيب المكتب النهائي:</span>
                  <span className="font-medium text-blue-700">{distribution.office_share.toFixed(2)} د.إ</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-green-600">👤 إجمالي نصيب الموظفين:</span>
                  <span className="font-medium text-green-700">
                    {distribution.employees.reduce((sum, emp) => sum + emp.amount, 0).toFixed(2)} د.إ
                  </span>
                </div>
                {distribution.remaining_amount > 0 && (
                  <div className="flex justify-between items-center py-1 text-orange-600">
                    <span>المبلغ المُعاد للمكتب:</span>
                    <span className="font-medium">+{distribution.remaining_amount.toFixed(2)} د.إ</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Apply Distribution Button for Preview Mode */}
          {showVisualization && previewMode && (
            <div className="flex justify-center pt-4">
              <Button 
                onClick={() => {
                  setPreviewMode(false);
                  // The distribution is already being passed via onDistributionChange effect
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                disabled={!isValidPercentages()}
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                اعتماد التوزيع
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};