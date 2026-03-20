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
          payment_link: string | null;
          notification_preferences: { payments: boolean; overdue: boolean; invoices: boolean; auto_remind: boolean };
          setup_progress: { has_property: boolean; has_units: boolean; has_tenant: boolean; completed_at: string | null; dismissed: boolean } | null;
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
          payment_link?: string | null;
          notification_preferences?: { payments: boolean; overdue: boolean; invoices: boolean; auto_remind?: boolean };
          setup_progress?: { has_property: boolean; has_units: boolean; has_tenant: boolean; completed_at: string | null; dismissed: boolean };
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
          payment_link?: string | null;
          notification_preferences?: { payments: boolean; overdue: boolean; invoices: boolean; auto_remind?: boolean };
          setup_progress?: { has_property: boolean; has_units: boolean; has_tenant: boolean; completed_at: string | null; dismissed: boolean };
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
          payment_token: string;
          late_fee_amount: number | null;
          late_fee_applied_at: string | null;
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
          payment_token?: string;
          late_fee_amount?: number | null;
          late_fee_applied_at?: string | null;
        };
        Update: {
          amount?: number;
          due_date?: string;
          issue_date?: string;
          status?: 'paid' | 'pending' | 'overdue';
          description?: string;
          late_fee_amount?: number | null;
          late_fee_applied_at?: string | null;
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
      late_fee_settings: {
        Row: {
          id: string;
          landlord_id: string;
          fee_type: 'flat' | 'percentage';
          fee_value: number;
          grace_period_days: number;
          auto_apply: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          landlord_id: string;
          fee_type?: 'flat' | 'percentage';
          fee_value?: number;
          grace_period_days?: number;
          auto_apply?: boolean;
        };
        Update: {
          fee_type?: 'flat' | 'percentage';
          fee_value?: number;
          grace_period_days?: number;
          auto_apply?: boolean;
        };
        Relationships: [];
      };
      recurring_invoice_settings: {
        Row: {
          id: string;
          landlord_id: string;
          enabled: boolean;
          day_of_month: number;
          send_emails: boolean;
          description_template: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          landlord_id: string;
          enabled?: boolean;
          day_of_month?: number;
          send_emails?: boolean;
          description_template?: string;
        };
        Update: {
          enabled?: boolean;
          day_of_month?: number;
          send_emails?: boolean;
          description_template?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          landlord_id: string;
          type: 'payment_received' | 'payment_overdue' | 'invoice_created' | 'proof_submitted' | 'proof_approved' | 'proof_rejected' | 'tenant_added' | 'lease_expiring' | 'late_fee_applied' | 'system';
          title: string;
          message: string;
          related_entity_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          landlord_id: string;
          type: 'payment_received' | 'payment_overdue' | 'invoice_created' | 'proof_submitted' | 'proof_approved' | 'proof_rejected' | 'tenant_added' | 'lease_expiring' | 'late_fee_applied' | 'system';
          title: string;
          message: string;
          related_entity_id?: string | null;
          is_read?: boolean;
        };
        Update: {
          is_read?: boolean;
        };
        Relationships: [];
      };
      activity_logs: {
        Row: {
          id: string;
          landlord_id: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          description: string;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          landlord_id: string;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          description: string;
          metadata?: Record<string, unknown> | null;
        };
        Update: {
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          description?: string;
          metadata?: Record<string, unknown> | null;
        };
        Relationships: [];
      };
      lease_documents: {
        Row: {
          id: string;
          tenant_id: string;
          landlord_id: string;
          file_name: string;
          file_type: string;
          file_size: number;
          file_url: string;
          storage_path: string;
          document_type: 'lease' | 'addendum' | 'other';
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          landlord_id: string;
          file_name: string;
          file_type: string;
          file_size: number;
          file_url: string;
          storage_path: string;
          document_type?: 'lease' | 'addendum' | 'other';
        };
        Update: {
          file_name?: string;
          document_type?: 'lease' | 'addendum' | 'other';
        };
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          message: string;
          icon: string;
          cta_text: string | null;
          cta_link: string | null;
          active: boolean;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          message: string;
          icon?: string;
          cta_text?: string | null;
          cta_link?: string | null;
          active?: boolean;
          expires_at?: string | null;
        };
        Update: {
          title?: string;
          message?: string;
          icon?: string;
          active?: boolean;
          expires_at?: string | null;
        };
        Relationships: [];
      };
      announcement_dismissals: {
        Row: {
          id: string;
          announcement_id: string;
          user_id: string;
          dismissed_at: string;
        };
        Insert: {
          id?: string;
          announcement_id: string;
          user_id: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_invoice_by_token: {
        Args: { p_token: string };
        Returns: unknown;
      };
      submit_proof_by_token: {
        Args: { p_token: string; p_image_url: string };
        Returns: unknown;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
