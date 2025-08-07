-- Create employee requests table
CREATE TABLE public.employee_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  request_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  requested_date DATE,
  attachments JSONB DEFAULT '[]',
  manager_response TEXT,
  responded_by UUID,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employee complaints table
CREATE TABLE public.employee_complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  complaint_category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  incident_date DATE,
  department TEXT,
  attachments JSONB DEFAULT '[]',
  manager_response TEXT,
  responded_by UUID,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_complaints ENABLE ROW LEVEL SECURITY;

-- RLS policies for employee_requests
CREATE POLICY "Employee can view own requests" 
ON public.employee_requests 
FOR SELECT 
USING (employee_id = auth.uid());

CREATE POLICY "Employee can create own requests" 
ON public.employee_requests 
FOR INSERT 
WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Employee can update own requests" 
ON public.employee_requests 
FOR UPDATE 
USING (employee_id = auth.uid());

CREATE POLICY "Admins can view all requests" 
ON public.employee_requests 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can update all requests" 
ON public.employee_requests 
FOR UPDATE 
USING (is_admin());

-- RLS policies for employee_complaints
CREATE POLICY "Employee can view own complaints" 
ON public.employee_complaints 
FOR SELECT 
USING (employee_id = auth.uid());

CREATE POLICY "Employee can create own complaints" 
ON public.employee_complaints 
FOR INSERT 
WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Employee can update own complaints" 
ON public.employee_complaints 
FOR UPDATE 
USING (employee_id = auth.uid());

CREATE POLICY "Admins can view all complaints" 
ON public.employee_complaints 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can update all complaints" 
ON public.employee_complaints 
FOR UPDATE 
USING (is_admin());

-- Create notification function for new requests
CREATE OR REPLACE FUNCTION public.notify_new_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for admins
  PERFORM public.create_system_notification(
    'طلب إداري جديد',
    'تم تقديم طلب جديد من الموظف: ' || (
      SELECT first_name || ' ' || last_name 
      FROM public.profiles 
      WHERE user_id = NEW.employee_id
    ),
    'request',
    'high',
    'employee_requests',
    NEW.id,
    NULL,
    JSONB_BUILD_OBJECT(
      'request_type', NEW.request_type,
      'employee_id', NEW.employee_id,
      'title', NEW.title
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create notification function for new complaints
CREATE OR REPLACE FUNCTION public.notify_new_complaint()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for admins
  PERFORM public.create_system_notification(
    'شكوى جديدة',
    'تم تقديم شكوى جديدة من الموظف: ' || (
      SELECT first_name || ' ' || last_name 
      FROM public.profiles 
      WHERE user_id = NEW.employee_id
    ),
    'complaint',
    'high',
    'employee_complaints',
    NEW.id,
    NULL,
    JSONB_BUILD_OBJECT(
      'complaint_category', NEW.complaint_category,
      'employee_id', NEW.employee_id,
      'title', NEW.title
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER notify_new_request_trigger
  AFTER INSERT ON public.employee_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_request();

CREATE TRIGGER notify_new_complaint_trigger
  AFTER INSERT ON public.employee_complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_complaint();

-- Create function to create system notifications if it doesn't exist
CREATE OR REPLACE FUNCTION public.create_system_notification(
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_priority TEXT DEFAULT 'medium',
  p_related_table TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL,
  p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
  admin_user RECORD;
BEGIN
  -- Get all admin users
  FOR admin_user IN 
    SELECT user_id FROM public.profiles 
    WHERE role = 'admin' AND is_active = true
  LOOP
    INSERT INTO public.system_notifications (
      user_id,
      title,
      message,
      type,
      priority,
      related_table,
      related_id,
      scheduled_for,
      metadata
    ) VALUES (
      admin_user.user_id,
      p_title,
      p_message,
      p_type,
      p_priority,
      p_related_table,
      p_related_id,
      COALESCE(p_scheduled_for, now()),
      p_metadata
    );
  END LOOP;
  
  RETURN notification_id;
END;
$$;

-- Create system_notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.system_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  priority TEXT NOT NULL DEFAULT 'medium',
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_table TEXT,
  related_id UUID,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on system_notifications
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for system_notifications
CREATE POLICY "Users can view own notifications" 
ON public.system_notifications 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" 
ON public.system_notifications 
FOR UPDATE 
USING (user_id = auth.uid());