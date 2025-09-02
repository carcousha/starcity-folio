// @ts-nocheck
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

export default function ConvertExpensesToDebts() {
  const [isConverting, setIsConverting] = useState(false);
  const [convertedCount, setConvertedCount] = useState<number | null>(null);
  const { toast } = useToast();

  const handleConversion = async () => {
    setIsConverting(true);
    try {
      // استدعاء دالة تحويل المصروفات الشخصية الموجودة إلى ديون
      const { data, error } = await supabase.rpc('convert_existing_personal_expenses_to_debts');

      if (error) throw error;

      setConvertedCount(data);
      
      toast({
        title: "تم التحويل بنجاح",
        description: `تم تحويل ${data} مصروف شخصي إلى ديون`,
      });

    } catch (error: any) {
      console.error('Error converting expenses to debts:', error);
      toast({
        title: "خطأ في التحويل",
        description: "فشل في تحويل المصروفات الشخصية إلى ديون: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          تحويل المصروفات الشخصية
        </CardTitle>
        <CardDescription>
          تحويل المصروفات الشخصية الموجودة إلى مديونيات
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-700">
              <p className="font-medium mb-1">ملاحظة هامة:</p>
              <p>سيتم تحويل جميع المصروفات الشخصية الموجودة إلى مديونيات على الموظفين المعنيين مع إمكانية الخصم التلقائي من العمولة.</p>
            </div>
          </div>
        </div>

        {convertedCount !== null && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="text-sm text-green-700">
                <p className="font-medium">تم التحويل بنجاح!</p>
                <p>تم تحويل {convertedCount} مصروف شخصي إلى مديونيات</p>
              </div>
            </div>
          </div>
        )}

        <Button 
          onClick={handleConversion} 
          disabled={isConverting}
          className="w-full"
        >
          {isConverting ? (
            <>
              <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
              جاري التحويل...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 ml-2" />
              تحويل المصروفات الشخصية
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          هذه العملية آمنة ولا تؤثر على البيانات الموجودة، بل تنشئ ديون جديدة للمصروفات الشخصية.
        </p>
      </CardContent>
    </Card>
  );
}