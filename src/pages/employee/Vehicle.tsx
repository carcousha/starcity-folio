import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Car, 
  Fuel,
  Wrench,
  Calendar,
  MapPin,
  FileText,
  Plus,
  AlertTriangle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export default function Vehicle() {
  const { profile } = useAuth();
  const [showRequestForm, setShowRequestForm] = useState(false);

  const { data: vehicleData, isLoading } = useQuery({
    queryKey: ['employee-vehicle', profile?.user_id],
    queryFn: async () => {
      if (!profile) return null;
      
      // للآن سنعرض معلومات وهمية - يمكن تطويرها لاحقاً مع جدول السيارات المخصصة للموظفين
      return {
        assignedVehicle: {
          id: '1',
          make: 'تويوتا',
          model: 'كامري',
          year: 2022,
          license_plate: 'ع ك ج 123',
          fuel_level: 75,
          last_service: '2024-01-15',
          next_service: '2024-04-15',
          status: 'active'
        },
        recentTrips: [
          {
            id: '1',
            destination: 'عجمان - دبي',
            date: '2024-01-20',
            distance: 45,
            purpose: 'زيارة عميل'
          },
          {
            id: '2',
            destination: 'عجمان - الشارقة',
            date: '2024-01-18',
            distance: 25,
            purpose: 'معاينة عقار'
          }
        ],
        fuelExpenses: [
          {
            id: '1',
            amount: 120,
            date: '2024-01-19',
            station: 'أدنوك'
          },
          {
            id: '2',
            amount: 110,
            date: '2024-01-15',
            station: 'إيبكو'
          }
        ]
      };
    },
    enabled: !!profile
  });

  if (!profile) return null;

  const vehicle = vehicleData?.assignedVehicle;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <Car className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">سيارتي</h1>
            <p className="text-muted-foreground">إدارة السيارة المخصصة لي</p>
          </div>
        </div>
        <Button onClick={() => setShowRequestForm(true)}>
          <Plus className="h-4 w-4 ml-2" />
          طلب صيانة
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">جارٍ التحميل...</p>
        </div>
      ) : !vehicle ? (
        <Card>
          <CardContent className="text-center py-8">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">لم يتم تخصيص سيارة لك بعد</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Vehicle Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Car className="h-5 w-5" />
                <span>معلومات السيارة</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg">{vehicle.make} {vehicle.model}</h3>
                  <p className="text-muted-foreground">موديل {vehicle.year}</p>
                  <p className="font-mono text-sm mt-2">{vehicle.license_plate}</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Fuel className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold">{vehicle.fuel_level}%</p>
                  <p className="text-muted-foreground text-sm">مستوى الوقود</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Wrench className="h-6 w-6 text-orange-600" />
                  </div>
                  <p className="text-sm font-medium">{new Date(vehicle.last_service).toLocaleDateString('ar-AE')}</p>
                  <p className="text-muted-foreground text-sm">آخر صيانة</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-sm font-medium">{new Date(vehicle.next_service).toLocaleDateString('ar-AE')}</p>
                  <p className="text-muted-foreground text-sm">الصيانة القادمة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Trips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <MapPin className="h-5 w-5" />
                  <span>الرحلات الأخيرة</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vehicleData?.recentTrips.map((trip: any) => (
                    <div key={trip.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{trip.destination}</p>
                        <p className="text-sm text-muted-foreground">{trip.purpose}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(trip.date).toLocaleDateString('ar-AE')}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">{trip.distance} كم</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Fuel Expenses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <Fuel className="h-5 w-5" />
                  <span>مصروفات الوقود</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vehicleData?.fuelExpenses.map((expense: any) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{expense.station}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString('ar-AE')}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">{expense.amount} د.إ</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Maintenance Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <AlertTriangle className="h-5 w-5" />
                <span>تنبيهات الصيانة</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 ml-3" />
                  <div className="flex-1">
                    <p className="font-medium text-yellow-800">صيانة دورية مستحقة</p>
                    <p className="text-sm text-yellow-600">
                      موعد الصيانة القادمة في {new Date(vehicle.next_service).toLocaleDateString('ar-AE')}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    حجز موعد
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}