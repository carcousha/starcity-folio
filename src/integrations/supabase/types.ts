export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          amount: number | null
          created_at: string
          description: string
          id: string
          metadata: Json | null
          operation_type: string
          related_id: string | null
          related_table: string | null
          source_id: string
          source_table: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          operation_type: string
          related_id?: string | null
          related_table?: string | null
          source_id: string
          source_table: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          operation_type?: string
          related_id?: string | null
          related_table?: string | null
          source_id?: string
          source_table?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
          timestamp: string
          user_id: string
        }
        Insert: {
          action: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
          timestamp?: string
          user_id: string
        }
        Update: {
          action?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          assigned_to: string | null
          created_at: string
          created_by: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          preferences: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          preferences?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          preferences?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      commission_employees: {
        Row: {
          calculated_share: number
          commission_id: string
          created_at: string
          deducted_debt: number
          employee_id: string
          id: string
          net_share: number
          percentage: number
          updated_at: string
        }
        Insert: {
          calculated_share?: number
          commission_id: string
          created_at?: string
          deducted_debt?: number
          employee_id: string
          id?: string
          net_share?: number
          percentage: number
          updated_at?: string
        }
        Update: {
          calculated_share?: number
          commission_id?: string
          created_at?: string
          deducted_debt?: number
          employee_id?: string
          id?: string
          net_share?: number
          percentage?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_employees_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount: number
          client_name: string | null
          created_at: string
          deal_id: string
          employee_id: string
          id: string
          notes: string | null
          office_share: number | null
          paid_at: string | null
          percentage: number
          remaining_for_employees: number | null
          status: string
          total_commission: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          client_name?: string | null
          created_at?: string
          deal_id: string
          employee_id: string
          id?: string
          notes?: string | null
          office_share?: number | null
          paid_at?: string | null
          percentage: number
          remaining_for_employees?: number | null
          status?: string
          total_commission?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          client_name?: string | null
          created_at?: string
          deal_id?: string
          employee_id?: string
          id?: string
          notes?: string | null
          office_share?: number | null
          paid_at?: string | null
          percentage?: number
          remaining_for_employees?: number | null
          status?: string
          total_commission?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          amount: number
          client_id: string
          closed_at: string | null
          commission_amount: number | null
          commission_rate: number
          created_at: string
          deal_type: string
          handled_by: string
          id: string
          notes: string | null
          property_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          client_id: string
          closed_at?: string | null
          commission_amount?: number | null
          commission_rate?: number
          created_at?: string
          deal_type: string
          handled_by: string
          id?: string
          notes?: string | null
          property_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string
          closed_at?: string | null
          commission_amount?: number | null
          commission_rate?: number
          created_at?: string
          deal_type?: string
          handled_by?: string
          id?: string
          notes?: string | null
          property_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          amount: number
          created_at: string
          debtor_id: string | null
          debtor_name: string
          debtor_type: string
          description: string | null
          due_date: string | null
          id: string
          paid_at: string | null
          recorded_by: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          debtor_id?: string | null
          debtor_name: string
          debtor_type: string
          description?: string | null
          due_date?: string | null
          id?: string
          paid_at?: string | null
          recorded_by: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          debtor_id?: string | null
          debtor_name?: string
          debtor_type?: string
          description?: string | null
          due_date?: string | null
          id?: string
          paid_at?: string | null
          recorded_by?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          expense_date: string
          id: string
          receipt_url: string | null
          recorded_by: string
          title: string
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          receipt_url?: string | null
          recorded_by: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          receipt_url?: string | null
          recorded_by?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      file_uploads: {
        Row: {
          category: string | null
          created_at: string
          file_path: string
          file_size: number | null
          file_type: string | null
          filename: string
          id: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          filename: string
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          filename?: string
          id?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          is_active?: boolean
          last_name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          area: number | null
          bathrooms: number | null
          bedrooms: number | null
          created_at: string
          description: string | null
          features: string[] | null
          id: string
          images: string[] | null
          listed_by: string
          location: string
          price: number
          property_type: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          images?: string[] | null
          listed_by: string
          location: string
          price: number
          property_type: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          images?: string[] | null
          listed_by?: string
          location?: string
          price?: number
          property_type?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      revenues: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          recorded_by: string
          revenue_date: string
          source: string
          title: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          recorded_by: string
          revenue_date?: string
          source: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          recorded_by?: string
          revenue_date?: string
          source?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      themes: {
        Row: {
          colors: Json | null
          created_at: string
          created_by: string | null
          fonts: Json | null
          id: string
          is_default: boolean | null
          layout: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          colors?: Json | null
          created_at?: string
          created_by?: string | null
          fonts?: Json | null
          id?: string
          is_default?: boolean | null
          layout?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          colors?: Json | null
          created_at?: string
          created_by?: string | null
          fonts?: Json | null
          id?: string
          is_default?: boolean | null
          layout?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      treasury_accounts: {
        Row: {
          account_number: string | null
          account_type: string
          bank_name: string | null
          created_at: string
          created_by: string
          currency: string
          current_balance: number
          iban: string | null
          id: string
          is_active: boolean
          name: string
          opening_balance: number
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          account_type: string
          bank_name?: string | null
          created_at?: string
          created_by: string
          currency?: string
          current_balance?: number
          iban?: string | null
          id?: string
          is_active?: boolean
          name: string
          opening_balance?: number
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          account_type?: string
          bank_name?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          current_balance?: number
          iban?: string | null
          id?: string
          is_active?: boolean
          name?: string
          opening_balance?: number
          updated_at?: string
        }
        Relationships: []
      }
      treasury_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          from_account_id: string | null
          id: string
          processed_by: string
          reference_id: string | null
          reference_type: string | null
          to_account_id: string | null
          transaction_date: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          from_account_id?: string | null
          id?: string
          processed_by: string
          reference_id?: string | null
          reference_type?: string | null
          to_account_id?: string | null
          transaction_date?: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          from_account_id?: string | null
          id?: string
          processed_by?: string
          reference_id?: string | null
          reference_type?: string | null
          to_account_id?: string | null
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treasury_transactions_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "treasury_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treasury_transactions_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "treasury_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string
          granted: boolean | null
          granted_by: string | null
          id: string
          module_name: string
          permission_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          granted?: boolean | null
          granted_by?: string | null
          id?: string
          module_name: string
          permission_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          granted?: boolean | null
          granted_by?: string | null
          id?: string
          module_name?: string
          permission_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_expenses: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          expense_date: string
          expense_type: string
          id: string
          odometer_reading: number | null
          receipt_url: string | null
          recorded_by: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          expense_date?: string
          expense_type: string
          id?: string
          odometer_reading?: number | null
          receipt_url?: string | null
          recorded_by: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          expense_date?: string
          expense_type?: string
          id?: string
          odometer_reading?: number | null
          receipt_url?: string | null
          recorded_by?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          assigned_to: string | null
          color: string | null
          created_at: string
          id: string
          insurance_expiry: string | null
          last_maintenance: string | null
          license_expiry: string | null
          license_plate: string
          make: string
          model: string
          next_maintenance: string | null
          notes: string | null
          odometer_reading: number | null
          purchase_date: string | null
          purchase_price: number | null
          status: string
          updated_at: string
          year: number
        }
        Insert: {
          assigned_to?: string | null
          color?: string | null
          created_at?: string
          id?: string
          insurance_expiry?: string | null
          last_maintenance?: string | null
          license_expiry?: string | null
          license_plate: string
          make: string
          model: string
          next_maintenance?: string | null
          notes?: string | null
          odometer_reading?: number | null
          purchase_date?: string | null
          purchase_price?: number | null
          status?: string
          updated_at?: string
          year: number
        }
        Update: {
          assigned_to?: string | null
          color?: string | null
          created_at?: string
          id?: string
          insurance_expiry?: string | null
          last_maintenance?: string | null
          license_expiry?: string | null
          license_plate?: string
          make?: string
          model?: string
          next_maintenance?: string | null
          notes?: string | null
          odometer_reading?: number | null
          purchase_date?: string | null
          purchase_price?: number | null
          status?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_employee_financial_summary: {
        Args: { employee_user_id: string }
        Returns: {
          total_commissions: number
          total_debts: number
          net_commissions: number
          total_deals: number
          recent_activities: Json
        }[]
      }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      log_financial_activity: {
        Args: {
          p_operation_type: string
          p_description: string
          p_amount: number
          p_source_table: string
          p_source_id: string
          p_related_table?: string
          p_related_id?: string
          p_user_id?: string
          p_metadata?: Json
        }
        Returns: string
      }
      secure_role_change: {
        Args: {
          target_user_id: string
          new_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "accountant" | "employee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "accountant", "employee"],
    },
  },
} as const
