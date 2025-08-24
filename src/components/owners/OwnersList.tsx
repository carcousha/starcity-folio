import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PropertyOwner } from "@/types/owners";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Building, Phone, User, MessageCircle, Edit, Eye, Mail, MapPin, FileText, DollarSign, Grid3X3, Table, RefreshCw, ArrowRight } from "lucide-react";
import { ContactSyncService } from "@/services/contactSyncService";
import { OwnerForm } from "./OwnerForm";
import { OwnerDetails } from "./OwnerDetails";
import { OwnersTable } from "./OwnersTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// تخزين مؤقت للبيانات
const ownersCache = {
  data: null as PropertyOwner[] | null,
  lastFetch: 0,
  cacheExpiry: 5 * 60 * 1000, // 5 دقائق
};

export const OwnersList = () => {
  const { toast } = useToast();
  const [owners, setOwners] = useState<PropertyOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ownerTypeFilter, setOwnerTypeFilter] = useState<string>("all");
  const [selectedOwner, setSelectedOwner] = useState<PropertyOwner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // استعادة الحالة من localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('owners-view-mode');
    if (savedViewMode === 'cards' || savedViewMode === 'table') {
      setViewMode(savedViewMode);
    }

    const savedSearchTerm = localStorage.getItem('owners-search-term');
    if (savedSearchTerm) {
      setSearchTerm(savedSearchTerm);
    }

    const savedOwnerTypeFilter = localStorage.getItem('owners-type-filter');
    if (savedOwnerTypeFilter) {
      setOwnerTypeFilter(savedOwnerTypeFilter);
    }
  }, []);

  // حفظ الحالة في localStorage
  useEffect(() => {
    localStorage.setItem('owners-view-mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('owners-search-term', searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    localStorage.setItem('owners-type-filter', ownerTypeFilter);
  }, [ownerTypeFilter]);

  const fetchOwners = useCallback(async (forceRefresh = false) => {
    // التحقق من التخزين المؤقت
    const now = Date.now();
    if (!forceRefresh && 
        ownersCache.data && 
        (now - ownersCache.lastFetch) < ownersCache.cacheExpiry) {
      setOwners(ownersCache.data);
      setIsDataLoaded(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("property_owners")
        .select('*')
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Get employee names separately to avoid relationship issues
      const ownersWithEmployeeInfo = await Promise.all(
        (data || []).map(async (owner) => {
          if (owner.assigned_employee) {
            const { data: employeeData } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('user_id', owner.assigned_employee)
              .maybeSingle();
            
            return {
              ...owner,
              assigned_employee_profile: employeeData
            };
          }
          return {
            ...owner,
            assigned_employee_profile: null
          };
        })
      );
      
      // تحديث التخزين المؤقت
      ownersCache.data = ownersWithEmployeeInfo as PropertyOwner[];
      ownersCache.lastFetch = now;
      
      setOwners(ownersWithEmployeeInfo as PropertyOwner[]);
      setIsDataLoaded(true);
    } catch (error: any) {
      console.error("Error fetching owners:", error);
      toast({
        variant: "destructive",
        title: "خطأ في تحميل البيانات",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // تحميل البيانات عند بدء المكون
  useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

  // تحديث البيانات يدوياً
  const refreshData = useCallback(() => {
    fetchOwners(true);
  }, [fetchOwners]);

  // Function to open WhatsApp
  const openWhatsApp = (phoneNumbers: string[]) => {
    if (phoneNumbers && phoneNumbers.length > 0) {
      // Clean the phone number (remove spaces, dashes, etc.)
      const cleanNumber = phoneNumbers[0].replace(/[\s\-\(\)]/g, '');
      const whatsappUrl = `https://wa.me/${cleanNumber}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const filteredOwners = owners.filter((owner) => {
    // Safe access to mobile_numbers (handle JSONB array)
    const mobileNumbers = Array.isArray(owner.mobile_numbers) ? owner.mobile_numbers : [];
    
    const matchesSearch = 
      owner.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mobileNumbers.some((num: string) => num.includes(searchTerm)) ||
      owner.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.address?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = ownerTypeFilter === "all" || owner.owner_type === ownerTypeFilter;

    return matchesSearch && matchesType;
  });

  const handleEditOwner = (owner: PropertyOwner) => {
    setSelectedOwner(owner);
    setShowForm(true);
  };

  const handleViewOwner = (owner: PropertyOwner) => {
    setSelectedOwner(owner);
    setShowDetails(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedOwner(null);
    refreshData(); // Refresh data after successful form submission
  };

  // حفظ المالك المحدد في localStorage
  useEffect(() => {
    if (selectedOwner) {
      localStorage.setItem('owners-selected-owner', JSON.stringify(selectedOwner));
    }
  }, [selectedOwner]);

  // استعادة المالك المحدد من localStorage
  useEffect(() => {
    const savedOwner = localStorage.getItem('owners-selected-owner');
    if (savedOwner && isDataLoaded) {
      try {
        const owner = JSON.parse(savedOwner);
        // التحقق من أن المالك لا يزال موجوداً في البيانات الحالية
        if (owners.find(o => o.id === owner.id)) {
          setSelectedOwner(owner);
        }
      } catch (error) {
        console.error('خطأ في استعادة المالك المحفوظ:', error);
      }
    }
  }, [isDataLoaded, owners]);

  // تنظيف التخزين المؤقت عند تسجيل الخروج
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth-session' && !e.newValue) {
        // تم تسجيل الخروج، امسح التخزين المؤقت
        ownersCache.data = null;
        ownersCache.lastFetch = 0;
        localStorage.removeItem('owners-view-mode');
        localStorage.removeItem('owners-search-term');
        localStorage.removeItem('owners-type-filter');
        localStorage.removeItem('owners-selected-owner');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-4">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  // مزامنة جميع الملاك مع WhatsApp
  const syncAllToWhatsApp = async () => {
    try {
      let syncedCount = 0;
      for (const owner of owners) {
        if (owner.mobile_numbers && owner.mobile_numbers.length > 0) {
          const ownerContact = {
            id: owner.id,
            name: owner.full_name,
            phone: owner.mobile_numbers[0],
            email: owner.email,
            whatsapp_number: owner.mobile_numbers[0],
            id_number: owner.id_number,
            notes: owner.internal_notes
          };
          
          const result = await ContactSyncService.syncOwnerToWhatsApp(ownerContact);
          if (result) syncedCount++;
        }
      }
      
      toast({
        title: "تمت المزامنة بنجاح",
        description: `تم مزامنة ${syncedCount} مالك مع WhatsApp`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ في المزامنة",
        description: "فشل في مزامنة الملاك مع WhatsApp",
      });
    }
  };

  // مزامنة من WhatsApp إلى الملاك
  const syncFromWhatsApp = async () => {
    try {
      const result = await ContactSyncService.getSyncStats();
      toast({
        title: "تمت المزامنة بنجاح",
        description: `تم مزامنة ${result.owners} مالك من WhatsApp`,
      });
      fetchOwners(); // إعادة تحميل البيانات
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ في المزامنة",
        description: "فشل في مزامنة الملاك من WhatsApp",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* أزرار المزامنة مع WhatsApp */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-purple-600" />
            <span className="font-medium text-purple-800">مزامنة WhatsApp</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={syncAllToWhatsApp}
              variant="outline"
              size="sm"
              className="border-purple-300 text-purple-700 hover:bg-purple-100"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              مزامنة الملاك إلى WhatsApp
            </Button>
            <Button
              onClick={syncFromWhatsApp}
              variant="outline"
              size="sm"
              className="border-purple-300 text-purple-700 hover:bg-purple-100"
            >
              <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              مزامنة من WhatsApp إلى الملاك
            </Button>
          </div>
        </div>
      </div>

      {/* Header and Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-right">إدارة المُلاك</h1>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="flex items-center gap-1"
            >
              <Grid3X3 className="h-4 w-4" />
              كروت
            </Button>
            <Button
              variant={viewMode === "table" ? "ghost" : "default"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="flex items-center gap-1"
            >
              <Table className="h-4 w-4" />
              جدول
            </Button>
          </div>

          {/* زر تحديث البيانات */}
          <Button
            onClick={refreshData}
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث البيانات</span>
          </Button>

          {/* عرض آخر تحديث */}
          {isDataLoaded && (
            <Badge variant="secondary" className="text-xs">
              آخر تحديث: {new Date(ownersCache.lastFetch).toLocaleTimeString('ar-SA')}
            </Badge>
          )}
        </div>
        
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setSelectedOwner(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              إضافة مالك جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-right">
                {selectedOwner ? "تعديل بيانات المالك" : "إضافة مالك جديد"}
              </DialogTitle>
            </DialogHeader>
            <OwnerForm
              owner={selectedOwner}
              onSuccess={handleFormSuccess}
              onCancel={() => setShowForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث بالاسم، رقم الهاتف، البريد الإلكتروني، أو العنوان..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-right"
                dir="rtl"
              />
            </div>
            <Select value={ownerTypeFilter} onValueChange={setOwnerTypeFilter}>
              <SelectTrigger className="w-full sm:w-48 text-right" dir="rtl">
                <SelectValue placeholder="نوع المالك" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="individual">أفراد</SelectItem>
                <SelectItem value="company">شركات</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">إجمالي المُلاك</p>
                <p className="text-2xl font-bold">{owners.length}</p>
              </div>
              <User className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">أفراد</p>
                <p className="text-2xl font-bold">
                  {owners.filter(o => o.owner_type === 'individual').length}
                </p>
              </div>
              <User className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">شركات</p>
                <p className="text-2xl font-bold">
                  {owners.filter(o => o.owner_type === 'company').length}
                </p>
              </div>
              <Building className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">إجمالي قيمة العقارات</p>
                <p className="text-lg font-bold">
                  {formatCurrency(
                    owners.reduce((sum, owner) => sum + (owner.total_properties_value || 0), 0)
                  )}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content based on view mode */}
      {viewMode === "table" ? (
        <OwnersTable
          owners={filteredOwners}
          onEdit={handleEditOwner}
          onView={handleViewOwner}
          onOpenWhatsApp={openWhatsApp}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOwners.map((owner) => (
            <Card key={owner.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewOwner(owner)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditOwner(owner)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <CardTitle className="text-lg">{owner.full_name}</CardTitle>
                    <Badge
                      variant={owner.owner_type === "individual" ? "default" : "secondary"}
                      className="mt-1"
                    >
                      {owner.owner_type === "individual" ? "فرد" : "شركة"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Contact Information */}
                <div className="space-y-2">
                  {Array.isArray(owner.mobile_numbers) && owner.mobile_numbers.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span className="flex-1">{owner.mobile_numbers.join(", ")}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openWhatsApp(owner.mobile_numbers)}
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="إرسال رسالة واتساب"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {owner.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="text-right" dir="rtl">{owner.email}</span>
                    </div>
                  )}

                  {owner.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="text-right line-clamp-2" dir="rtl">{owner.address}</span>
                    </div>
                  )}
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Building className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{owner.total_properties_count}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">عقار</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span className="text-xs font-medium">
                        {owner.total_properties_value > 0 
                          ? `${(owner.total_properties_value / 1000000).toFixed(1)}م`
                          : "0"
                        }
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">درهم</p>
                  </div>
                </div>

                {/* Assigned Employee */}
                {owner.assigned_employee_profile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                    <User className="h-4 w-4" />
                    <span className="text-right">
                      الموظف المسؤول: {owner.assigned_employee_profile.first_name} {owner.assigned_employee_profile.last_name}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredOwners.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">لا توجد بيانات مُلاك</p>
            <p className="text-sm text-muted-foreground mt-2">
              {searchTerm || ownerTypeFilter !== "all"
                ? "لم يتم العثور على نتائج تطابق البحث"
                : "لم يتم إضافة أي مُلاك بعد"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Owner Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right">
              تفاصيل المالك: {selectedOwner?.full_name}
            </DialogTitle>
          </DialogHeader>
          {selectedOwner && (
            <OwnerDetails 
              owner={selectedOwner} 
              onClose={() => setShowDetails(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};