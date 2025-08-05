-- إنشاء جدول مصروفات السيارات إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.vehicle_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL,
  expense_type TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  odometer_reading INTEGER,
  description TEXT,
  receipt_url TEXT,
  debt_assignment TEXT DEFAULT 'company',
  recorded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل Row Level Security
ALTER TABLE public.vehicle_expenses ENABLE ROW LEVEL SECURITY;

-- إنشاء دالة للتحقق من صلاحيات إدارة الماليات
CREATE OR REPLACE FUNCTION public.can_manage_vehicle_expenses()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- سياسة للعرض: المديرين والمحاسبين يمكنهم عرض جميع المصروفات
CREATE POLICY "المديرين والمحاسبين يمكنهم عرض مصروفات السيارات" 
ON public.vehicle_expenses 
FOR SELECT 
USING (can_manage_vehicle_expenses());

-- سياسة للإدراج: المديرين والمحاسبين يمكنهم إضافة مصروفات
CREATE POLICY "المديرين والمحاسبين يمكنهم إضافة مصروفات السيارات" 
ON public.vehicle_expenses 
FOR INSERT 
WITH CHECK (can_manage_vehicle_expenses() AND recorded_by = auth.uid());

-- سياسة للتحديث: المديرين والمحاسبين يمكنهم تحديث المصروفات
CREATE POLICY "المديرين والمحاسبين يمكنهم تحديث مصروفات السيارات" 
ON public.vehicle_expenses 
FOR UPDATE 
USING (can_manage_vehicle_expenses());

-- سياسة للحذف: المديرين فقط يمكنهم حذف المصروفات
CREATE POLICY "المديرين يمكنهم حذف مصروفات السيارات" 
ON public.vehicle_expenses 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  )
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_vehicle_id ON public.vehicle_expenses(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_expense_date ON public.vehicle_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_recorded_by ON public.vehicle_expenses(recorded_by);

-- إنشاء trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_vehicle_expenses_updated_at ON public.vehicle_expenses;
CREATE TRIGGER update_vehicle_expenses_updated_at
  BEFORE UPDATE ON public.vehicle_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();