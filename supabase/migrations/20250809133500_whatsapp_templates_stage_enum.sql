-- Normalize whatsapp_templates.stage to enum and add index

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_stage') THEN
    CREATE TYPE public.whatsapp_stage AS ENUM ('Lead','Negotiation','Closing','PostSale');
  END IF;
END$$;

-- If old text column 'stage' exists with different semantics, rename it to stage_key
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='whatsapp_templates' AND column_name='stage' AND udt_name <> 'whatsapp_stage'
  ) THEN
    ALTER TABLE public.whatsapp_templates RENAME COLUMN stage TO stage_key;
  END IF;
END$$;

-- Add enum column if not exists
ALTER TABLE public.whatsapp_templates 
  ADD COLUMN IF NOT EXISTS stage public.whatsapp_stage NOT NULL DEFAULT 'Lead';

CREATE INDEX IF NOT EXISTS idx_wt_stage_only ON public.whatsapp_templates(stage);


