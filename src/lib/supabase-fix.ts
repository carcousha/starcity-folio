// This file contains temporary fixes for TypeScript errors after database schema updates
// These fixes will be replaced with proper types once the schema is stable

export function fixSupabaseQuery(query: any) {
  return query as any;
}

export function fixSupabaseData(data: any) {
  return data as any;
}

// Temporary interface for profiles to fix immediate TypeScript errors
export interface TempProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'accountant' | 'employee';
  avatar_url?: string;
  is_active: boolean;
}