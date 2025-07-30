-- Fix Security Definer Views by dropping them - they will be replaced by proper queries in the application

-- Drop the existing problematic views
DROP VIEW IF EXISTS public.employee_financial_summary;
DROP VIEW IF EXISTS public.user_roles_view;

-- These views will be replaced by direct queries in the application code that use proper RLS
-- This eliminates the security definer issue while maintaining functionality