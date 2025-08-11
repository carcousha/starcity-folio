export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          name: string
          phone: string
          email: string | null
          address: string | null
          preferences: string | null
          notes: string | null
          internal_notes: string | null
          assigned_to: string | null
          created_by: string
          created_at: string
          updated_at: string
          nationality: string | null
          preferred_language: string | null
          preferred_contact_method: string | null
          property_type_interest: string | null
          purchase_purpose: string | null
          budget_min: number | null
          budget_max: number | null
          preferred_location: string | null
          planned_purchase_date: string | null
          client_status: string | null
          source: string | null
          preferred_payment_method: string | null
          last_contacted: string | null
          previous_deals_count: number | null
        }
        Insert: {
          id?: string
          name: string
          phone: string
          email?: string | null
          address?: string | null
          preferences?: string | null
          notes?: string | null
          internal_notes?: string | null
          assigned_to?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
          nationality?: string | null
          preferred_language?: string | null
          preferred_contact_method?: string | null
          property_type_interest?: string | null
          purchase_purpose?: string | null
          budget_min?: number | null
          budget_max?: number | null
          preferred_location?: string | null
          planned_purchase_date?: string | null
          client_status?: string | null
          source?: string | null
          preferred_payment_method?: string | null
          last_contacted?: string | null
          previous_deals_count?: number | null
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          email?: string | null
          address?: string | null
          preferences?: string | null
          notes?: string | null
          internal_notes?: string | null
          assigned_to?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
          nationality?: string | null
          preferred_language?: string | null
          preferred_contact_method?: string | null
          property_type_interest?: string | null
          purchase_purpose?: string | null
          budget_min?: number | null
          budget_max?: number | null
          preferred_location?: string | null
          planned_purchase_date?: string | null
          client_status?: string | null
          source?: string | null
          preferred_payment_method?: string | null
          last_contacted?: string | null
          previous_deals_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      leads: {
        Row: {
          id: string
          full_name: string
          phone: string
          email: string | null
          nationality: string | null
          preferred_language: string
          lead_source: string
          property_type: string
          budget_min: number | null
          budget_max: number | null
          preferred_location: string | null
          purchase_purpose: string
          assigned_to: string | null
          stage: string
          lead_score: number
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string
          next_follow_up: string | null
          converted_to_client: boolean
          converted_client_id: string | null
          conversion_date: string | null
        }
        Insert: {
          id?: string
          full_name: string
          phone: string
          email?: string | null
          nationality?: string | null
          preferred_language?: string
          lead_source: string
          property_type: string
          budget_min?: number | null
          budget_max?: number | null
          preferred_location?: string | null
          purchase_purpose: string
          assigned_to?: string | null
          stage?: string
          lead_score?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by: string
          next_follow_up?: string | null
          converted_to_client?: boolean
          converted_client_id?: string | null
          conversion_date?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string
          email?: string | null
          nationality?: string | null
          preferred_language?: string
          lead_source?: string
          property_type?: string
          budget_min?: number | null
          budget_max?: number | null
          preferred_location?: string | null
          purchase_purpose?: string
          assigned_to?: string | null
          stage?: string
          lead_score?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string
          next_follow_up?: string | null
          converted_to_client?: boolean
          converted_client_id?: string | null
          conversion_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          role: 'admin' | 'accountant' | 'employee'
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          role?: 'admin' | 'accountant' | 'employee'
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          role?: 'admin' | 'accountant' | 'employee'
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      convert_lead_to_client: {
        Args: {
          lead_id_param: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          user_id: string
          role_name: 'admin' | 'accountant' | 'employee'
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: 'admin' | 'accountant' | 'employee'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never
