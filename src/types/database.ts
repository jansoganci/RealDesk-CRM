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
      contracts: {
        Row: {
          contract_pdf_path: string | null
          created_at: string | null
          currency: string | null
          end_date: string
          expected_new_rent: number | null
          id: string
          notes: string | null
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
        }
        Insert: {
          contract_pdf_path?: string | null
          created_at?: string | null
          currency?: string | null
          end_date: string
          expected_new_rent?: number | null
          id?: string
          notes?: string | null
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
        }
        Update: {
          contract_pdf_path?: string | null
          created_at?: string | null
          currency?: string | null
          end_date?: string
          expected_new_rent?: number | null
          id?: string
          notes?: string | null
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
        }
        Relationships: [
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
      inquiry_matches: {
        Row: {
          contacted: boolean | null
          id: string
          inquiry_id: string
          matched_at: string | null
          notification_sent: boolean | null
          property_id: string
        }
        Insert: {
          contacted?: boolean | null
          id?: string
          inquiry_id: string
          matched_at?: string | null
          notification_sent?: boolean | null
          property_id: string
        }
        Update: {
          contacted?: boolean | null
          id?: string
          inquiry_id?: string
          matched_at?: string | null
          notification_sent?: boolean | null
          property_id?: string
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
          id: string
          notes: string | null
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
          id?: string
          notes?: string | null
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
          id?: string
          notes?: string | null
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
      properties: {
        Row: {
          address: string
          city: string | null
          created_at: string | null
          currency: string | null
          district: string | null
          id: string
          listing_url: string | null
          notes: string | null
          owner_id: string
          rent_amount: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          address: string
          city?: string | null
          created_at?: string | null
          currency?: string | null
          district?: string | null
          id?: string
          listing_url?: string | null
          notes?: string | null
          owner_id: string
          rent_amount?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          city?: string | null
          created_at?: string | null
          currency?: string | null
          district?: string | null
          id?: string
          listing_url?: string | null
          notes?: string | null
          owner_id?: string
          rent_amount?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
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
          email: string | null
          id: string
          max_budget: number | null
          min_budget: number | null
          name: string
          notes: string | null
          phone: string
          preferred_city: string | null
          preferred_district: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          max_budget?: number | null
          min_budget?: number | null
          name: string
          notes?: string | null
          phone: string
          preferred_city?: string | null
          preferred_district?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          max_budget?: number | null
          min_budget?: number | null
          name?: string
          notes?: string | null
          phone?: string
          preferred_city?: string | null
          preferred_district?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      property_owners: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      tenants: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          property_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          property_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          property_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          currency: string | null
          language: string | null
          meeting_reminder_minutes: number | null
          user_id: string
        }
        Insert: {
          currency?: string | null
          language?: string | null
          meeting_reminder_minutes?: number | null
          user_id: string
        }
        Update: {
          currency?: string | null
          language?: string | null
          meeting_reminder_minutes?: number | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_quota: {
        Args: {
          p_client_request_id?: string
          p_device_id?: string
          p_user_id?: string
        }
        Returns: Json
      }
      get_quota: {
        Args: { p_device_id?: string; p_user_id?: string }
        Returns: Json
      }
      rpc_create_contract_and_update_property: {
        Args: { p_contract: Json }
        Returns: {
          contract_pdf_path: string | null
          created_at: string | null
          currency: string | null
          end_date: string
          expected_new_rent: number | null
          id: string
          notes: string | null
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
        }
        SetofOptions: {
          from: "*"
          to: "contracts"
          isOneToOne: true
          isSetofReturn: false
        }
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
          end_date: string
          expected_new_rent: number | null
          id: string
          notes: string | null
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
        }
        SetofOptions: {
          from: "*"
          to: "contracts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
