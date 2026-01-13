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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      commissions: {
        Row: {
          amount: number
          contract_id: string | null
          created_at: string
          currency: string
          deleted_at: string | null
          id: string
          notes: string | null
          org_id: string
          property_address: string
          property_id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          contract_id?: string | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          property_address: string
          property_id: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          contract_id?: string | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          property_address?: string
          property_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_logs: {
        Row: {
          categories: Json
          created_at: string
          id: string
          language: string
          session_id: string
          timestamp: string
          user_agent: string | null
          user_id: string | null
          version: string
        }
        Insert: {
          categories: Json
          created_at?: string
          id?: string
          language: string
          session_id: string
          timestamp: string
          user_agent?: string | null
          user_id?: string | null
          version?: string
        }
        Update: {
          categories?: Json
          created_at?: string
          id?: string
          language?: string
          session_id?: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
          version?: string
        }
        Relationships: []
      }
      contract_clause_overrides: {
        Row: {
          clause_index: number
          clause_type: string
          contract_id: string
          created_at: string | null
          custom_content: string
          deleted_at: string | null
          id: string
          org_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          clause_index: number
          clause_type: string
          contract_id: string
          created_at?: string | null
          custom_content: string
          deleted_at?: string | null
          id?: string
          org_id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          clause_index?: number
          clause_type?: string
          contract_id?: string
          created_at?: string | null
          custom_content?: string
          deleted_at?: string | null
          id?: string
          org_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_clause_overrides_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_clause_overrides_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_clause_templates: {
        Row: {
          clause_index: number
          clause_type: string
          content: string
          created_at: string | null
          deleted_at: string | null
          id: string
          is_active: boolean | null
          org_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          clause_index: number
          clause_type: string
          content: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          org_id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          clause_index?: number
          clause_type?: string
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          org_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_clause_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_details: {
        Row: {
          annual_rent: number | null
          contract_duration_months: number | null
          contract_id: string
          created_at: string | null
          deleted_at: string | null
          deposit_amount: number | null
          deposit_currency: string | null
          furniture_list: Json | null
          id: string
          org_id: string
          payment_day_of_month: number | null
          payment_method: string | null
          rent_increase_rate: number | null
          special_conditions: string | null
          updated_at: string | null
          usage_purpose: string | null
          user_id: string
          utilities_included: Json | null
        }
        Insert: {
          annual_rent?: number | null
          contract_duration_months?: number | null
          contract_id: string
          created_at?: string | null
          deleted_at?: string | null
          deposit_amount?: number | null
          deposit_currency?: string | null
          furniture_list?: Json | null
          id?: string
          org_id?: string
          payment_day_of_month?: number | null
          payment_method?: string | null
          rent_increase_rate?: number | null
          special_conditions?: string | null
          updated_at?: string | null
          usage_purpose?: string | null
          user_id: string
          utilities_included?: Json | null
        }
        Update: {
          annual_rent?: number | null
          contract_duration_months?: number | null
          contract_id?: string
          created_at?: string | null
          deleted_at?: string | null
          deposit_amount?: number | null
          deposit_currency?: string | null
          furniture_list?: Json | null
          id?: string
          org_id?: string
          payment_day_of_month?: number | null
          payment_method?: string | null
          rent_increase_rate?: number | null
          special_conditions?: string | null
          updated_at?: string | null
          usage_purpose?: string | null
          user_id?: string
          utilities_included?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_details_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: true
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_details_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_instances_v2: {
        Row: {
          created_at: string
          form_data: Json
          id: string
          parties: Json
          pdf_path: string | null
          rendered_content: string
          signed_at: string | null
          signed_by: string | null
          status: string
          template_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          form_data?: Json
          id?: string
          parties?: Json
          pdf_path?: string | null
          rendered_content: string
          signed_at?: string | null
          signed_by?: string | null
          status?: string
          template_id?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          form_data?: Json
          id?: string
          parties?: Json
          pdf_path?: string | null
          rendered_content?: string
          signed_at?: string | null
          signed_by?: string | null
          status?: string
          template_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_instances_v2_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates_v2: {
        Row: {
          content: string
          created_at: string
          id: string
          is_default: boolean
          name: string
          placeholders: string[]
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          placeholders?: string[]
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          placeholders?: string[]
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          contract_pdf_path: string | null
          created_at: string | null
          currency: string | null
          deleted_at: string | null
          deposit: number | null
          end_date: string
          expected_new_rent: number | null
          id: string
          notes: string | null
          org_id: string
          property_id: string
          reminder_notes: string | null
          rent_amount: number | null
          rent_increase_reminder_contacted: boolean | null
          rent_increase_reminder_days: number | null
          rent_increase_reminder_enabled: boolean | null
          start_date: string
          status: string
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          contract_pdf_path?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          deposit?: number | null
          end_date: string
          expected_new_rent?: number | null
          id?: string
          notes?: string | null
          org_id?: string
          property_id: string
          reminder_notes?: string | null
          rent_amount?: number | null
          rent_increase_reminder_contacted?: boolean | null
          rent_increase_reminder_days?: number | null
          rent_increase_reminder_enabled?: boolean | null
          start_date: string
          status?: string
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          contract_pdf_path?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          deposit?: number | null
          end_date?: string
          expected_new_rent?: number | null
          id?: string
          notes?: string | null
          org_id?: string
          property_id?: string
          reminder_notes?: string | null
          rent_amount?: number | null
          rent_increase_reminder_contacted?: boolean | null
          rent_increase_reminder_days?: number | null
          rent_increase_reminder_enabled?: boolean | null
          start_date?: string
          status?: string
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          fetched_at: string
          from_currency: string
          id: string
          rate: number
          rate_date: string
          source: string | null
          to_currency: string
        }
        Insert: {
          fetched_at?: string
          from_currency: string
          id?: string
          rate: number
          rate_date: string
          source?: string | null
          to_currency: string
        }
        Update: {
          fetched_at?: string
          from_currency?: string
          id?: string
          rate?: number
          rate_date?: string
          source?: string | null
          to_currency?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          color: string | null
          created_at: string
          deleted_at: string | null
          icon: string | null
          id: string
          is_active: boolean
          is_default: boolean
          monthly_budget: number | null
          name: string
          org_id: string | null
          parent_category: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          monthly_budget?: number | null
          name: string
          org_id?: string | null
          parent_category?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          monthly_budget?: number | null
          name?: string
          org_id?: string | null
          parent_category?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          category: string
          commission_id: string | null
          contract_id: string | null
          created_at: string
          currency: string
          deleted_at: string | null
          description: string
          id: string
          invoice_number: string | null
          is_recurring: boolean
          notes: string | null
          org_id: string
          parent_transaction_id: string | null
          payment_method: string | null
          payment_status: string
          property_id: string | null
          receipt_url: string | null
          recurring_day: number | null
          recurring_end_date: string | null
          recurring_frequency: string | null
          subcategory: string | null
          transaction_date: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          commission_id?: string | null
          contract_id?: string | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description: string
          id?: string
          invoice_number?: string | null
          is_recurring?: boolean
          notes?: string | null
          org_id?: string
          parent_transaction_id?: string | null
          payment_method?: string | null
          payment_status?: string
          property_id?: string | null
          receipt_url?: string | null
          recurring_day?: number | null
          recurring_end_date?: string | null
          recurring_frequency?: string | null
          subcategory?: string | null
          transaction_date: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          commission_id?: string | null
          contract_id?: string | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string
          id?: string
          invoice_number?: string | null
          is_recurring?: boolean
          notes?: string | null
          org_id?: string
          parent_transaction_id?: string | null
          payment_method?: string | null
          payment_status?: string
          property_id?: string | null
          receipt_url?: string | null
          recurring_day?: number | null
          recurring_end_date?: string | null
          recurring_frequency?: string | null
          subcategory?: string | null
          transaction_date?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_parent_transaction_id_fkey"
            columns: ["parent_transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry_matches: {
        Row: {
          contacted: boolean | null
          deleted_at: string | null
          id: string
          inquiry_id: string
          matched_at: string | null
          notification_sent: boolean | null
          org_id: string
          property_id: string
          user_id: string
        }
        Insert: {
          contacted?: boolean | null
          deleted_at?: string | null
          id?: string
          inquiry_id: string
          matched_at?: string | null
          notification_sent?: boolean | null
          org_id?: string
          property_id: string
          user_id: string
        }
        Update: {
          contacted?: boolean | null
          deleted_at?: string | null
          id?: string
          inquiry_id?: string
          matched_at?: string | null
          notification_sent?: boolean | null
          org_id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_matches_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "property_inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiry_matches_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiry_matches_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          notes: string | null
          org_id: string
          owner_id: string | null
          property_id: string | null
          reminder_minutes: number | null
          start_time: string
          tenant_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          owner_id?: string | null
          property_id?: string | null
          reminder_minutes?: number | null
          start_time: string
          tenant_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          owner_id?: string | null
          property_id?: string | null
          reminder_minutes?: number | null
          start_time?: string
          tenant_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "property_owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      org_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invitation_token: string
          invited_at: string
          invited_by: string | null
          org_id: string
          role: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invitation_token: string
          invited_at?: string
          invited_by?: string | null
          org_id: string
          role?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_at?: string
          invited_by?: string | null
          org_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          org_id: string
          role: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          org_id: string
          role?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          org_id?: string
          role?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_events: {
        Row: {
          action_taken: string
          created_at: string
          data: Json | null
          id: string
          org_id: string
          step_name: string
          step_number: number
          user_id: string
        }
        Insert: {
          action_taken: string
          created_at?: string
          data?: Json | null
          id?: string
          org_id: string
          step_name: string
          step_number: number
          user_id: string
        }
        Update: {
          action_taken?: string
          created_at?: string
          data?: Json | null
          id?: string
          org_id?: string
          step_name?: string
          step_number?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          onboarding_skipped: boolean | null
          onboarding_skipped_at: string | null
          onboarding_step: number | null
          primary_use_case: string | null
          settings: Json | null
          slug: string
          team_size_range: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_skipped?: boolean | null
          onboarding_skipped_at?: string | null
          onboarding_step?: number | null
          primary_use_case?: string | null
          settings?: Json | null
          slug: string
          team_size_range?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_skipped?: boolean | null
          onboarding_skipped_at?: string | null
          onboarding_step?: number | null
          primary_use_case?: string | null
          settings?: Json | null
          slug?: string
          team_size_range?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          bina_no: string | null
          buyer_email: string | null
          buyer_name: string | null
          buyer_phone: string | null
          cadde_sokak: string | null
          city: string | null
          created_at: string | null
          currency: string | null
          daire_no: string | null
          deleted_at: string | null
          district: string | null
          full_address: string | null
          id: string
          il: string | null
          ilce: string | null
          listing_url: string | null
          mahalle: string | null
          normalized_address: string | null
          notes: string | null
          offer_amount: number | null
          offer_date: string | null
          org_id: string
          owner_id: string
          property_type: string
          rent_amount: number | null
          sale_price: number | null
          sold_at: string | null
          sold_price: number | null
          status: string
          type: string | null
          updated_at: string | null
          use_purpose: string | null
          user_id: string
        }
        Insert: {
          address: string
          bina_no?: string | null
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          cadde_sokak?: string | null
          city?: string | null
          created_at?: string | null
          currency?: string | null
          daire_no?: string | null
          deleted_at?: string | null
          district?: string | null
          full_address?: string | null
          id?: string
          il?: string | null
          ilce?: string | null
          listing_url?: string | null
          mahalle?: string | null
          normalized_address?: string | null
          notes?: string | null
          offer_amount?: number | null
          offer_date?: string | null
          org_id?: string
          owner_id: string
          property_type?: string
          rent_amount?: number | null
          sale_price?: number | null
          sold_at?: string | null
          sold_price?: number | null
          status?: string
          type?: string | null
          updated_at?: string | null
          use_purpose?: string | null
          user_id: string
        }
        Update: {
          address?: string
          bina_no?: string | null
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          cadde_sokak?: string | null
          city?: string | null
          created_at?: string | null
          currency?: string | null
          daire_no?: string | null
          deleted_at?: string | null
          district?: string | null
          full_address?: string | null
          id?: string
          il?: string | null
          ilce?: string | null
          listing_url?: string | null
          mahalle?: string | null
          normalized_address?: string | null
          notes?: string | null
          offer_amount?: number | null
          offer_date?: string | null
          org_id?: string
          owner_id?: string
          property_type?: string
          rent_amount?: number | null
          sale_price?: number | null
          sold_at?: string | null
          sold_price?: number | null
          status?: string
          type?: string | null
          updated_at?: string | null
          use_purpose?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "property_owners"
            referencedColumns: ["id"]
          },
        ]
      }
      property_inquiries: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          email: string | null
          id: string
          inquiry_type: string
          max_rent_budget: number | null
          max_sale_budget: number | null
          min_rent_budget: number | null
          min_sale_budget: number | null
          name: string
          notes: string | null
          org_id: string
          phone: string
          preferred_city: string | null
          preferred_district: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          inquiry_type?: string
          max_rent_budget?: number | null
          max_sale_budget?: number | null
          min_rent_budget?: number | null
          min_sale_budget?: number | null
          name: string
          notes?: string | null
          org_id?: string
          phone: string
          preferred_city?: string | null
          preferred_district?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          inquiry_type?: string
          max_rent_budget?: number | null
          max_sale_budget?: number | null
          min_rent_budget?: number | null
          min_sale_budget?: number | null
          name?: string
          notes?: string | null
          org_id?: string
          phone?: string
          preferred_city?: string | null
          preferred_district?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_inquiries_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      property_owners: {
        Row: {
          address: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          iban_encrypted: string | null
          id: string
          name: string
          notes: string | null
          org_id: string
          phone: string | null
          tc_encrypted: string | null
          tc_hash: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          iban_encrypted?: string | null
          id?: string
          name: string
          notes?: string | null
          org_id?: string
          phone?: string | null
          tc_encrypted?: string | null
          tc_hash?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          iban_encrypted?: string | null
          id?: string
          name?: string
          notes?: string | null
          org_id?: string
          phone?: string | null
          tc_encrypted?: string | null
          tc_hash?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_owners_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      property_photos: {
        Row: {
          created_at: string | null
          file_path: string
          id: string
          property_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          file_path: string
          id?: string
          property_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          file_path?: string
          id?: string
          property_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_photos_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_expenses: {
        Row: {
          amount: number
          auto_create_transaction: boolean
          category: string
          created_at: string
          currency: string
          day_of_month: number | null
          deleted_at: string | null
          description: string | null
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean
          last_generated_date: string | null
          name: string
          next_due_date: string
          notes: string | null
          org_id: string
          payment_method: string | null
          reminder_days_before: number | null
          start_date: string
          updated_at: string
          user_id: string
          vendor_name: string | null
        }
        Insert: {
          amount: number
          auto_create_transaction?: boolean
          category: string
          created_at?: string
          currency?: string
          day_of_month?: number | null
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          frequency: string
          id?: string
          is_active?: boolean
          last_generated_date?: string | null
          name: string
          next_due_date: string
          notes?: string | null
          org_id?: string
          payment_method?: string | null
          reminder_days_before?: number | null
          start_date: string
          updated_at?: string
          user_id: string
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          auto_create_transaction?: boolean
          category?: string
          created_at?: string
          currency?: string
          day_of_month?: number | null
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          last_generated_date?: string | null
          name?: string
          next_due_date?: string
          notes?: string | null
          org_id?: string
          payment_method?: string | null
          reminder_days_before?: number | null
          start_date?: string
          updated_at?: string
          user_id?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_expenses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          stripe_customer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          stripe_customer_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          stripe_customer_id?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          currency: string
          current_period_end: string
          current_period_start: string
          id: string
          interval: string
          status: string
          stripe_customer_id: string
          stripe_price_id: string
          stripe_product_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          currency: string
          current_period_end: string
          current_period_start: string
          id?: string
          interval: string
          status: string
          stripe_customer_id: string
          stripe_price_id: string
          stripe_product_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          currency?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          interval?: string
          status?: string
          stripe_customer_id?: string
          stripe_price_id?: string
          stripe_product_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          address: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          org_id: string
          phone: string | null
          tc_encrypted: string | null
          tc_hash: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          org_id?: string
          phone?: string | null
          tc_encrypted?: string | null
          tc_hash?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          org_id?: string
          phone?: string | null
          tc_encrypted?: string | null
          tc_hash?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_billing: {
        Row: {
          billing_status: string
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          last_payment_date: string | null
          next_billing_date: string | null
          payment_method_type: string | null
          plan_id: string
          plan_name: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_start: string | null
          trial_end: string
          trial_start: string
          trial_used: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_status?: string
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          last_payment_date?: string | null
          next_billing_date?: string | null
          payment_method_type?: string | null
          plan_id?: string
          plan_name?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_start?: string | null
          trial_end?: string
          trial_start?: string
          trial_used?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_status?: string
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          last_payment_date?: string | null
          next_billing_date?: string | null
          payment_method_type?: string | null
          plan_id?: string
          plan_name?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_start?: string | null
          trial_end?: string
          trial_start?: string
          trial_used?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          commission_rate: number | null
          currency: string | null
          full_name: string | null
          language: string | null
          meeting_reminder_minutes: number | null
          onboarding_banner_dismissed_at: string | null
          phone_number: string | null
          user_id: string
        }
        Insert: {
          commission_rate?: number | null
          currency?: string | null
          full_name?: string | null
          language?: string | null
          meeting_reminder_minutes?: number | null
          onboarding_banner_dismissed_at?: string | null
          phone_number?: string | null
          user_id: string
        }
        Update: {
          commission_rate?: number | null
          currency?: string | null
          full_name?: string | null
          language?: string | null
          meeting_reminder_minutes?: number | null
          onboarding_banner_dismissed_at?: string | null
          phone_number?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_org_invitation: {
        Args: { p_token: string }
        Returns: Json
      }
      calculate_next_due_date: {
        Args: { current_due_date: string; day_of_month?: number; freq: string }
        Returns: string
      }
      consume_quota: {
        Args: {
          p_client_request_id?: string
          p_device_id?: string
          p_user_id?: string
        }
        Returns: Json
      }
      generate_invitation_token: {
        Args: Record<string, never>
        Returns: string
      }
      get_invitation_info: {
        Args: { p_token: string }
        Returns: Json
      }
      create_contract_atomic: {
        Args: {
          contract_data: Json
          contract_details_data: Json
          owner_data: Json
          property_data: Json
          tenant_data: Json
          user_id_param: string
        }
        Returns: Json
      }
      create_sale_commission: {
        Args: {
          p_currency?: string
          p_property_id: string
          p_sale_price: number
        }
        Returns: string
      }
      get_quota: {
        Args: { p_device_id?: string; p_user_id?: string }
        Returns: Json
      }
      get_org_members_with_users: {
        Args: { p_org_id: string }
        Returns: Json
      }
      get_user_id_by_email: {
        Args: { email_input: string }
        Returns: { id: string }[]
      }
      has_active_subscription: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      rpc_create_contract_and_update_property: {
        Args: { p_contract: Json }
        Returns: Json
      }
      rpc_create_tenant_with_contract: {
        Args: { p_contract: Json; p_tenant: Json }
        Returns: Json
      }
      rpc_delete_contract: { Args: { p_contract_id: string }; Returns: Json }
      rpc_property_photo_delete: {
        Args: { p_photo_id: string; p_property_id: string }
        Returns: string
      }
      rpc_property_photo_insert: {
        Args: { p_file_path: string; p_property_id: string }
        Returns: {
          created_at: string | null
          file_path: string
          id: string
          property_id: string
          sort_order: number | null
        }
        SetofOptions: {
          from: "*"
          to: "property_photos"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      rpc_property_photos_reorder: {
        Args: { p_photo_ids: string[]; p_property_id: string }
        Returns: undefined
      }
      rpc_rollback_tenant_with_contract: {
        Args: { p_contract_id: string; p_tenant_id: string }
        Returns: Json
      }
      rpc_update_contract_status: {
        Args: { p_contract_id: string; p_new_status: string }
        Returns: {
          contract_pdf_path: string | null
          created_at: string | null
          currency: string | null
          deleted_at: string | null
          deposit: number | null
          end_date: string
          expected_new_rent: number | null
          id: string
          notes: string | null
          org_id: string
          property_id: string
          reminder_notes: string | null
          rent_amount: number | null
          rent_increase_reminder_contacted: boolean | null
          rent_increase_reminder_days: number | null
          rent_increase_reminder_enabled: boolean | null
          start_date: string
          status: string
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "contracts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      seed_default_clause_templates: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      user_has_active_access: { Args: { user_uuid: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
