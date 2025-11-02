export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      property_owners: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      properties: {
        Row: {
          id: string;
          owner_id: string;
          address: string;
          city: string | null;
          district: string | null;
          status: 'Empty' | 'Occupied' | 'Inactive';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          address: string;
          city?: string | null;
          district?: string | null;
          status?: 'Empty' | 'Occupied' | 'Inactive';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          address?: string;
          city?: string | null;
          district?: string | null;
          status?: 'Empty' | 'Occupied' | 'Inactive';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      property_photos: {
        Row: {
          id: string;
          property_id: string;
          file_path: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          file_path: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          file_path?: string;
          sort_order?: number;
          created_at?: string;
        };
      };
      tenants: {
        Row: {
          id: string;
          property_id: string | null;
          name: string;
          phone: string | null;
          email: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id?: string | null;
          name: string;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string | null;
          name?: string;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      contracts: {
        Row: {
          id: string;
          tenant_id: string;
          property_id: string;
          start_date: string;
          end_date: string;
          rent_amount: number | null;
          currency: string | null;
          status: 'Active' | 'Archived' | 'Inactive';
          contract_pdf_path: string | null;
          notes: string | null;
          rent_increase_reminder_enabled: boolean | null;
          rent_increase_reminder_days: number | null;
          rent_increase_reminder_contacted: boolean | null;
          expected_new_rent: number | null;
          reminder_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          property_id: string;
          start_date: string;
          end_date: string;
          rent_amount?: number | null;
          currency?: string | null;
          status?: 'Active' | 'Archived' | 'Inactive';
          contract_pdf_path?: string | null;
          notes?: string | null;
          rent_increase_reminder_enabled?: boolean | null;
          rent_increase_reminder_days?: number | null;
          rent_increase_reminder_contacted?: boolean | null;
          expected_new_rent?: number | null;
          reminder_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          property_id?: string;
          start_date?: string;
          end_date?: string;
          rent_amount?: number | null;
          currency?: string | null;
          status?: 'Active' | 'Archived' | 'Inactive';
          contract_pdf_path?: string | null;
          notes?: string | null;
          rent_increase_reminder_enabled?: boolean | null;
          rent_increase_reminder_days?: number | null;
          rent_increase_reminder_contacted?: boolean | null;
          expected_new_rent?: number | null;
          reminder_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_preferences: {
        Row: {
          user_id: string;
          language: string | null;
          currency: string | null;
        };
        Insert: {
          user_id: string;
          language?: string | null;
          currency?: string | null;
        };
        Update: {
          user_id?: string;
          language?: string | null;
          currency?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
