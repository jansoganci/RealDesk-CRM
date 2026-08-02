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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      applicant_screenings: {
        Row: {
          id: string
          org_id: string
          lead_id: string | null
          created_by: string
          applicant_name: string
          applicant_email: string | null
          applicant_phone: string | null
          screening_status: string
          background_check: boolean
          credit_check: boolean
          employment_verification: boolean
          landlord_reference: boolean
          income_verification: boolean
          notes: string | null
          property_id: string | null
          desired_move_in_date: string | null
          monthly_income: number | null
          credit_score: number | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          lead_id?: string | null
          created_by: string
          applicant_name: string
          applicant_email?: string | null
          applicant_phone?: string | null
          screening_status?: string
          background_check?: boolean
          credit_check?: boolean
          employment_verification?: boolean
          landlord_reference?: boolean
          income_verification?: boolean
          notes?: string | null
          property_id?: string | null
          desired_move_in_date?: string | null
          monthly_income?: number | null
          credit_score?: number | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          lead_id?: string | null
          created_by?: string
          applicant_name?: string
          applicant_email?: string | null
          applicant_phone?: string | null
          screening_status?: string
          background_check?: boolean
          credit_check?: boolean
          employment_verification?: boolean
          landlord_reference?: boolean
          income_verification?: boolean
          notes?: string | null
          property_id?: string | null
          desired_move_in_date?: string | null
          monthly_income?: number | null
          credit_score?: number | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applicant_screenings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_agent_agreements: {
        Row: {
          commission_rate: number | null
          commission_type: string | null
          created_at: string | null
          expiration_date: string
          flat_fee_amount: number | null
          id: string
          lead_id: string
          org_id: string
          pdf_url: string | null
          signed_date: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          commission_rate?: number | null
          commission_type?: string | null
          created_at?: string | null
          expiration_date: string
          flat_fee_amount?: number | null
          id?: string
          lead_id: string
          org_id: string
          pdf_url?: string | null
          signed_date: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          commission_rate?: number | null
          commission_type?: string | null
          created_at?: string | null
          expiration_date?: string
          flat_fee_amount?: number | null
          id?: string
          lead_id?: string
          org_id?: string
          pdf_url?: string | null
          signed_date?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_agent_agreements_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "property_inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_agent_agreements_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
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
          property_id: string | null
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
          org_id: string
          property_address: string
          property_id?: string | null
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
          property_id?: string | null
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
          org_id: string
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
          org_id: string
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
          handover_photos_url: string | null
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
          handover_photos_url?: string | null
          id?: string
          org_id: string
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
          handover_photos_url?: string | null
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
          after_term_action: string | null
          buyer_name_2: string | null
          closing_date: string | null
          commission_amount: number | null
          contract_pdf_path: string | null
          contract_type: string
          created_at: string | null
          currency: string | null
          deal_status: string | null
          deleted_at: string | null
          deposit: number | null
          earnest_money_amount: number | null
          earnest_money_due_date: string | null
          effective_date: string | null
          end_date: string
          expected_new_rent: number | null
          governing_law_state: string | null
          id: string
          landlord_id: string | null
          lease_type: string
          notes: string | null
          org_id: string
          pdf_generated_at: string | null
          prior_contract_id: string | null
          property_id: string
          purchase_price: number | null
          reminder_notes: string | null
          rent_amount: number | null
          rent_increase_reminder_contacted: boolean | null
          rent_increase_reminder_days: number | null
          rent_increase_reminder_enabled: boolean | null
          seller_id: string | null
          seller_name_2: string | null
          start_date: string
          status: string
          tenant_id: string | null
          termination_notice_days: number | null
          updated_at: string | null
          user_id: string
          wizard_completed: boolean
        }
        Insert: {
          after_term_action?: string | null
          buyer_name_2?: string | null
          closing_date?: string | null
          commission_amount?: number | null
          contract_pdf_path?: string | null
          contract_type?: string
          created_at?: string | null
          currency?: string | null
          deal_status?: string | null
          deleted_at?: string | null
          deposit?: number | null
          earnest_money_amount?: number | null
          earnest_money_due_date?: string | null
          effective_date?: string | null
          end_date: string
          expected_new_rent?: number | null
          governing_law_state?: string | null
          id?: string
          landlord_id?: string | null
          lease_type?: string
          notes?: string | null
          org_id: string
          pdf_generated_at?: string | null
          prior_contract_id?: string | null
          property_id: string
          purchase_price?: number | null
          reminder_notes?: string | null
          rent_amount?: number | null
          rent_increase_reminder_contacted?: boolean | null
          rent_increase_reminder_days?: number | null
          rent_increase_reminder_enabled?: boolean | null
          seller_id?: string | null
          seller_name_2?: string | null
          start_date: string
          status?: string
          tenant_id?: string | null
          termination_notice_days?: number | null
          updated_at?: string | null
          user_id: string
          wizard_completed?: boolean
        }
        Update: {
          after_term_action?: string | null
          buyer_name_2?: string | null
          closing_date?: string | null
          commission_amount?: number | null
          contract_pdf_path?: string | null
          contract_type?: string
          created_at?: string | null
          currency?: string | null
          deal_status?: string | null
          deleted_at?: string | null
          deposit?: number | null
          earnest_money_amount?: number | null
          earnest_money_due_date?: string | null
          effective_date?: string | null
          end_date?: string
          expected_new_rent?: number | null
          governing_law_state?: string | null
          id?: string
          landlord_id?: string | null
          lease_type?: string
          notes?: string | null
          org_id?: string
          pdf_generated_at?: string | null
          prior_contract_id?: string | null
          property_id?: string
          purchase_price?: number | null
          reminder_notes?: string | null
          rent_amount?: number | null
          rent_increase_reminder_contacted?: boolean | null
          rent_increase_reminder_days?: number | null
          rent_increase_reminder_enabled?: boolean | null
          seller_id?: string | null
          seller_name_2?: string | null
          start_date?: string
          status?: string
          tenant_id?: string | null
          termination_notice_days?: number | null
          updated_at?: string | null
          user_id?: string
          wizard_completed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "contracts_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "property_owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_prior_contract_id_fkey"
            columns: ["prior_contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
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
            foreignKeyName: "contracts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "property_owners"
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
      data_subject_requests: {
        Row: {
          id: string
          org_id: string
          requested_by: string | null
          requester_name: string
          requester_email: string
          requester_phone: string | null
          relationship_to_org: string
          relationship_description: string | null
          request_type: string
          details: string | null
          status: string
          status_notes: string | null
          verified_at: string | null
          completed_at: string | null
          deletion_summary: string | null
          deletion_progress: Json
          deletion_started_at: string | null
          data_disclosed_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          requested_by?: string | null
          requester_name: string
          requester_email: string
          requester_phone?: string | null
          relationship_to_org: string
          relationship_description?: string | null
          request_type: string
          details?: string | null
          status?: string
          status_notes?: string | null
          verified_at?: string | null
          completed_at?: string | null
          deletion_summary?: string | null
          deletion_progress?: Json
          deletion_started_at?: string | null
          data_disclosed_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          requested_by?: string | null
          requester_name?: string
          requester_email?: string
          requester_phone?: string | null
          relationship_to_org?: string
          relationship_description?: string | null
          request_type?: string
          details?: string | null
          status?: string
          status_notes?: string | null
          verified_at?: string | null
          completed_at?: string | null
          deletion_summary?: string | null
          deletion_progress?: Json
          deletion_started_at?: string | null
          data_disclosed_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_subject_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_amendments: {
        Row: {
          amendment_type: string | null
          created_at: string | null
          deal_id: string
          description: string
          effective_date: string
          id: string
          new_value: string | null
          old_value: string | null
          org_id: string
          signed_at: string | null
        }
        Insert: {
          amendment_type?: string | null
          created_at?: string | null
          deal_id: string
          description: string
          effective_date: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          org_id: string
          signed_at?: string | null
        }
        Update: {
          amendment_type?: string | null
          created_at?: string | null
          deal_id?: string
          description?: string
          effective_date?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          org_id?: string
          signed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_amendments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_amendments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_milestones: {
        Row: {
          completed_at: string | null
          contingency_id: string | null
          created_at: string | null
          days_offset: number | null
          deal_id: string
          due_date: string
          due_time: string | null
          id: string
          is_cfpb_required: boolean | null
          milestone_type: string
          notes: string | null
          offset_basis: string | null
          org_id: string
          responsible_party: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          contingency_id?: string | null
          created_at?: string | null
          days_offset?: number | null
          deal_id: string
          due_date: string
          due_time?: string | null
          id?: string
          is_cfpb_required?: boolean | null
          milestone_type: string
          notes?: string | null
          offset_basis?: string | null
          org_id: string
          responsible_party?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          contingency_id?: string | null
          created_at?: string | null
          days_offset?: number | null
          deal_id?: string
          due_date?: string
          due_time?: string | null
          id?: string
          is_cfpb_required?: boolean | null
          milestone_type?: string
          notes?: string | null
          offset_basis?: string | null
          org_id?: string
          responsible_party?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_milestones_contingency_id_fkey"
            columns: ["contingency_id"]
            isOneToOne: false
            referencedRelation: "offer_contingencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_milestones_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_milestones_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_parties: {
        Row: {
          company: string | null
          created_at: string | null
          deal_id: string
          email: string | null
          id: string
          name: string
          notes: string | null
          org_id: string
          phone: string | null
          role: string
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          deal_id: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          org_id: string
          phone?: string | null
          role: string
        }
        Update: {
          company?: string | null
          created_at?: string | null
          deal_id?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          org_id?: string
          phone?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_parties_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_parties_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          accepted_offer_price: number | null
          actual_close_date: string | null
          buyer_agent_agreement_id: string | null
          client_role: string
          created_at: string | null
          deal_name: string
          deal_stage: string
          deal_type: string
          deleted_at: string | null
          earnest_money_actual: number | null
          earnest_money_planned: number | null
          fell_through_reason: string | null
          financing_type: string | null
          id: string
          intended_offer_price: number | null
          lead_id: string | null
          lender_contact_id: string | null
          list_price: number | null
          mutual_acceptance_date: string | null
          notes: string | null
          org_id: string
          preapproval_status: string | null
          projected_close_date: string | null
          property_id: string | null
          property_snapshot: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accepted_offer_price?: number | null
          actual_close_date?: string | null
          buyer_agent_agreement_id?: string | null
          client_role: string
          created_at?: string | null
          deal_name: string
          deal_stage?: string
          deal_type?: string
          deleted_at?: string | null
          earnest_money_actual?: number | null
          earnest_money_planned?: number | null
          fell_through_reason?: string | null
          financing_type?: string | null
          id?: string
          intended_offer_price?: number | null
          lead_id?: string | null
          lender_contact_id?: string | null
          list_price?: number | null
          mutual_acceptance_date?: string | null
          notes?: string | null
          org_id: string
          preapproval_status?: string | null
          projected_close_date?: string | null
          property_id?: string | null
          property_snapshot?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accepted_offer_price?: number | null
          actual_close_date?: string | null
          buyer_agent_agreement_id?: string | null
          client_role?: string
          created_at?: string | null
          deal_name?: string
          deal_stage?: string
          deal_type?: string
          deleted_at?: string | null
          earnest_money_actual?: number | null
          earnest_money_planned?: number | null
          fell_through_reason?: string | null
          financing_type?: string | null
          id?: string
          intended_offer_price?: number | null
          lead_id?: string | null
          lender_contact_id?: string | null
          list_price?: number | null
          mutual_acceptance_date?: string | null
          notes?: string | null
          org_id?: string
          preapproval_status?: string | null
          projected_close_date?: string | null
          property_id?: string | null
          property_snapshot?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_buyer_agent_agreement_id_fkey"
            columns: ["buyer_agent_agreement_id"]
            isOneToOne: false
            referencedRelation: "buyer_agent_agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "property_inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_lender_contact_id_fkey"
            columns: ["lender_contact_id"]
            isOneToOne: false
            referencedRelation: "deal_parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      deposit_deductions: {
        Row: {
          id: string
          deposit_id: string
          description: string
          amount: number
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          deposit_id: string
          description: string
          amount: number
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          deposit_id?: string
          description?: string
          amount?: number
          category?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposit_deductions_deposit_id_fkey"
            columns: ["deposit_id"]
            isOneToOne: false
            referencedRelation: "security_deposit_tracker"
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
          org_id: string
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
          org_id: string
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
      lease_amendments: {
        Row: {
          amendment_date: string
          contract_id: string
          created_at: string
          description: string
          id: string
          org_id: string
          user_id: string
        }
        Insert: {
          amendment_date: string
          contract_id: string
          created_at?: string
          description: string
          id?: string
          org_id: string
          user_id: string
        }
        Update: {
          amendment_date?: string
          contract_id?: string
          created_at?: string
          description?: string
          id?: string
          org_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lease_amendments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_amendments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lease_details: {
        Row: {
          additional_occupants: string[]
          additional_terms: string | null
          appliances_enabled: boolean
          appliances_list: string[] | null
          appliances_other: string | null
          bathrooms: number
          bedrooms: number
          co_signer_email: string | null
          co_signer_name: string | null
          co_signer_phone: string | null
          co_signer_role: string | null
          common_areas_description: string | null
          common_areas_enabled: boolean
          contract_id: string
          created_at: string
          early_move_in_date: string | null
          early_move_in_enabled: boolean
          early_move_in_prorated_rent: number | null
          furnished_enabled: boolean
          furnished_rooms: string[] | null
          id: string
          landlord_email: string | null
          landlord_mailing_city: string | null
          landlord_mailing_state: string | null
          landlord_mailing_street: string | null
          landlord_mailing_zip: string | null
          landlord_name: string
          landlord_notice_custom_address: string | null
          landlord_phone: string | null
          late_fee_amount: number | null
          late_fee_interest_pct: number | null
          late_fee_per: string | null
          late_fee_type: string
          lead_paint_disclosure_required: boolean
          lead_paint_hazard_description: string | null
          lead_paint_known_hazards: boolean | null
          lead_paint_pamphlet_delivered: boolean
          lead_paint_pamphlet_delivery_date: string | null
          lead_paint_pamphlet_delivery_method: string | null
          lead_paint_records_available: boolean | null
          lead_paint_records_description: string | null
          move_in_inspection_required: boolean
          nsf_fee_amount: number | null
          nsf_fee_enabled: boolean
          org_id: string
          parking_enabled: boolean
          parking_fee_amount: number | null
          parking_fee_enabled: boolean
          parking_spaces: number | null
          payment_method_other: string | null
          payment_methods: string[]
          paypal_email: string | null
          pets_allowed: boolean
          pets_count: number | null
          pets_deposit_amount: number | null
          pets_deposit_refundable: boolean | null
          pets_max_weight_lbs: number | null
          pets_types: string | null
          prepaid_rent_amount: number | null
          prepaid_rent_enabled: boolean
          prepaid_rent_end: string | null
          prepaid_rent_start: string | null
          property_city: string
          property_state: string
          property_street: string
          property_timezone: string
          property_unit: string | null
          property_zip: string
          renters_insurance_min_coverage: number | null
          renters_insurance_required: boolean
          rent_due_day: number
          residence_type: string
          residence_type_other: string | null
          security_deposit_amount: number | null
          security_deposit_enabled: boolean
          security_deposit_return_days: number | null
          smoking_allowed: boolean
          subletting_policy: string
          tenant_email: string | null
          tenant_email_2: string | null
          tenant_name: string
          tenant_name_2: string | null
          tenant_notice_custom_address: string | null
          tenant_phone: string | null
          tenant_phone_2: string | null
          utilities_landlord_covered: string[]
          utilities_other: string | null
          user_id: string
          venmo_handle: string | null
          year_built: number | null
          zelle_contact: string | null
          updated_at: string
        }
        Insert: {
          additional_occupants?: string[]
          additional_terms?: string | null
          appliances_enabled?: boolean
          appliances_list?: string[] | null
          appliances_other?: string | null
          bathrooms?: number
          bedrooms?: number
          co_signer_email?: string | null
          co_signer_name?: string | null
          co_signer_phone?: string | null
          co_signer_role?: string | null
          common_areas_description?: string | null
          common_areas_enabled?: boolean
          contract_id: string
          created_at?: string
          early_move_in_date?: string | null
          early_move_in_enabled?: boolean
          early_move_in_prorated_rent?: number | null
          furnished_enabled?: boolean
          furnished_rooms?: string[] | null
          id?: string
          landlord_email?: string | null
          landlord_mailing_city?: string | null
          landlord_mailing_state?: string | null
          landlord_mailing_street?: string | null
          landlord_mailing_zip?: string | null
          landlord_name: string
          landlord_notice_custom_address?: string | null
          landlord_phone?: string | null
          late_fee_amount?: number | null
          late_fee_interest_pct?: number | null
          late_fee_per?: string | null
          late_fee_type?: string
          lead_paint_disclosure_required?: boolean
          lead_paint_hazard_description?: string | null
          lead_paint_known_hazards?: boolean | null
          lead_paint_pamphlet_delivered?: boolean
          lead_paint_pamphlet_delivery_date?: string | null
          lead_paint_pamphlet_delivery_method?: string | null
          lead_paint_records_available?: boolean | null
          lead_paint_records_description?: string | null
          move_in_inspection_required?: boolean
          nsf_fee_amount?: number | null
          nsf_fee_enabled?: boolean
          org_id: string
          parking_enabled?: boolean
          parking_fee_amount?: number | null
          parking_fee_enabled?: boolean
          parking_spaces?: number | null
          payment_method_other?: string | null
          payment_methods?: string[]
          paypal_email?: string | null
          pets_allowed?: boolean
          pets_count?: number | null
          pets_deposit_amount?: number | null
          pets_deposit_refundable?: boolean | null
          pets_max_weight_lbs?: number | null
          pets_types?: string | null
          prepaid_rent_amount?: number | null
          prepaid_rent_enabled?: boolean
          prepaid_rent_end?: string | null
          prepaid_rent_start?: string | null
          property_city: string
          property_state: string
          property_street: string
          property_timezone: string
          property_unit?: string | null
          property_zip: string
          renters_insurance_min_coverage?: number | null
          renters_insurance_required?: boolean
          rent_due_day?: number
          residence_type?: string
          residence_type_other?: string | null
          security_deposit_amount?: number | null
          security_deposit_enabled?: boolean
          security_deposit_return_days?: number | null
          smoking_allowed?: boolean
          subletting_policy?: string
          tenant_email?: string | null
          tenant_email_2?: string | null
          tenant_name: string
          tenant_name_2?: string | null
          tenant_notice_custom_address?: string | null
          tenant_phone?: string | null
          tenant_phone_2?: string | null
          utilities_landlord_covered?: string[]
          utilities_other?: string | null
          user_id: string
          venmo_handle?: string | null
          year_built?: number | null
          zelle_contact?: string | null
          updated_at?: string
        }
        Update: {
          additional_occupants?: string[]
          additional_terms?: string | null
          appliances_enabled?: boolean
          appliances_list?: string[] | null
          appliances_other?: string | null
          bathrooms?: number
          bedrooms?: number
          co_signer_email?: string | null
          co_signer_name?: string | null
          co_signer_phone?: string | null
          co_signer_role?: string | null
          common_areas_description?: string | null
          common_areas_enabled?: boolean
          contract_id?: string
          created_at?: string
          early_move_in_date?: string | null
          early_move_in_enabled?: boolean
          early_move_in_prorated_rent?: number | null
          furnished_enabled?: boolean
          furnished_rooms?: string[] | null
          id?: string
          landlord_email?: string | null
          landlord_mailing_city?: string | null
          landlord_mailing_state?: string | null
          landlord_mailing_street?: string | null
          landlord_mailing_zip?: string | null
          landlord_name?: string
          landlord_notice_custom_address?: string | null
          landlord_phone?: string | null
          late_fee_amount?: number | null
          late_fee_interest_pct?: number | null
          late_fee_per?: string | null
          late_fee_type?: string
          lead_paint_disclosure_required?: boolean
          lead_paint_hazard_description?: string | null
          lead_paint_known_hazards?: boolean | null
          lead_paint_pamphlet_delivered?: boolean
          lead_paint_pamphlet_delivery_date?: string | null
          lead_paint_pamphlet_delivery_method?: string | null
          lead_paint_records_available?: boolean | null
          lead_paint_records_description?: string | null
          move_in_inspection_required?: boolean
          nsf_fee_amount?: number | null
          nsf_fee_enabled?: boolean
          org_id?: string
          parking_enabled?: boolean
          parking_fee_amount?: number | null
          parking_fee_enabled?: boolean
          parking_spaces?: number | null
          payment_method_other?: string | null
          payment_methods?: string[]
          paypal_email?: string | null
          pets_allowed?: boolean
          pets_count?: number | null
          pets_deposit_amount?: number | null
          pets_deposit_refundable?: boolean | null
          pets_max_weight_lbs?: number | null
          pets_types?: string | null
          prepaid_rent_amount?: number | null
          prepaid_rent_enabled?: boolean
          prepaid_rent_end?: string | null
          prepaid_rent_start?: string | null
          property_city?: string
          property_state?: string
          property_street?: string
          property_timezone?: string
          property_unit?: string | null
          property_zip?: string
          renters_insurance_min_coverage?: number | null
          renters_insurance_required?: boolean
          rent_due_day?: number
          residence_type?: string
          residence_type_other?: string | null
          security_deposit_amount?: number | null
          security_deposit_enabled?: boolean
          security_deposit_return_days?: number | null
          smoking_allowed?: boolean
          subletting_policy?: string
          tenant_email?: string | null
          tenant_email_2?: string | null
          tenant_name?: string
          tenant_name_2?: string | null
          tenant_notice_custom_address?: string | null
          tenant_phone?: string | null
          tenant_phone_2?: string | null
          utilities_landlord_covered?: string[]
          utilities_other?: string | null
          user_id?: string
          venmo_handle?: string | null
          year_built?: number | null
          zelle_contact?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lease_details_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: true
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_details_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          org_id: string
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
      offer_contingencies: {
        Row: {
          business_days_only: boolean | null
          contingency_type: string
          created_at: string | null
          days_offset: number | null
          deadline_date: string | null
          deal_id: string
          id: string
          included_in_offer: boolean
          label_override: string | null
          notes: string | null
          notice_required: boolean | null
          notice_sent_date: string | null
          offer_round_id: string
          org_id: string
          resolution_type: string | null
          resolved_date: string | null
          response_due_date: string | null
          status: string
          type_specific_data: Json | null
          updated_at: string | null
          waived_after_acceptance: boolean
          waived_at_offer: boolean
        }
        Insert: {
          business_days_only?: boolean | null
          contingency_type: string
          created_at?: string | null
          days_offset?: number | null
          deadline_date?: string | null
          deal_id: string
          id?: string
          included_in_offer?: boolean
          label_override?: string | null
          notes?: string | null
          notice_required?: boolean | null
          notice_sent_date?: string | null
          offer_round_id: string
          org_id: string
          resolution_type?: string | null
          resolved_date?: string | null
          response_due_date?: string | null
          status?: string
          type_specific_data?: Json | null
          updated_at?: string | null
          waived_after_acceptance?: boolean
          waived_at_offer?: boolean
        }
        Update: {
          business_days_only?: boolean | null
          contingency_type?: string
          created_at?: string | null
          days_offset?: number | null
          deadline_date?: string | null
          deal_id?: string
          id?: string
          included_in_offer?: boolean
          label_override?: string | null
          notes?: string | null
          notice_required?: boolean | null
          notice_sent_date?: string | null
          offer_round_id?: string
          org_id?: string
          resolution_type?: string | null
          resolved_date?: string | null
          response_due_date?: string | null
          status?: string
          type_specific_data?: Json | null
          updated_at?: string | null
          waived_after_acceptance?: boolean
          waived_at_offer?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "offer_contingencies_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_contingencies_offer_round_id_fkey"
            columns: ["offer_round_id"]
            isOneToOne: false
            referencedRelation: "offer_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_contingencies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_negotiations: {
        Row: {
          accepted_round_id: string | null
          created_at: string | null
          deal_id: string
          id: string
          org_id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accepted_round_id?: string | null
          created_at?: string | null
          deal_id: string
          id?: string
          org_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accepted_round_id?: string | null
          created_at?: string | null
          deal_id?: string
          id?: string
          org_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_negotiations_accepted_round_id_fkey"
            columns: ["accepted_round_id"]
            isOneToOne: false
            referencedRelation: "offer_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_negotiations_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_negotiations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_rounds: {
        Row: {
          appraisal_gap_coverage: number | null
          closing_date: string | null
          contract_id: string | null
          created_at: string | null
          deal_id: string
          emd_amount: number | null
          expiration_date: string | null
          expiration_time: string | null
          financing_type: string | null
          id: string
          mutual_acceptance_at: string | null
          negotiation_id: string
          notes: string | null
          offer_price: number
          offered_by: string
          org_id: string
          parent_round_id: string | null
          personal_property_notes: string | null
          possession_date: string | null
          round_number: number
          seller_credits: number | null
          status: string
          submitted_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          appraisal_gap_coverage?: number | null
          closing_date?: string | null
          contract_id?: string | null
          created_at?: string | null
          deal_id: string
          emd_amount?: number | null
          expiration_date?: string | null
          expiration_time?: string | null
          financing_type?: string | null
          id?: string
          mutual_acceptance_at?: string | null
          negotiation_id: string
          notes?: string | null
          offer_price: number
          offered_by: string
          org_id: string
          parent_round_id?: string | null
          personal_property_notes?: string | null
          possession_date?: string | null
          round_number: number
          seller_credits?: number | null
          status: string
          submitted_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          appraisal_gap_coverage?: number | null
          closing_date?: string | null
          contract_id?: string | null
          created_at?: string | null
          deal_id?: string
          emd_amount?: number | null
          expiration_date?: string | null
          expiration_time?: string | null
          financing_type?: string | null
          id?: string
          mutual_acceptance_at?: string | null
          negotiation_id?: string
          notes?: string | null
          offer_price?: number
          offered_by?: string
          org_id?: string
          parent_round_id?: string | null
          personal_property_notes?: string | null
          possession_date?: string | null
          round_number?: number
          seller_credits?: number | null
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_rounds_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_rounds_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_rounds_negotiation_id_fkey"
            columns: ["negotiation_id"]
            isOneToOne: false
            referencedRelation: "offer_negotiations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_rounds_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_rounds_parent_round_id_fkey"
            columns: ["parent_round_id"]
            isOneToOne: false
            referencedRelation: "offer_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_events: {
        Row: {
          action_taken: string
          created_at: string | null
          data: Json | null
          id: string
          org_id: string
          step_name: string
          step_number: number
          user_id: string
        }
        Insert: {
          action_taken: string
          created_at?: string | null
          data?: Json | null
          id?: string
          org_id: string
          step_name: string
          step_number: number
          user_id: string
        }
        Update: {
          action_taken?: string
          created_at?: string | null
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
      org_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invitation_token: string
          invited_at: string
          invited_by: string | null
          org_id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invitation_token: string
          invited_at?: string
          invited_by?: string | null
          org_id: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_at?: string
          invited_by?: string | null
          org_id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: [
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
      org_member_commission_settings: {
        Row: {
          id: string
          org_id: string
          user_id: string
          broker_model: string
          broker_split_pct: number
          annual_cap_amount: number | null
          cap_anniversary_date: string | null
          franchise_fee_enabled: boolean
          franchise_fee_pct: number | null
          franchise_fee_cap: number | null
          default_transaction_fee: number
          eo_fee_type: string
          eo_fee_amount: number
          default_tc_fee: number
          default_rental_commission_type: string
          default_rental_commission_rate: number | null
          default_rental_flat_fee: number | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          broker_model?: string
          broker_split_pct?: number
          annual_cap_amount?: number | null
          cap_anniversary_date?: string | null
          franchise_fee_enabled?: boolean
          franchise_fee_pct?: number | null
          franchise_fee_cap?: number | null
          default_transaction_fee?: number
          eo_fee_type?: string
          eo_fee_amount?: number
          default_tc_fee?: number
          default_rental_commission_type?: string
          default_rental_commission_rate?: number | null
          default_rental_flat_fee?: number | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          user_id?: string
          broker_model?: string
          broker_split_pct?: number
          annual_cap_amount?: number | null
          cap_anniversary_date?: string | null
          franchise_fee_enabled?: boolean
          franchise_fee_pct?: number | null
          franchise_fee_cap?: number | null
          default_transaction_fee?: number
          eo_fee_type?: string
          eo_fee_amount?: number
          default_tc_fee?: number
          default_rental_commission_type?: string
          default_rental_commission_rate?: number | null
          default_rental_flat_fee?: number | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_member_commission_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          brokerage_name: string | null
          created_at: string | null
          id: string
          license_state: string | null
          logo_url: string | null
          name: string
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          onboarding_skipped: boolean | null
          onboarding_skipped_at: string | null
          onboarding_step: number | null
          primary_market_city: string | null
          primary_market_state: string | null
          primary_use_case: string | null
          settings: Json | null
          slug: string
          team_size_range: string | null
          updated_at: string | null
        }
        Insert: {
          brokerage_name?: string | null
          created_at?: string | null
          id?: string
          license_state?: string | null
          logo_url?: string | null
          name: string
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_skipped?: boolean | null
          onboarding_skipped_at?: string | null
          onboarding_step?: number | null
          primary_market_city?: string | null
          primary_market_state?: string | null
          primary_use_case?: string | null
          settings?: Json | null
          slug: string
          team_size_range?: string | null
          updated_at?: string | null
        }
        Update: {
          brokerage_name?: string | null
          created_at?: string | null
          id?: string
          license_state?: string | null
          logo_url?: string | null
          name?: string
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_skipped?: boolean | null
          onboarding_skipped_at?: string | null
          onboarding_step?: number | null
          primary_market_city?: string | null
          primary_market_state?: string | null
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
          district_legacy: string | null
          full_address: string | null
          id: string
          il: string | null
          listing_url: string | null
          mahalle: string | null
          mls_id: string | null
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
          state: string | null
          status: string
          street_address: string | null
          type: string | null
          under_contract_deal_id: string | null
          under_offer_at: string | null
          unit: string | null
          updated_at: string | null
          use_purpose: string | null
          user_id: string
          year_built: number | null
          zip_code: string | null
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
          district_legacy?: string | null
          full_address?: string | null
          id?: string
          il?: string | null
          listing_url?: string | null
          mahalle?: string | null
          mls_id?: string | null
          normalized_address?: string | null
          notes?: string | null
          offer_amount?: number | null
          offer_date?: string | null
          org_id: string
          owner_id: string
          property_type?: string
          rent_amount?: number | null
          sale_price?: number | null
          sold_at?: string | null
          sold_price?: number | null
          state?: string | null
          status?: string
          street_address?: string | null
          type?: string | null
          under_contract_deal_id?: string | null
          under_offer_at?: string | null
          unit?: string | null
          updated_at?: string | null
          use_purpose?: string | null
          user_id: string
          year_built?: number | null
          zip_code?: string | null
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
          district_legacy?: string | null
          full_address?: string | null
          id?: string
          il?: string | null
          listing_url?: string | null
          mahalle?: string | null
          mls_id?: string | null
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
          state?: string | null
          status?: string
          street_address?: string | null
          type?: string | null
          under_contract_deal_id?: string | null
          under_offer_at?: string | null
          unit?: string | null
          updated_at?: string | null
          use_purpose?: string | null
          user_id?: string
          year_built?: number | null
          zip_code?: string | null
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
          {
            foreignKeyName: "properties_under_contract_deal_id_fkey"
            columns: ["under_contract_deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      property_inquiries: {
        Row: {
          created_at: string | null
          deal_id: string | null
          deleted_at: string | null
          email: string | null
          id: string
          inquiry_type: string
          lead_source: string | null
          max_rent_budget: number | null
          max_sale_budget: number | null
          min_rent_budget: number | null
          min_sale_budget: number | null
          name: string
          notes: string | null
          org_id: string
          phone: string
          pre_approved: boolean | null
          preferred_city: string | null
          preferred_district: string | null
          preferred_state: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deal_id?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          inquiry_type?: string
          lead_source?: string | null
          max_rent_budget?: number | null
          max_sale_budget?: number | null
          min_rent_budget?: number | null
          min_sale_budget?: number | null
          name: string
          notes?: string | null
          org_id: string
          phone: string
          pre_approved?: boolean | null
          preferred_city?: string | null
          preferred_district?: string | null
          preferred_state?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deal_id?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          inquiry_type?: string
          lead_source?: string | null
          max_rent_budget?: number | null
          max_sale_budget?: number | null
          min_rent_budget?: number | null
          min_sale_budget?: number | null
          name?: string
          notes?: string | null
          org_id?: string
          phone?: string
          pre_approved?: boolean | null
          preferred_city?: string | null
          preferred_district?: string | null
          preferred_state?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_inquiries_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
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
          account_number_encrypted: string | null
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
          routing_number_encrypted: string | null
          tax_id: string | null
          tc_encrypted: string | null
          tc_hash: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_number_encrypted?: string | null
          address?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          iban_encrypted?: string | null
          id?: string
          name: string
          notes?: string | null
          org_id: string
          phone?: string | null
          routing_number_encrypted?: string | null
          tax_id?: string | null
          tc_encrypted?: string | null
          tc_hash?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_number_encrypted?: string | null
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
          routing_number_encrypted?: string | null
          tax_id?: string | null
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
      purchase_details: {
        Row: {
          additional_terms: string | null
          all_cash_proof_deadline_date: string | null
          all_cash_proof_deadline_time: string | null
          appraisal_contingency: boolean
          appraisal_negotiation_days: number | null
          bank_contingent_on_sale: boolean
          bank_loan_type: string | null
          bank_loan_type_other: string | null
          bank_preapproval_letter_date: string | null
          bank_seller_notification_days: number | null
          buyer_agent_name: string | null
          buyer_email: string | null
          buyer_email_2: string | null
          buyer_mailing_city: string | null
          buyer_mailing_city_2: string | null
          buyer_mailing_state: string | null
          buyer_mailing_state_2: string | null
          buyer_mailing_street: string | null
          buyer_mailing_street_2: string | null
          buyer_mailing_zip: string | null
          buyer_mailing_zip_2: string | null
          buyer_name: string
          buyer_name_2: string | null
          buyer_phone: string | null
          buyer_phone_2: string | null
          closing_costs_responsibility: string
          closing_time: string | null
          contingent_on_other_property: boolean
          contingent_property_address: string | null
          contingent_property_days: number | null
          contract_id: string
          created_at: string
          custom_addendums: string[] | null
          earnest_money_deadline_time: string | null
          earnest_money_escrow_required: boolean
          earnest_money_return_days: number
          fha_addendum_path: string | null
          fha_addendum_uploaded: boolean
          financing_type: string
          id: string
          inspection_contractor_deadline_date: string | null
          inspection_contractor_deadline_time: string | null
          inspection_disclosures_deadline_date: string | null
          inspection_disclosures_deadline_time: string | null
          inspection_negotiation_days: number | null
          land_included: boolean
          lead_paint_disclosure_required: boolean
          lead_paint_hazard_description: string | null
          lead_paint_known_hazards: boolean | null
          lead_paint_pamphlet_delivered: boolean
          lead_paint_pamphlet_delivery_date: string | null
          lead_paint_pamphlet_delivery_method: string | null
          lead_paint_records_available: boolean | null
          mineral_rights_transferred: boolean
          offer_expiration_date: string | null
          offer_expiration_time: string | null
          org_id: string
          other_description: string | null
          other_property_info: string | null
          pdf_generated_at: string | null
          personal_property_description: string | null
          property_city: string
          property_state: string
          property_street: string
          property_timezone: string
          property_type: string
          property_type_other: string | null
          property_zip: string
          seller_agent_name: string | null
          seller_email: string | null
          seller_email_2: string | null
          seller_financing_approval_deadline: string | null
          seller_financing_doc_deadline: string | null
          seller_financing_down_payment: number | null
          seller_financing_interest_rate: number | null
          seller_financing_loan_amount: number | null
          seller_financing_term_unit: string | null
          seller_financing_term_value: number | null
          seller_mailing_city: string | null
          seller_mailing_state: string | null
          seller_mailing_street: string | null
          seller_mailing_zip: string | null
          seller_name: string
          seller_name_2: string | null
          seller_phone: string | null
          seller_phone_2: string | null
          survey_buyer_notification_days: number | null
          survey_seller_remedy_days: number | null
          tax_parcel_info: string | null
          title_buyer_review_days: number | null
          title_company: string | null
          title_seller_remedy_days: number | null
          title_type: string | null
          updated_at: string
          user_id: string
          va_addendum_path: string | null
          va_addendum_uploaded: boolean
          wizard_completed: boolean
          year_built: number | null
        }
        Insert: {
          additional_terms?: string | null
          all_cash_proof_deadline_date?: string | null
          all_cash_proof_deadline_time?: string | null
          appraisal_contingency?: boolean
          appraisal_negotiation_days?: number | null
          bank_contingent_on_sale?: boolean
          bank_loan_type?: string | null
          bank_loan_type_other?: string | null
          bank_preapproval_letter_date?: string | null
          bank_seller_notification_days?: number | null
          buyer_agent_name?: string | null
          buyer_email?: string | null
          buyer_email_2?: string | null
          buyer_mailing_city?: string | null
          buyer_mailing_city_2?: string | null
          buyer_mailing_state?: string | null
          buyer_mailing_state_2?: string | null
          buyer_mailing_street?: string | null
          buyer_mailing_street_2?: string | null
          buyer_mailing_zip?: string | null
          buyer_mailing_zip_2?: string | null
          buyer_name: string
          buyer_name_2?: string | null
          buyer_phone?: string | null
          buyer_phone_2?: string | null
          closing_costs_responsibility?: string
          closing_time?: string | null
          contingent_on_other_property?: boolean
          contingent_property_address?: string | null
          contingent_property_days?: number | null
          contract_id: string
          created_at?: string
          custom_addendums?: string[] | null
          earnest_money_deadline_time?: string | null
          earnest_money_escrow_required?: boolean
          earnest_money_return_days?: number
          fha_addendum_path?: string | null
          fha_addendum_uploaded?: boolean
          financing_type?: string
          id?: string
          inspection_contractor_deadline_date?: string | null
          inspection_contractor_deadline_time?: string | null
          inspection_disclosures_deadline_date?: string | null
          inspection_disclosures_deadline_time?: string | null
          inspection_negotiation_days?: number | null
          land_included?: boolean
          lead_paint_disclosure_required?: boolean
          lead_paint_hazard_description?: string | null
          lead_paint_known_hazards?: boolean | null
          lead_paint_pamphlet_delivered?: boolean
          lead_paint_pamphlet_delivery_date?: string | null
          lead_paint_pamphlet_delivery_method?: string | null
          lead_paint_records_available?: boolean | null
          mineral_rights_transferred?: boolean
          offer_expiration_date?: string | null
          offer_expiration_time?: string | null
          org_id: string
          other_description?: string | null
          other_property_info?: string | null
          pdf_generated_at?: string | null
          personal_property_description?: string | null
          property_city: string
          property_state: string
          property_street: string
          property_timezone: string
          property_type?: string
          property_type_other?: string | null
          property_zip: string
          seller_agent_name?: string | null
          seller_email?: string | null
          seller_email_2?: string | null
          seller_financing_approval_deadline?: string | null
          seller_financing_doc_deadline?: string | null
          seller_financing_down_payment?: number | null
          seller_financing_interest_rate?: number | null
          seller_financing_loan_amount?: number | null
          seller_financing_term_unit?: string | null
          seller_financing_term_value?: number | null
          seller_mailing_city?: string | null
          seller_mailing_state?: string | null
          seller_mailing_street?: string | null
          seller_mailing_zip?: string | null
          seller_name: string
          seller_name_2?: string | null
          seller_phone?: string | null
          seller_phone_2?: string | null
          survey_buyer_notification_days?: number | null
          survey_seller_remedy_days?: number | null
          tax_parcel_info?: string | null
          title_buyer_review_days?: number | null
          title_company?: string | null
          title_seller_remedy_days?: number | null
          title_type?: string | null
          updated_at?: string
          user_id: string
          va_addendum_path?: string | null
          va_addendum_uploaded?: boolean
          wizard_completed?: boolean
          year_built?: number | null
        }
        Update: {
          additional_terms?: string | null
          all_cash_proof_deadline_date?: string | null
          all_cash_proof_deadline_time?: string | null
          appraisal_contingency?: boolean
          appraisal_negotiation_days?: number | null
          bank_contingent_on_sale?: boolean
          bank_loan_type?: string | null
          bank_loan_type_other?: string | null
          bank_preapproval_letter_date?: string | null
          bank_seller_notification_days?: number | null
          buyer_agent_name?: string | null
          buyer_email?: string | null
          buyer_email_2?: string | null
          buyer_mailing_city?: string | null
          buyer_mailing_city_2?: string | null
          buyer_mailing_state?: string | null
          buyer_mailing_state_2?: string | null
          buyer_mailing_street?: string | null
          buyer_mailing_street_2?: string | null
          buyer_mailing_zip?: string | null
          buyer_mailing_zip_2?: string | null
          buyer_name?: string
          buyer_name_2?: string | null
          buyer_phone?: string | null
          buyer_phone_2?: string | null
          closing_costs_responsibility?: string
          closing_time?: string | null
          contingent_on_other_property?: boolean
          contingent_property_address?: string | null
          contingent_property_days?: number | null
          contract_id?: string
          created_at?: string
          custom_addendums?: string[] | null
          earnest_money_deadline_time?: string | null
          earnest_money_escrow_required?: boolean
          earnest_money_return_days?: number
          fha_addendum_path?: string | null
          fha_addendum_uploaded?: boolean
          financing_type?: string
          id?: string
          inspection_contractor_deadline_date?: string | null
          inspection_contractor_deadline_time?: string | null
          inspection_disclosures_deadline_date?: string | null
          inspection_disclosures_deadline_time?: string | null
          inspection_negotiation_days?: number | null
          land_included?: boolean
          lead_paint_disclosure_required?: boolean
          lead_paint_hazard_description?: string | null
          lead_paint_known_hazards?: boolean | null
          lead_paint_pamphlet_delivered?: boolean
          lead_paint_pamphlet_delivery_date?: string | null
          lead_paint_pamphlet_delivery_method?: string | null
          lead_paint_records_available?: boolean | null
          mineral_rights_transferred?: boolean
          offer_expiration_date?: string | null
          offer_expiration_time?: string | null
          org_id?: string
          other_description?: string | null
          other_property_info?: string | null
          pdf_generated_at?: string | null
          personal_property_description?: string | null
          property_city?: string
          property_state?: string
          property_street?: string
          property_timezone?: string
          property_type?: string
          property_type_other?: string | null
          property_zip?: string
          seller_agent_name?: string | null
          seller_email?: string | null
          seller_email_2?: string | null
          seller_financing_approval_deadline?: string | null
          seller_financing_doc_deadline?: string | null
          seller_financing_down_payment?: number | null
          seller_financing_interest_rate?: number | null
          seller_financing_loan_amount?: number | null
          seller_financing_term_unit?: string | null
          seller_financing_term_value?: number | null
          seller_mailing_city?: string | null
          seller_mailing_state?: string | null
          seller_mailing_street?: string | null
          seller_mailing_zip?: string | null
          seller_name?: string
          seller_name_2?: string | null
          seller_phone?: string | null
          seller_phone_2?: string | null
          survey_buyer_notification_days?: number | null
          survey_seller_remedy_days?: number | null
          tax_parcel_info?: string | null
          title_buyer_review_days?: number | null
          title_company?: string | null
          title_seller_remedy_days?: number | null
          title_type?: string | null
          updated_at?: string
          user_id?: string
          va_addendum_path?: string | null
          va_addendum_uploaded?: boolean
          wizard_completed?: boolean
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_details_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: true
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_details_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          org_id: string
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
      showing_logs: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          feedback: string | null
          feedback_enum: string | null
          id: string
          interest_level: string | null
          lead_id: string
          notes: string | null
          org_id: string
          property_id: string
          showing_date: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          feedback?: string | null
          feedback_enum?: string | null
          id?: string
          interest_level?: string | null
          lead_id: string
          notes?: string | null
          org_id: string
          property_id: string
          showing_date: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          feedback?: string | null
          feedback_enum?: string | null
          id?: string
          interest_level?: string | null
          lead_id?: string
          notes?: string | null
          org_id?: string
          property_id?: string
          showing_date?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "showing_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "property_inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "showing_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "showing_logs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      security_deposit_tracker: {
        Row: {
          id: string
          org_id: string
          property_id: string | null
          tenant_id: string | null
          contract_id: string | null
          created_by: string
          deposit_amount: number
          held_by: string
          held_by_other_description: string | null
          return_deadline: string
          return_date: string | null
          status: string
          interest_required: boolean
          interest_amount: number | null
          notes: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          property_id?: string | null
          tenant_id?: string | null
          contract_id?: string | null
          created_by: string
          deposit_amount: number
          held_by: string
          held_by_other_description?: string | null
          return_deadline: string
          return_date?: string | null
          status?: string
          interest_required?: boolean
          interest_amount?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          property_id?: string | null
          tenant_id?: string | null
          contract_id?: string | null
          created_by?: string
          deposit_amount?: number
          held_by?: string
          held_by_other_description?: string | null
          return_deadline?: string
          return_date?: string | null
          status?: string
          interest_required?: boolean
          interest_amount?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_deposit_tracker_org_id_fkey"
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
          org_id: string
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
      user_onboarding_responses: {
        Row: {
          answer: Json
          created_at: string | null
          id: string
          org_id: string
          question_key: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answer: Json
          created_at?: string | null
          id?: string
          org_id: string
          question_key: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answer?: Json
          created_at?: string | null
          id?: string
          org_id?: string
          question_key?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_onboarding_responses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          commission_rate: number | null
          currency: string | null
          full_name: string | null
          language: string | null
          meeting_reminder_minutes: number | null
          onboarding_banner_dismissed_at: number | null
          phone_number: string | null
          user_id: string
        }
        Insert: {
          commission_rate?: number | null
          currency?: string | null
          full_name?: string | null
          language?: string | null
          meeting_reminder_minutes?: number | null
          onboarding_banner_dismissed_at?: number | null
          phone_number?: string | null
          user_id: string
        }
        Update: {
          commission_rate?: number | null
          currency?: string | null
          full_name?: string | null
          language?: string | null
          meeting_reminder_minutes?: number | null
          onboarding_banner_dismissed_at?: number | null
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
      accept_org_invitation: { Args: { p_token: string }; Returns: Json }
      resolve_member_broker_settings: {
        Args: { p_org_id: string; p_member_user_id: string }
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
      create_first_organization: {
        Args: { p_org_name?: string }
        Returns: string
      }
      create_sale_commission: {
        Args: {
          p_currency?: string
          p_property_id: string
          p_sale_price: number
        }
        Returns: string
      }
      ensure_user_trial: { Args: never; Returns: undefined }
      generate_invitation_token: { Args: never; Returns: string }
      get_invitation_info: { Args: { p_token: string }; Returns: Json }
      get_invitation_with_inviter: {
        Args: { p_invitation_id: string }
        Returns: Json
      }
      get_org_members_with_users: {
        Args: { p_org_id: string }
        Returns: {
          created_at: string
          id: string
          invited_at: string
          invited_by: string
          joined_at: string
          org_id: string
          role: string
          status: string
          updated_at: string
          user_avatar_url: string
          user_email: string
          user_full_name: string
          user_id: string
        }[]
      }
      get_quota: {
        Args: { p_device_id?: string; p_user_id?: string }
        Returns: Json
      }
      get_team_performance: {
        Args: { p_end_date?: string; p_org_id: string; p_start_date?: string }
        Returns: Json
      }
      get_user_id_by_email: {
        Args: { email_input: string }
        Returns: {
          email: string
          id: string
        }[]
      }
      get_user_org_ids: { Args: never; Returns: string[] }
      has_active_subscription: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      is_org_owner: { Args: { check_org_id: string }; Returns: boolean }
      rpc_create_contract_and_update_property: {
        Args: { p_contract: Json }
        Returns: Json
      }
      rpc_create_tenant_with_contract: {
        Args: { p_contract: Json; p_tenant: Json }
        Returns: Json
      }
      rpc_create_lease_contract: {
        Args: { p_contract: Json; p_lease_details: Json }
        Returns: string
      }
      rpc_create_purchase_contract: {
        Args: { p_contract: Json; p_deal_id?: string | null; p_purchase_details: Json }
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
          commission_amount: number | null
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
