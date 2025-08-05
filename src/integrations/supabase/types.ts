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
      applied_incentives: {
        Row: {
          achievement_percentage: number
          applied_at: string
          calculated_amount: number
          created_by: string
          employee_id: string
          id: string
          incentive_rule_id: string
          notes: string | null
          target_id: string
        }
        Insert: {
          achievement_percentage: number
          applied_at?: string
          calculated_amount: number
          created_by: string
          employee_id: string
          id?: string
          incentive_rule_id: string
          notes?: string | null
          target_id: string
        }
        Update: {
          achievement_percentage?: number
          applied_at?: string
          calculated_amount?: number
          created_by?: string
          employee_id?: string
          id?: string
          incentive_rule_id?: string
          notes?: string | null
          target_id?: string
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
      auth_attempts: {
        Row: {
          attempt_type: string
          created_at: string | null
          error_message: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          success: boolean
          user_agent: string | null
          user_identifier: string
        }
        Insert: {
          attempt_type: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          success: boolean
          user_agent?: string | null
          user_identifier: string
        }
        Update: {
          attempt_type?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          success?: boolean
          user_agent?: string | null
          user_identifier?: string
        }
        Relationships: []
      }
      budget_limits: {
        Row: {
          alert_threshold: number | null
          category: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          monthly_limit: number | null
          updated_at: string
          yearly_limit: number | null
        }
        Insert: {
          alert_threshold?: number | null
          category: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          monthly_limit?: number | null
          updated_at?: string
          yearly_limit?: number | null
        }
        Update: {
          alert_threshold?: number | null
          category?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          monthly_limit?: number | null
          updated_at?: string
          yearly_limit?: number | null
        }
        Relationships: []
      }
      client_documents: {
        Row: {
          client_id: string
          document_name: string
          document_type: string
          file_size: number | null
          file_url: string
          id: string
          notes: string | null
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          client_id: string
          document_name: string
          document_type: string
          file_size?: number | null
          file_url: string
          id?: string
          notes?: string | null
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          client_id?: string
          document_name?: string
          document_type?: string
          file_size?: number | null
          file_url?: string
          id?: string
          notes?: string | null
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          assigned_to: string | null
          budget_max: number | null
          budget_min: number | null
          client_status: string | null
          created_at: string
          created_by: string
          email: string | null
          id: string
          internal_notes: string | null
          last_contacted: string | null
          name: string
          nationality: string | null
          notes: string | null
          phone: string
          planned_purchase_date: string | null
          preferences: string | null
          preferred_contact_method: string | null
          preferred_language: string | null
          preferred_location: string | null
          preferred_payment_method: string | null
          previous_deals_count: number | null
          property_type_interest: string | null
          purchase_purpose: string | null
          source: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          client_status?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          internal_notes?: string | null
          last_contacted?: string | null
          name: string
          nationality?: string | null
          notes?: string | null
          phone: string
          planned_purchase_date?: string | null
          preferences?: string | null
          preferred_contact_method?: string | null
          preferred_language?: string | null
          preferred_location?: string | null
          preferred_payment_method?: string | null
          previous_deals_count?: number | null
          property_type_interest?: string | null
          purchase_purpose?: string | null
          source?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          client_status?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          internal_notes?: string | null
          last_contacted?: string | null
          name?: string
          nationality?: string | null
          notes?: string | null
          phone?: string
          planned_purchase_date?: string | null
          preferences?: string | null
          preferred_contact_method?: string | null
          preferred_language?: string | null
          preferred_location?: string | null
          preferred_payment_method?: string | null
          previous_deals_count?: number | null
          property_type_interest?: string | null
          purchase_purpose?: string | null
          source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      commission_employees: {
        Row: {
          calculated_share: number
          commission_id: string
          created_at: string
          custom_percentage: number | null
          deducted_debt: number
          employee_id: string
          id: string
          is_custom_distribution: boolean | null
          net_share: number
          percentage: number
          updated_at: string
        }
        Insert: {
          calculated_share?: number
          commission_id: string
          created_at?: string
          custom_percentage?: number | null
          deducted_debt?: number
          employee_id: string
          id?: string
          is_custom_distribution?: boolean | null
          net_share?: number
          percentage: number
          updated_at?: string
        }
        Update: {
          calculated_share?: number
          commission_id?: string
          created_at?: string
          custom_percentage?: number | null
          deducted_debt?: number
          employee_id?: string
          id?: string
          is_custom_distribution?: boolean | null
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
          deal_id: string | null
          distribution_type: string | null
          employee_id: string | null
          has_custom_employee_percentages: boolean | null
          id: string
          notes: string | null
          office_share: number | null
          paid_at: string | null
          percentage: number
          remaining_for_employees: number | null
          status: string
          total_commission: number | null
          unused_employee_amount: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          client_name?: string | null
          created_at?: string
          deal_id?: string | null
          distribution_type?: string | null
          employee_id?: string | null
          has_custom_employee_percentages?: boolean | null
          id?: string
          notes?: string | null
          office_share?: number | null
          paid_at?: string | null
          percentage: number
          remaining_for_employees?: number | null
          status?: string
          total_commission?: number | null
          unused_employee_amount?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          client_name?: string | null
          created_at?: string
          deal_id?: string | null
          distribution_type?: string | null
          employee_id?: string | null
          has_custom_employee_percentages?: boolean | null
          id?: string
          notes?: string | null
          office_share?: number | null
          paid_at?: string | null
          percentage?: number
          remaining_for_employees?: number | null
          status?: string
          total_commission?: number | null
          unused_employee_amount?: number | null
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
      contract_documents: {
        Row: {
          contract_id: string
          document_name: string
          document_type: string
          expiry_date: string | null
          file_size: number | null
          file_url: string
          id: string
          is_signed: boolean | null
          notes: string | null
          upload_date: string
          uploaded_by: string
        }
        Insert: {
          contract_id: string
          document_name: string
          document_type: string
          expiry_date?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          is_signed?: boolean | null
          notes?: string | null
          upload_date?: string
          uploaded_by: string
        }
        Update: {
          contract_id?: string
          document_name?: string
          document_type?: string
          expiry_date?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          is_signed?: boolean | null
          notes?: string | null
          upload_date?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "rental_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          file_size: number | null
          id: string
          is_active: boolean
          mime_type: string | null
          template_file_url: string
          template_name: string
          template_type: string
          updated_at: string
          uploaded_file_path: string | null
          version: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean
          mime_type?: string | null
          template_file_url: string
          template_name: string
          template_type: string
          updated_at?: string
          uploaded_file_path?: string | null
          version?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean
          mime_type?: string | null
          template_file_url?: string
          template_name?: string
          template_type?: string
          updated_at?: string
          uploaded_file_path?: string | null
          version?: string
        }
        Relationships: []
      }
      deal_commissions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          client_name: string | null
          commission_amount: number
          commission_rate: number
          created_at: string
          created_by: string
          deal_amount: number
          deal_id: string
          employee_share: number
          handled_by: string
          id: string
          notes: string | null
          office_share: number
          paid_at: string | null
          property_title: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          client_name?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          created_by?: string
          deal_amount?: number
          deal_id: string
          employee_share?: number
          handled_by: string
          id?: string
          notes?: string | null
          office_share?: number
          paid_at?: string | null
          property_title?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          client_name?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          created_by?: string
          deal_amount?: number
          deal_id?: string
          employee_share?: number
          handled_by?: string
          id?: string
          notes?: string | null
          office_share?: number
          paid_at?: string | null
          property_title?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_commissions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_commissions_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      deals: {
        Row: {
          amount: number
          client_id: string
          closed_at: string | null
          commission_amount: number | null
          commission_calculated: boolean | null
          commission_rate: number
          created_at: string
          created_by: string | null
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
          commission_calculated?: boolean | null
          commission_rate?: number
          created_at?: string
          created_by?: string | null
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
          commission_calculated?: boolean | null
          commission_rate?: number
          created_at?: string
          created_by?: string | null
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
      debt_installments: {
        Row: {
          amount: number
          created_at: string
          debt_id: string
          due_date: string
          id: string
          installment_number: number
          notes: string | null
          paid_amount: number | null
          paid_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          debt_id: string
          due_date: string
          id?: string
          installment_number: number
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          debt_id?: string
          due_date?: string
          id?: string
          installment_number?: number
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_installments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
        ]
      }
      debt_notifications: {
        Row: {
          created_at: string
          debt_id: string | null
          id: string
          installment_id: string | null
          is_read: boolean | null
          message: string
          metadata: Json | null
          notification_type: string
          scheduled_for: string
          sent_at: string | null
          status: string
          target_user_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          debt_id?: string | null
          id?: string
          installment_id?: string | null
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          notification_type: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
          target_user_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          debt_id?: string | null
          id?: string
          installment_id?: string | null
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          target_user_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_notifications_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debt_notifications_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "debt_installments"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          amount: number
          auto_deduct_from_commission: boolean | null
          contract_reference: string | null
          created_at: string
          debtor_id: string | null
          debtor_name: string
          debtor_type: string
          description: string | null
          due_date: string | null
          grace_period_days: number | null
          guarantor_name: string | null
          guarantor_phone: string | null
          id: string
          installment_count: number | null
          installment_frequency: string | null
          late_fee_amount: number | null
          paid_at: string | null
          payment_method: string | null
          priority_level: number | null
          recorded_by: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          auto_deduct_from_commission?: boolean | null
          contract_reference?: string | null
          created_at?: string
          debtor_id?: string | null
          debtor_name: string
          debtor_type: string
          description?: string | null
          due_date?: string | null
          grace_period_days?: number | null
          guarantor_name?: string | null
          guarantor_phone?: string | null
          id?: string
          installment_count?: number | null
          installment_frequency?: string | null
          late_fee_amount?: number | null
          paid_at?: string | null
          payment_method?: string | null
          priority_level?: number | null
          recorded_by: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          auto_deduct_from_commission?: boolean | null
          contract_reference?: string | null
          created_at?: string
          debtor_id?: string | null
          debtor_name?: string
          debtor_type?: string
          description?: string | null
          due_date?: string | null
          grace_period_days?: number | null
          guarantor_name?: string | null
          guarantor_phone?: string | null
          id?: string
          installment_count?: number | null
          installment_frequency?: string | null
          late_fee_amount?: number | null
          paid_at?: string | null
          payment_method?: string | null
          priority_level?: number | null
          recorded_by?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_targets: {
        Row: {
          achieved_at: string | null
          commission_target: number
          created_at: string
          created_by: string
          current_commission: number
          current_deals: number
          current_sales: number
          deals_target: number
          employee_id: string
          id: string
          is_achieved: boolean
          sales_target: number
          target_period: string
          target_type: string
          updated_at: string
        }
        Insert: {
          achieved_at?: string | null
          commission_target?: number
          created_at?: string
          created_by: string
          current_commission?: number
          current_deals?: number
          current_sales?: number
          deals_target?: number
          employee_id: string
          id?: string
          is_achieved?: boolean
          sales_target?: number
          target_period: string
          target_type: string
          updated_at?: string
        }
        Update: {
          achieved_at?: string | null
          commission_target?: number
          created_at?: string
          created_by?: string
          current_commission?: number
          current_deals?: number
          current_sales?: number
          deals_target?: number
          employee_id?: string
          id?: string
          is_achieved?: boolean
          sales_target?: number
          target_period?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      expense_attachments: {
        Row: {
          expense_id: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          expense_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          expense_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          budget_category: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          expense_date: string
          expense_type: string | null
          id: string
          is_approved: boolean | null
          receipt_reference: string | null
          receipt_url: string | null
          recorded_by: string | null
          title: string
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          budget_category?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          expense_type?: string | null
          id?: string
          is_approved?: boolean | null
          receipt_reference?: string | null
          receipt_url?: string | null
          recorded_by?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          budget_category?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          expense_type?: string | null
          id?: string
          is_approved?: boolean | null
          receipt_reference?: string | null
          receipt_url?: string | null
          recorded_by?: string | null
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
      government_service_fees: {
        Row: {
          amount: number
          created_at: string | null
          due_date: string | null
          fee_type: string
          id: string
          paid_amount: number | null
          paid_at: string | null
          payment_reference: string | null
          service_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number
          created_at?: string | null
          due_date?: string | null
          fee_type: string
          id?: string
          paid_amount?: number | null
          paid_at?: string | null
          payment_reference?: string | null
          service_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_date?: string | null
          fee_type?: string
          id?: string
          paid_amount?: number | null
          paid_at?: string | null
          payment_reference?: string | null
          service_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "government_service_fees_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "government_services"
            referencedColumns: ["id"]
          },
        ]
      }
      government_service_timeline: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          service_id: string
          stage_name: string
          stage_order: number | null
          stage_status: string
          started_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          service_id: string
          stage_name: string
          stage_order?: number | null
          stage_status?: string
          started_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          service_id?: string
          stage_name?: string
          stage_order?: number | null
          stage_status?: string
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "government_service_timeline_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "government_services"
            referencedColumns: ["id"]
          },
        ]
      }
      government_service_workflow: {
        Row: {
          created_at: string
          id: string
          is_final_stage: boolean | null
          next_stage: string | null
          stage_name: string
          stage_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_final_stage?: boolean | null
          next_stage?: string | null
          stage_name: string
          stage_order: number
        }
        Update: {
          created_at?: string
          id?: string
          is_final_stage?: boolean | null
          next_stage?: string | null
          stage_name?: string
          stage_order?: number
        }
        Relationships: []
      }
      government_services: {
        Row: {
          actual_completion_date: string | null
          application_date: string | null
          category: string | null
          client_id: string | null
          completion_notes: string | null
          contract_id: string
          contract_start_date: string | null
          cost: number | null
          created_at: string
          documents_url: string[] | null
          due_date: string | null
          expected_completion_date: string | null
          government_entity: string | null
          handled_by: string
          id: string
          notes: string | null
          official_fees: number | null
          priority: string | null
          progress_percentage: number | null
          reference_number: string | null
          rejection_reason: string | null
          service_name: string
          service_type: string
          stage_order: number | null
          status: string
          timeline_stages: Json | null
          updated_at: string
          workflow_stage: string | null
        }
        Insert: {
          actual_completion_date?: string | null
          application_date?: string | null
          category?: string | null
          client_id?: string | null
          completion_notes?: string | null
          contract_id: string
          contract_start_date?: string | null
          cost?: number | null
          created_at?: string
          documents_url?: string[] | null
          due_date?: string | null
          expected_completion_date?: string | null
          government_entity?: string | null
          handled_by: string
          id?: string
          notes?: string | null
          official_fees?: number | null
          priority?: string | null
          progress_percentage?: number | null
          reference_number?: string | null
          rejection_reason?: string | null
          service_name: string
          service_type: string
          stage_order?: number | null
          status?: string
          timeline_stages?: Json | null
          updated_at?: string
          workflow_stage?: string | null
        }
        Update: {
          actual_completion_date?: string | null
          application_date?: string | null
          category?: string | null
          client_id?: string | null
          completion_notes?: string | null
          contract_id?: string
          contract_start_date?: string | null
          cost?: number | null
          created_at?: string
          documents_url?: string[] | null
          due_date?: string | null
          expected_completion_date?: string | null
          government_entity?: string | null
          handled_by?: string
          id?: string
          notes?: string | null
          official_fees?: number | null
          priority?: string | null
          progress_percentage?: number | null
          reference_number?: string | null
          rejection_reason?: string | null
          service_name?: string
          service_type?: string
          stage_order?: number | null
          status?: string
          timeline_stages?: Json | null
          updated_at?: string
          workflow_stage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "government_services_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "government_services_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "rental_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "government_services_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      incentive_rules: {
        Row: {
          achievement_percentage: number
          created_at: string
          created_by: string
          id: string
          incentive_type: string
          incentive_value: number
          is_active: boolean
          max_incentive_amount: number | null
          rule_name: string
          target_type: string
          updated_at: string
        }
        Insert: {
          achievement_percentage?: number
          created_at?: string
          created_by: string
          id?: string
          incentive_type: string
          incentive_value: number
          is_active?: boolean
          max_incentive_amount?: number | null
          rule_name: string
          target_type: string
          updated_at?: string
        }
        Update: {
          achievement_percentage?: number
          created_at?: string
          created_by?: string
          id?: string
          incentive_type?: string
          incentive_value?: number
          is_active?: boolean
          max_incentive_amount?: number | null
          rule_name?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          activity_date: string | null
          activity_type: string
          created_at: string | null
          created_by: string
          description: string | null
          duration_minutes: number | null
          id: string
          lead_id: string
          next_action: string | null
          outcome: string | null
          title: string
        }
        Insert: {
          activity_date?: string | null
          activity_type: string
          created_at?: string | null
          created_by: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id: string
          next_action?: string | null
          outcome?: string | null
          title: string
        }
        Update: {
          activity_date?: string | null
          activity_type?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id?: string
          next_action?: string | null
          outcome?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_property_preferences: {
        Row: {
          created_at: string | null
          feedback: string | null
          id: string
          interest_level: string | null
          lead_id: string
          property_id: string | null
          viewing_date: string | null
        }
        Insert: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          interest_level?: string | null
          lead_id: string
          property_id?: string | null
          viewing_date?: string | null
        }
        Update: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          interest_level?: string | null
          lead_id?: string
          property_id?: string | null
          viewing_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_property_preferences_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_property_preferences_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          budget_max: number | null
          budget_min: number | null
          conversion_date: string | null
          converted_client_id: string | null
          converted_to_client: boolean | null
          created_at: string | null
          created_by: string
          email: string | null
          full_name: string
          id: string
          lead_score: number | null
          lead_source: string
          nationality: string | null
          next_follow_up: string | null
          notes: string | null
          phone: string
          preferred_language: string
          preferred_location: string | null
          property_type: string
          purchase_purpose: string
          stage: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          conversion_date?: string | null
          converted_client_id?: string | null
          converted_to_client?: boolean | null
          created_at?: string | null
          created_by: string
          email?: string | null
          full_name: string
          id?: string
          lead_score?: number | null
          lead_source: string
          nationality?: string | null
          next_follow_up?: string | null
          notes?: string | null
          phone: string
          preferred_language?: string
          preferred_location?: string | null
          property_type: string
          purchase_purpose: string
          stage?: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          conversion_date?: string | null
          converted_client_id?: string | null
          converted_to_client?: boolean | null
          created_at?: string | null
          created_by?: string
          email?: string | null
          full_name?: string
          id?: string
          lead_score?: number | null
          lead_source?: string
          nationality?: string | null
          next_follow_up?: string | null
          notes?: string | null
          phone?: string
          preferred_language?: string
          preferred_location?: string | null
          property_type?: string
          purchase_purpose?: string
          stage?: string
          updated_at?: string | null
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
          },
        ]
      }
      notification_logs: {
        Row: {
          channel: string
          created_at: string
          employee_id: string
          error_message: string | null
          id: string
          message: string
          metadata: Json | null
          notification_type: string
          sent_at: string | null
          status: string
          title: string
        }
        Insert: {
          channel: string
          created_at?: string
          employee_id: string
          error_message?: string | null
          id?: string
          message: string
          metadata?: Json | null
          notification_type: string
          sent_at?: string | null
          status?: string
          title: string
        }
        Update: {
          channel?: string
          created_at?: string
          employee_id?: string
          error_message?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          notification_type?: string
          sent_at?: string | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          commission_alerts: boolean
          created_at: string
          debt_alerts: boolean
          email_notifications: boolean
          employee_id: string
          id: string
          target_alerts: boolean
          updated_at: string
          whatsapp_notifications: boolean
          whatsapp_number: string | null
        }
        Insert: {
          commission_alerts?: boolean
          created_at?: string
          debt_alerts?: boolean
          email_notifications?: boolean
          employee_id: string
          id?: string
          target_alerts?: boolean
          updated_at?: string
          whatsapp_notifications?: boolean
          whatsapp_number?: string | null
        }
        Update: {
          commission_alerts?: boolean
          created_at?: string
          debt_alerts?: boolean
          email_notifications?: boolean
          employee_id?: string
          id?: string
          target_alerts?: boolean
          updated_at?: string
          whatsapp_notifications?: boolean
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      pdf_templates: {
        Row: {
          created_at: string
          created_by: string
          field_positions: Json
          file_path: string
          id: string
          is_active: boolean
          template_name: string
          template_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          field_positions?: Json
          file_path: string
          id?: string
          is_active?: boolean
          template_name: string
          template_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          field_positions?: Json
          file_path?: string
          id?: string
          is_active?: boolean
          template_name?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      permission_settings: {
        Row: {
          action_type: string
          allowed_roles: string[]
          allowed_users: string[] | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          module_name: string
          updated_at: string
        }
        Insert: {
          action_type: string
          allowed_roles?: string[]
          allowed_users?: string[] | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          module_name: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          allowed_roles?: string[]
          allowed_users?: string[] | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          module_name?: string
          updated_at?: string
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
          user_id: string
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
          user_id: string
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
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          area: number | null
          bathrooms: number | null
          bedrooms: number | null
          created_at: string
          created_by: string | null
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
          created_by?: string | null
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
          created_by?: string | null
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
      rental_contracts: {
        Row: {
          area: string | null
          auto_renewal: boolean | null
          commission_amount: number | null
          contract_duration_months: number
          contract_number: string
          contract_status: string
          created_at: string
          created_by: string
          end_date: string
          generated_contract_path: string | null
          generated_pdf_path: string | null
          id: string
          installment_frequency: string
          installments_count: number
          owner_name: string | null
          payment_method: string | null
          pdf_template_id: string | null
          plot_number: string | null
          property_id: string | null
          property_title: string | null
          purpose_of_use: string | null
          renewal_notice_days: number | null
          rent_amount: number
          security_deposit: number | null
          special_terms: string | null
          start_date: string
          template_used_id: string | null
          tenant_id: string | null
          tenant_name: string | null
          unit_number: string | null
          unit_type: string | null
          updated_at: string
        }
        Insert: {
          area?: string | null
          auto_renewal?: boolean | null
          commission_amount?: number | null
          contract_duration_months: number
          contract_number: string
          contract_status?: string
          created_at?: string
          created_by: string
          end_date: string
          generated_contract_path?: string | null
          generated_pdf_path?: string | null
          id?: string
          installment_frequency?: string
          installments_count?: number
          owner_name?: string | null
          payment_method?: string | null
          pdf_template_id?: string | null
          plot_number?: string | null
          property_id?: string | null
          property_title?: string | null
          purpose_of_use?: string | null
          renewal_notice_days?: number | null
          rent_amount: number
          security_deposit?: number | null
          special_terms?: string | null
          start_date: string
          template_used_id?: string | null
          tenant_id?: string | null
          tenant_name?: string | null
          unit_number?: string | null
          unit_type?: string | null
          updated_at?: string
        }
        Update: {
          area?: string | null
          auto_renewal?: boolean | null
          commission_amount?: number | null
          contract_duration_months?: number
          contract_number?: string
          contract_status?: string
          created_at?: string
          created_by?: string
          end_date?: string
          generated_contract_path?: string | null
          generated_pdf_path?: string | null
          id?: string
          installment_frequency?: string
          installments_count?: number
          owner_name?: string | null
          payment_method?: string | null
          pdf_template_id?: string | null
          plot_number?: string | null
          property_id?: string | null
          property_title?: string | null
          purpose_of_use?: string | null
          renewal_notice_days?: number | null
          rent_amount?: number
          security_deposit?: number | null
          special_terms?: string | null
          start_date?: string
          template_used_id?: string | null
          tenant_id?: string | null
          tenant_name?: string | null
          unit_number?: string | null
          unit_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_contracts_pdf_template_id_fkey"
            columns: ["pdf_template_id"]
            isOneToOne: false
            referencedRelation: "pdf_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_contracts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "rental_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_contracts_template_used_id_fkey"
            columns: ["template_used_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "rental_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_installments: {
        Row: {
          amount: number
          bank_name: string | null
          cheque_number: string | null
          contract_id: string
          created_at: string
          due_date: string
          id: string
          installment_number: number
          notes: string | null
          paid_amount: number | null
          payment_date: string | null
          payment_method: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          bank_name?: string | null
          cheque_number?: string | null
          contract_id: string
          created_at?: string
          due_date: string
          id?: string
          installment_number: number
          notes?: string | null
          paid_amount?: number | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_name?: string | null
          cheque_number?: string | null
          contract_id?: string
          created_at?: string
          due_date?: string
          id?: string
          installment_number?: number
          notes?: string | null
          paid_amount?: number | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_installments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "rental_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_notifications: {
        Row: {
          channel: string
          contract_id: string | null
          created_at: string
          id: string
          message: string
          metadata: Json | null
          notification_type: string
          recipient_id: string | null
          recipient_type: string
          scheduled_date: string
          sent_date: string | null
          status: string
          title: string
        }
        Insert: {
          channel?: string
          contract_id?: string | null
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          notification_type: string
          recipient_id?: string | null
          recipient_type: string
          scheduled_date: string
          sent_date?: string | null
          status?: string
          title: string
        }
        Update: {
          channel?: string
          contract_id?: string | null
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          notification_type?: string
          recipient_id?: string | null
          recipient_type?: string
          scheduled_date?: string
          sent_date?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_notifications_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "rental_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_properties: {
        Row: {
          agreed_rent_amount: number
          area: number | null
          bathrooms: number | null
          bedrooms: number | null
          commission_percentage: number | null
          created_at: string
          created_by: string
          features: string[] | null
          id: string
          images: string[] | null
          notes: string | null
          owner_email: string | null
          owner_name: string
          owner_phone: string
          property_address: string
          property_title: string
          property_type: string
          status: string
          unit_number: string | null
          updated_at: string
        }
        Insert: {
          agreed_rent_amount: number
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          commission_percentage?: number | null
          created_at?: string
          created_by: string
          features?: string[] | null
          id?: string
          images?: string[] | null
          notes?: string | null
          owner_email?: string | null
          owner_name: string
          owner_phone: string
          property_address: string
          property_title: string
          property_type?: string
          status?: string
          unit_number?: string | null
          updated_at?: string
        }
        Update: {
          agreed_rent_amount?: number
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          commission_percentage?: number | null
          created_at?: string
          created_by?: string
          features?: string[] | null
          id?: string
          images?: string[] | null
          notes?: string | null
          owner_email?: string | null
          owner_name?: string
          owner_phone?: string
          property_address?: string
          property_title?: string
          property_type?: string
          status?: string
          unit_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rental_renewals: {
        Row: {
          created_at: string
          id: string
          new_contract_id: string | null
          new_duration_months: number | null
          new_rent_amount: number | null
          original_contract_id: string
          processed_by: string
          renewal_date: string
          renewal_status: string
          renewal_terms: string | null
          rent_increase_percentage: number | null
          tenant_response: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          new_contract_id?: string | null
          new_duration_months?: number | null
          new_rent_amount?: number | null
          original_contract_id: string
          processed_by: string
          renewal_date: string
          renewal_status?: string
          renewal_terms?: string | null
          rent_increase_percentage?: number | null
          tenant_response?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          new_contract_id?: string | null
          new_duration_months?: number | null
          new_rent_amount?: number | null
          original_contract_id?: string
          processed_by?: string
          renewal_date?: string
          renewal_status?: string
          renewal_terms?: string | null
          rent_increase_percentage?: number | null
          tenant_response?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_renewals_new_contract_id_fkey"
            columns: ["new_contract_id"]
            isOneToOne: false
            referencedRelation: "rental_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_renewals_original_contract_id_fkey"
            columns: ["original_contract_id"]
            isOneToOne: false
            referencedRelation: "rental_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_tenants: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          current_address: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emirates_id: string | null
          full_name: string
          id: string
          lead_source: string | null
          nationality: string | null
          notes: string | null
          passport_number: string | null
          phone: string
          preferred_language: string | null
          status: string
          updated_at: string
          visa_status: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          current_address?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emirates_id?: string | null
          full_name: string
          id?: string
          lead_source?: string | null
          nationality?: string | null
          notes?: string | null
          passport_number?: string | null
          phone: string
          preferred_language?: string | null
          status?: string
          updated_at?: string
          visa_status?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          current_address?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emirates_id?: string | null
          full_name?: string
          id?: string
          lead_source?: string | null
          nationality?: string | null
          notes?: string | null
          passport_number?: string | null
          phone?: string
          preferred_language?: string | null
          status?: string
          updated_at?: string
          visa_status?: string | null
        }
        Relationships: []
      }
      revenues: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string | null
          employee_id: string | null
          id: string
          recorded_by: string
          revenue_date: string
          revenue_type: string | null
          source: string
          title: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          employee_id?: string | null
          id?: string
          recorded_by: string
          revenue_date?: string
          revenue_type?: string | null
          source: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          employee_id?: string | null
          id?: string
          recorded_by?: string
          revenue_date?: string
          revenue_type?: string | null
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
      system_notifications: {
        Row: {
          created_at: string
          id: string
          is_browser_sent: boolean
          is_read: boolean
          is_sound_played: boolean
          message: string
          metadata: Json | null
          priority: string
          read_at: string | null
          related_id: string | null
          related_table: string | null
          scheduled_for: string | null
          sent_at: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_browser_sent?: boolean
          is_read?: boolean
          is_sound_played?: boolean
          message: string
          metadata?: Json | null
          priority?: string
          read_at?: string | null
          related_id?: string | null
          related_table?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_browser_sent?: boolean
          is_read?: boolean
          is_sound_played?: boolean
          message?: string
          metadata?: Json | null
          priority?: string
          read_at?: string | null
          related_id?: string | null
          related_table?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      task_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          assigned_to: string
          id: string
          task_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          assigned_to: string
          id?: string
          task_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          assigned_to?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          task_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          task_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          task_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          comment_text: string
          created_at: string
          created_by: string
          id: string
          task_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          created_by: string
          id?: string
          task_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          created_by?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          notification_type: string
          sent_via_email: boolean | null
          sent_via_whatsapp: boolean | null
          task_id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          notification_type: string
          sent_via_email?: boolean | null
          sent_via_whatsapp?: boolean | null
          task_id: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string
          sent_via_email?: boolean | null
          sent_via_whatsapp?: boolean | null
          task_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          automation_trigger: string | null
          client_id: string | null
          completed_at: string | null
          contract_id: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          is_automated: boolean | null
          priority: string
          property_id: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          automation_trigger?: string | null
          client_id?: string | null
          completed_at?: string | null
          contract_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_automated?: boolean | null
          priority?: string
          property_id?: string | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          automation_trigger?: string | null
          client_id?: string | null
          completed_at?: string | null
          contract_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_automated?: boolean | null
          priority?: string
          property_id?: string | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "rental_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
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
      user_notification_settings: {
        Row: {
          browser_notifications: boolean
          created_at: string
          do_not_disturb_end: string | null
          do_not_disturb_start: string | null
          enabled_types: Json
          id: string
          in_app_notifications: boolean
          reminder_frequency: number
          sound_file: string
          sound_notifications: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          browser_notifications?: boolean
          created_at?: string
          do_not_disturb_end?: string | null
          do_not_disturb_start?: string | null
          enabled_types?: Json
          id?: string
          in_app_notifications?: boolean
          reminder_frequency?: number
          sound_file?: string
          sound_notifications?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          browser_notifications?: boolean
          created_at?: string
          do_not_disturb_end?: string | null
          do_not_disturb_start?: string | null
          enabled_types?: Json
          id?: string
          in_app_notifications?: boolean
          reminder_frequency?: number
          sound_file?: string
          sound_notifications?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          debt_assignment: string | null
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
          debt_assignment?: string | null
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
          debt_assignment?: string | null
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
      advance_workflow_stage: {
        Args: { service_id_param: string }
        Returns: boolean
      }
      approve_commission: {
        Args: { commission_id_param: string }
        Returns: boolean
      }
      approve_commission_multi: {
        Args: { commission_id_param: string }
        Returns: boolean
      }
      calculate_and_apply_incentives: {
        Args: { target_id_param: string }
        Returns: Json
      }
      calculate_commission_distribution: {
        Args: { p_commission_id: string }
        Returns: undefined
      }
      calculate_commission_new_system: {
        Args: {
          p_client_name: string
          p_transaction_type: string
          p_property_type: string
          p_total_amount: number
          p_employee_ids?: string[]
          p_custom_percentages?: Json
        }
        Returns: Json
      }
      calculate_deal_commission: {
        Args: { deal_id_param: string }
        Returns: Json
      }
      calculate_deal_commission_multi: {
        Args: {
          deal_id_param: string
          employee_ids?: string[]
          employee_percentages?: number[]
        }
        Returns: Json
      }
      calculate_deal_commission_multi_fixed: {
        Args: { deal_id_param: string; employee_ids?: string[] }
        Returns: Json
      }
      calculate_lead_score: {
        Args: { lead_record: Database["public"]["Tables"]["leads"]["Row"] }
        Returns: number
      }
      calculate_service_total_fees: {
        Args: { service_id_param: string }
        Returns: number
      }
      can_manage_financials: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_manage_vehicle_expenses: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_module_permission: {
        Args: {
          module_name_param: string
          action_type_param: string
          user_id_param?: string
        }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          identifier: string
          max_attempts?: number
          window_minutes?: number
        }
        Returns: boolean
      }
      check_rate_limit_enhanced: {
        Args: {
          user_email: string
          max_attempts?: number
          time_window_minutes?: number
        }
        Returns: boolean
      }
      convert_lead_to_client: {
        Args: { lead_id_param: string }
        Returns: string
      }
      create_debt_installments: {
        Args: {
          p_debt_id: string
          p_installment_count: number
          p_frequency: string
          p_start_date: string
        }
        Returns: undefined
      }
      create_system_notification: {
        Args: {
          p_user_id: string
          p_title: string
          p_message: string
          p_type: string
          p_priority?: string
          p_related_table?: string
          p_related_id?: string
          p_scheduled_for?: string
          p_metadata?: Json
        }
        Returns: string
      }
      create_task_notification: {
        Args: {
          p_task_id: string
          p_user_id: string
          p_notification_type: string
          p_title: string
          p_message: string
        }
        Returns: string
      }
      fix_data_integrity: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_contract_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_reference_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_rental_installments: {
        Args: {
          p_contract_id: string
          p_start_date: string
          p_installments_count: number
          p_frequency: string
          p_amount_per_installment: number
        }
        Returns: undefined
      }
      get_contracts_report: {
        Args: { p_start_date?: string; p_end_date?: string; p_status?: string }
        Returns: {
          contract_id: string
          contract_number: string
          property_title: string
          tenant_name: string
          rent_amount: number
          start_date: string
          end_date: string
          contract_status: string
          total_installments: number
          paid_installments: number
          pending_installments: number
          total_paid: number
          total_pending: number
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_employee_commission_statement: {
        Args: { employee_id_param?: string }
        Returns: {
          employee_id: string
          employee_name: string
          employee_email: string
          total_commissions_count: number
          total_calculated_commissions: number
          total_deducted_debts: number
          total_net_commissions: number
          total_paid_commissions: number
          total_pending_commissions: number
          total_incentives: number
          current_total_debts: number
        }[]
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
      get_monthly_budget_report: {
        Args: { target_month?: string }
        Returns: {
          category: string
          monthly_limit: number
          actual_spent: number
          remaining_budget: number
          percentage_used: number
          status: string
          transaction_count: number
        }[]
      }
      get_unread_system_notifications_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_crm_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_accountant: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_accountant_or_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_employee: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_profile_owner: {
        Args: { profile_user_id: string }
        Returns: boolean
      }
      link_service_to_accounting: {
        Args: {
          service_id_param: string
          expense_amount: number
          expense_description?: string
        }
        Returns: string
      }
      log_auth_attempt: {
        Args: {
          attempt_type: string
          user_identifier: string
          success: boolean
          error_message?: string
          metadata?: Json
        }
        Returns: string
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
      log_security_event: {
        Args: {
          event_type: string
          description: string
          severity?: string
          user_id_param?: string
          metadata?: Json
        }
        Returns: string
      }
      process_installment_payment: {
        Args: {
          p_installment_id: string
          p_payment_amount: number
          p_payment_method?: string
          p_notes?: string
        }
        Returns: boolean
      }
      process_rental_payment: {
        Args: {
          p_installment_id: string
          p_payment_amount: number
          p_payment_method?: string
          p_cheque_number?: string
          p_bank_name?: string
          p_notes?: string
        }
        Returns: boolean
      }
      schedule_debt_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      schedule_renewal_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      secure_role_change: {
        Args: {
          target_user_id: string
          new_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      security_audit_summary: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      send_commission_notification: {
        Args: {
          employee_id_param: string
          commission_id_param: string
          commission_amount: number
        }
        Returns: string
      }
      update_commission_employee_percentages: {
        Args: { p_commission_id: string; p_employee_percentages: Json }
        Returns: Json
      }
      update_employee_targets_progress: {
        Args: { employee_id_param: string }
        Returns: undefined
      }
      update_service_stage: {
        Args: {
          service_id_param: string
          stage_name_param: string
          stage_status_param?: string
          notes_param?: string
        }
        Returns: boolean
      }
      validate_password_strength: {
        Args: { password: string }
        Returns: Json
      }
      validate_role_access: {
        Args: { required_role: Database["public"]["Enums"]["app_role"] }
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
