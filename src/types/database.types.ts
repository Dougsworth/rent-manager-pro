export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: 'landlord' | 'tenant';
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          company_name: string;
          company_address: string;
          company_city: string;
          company_country: string;
          company_website: string;
          company_tax_id: string;
          bank_name: string;
          bank_account_name: string;
          bank_account_number: string;
          bank_branch: string;
          notification_preferences: { payments: boolean; overdue: boolean; invoices: boolean };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: 'landlord' | 'tenant';
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string;
          company_name?: string;
          company_address?: string;
          company_city?: string;
          company_country?: string;
          company_website?: string;
          company_tax_id?: string;
          bank_name?: string;
          bank_account_name?: string;
          bank_account_number?: string;
          bank_branch?: string;
          notification_preferences?: { payments: boolean; overdue: boolean; invoices: boolean };
        };
        Update: {
          role?: 'landlord' | 'tenant';
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string;
          company_name?: string;
          company_address?: string;
          company_city?: string;
          company_country?: string;
          company_website?: string;
          company_tax_id?: string;
          bank_name?: string;
          bank_account_name?: string;
          bank_account_number?: string;
          bank_branch?: string;
          notification_preferences?: { payments: boolean; overdue: boolean; invoices: boolean };
        };
        Relationships: [];
      };
      properties: {
        Row: {
          id: string;
          landlord_id: string;
          name: string;
          address: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          landlord_id: string;
          name: string;
          address?: string;
        };
        Update: {
          name?: string;
          address?: string;
        };
        Relationships: [];
      };
      units: {
        Row: {
          id: string;
          property_id: string;
          name: string;
          rent_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          name: string;
          rent_amount?: number;
        };
        Update: {
          name?: string;
          rent_amount?: number;
        };
        Relationships: [];
      };
      tenants: {
        Row: {
          id: string;
          profile_id: string | null;
          landlord_id: string;
          unit_id: string | null;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          lease_start: string | null;
          lease_end: string | null;
          status: 'active' | 'inactive';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          landlord_id: string;
          unit_id?: string | null;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string;
          lease_start?: string | null;
          lease_end?: string | null;
          status?: 'active' | 'inactive';
        };
        Update: {
          profile_id?: string | null;
          unit_id?: string | null;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string;
          lease_start?: string | null;
          lease_end?: string | null;
          status?: 'active' | 'inactive';
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          tenant_id: string;
          landlord_id: string;
          amount: number;
          due_date: string;
          issue_date: string;
          status: 'paid' | 'pending' | 'overdue';
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_number?: string;
          tenant_id: string;
          landlord_id: string;
          amount: number;
          due_date: string;
          issue_date?: string;
          status?: 'paid' | 'pending' | 'overdue';
          description?: string;
        };
        Update: {
          amount?: number;
          due_date?: string;
          issue_date?: string;
          status?: 'paid' | 'pending' | 'overdue';
          description?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          payment_number: string;
          invoice_id: string | null;
          tenant_id: string;
          landlord_id: string;
          amount: number;
          payment_date: string;
          method: 'bank_transfer' | 'card' | 'cash' | 'other';
          status: 'completed' | 'pending' | 'failed';
          transaction_id: string | null;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          payment_number?: string;
          invoice_id?: string | null;
          tenant_id: string;
          landlord_id: string;
          amount: number;
          payment_date?: string;
          method?: 'bank_transfer' | 'card' | 'cash' | 'other';
          status?: 'completed' | 'pending' | 'failed';
          transaction_id?: string | null;
          notes?: string;
        };
        Update: {
          invoice_id?: string | null;
          amount?: number;
          payment_date?: string;
          method?: 'bank_transfer' | 'card' | 'cash' | 'other';
          status?: 'completed' | 'pending' | 'failed';
          transaction_id?: string | null;
          notes?: string;
        };
        Relationships: [];
      };
      payment_proofs: {
        Row: {
          id: string;
          invoice_id: string;
          tenant_id: string;
          landlord_id: string;
          image_url: string;
          status: 'pending' | 'approved' | 'rejected';
          reviewer_note: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          tenant_id: string;
          landlord_id: string;
          image_url: string;
          status?: 'pending' | 'approved' | 'rejected';
          reviewer_note?: string;
        };
        Update: {
          status?: 'pending' | 'approved' | 'rejected';
          reviewer_note?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
