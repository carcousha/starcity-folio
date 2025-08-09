export interface PropertyOwner {
  id: string;
  full_name: string;
  mobile_numbers: any; // JSONB field from database
  owner_type: string;
  address?: string;
  email?: string;
  nationality?: string;
  id_number?: string;
  internal_notes?: string;
  total_properties_count: number;
  total_properties_value: number;
  last_contact_date?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  created_by?: string;
  assigned_employee?: string;
  assigned_employee_profile?: {
    first_name: string;
    last_name: string;
  } | null;
}