export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          address: string | null
          assigned_to: string | null
          budget_max: number | null
          budget_min: number | null
          city: string | null
          client_type: string | null
          company: string | null
          created_at: string | null
          created_by: string
          email: string | null
          full_name: string
          id: string
          id_number: string | null
          nationality: string | null
          notes: string | null
          passport_number: string | null
          phone: string | null
          preferred_areas: string[] | null
          preferred_language: string | null
          priority: string | null
          property_interest: string | null
          source: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          client_type?: string | null
          company?: string | null
          created_at?: string | null
          created_by?: string
          email?: string | null
          full_name: string
          id?: string
          id_number?: string | null
          nationality?: string | null
          notes?: string | null
          passport_number?: string | null
          phone?: string | null
          preferred_areas?: string[] | null
          preferred_language?: string | null
          priority?: string | null
          property_interest?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          client_type?: string | null
          company?: string | null
          created_at?: string | null
          created_by?: string
          email?: string | null
          full_name?: string
          id?: string
          id_number?: string | null
          nationality?: string | null
          notes?: string | null
          passport_number?: string | null
          phone?: string | null
          preferred_areas?: string[] | null
          preferred_language?: string | null
          priority?: string | null
          property_interest?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      commissions: {
        Row: {
          amount: number
          approved_by: string | null
          base_amount: number | null
          client_id: string | null
          commission_type: string
          created_at: string | null
          created_by: string
          deal_id: string | null
          description: string | null
          due_date: string | null
          earned_date: string | null
          employee_id: string
          id: string
          notes: string | null
          paid_date: string | null
          payment_status: string | null
          percentage: number | null
          property_id: string | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          amount: number
          approved_by?: string | null
          base_amount?: number | null
          client_id?: string | null
          commission_type: string
          created_at?: string | null
          created_by?: string
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          earned_date?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          paid_date?: string | null
          payment_status?: string | null
          percentage?: number | null
          property_id?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          amount?: number
          approved_by?: string | null
          base_amount?: number | null
          client_id?: string | null
          commission_type?: string
          created_at?: string | null
          created_by?: string
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          earned_date?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          paid_date?: string | null
          payment_status?: string | null
          percentage?: number | null
          property_id?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          reminder_time: string | null
          scheduled_date: string
          status: string
          target_count: number | null
          target_suppliers: Json | null
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          reminder_time?: string | null
          scheduled_date: string
          status?: string
          target_count?: number | null
          target_suppliers?: Json | null
          task_type: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          reminder_time?: string | null
          scheduled_date?: string
          status?: string
          target_count?: number | null
          target_suppliers?: Json | null
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      debts: {
        Row: {
          created_at: string | null
          created_by: string
          currency: string | null
          debt_date: string
          debt_type: string
          debtor_id: string | null
          debtor_name: string
          debtor_type: string
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          original_amount: number
          remaining_amount: number
          source_id: string | null
          source_table: string | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string
          currency?: string | null
          debt_date?: string
          debt_type: string
          debtor_id?: string | null
          debtor_name: string
          debtor_type: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          original_amount: number
          remaining_amount: number
          source_id?: string | null
          source_table?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          currency?: string | null
          debt_date?: string
          debt_type?: string
          debtor_id?: string | null
          debtor_name?: string
          debtor_type?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          original_amount?: number
          remaining_amount?: number
          source_id?: string | null
          source_table?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      enhanced_contact_channels: {
        Row: {
          channel_type: string
          channel_value: string
          contact_id: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          is_verified: boolean | null
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          channel_type: string
          channel_value: string
          contact_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          channel_type?: string
          channel_value?: string
          contact_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      enhanced_contacts: {
        Row: {
          address: string | null
          area_max: number | null
          area_min: number | null
          assigned_to: string | null
          budget_max: number | null
          budget_min: number | null
          city: string | null
          client_stage: string | null
          company: string | null
          country: string | null
          created_at: string | null
          created_by: string
          custom_fields: Json | null
          deals_count: number | null
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          follow_up_status: string | null
          full_name: string | null
          id: string
          is_being_deleted: boolean | null
          language: string | null
          last_deal_date: string | null
          last_interaction_date: string | null
          lead_source: string | null
          metadata: Json | null
          nationality: string | null
          next_follow_up_date: string | null
          notes: string | null
          original_id: string | null
          original_table: string | null
          phone: string | null
          phone_primary: string | null
          phone_secondary: string | null
          position: string | null
          preferred_location: string | null
          priority: string | null
          property_type_interest: string | null
          rating: number | null
          roles: string[] | null
          search_vector: unknown | null
          short_name: string | null
          source: string | null
          status: string | null
          tags: string[] | null
          total_deal_value: number | null
          updated_at: string | null
          updated_by: string | null
          whatsapp_number: string | null
        }
        Insert: {
          address?: string | null
          area_max?: number | null
          area_min?: number | null
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          client_stage?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string
          custom_fields?: Json | null
          deals_count?: number | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          follow_up_status?: string | null
          full_name?: string | null
          id?: string
          is_being_deleted?: boolean | null
          language?: string | null
          last_deal_date?: string | null
          last_interaction_date?: string | null
          lead_source?: string | null
          metadata?: Json | null
          nationality?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          original_id?: string | null
          original_table?: string | null
          phone?: string | null
          phone_primary?: string | null
          phone_secondary?: string | null
          position?: string | null
          preferred_location?: string | null
          priority?: string | null
          property_type_interest?: string | null
          rating?: number | null
          roles?: string[] | null
          search_vector?: unknown | null
          short_name?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          total_deal_value?: number | null
          updated_at?: string | null
          updated_by?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          address?: string | null
          area_max?: number | null
          area_min?: number | null
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          client_stage?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string
          custom_fields?: Json | null
          deals_count?: number | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          follow_up_status?: string | null
          full_name?: string | null
          id?: string
          is_being_deleted?: boolean | null
          language?: string | null
          last_deal_date?: string | null
          last_interaction_date?: string | null
          lead_source?: string | null
          metadata?: Json | null
          nationality?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          original_id?: string | null
          original_table?: string | null
          phone?: string | null
          phone_primary?: string | null
          phone_secondary?: string | null
          position?: string | null
          preferred_location?: string | null
          priority?: string | null
          property_type_interest?: string | null
          rating?: number | null
          roles?: string[] | null
          search_vector?: unknown | null
          short_name?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          total_deal_value?: number | null
          updated_at?: string | null
          updated_by?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          attachments: string[] | null
          category: string
          created_at: string | null
          created_by: string
          currency: string | null
          department: string | null
          description: string | null
          employee_id: string | null
          expense_date: string
          id: string
          notes: string | null
          payment_method: string | null
          receipt_url: string | null
          reference_number: string | null
          status: string | null
          subcategory: string | null
          title: string
          updated_at: string | null
          updated_by: string | null
          vendor_name: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          attachments?: string[] | null
          category: string
          created_at?: string | null
          created_by?: string
          currency?: string | null
          department?: string | null
          description?: string | null
          employee_id?: string | null
          expense_date?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          reference_number?: string | null
          status?: string | null
          subcategory?: string | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          attachments?: string[] | null
          category?: string
          created_at?: string | null
          created_by?: string
          currency?: string | null
          department?: string | null
          description?: string | null
          employee_id?: string | null
          expense_date?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          reference_number?: string | null
          status?: string | null
          subcategory?: string | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          vendor_name?: string | null
        }
        Relationships: []
      }
      external_suppliers: {
        Row: {
          assigned_to: string | null
          category: string
          company_name: string | null
          contact_name: string | null
          created_at: string
          created_by: string
          first_name: string | null
          id: string
          is_active: boolean | null
          last_contact_date: string | null
          last_contact_type: string | null
          last_name: string | null
          name: string
          notes: string | null
          phone: string
          priority: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          company_name?: string | null
          contact_name?: string | null
          created_at?: string
          created_by: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_contact_date?: string | null
          last_contact_type?: string | null
          last_name?: string | null
          name: string
          notes?: string | null
          phone: string
          priority?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          company_name?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_contact_date?: string | null
          last_contact_type?: string | null
          last_name?: string | null
          name?: string
          notes?: string | null
          phone?: string
          priority?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          budget_range: string | null
          company: string | null
          conversion_date: string | null
          converted_to_client_id: string | null
          created_at: string | null
          created_by: string
          email: string | null
          full_name: string
          id: string
          interaction_count: number | null
          last_contact_date: string | null
          next_follow_up: string | null
          notes: string | null
          phone: string | null
          property_interest: string | null
          source: string | null
          specific_requirements: string | null
          stage: string | null
          status: string | null
          tags: string[] | null
          timeline: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          assigned_to?: string | null
          budget_range?: string | null
          company?: string | null
          conversion_date?: string | null
          converted_to_client_id?: string | null
          created_at?: string | null
          created_by?: string
          email?: string | null
          full_name: string
          id?: string
          interaction_count?: number | null
          last_contact_date?: string | null
          next_follow_up?: string | null
          notes?: string | null
          phone?: string | null
          property_interest?: string | null
          source?: string | null
          specific_requirements?: string | null
          stage?: string | null
          status?: string | null
          tags?: string[] | null
          timeline?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          assigned_to?: string | null
          budget_range?: string | null
          company?: string | null
          conversion_date?: string | null
          converted_to_client_id?: string | null
          created_at?: string | null
          created_by?: string
          email?: string | null
          full_name?: string
          id?: string
          interaction_count?: number | null
          last_contact_date?: string | null
          next_follow_up?: string | null
          notes?: string | null
          phone?: string | null
          property_interest?: string | null
          source?: string | null
          specific_requirements?: string | null
          stage?: string | null
          status?: string | null
          tags?: string[] | null
          timeline?: string | null
          updated_at?: string | null
          updated_by?: string | null
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
          address: string | null
          amenities: string[] | null
          area: string | null
          area_sqft: number | null
          area_sqm: number | null
          assigned_to: string | null
          bathrooms: number | null
          bedrooms: number | null
          building_name: string | null
          city: string | null
          created_at: string | null
          created_by: string
          description: string | null
          documents: string[] | null
          features: string[] | null
          floor_number: number | null
          id: string
          images: string[] | null
          listing_type: string | null
          notes: string | null
          owner_id: string | null
          price: number | null
          price_negotiable: boolean | null
          price_per_sqft: number | null
          property_type: string
          status: string | null
          tags: string[] | null
          title: string
          unit_number: string | null
          updated_at: string | null
          updated_by: string | null
          virtual_tour_url: string | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          area?: string | null
          area_sqft?: number | null
          area_sqm?: number | null
          assigned_to?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          building_name?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          documents?: string[] | null
          features?: string[] | null
          floor_number?: number | null
          id?: string
          images?: string[] | null
          listing_type?: string | null
          notes?: string | null
          owner_id?: string | null
          price?: number | null
          price_negotiable?: boolean | null
          price_per_sqft?: number | null
          property_type: string
          status?: string | null
          tags?: string[] | null
          title: string
          unit_number?: string | null
          updated_at?: string | null
          updated_by?: string | null
          virtual_tour_url?: string | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          area?: string | null
          area_sqft?: number | null
          area_sqm?: number | null
          assigned_to?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          building_name?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          documents?: string[] | null
          features?: string[] | null
          floor_number?: number | null
          id?: string
          images?: string[] | null
          listing_type?: string | null
          notes?: string | null
          owner_id?: string | null
          price?: number | null
          price_negotiable?: boolean | null
          price_per_sqft?: number | null
          property_type?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          unit_number?: string | null
          updated_at?: string | null
          updated_by?: string | null
          virtual_tour_url?: string | null
        }
        Relationships: []
      }
      property_owners: {
        Row: {
          address: string | null
          assigned_to: string | null
          best_time_to_call: string | null
          city: string | null
          company: string | null
          created_at: string | null
          created_by: string
          email: string | null
          full_name: string
          id: string
          id_number: string | null
          nationality: string | null
          notes: string | null
          owner_type: string | null
          passport_number: string | null
          phone: string | null
          preferred_contact_method: string | null
          preferred_language: string | null
          properties_count: number | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          best_time_to_call?: string | null
          city?: string | null
          company?: string | null
          created_at?: string | null
          created_by?: string
          email?: string | null
          full_name: string
          id?: string
          id_number?: string | null
          nationality?: string | null
          notes?: string | null
          owner_type?: string | null
          passport_number?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          preferred_language?: string | null
          properties_count?: number | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          best_time_to_call?: string | null
          city?: string | null
          company?: string | null
          created_at?: string | null
          created_by?: string
          email?: string | null
          full_name?: string
          id?: string
          id_number?: string | null
          nationality?: string | null
          notes?: string | null
          owner_type?: string | null
          passport_number?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          preferred_language?: string | null
          properties_count?: number | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      revenues: {
        Row: {
          amount: number
          client_id: string | null
          contract_id: string | null
          created_at: string | null
          created_by: string
          currency: string | null
          description: string | null
          id: string
          notes: string | null
          payment_method: string | null
          property_id: string | null
          reference_number: string | null
          revenue_date: string
          source: string
          status: string | null
          subcategory: string | null
          title: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          amount: number
          client_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          created_by?: string
          currency?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          property_id?: string | null
          reference_number?: string | null
          revenue_date?: string
          source: string
          status?: string | null
          subcategory?: string | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          amount?: number
          client_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          created_by?: string
          currency?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          property_id?: string | null
          reference_number?: string | null
          revenue_date?: string
          source?: string
          status?: string | null
          subcategory?: string | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          assigned_date: string | null
          assigned_to: string | null
          color: string | null
          created_at: string | null
          created_by: string
          current_value: number | null
          id: string
          insurance_company: string | null
          insurance_expiry: string | null
          insurance_policy_number: string | null
          make: string
          model: string
          notes: string | null
          plate_number: string | null
          purchase_date: string | null
          purchase_price: number | null
          registration_expiry: string | null
          registration_number: string | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
          vin_number: string | null
          year: number | null
        }
        Insert: {
          assigned_date?: string | null
          assigned_to?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string
          current_value?: number | null
          id?: string
          insurance_company?: string | null
          insurance_expiry?: string | null
          insurance_policy_number?: string | null
          make: string
          model: string
          notes?: string | null
          plate_number?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          registration_expiry?: string | null
          registration_number?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          vin_number?: string | null
          year?: number | null
        }
        Update: {
          assigned_date?: string | null
          assigned_to?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string
          current_value?: number | null
          id?: string
          insurance_company?: string | null
          insurance_expiry?: string | null
          insurance_policy_number?: string | null
          make?: string
          model?: string
          notes?: string | null
          plate_number?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          registration_expiry?: string | null
          registration_number?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          vin_number?: string | null
          year?: number | null
        }
        Relationships: []
      }
      whatsapp_bulk_messages: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string
          custom_recipients: string[] | null
          failed_count: number | null
          id: string
          media_type: string | null
          media_url: string | null
          message_content: string
          message_type: string | null
          name: string
          recipient_filters: Json | null
          recipient_type: string | null
          scheduled_at: string | null
          send_type: string | null
          sent_count: number | null
          started_at: string | null
          status: string | null
          success_rate: number | null
          total_recipients: number | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          custom_recipients?: string[] | null
          failed_count?: number | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          message_content: string
          message_type?: string | null
          name: string
          recipient_filters?: Json | null
          recipient_type?: string | null
          scheduled_at?: string | null
          send_type?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?: string | null
          success_rate?: number | null
          total_recipients?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          custom_recipients?: string[] | null
          failed_count?: number | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          message_content?: string
          message_type?: string | null
          name?: string
          recipient_filters?: Json | null
          recipient_type?: string | null
          scheduled_at?: string | null
          send_type?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?: string | null
          success_rate?: number | null
          total_recipients?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_campaigns: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          name: string
          scheduled_at: string | null
          status: string | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          name: string
          scheduled_at?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          scheduled_at?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_contacts: {
        Row: {
          company: string | null
          created_at: string | null
          created_by: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone_number: string
          tags: string[] | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          created_by?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone_number: string
          tags?: string[] | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          created_by?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone_number?: string
          tags?: string[] | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          campaign_id: string | null
          contact_id: string | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          message_content: string
          message_type: string | null
          phone_number: string
          sent_at: string | null
          sent_by: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message_content: string
          message_type?: string | null
          phone_number: string
          sent_at?: string | null
          sent_by?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message_content?: string
          message_type?: string | null
          phone_number?: string
          sent_at?: string | null
          sent_by?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_settings: {
        Row: {
          api_key: string | null
          created_at: string | null
          default_footer: string | null
          id: string
          is_active: boolean | null
          phone_number: string | null
          updated_at: string | null
        }
        Insert: {
          api_key?: string | null
          created_at?: string | null
          default_footer?: string | null
          id?: string
          is_active?: boolean | null
          phone_number?: string | null
          updated_at?: string | null
        }
        Update: {
          api_key?: string | null
          created_at?: string | null
          default_footer?: string | null
          id?: string
          is_active?: boolean | null
          phone_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_smart_logs: {
        Row: {
          created_at: string
          id: string
          message_sent: string
          message_template: string
          phone_number: string
          sent_at: string
          sent_by: string
          status: string
          supplier_id: string | null
          task_id: string | null
          whatsapp_message_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message_sent: string
          message_template: string
          phone_number: string
          sent_at?: string
          sent_by: string
          status?: string
          supplier_id?: string | null
          task_id?: string | null
          whatsapp_message_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message_sent?: string
          message_template?: string
          phone_number?: string
          sent_at?: string
          sent_by?: string
          status?: string
          supplier_id?: string | null
          task_id?: string | null
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_smart_logs_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "external_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_smart_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "daily_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_smart_settings: {
        Row: {
          auto_send_enabled: boolean | null
          daily_message_limit: number
          daily_reminder_time: string | null
          id: string
          message_cooldown_hours: number
          message_template_ar: string
          message_template_en: string
          target_categories: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_send_enabled?: boolean | null
          daily_message_limit?: number
          daily_reminder_time?: string | null
          id?: string
          message_cooldown_hours?: number
          message_template_ar?: string
          message_template_en?: string
          target_categories?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_send_enabled?: boolean | null
          daily_message_limit?: number
          daily_reminder_time?: string | null
          id?: string
          message_cooldown_hours?: number
          message_template_ar?: string
          message_template_en?: string
          target_categories?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          id: string
          is_active: boolean | null
          name: string
          type: string | null
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string
          id?: string
          is_active?: boolean | null
          name: string
          type?: string | null
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string | null
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_first_admin: {
        Args: {
          p_email: string
          p_first_name?: string
          p_last_name?: string
          p_user_id: string
        }
        Returns: Json
      }
      find_user_by_email: {
        Args: { p_email: string }
        Returns: {
          avatar_url: string
          created_at: string
          email: string
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          phone: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }[]
      }
      get_current_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          created_at: string
          email: string
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          phone: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }[]
      }
      has_admin_users: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      secure_change_user_role: {
        Args: { new_role: string; target_user_id: string }
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
