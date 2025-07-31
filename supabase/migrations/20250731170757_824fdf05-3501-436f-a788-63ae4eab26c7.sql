-- جدول لحفظ معلومات قوالب PDF ومواقع الحقول
CREATE TABLE public.pdf_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'rental_contract',
  file_path TEXT NOT NULL,
  field_positions JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تمكين RLS
ALTER TABLE public.pdf_templates ENABLE ROW LEVEL SECURITY;

-- سياسات RLS
CREATE POLICY "Admins and accountants can manage PDF templates"
ON public.pdf_templates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "All users can view active PDF templates"
ON public.pdf_templates FOR SELECT
USING (is_active = true);

-- إضافة حقول جديدة لجدول العقود
ALTER TABLE public.rental_contracts 
ADD COLUMN IF NOT EXISTS pdf_template_id UUID REFERENCES public.pdf_templates(id),
ADD COLUMN IF NOT EXISTS generated_pdf_path TEXT;