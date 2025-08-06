import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export function SyncDebtsWithJournal() {
  const [isLoading, setIsLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<number | null>(null);
  const { toast } = useToast();

  const handleSync = async () => {
    try {
      setIsLoading(true);
      setSyncResult(null);

      const { data, error } = await supabase.rpc('sync_debts_with_journal');

      if (error) throw error;

      setSyncResult(data);
      toast({
        title: 'نجحت المزامنة',
        description: `تم مزامنة ${data} من الديون مع دفتر اليومية`,
      });
    } catch (error) {
      console.error('Error syncing debts:', error);
      toast({
        title: 'خطأ في المزامنة',
        description: 'حدث خطأ أثناء مزامنة الديون مع دفتر اليومية',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-amber-900">مزامنة الديون مع دفتر اليومية</CardTitle>
        </div>
        <CardDescription className="text-amber-700">
          هذه الأداة تقوم بمزامنة الديون الموجودة مع دفتر اليومية لضمان التكامل الكامل
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {syncResult !== null && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800">
              تم مزامنة {syncResult} من الديون بنجاح
            </span>
          </div>
        )}
        
        <Button 
          onClick={handleSync} 
          disabled={isLoading}
          className="w-full"
          variant="outline"
        >
          {isLoading ? 'جاري المزامنة...' : 'بدء المزامنة'}
        </Button>

        <div className="text-sm text-amber-700 space-y-1">
          <p>• هذه العملية آمنة ولن تؤثر على البيانات الموجودة</p>
          <p>• سيتم ربط كل مديونية بقيد في دفتر اليومية</p>
          <p>• يمكن تشغيل هذه العملية عدة مرات دون مشاكل</p>
        </div>
      </CardContent>
    </Card>
  );
}