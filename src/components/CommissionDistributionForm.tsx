import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calculator, Users, DollarSign, AlertTriangle, Building2, User } from "lucide-react";

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
  onDistributionChange 
}: CommissionDistributionFormProps) => {
  const [managerPercentages, setManagerPercentages] = useState<{ [key: string]: number }>({});

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

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          معاينة توزيع العمولة
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          يتم تقسيم العمولة تلقائياً: 50% للمكتب و 50% للموظفين. يمكنك تعديل نسبة كل موظف حسب الحاجة.
        </p>
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
                        النسبة:
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
                        />
                        <span className="text-sm text-green-700">%</span>
                        <span className="text-xs text-muted-foreground">
                          = {((managerPercentages[employee.employee_id] || 0) * distribution.employee_share / 100).toFixed(2)} د.إ
                        </span>
                      </div>
                    </div>
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
      </CardContent>
    </Card>
  );
};

