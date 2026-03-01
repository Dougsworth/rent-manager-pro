import type { Database } from './database.types';

// Row shortcuts
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Property = Database['public']['Tables']['properties']['Row'];
export type Unit = Database['public']['Tables']['units']['Row'];
export type DbTenant = Database['public']['Tables']['tenants']['Row'];
export type Invoice = Database['public']['Tables']['invoices']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type PaymentProof = Database['public']['Tables']['payment_proofs']['Row'];
export type LateFeeSettings = Database['public']['Tables']['late_fee_settings']['Row'];
export type LeaseDocument = Database['public']['Tables']['lease_documents']['Row'];

export interface PaymentProofWithDetails extends PaymentProof {
  tenant_first_name: string;
  tenant_last_name: string;
  invoice_number: string;
  invoice_amount: number;
}

// UI-facing joined types
export interface TenantWithDetails extends DbTenant {
  unit_name: string;
  property_name: string;
  rent_amount: number;
  payment_status: 'paid' | 'pending' | 'overdue';
}

export interface InvoiceWithTenant extends Invoice {
  tenant_first_name: string;
  tenant_last_name: string;
  property_name: string;
  unit_name: string;
}

export interface PaymentWithDetails extends Payment {
  tenant_first_name: string;
  tenant_last_name: string;
  property_name: string;
  unit_name: string;
  invoice_number: string | null;
}

export interface DashboardStats {
  expected: number;
  collected: number;
  outstanding: number;
  overdue: number;
  tenantCount: number;
}

export interface PropertyWithUnits extends Property {
  units: Unit[];
}

export interface PublicInvoiceData {
  invoice_id: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  issue_date: string;
  status: 'paid' | 'pending' | 'overdue';
  description: string;
  tenant_name: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_branch: string;
  proofs: {
    id: string;
    image_url: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewer_note: string;
    created_at: string;
  }[];
}

// AI Chat types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source: 'local' | 'ai';
}

export interface AiChatUsage {
  request_count: number;
  limit: number;
  remaining: number;
}

// Report types
export interface MonthlyCollectionData {
  month: string;
  monthLabel: string;
  expected: number;
  collected: number;
  outstanding: number;
}

export interface PropertyCollectionData {
  property_id: string;
  property_name: string;
  expected: number;
  collected: number;
  unit_count: number;
}

export interface PnLData {
  totalExpected: number;
  totalCollected: number;
  totalOutstanding: number;
  collectionRate: number;
  byMonth: MonthlyCollectionData[];
  byProperty: PropertyCollectionData[];
}

export type LocalIntent =
  | 'overdue'
  | 'outstanding'
  | 'tenant_count'
  | 'collected'
  | 'recent_payments'
  | 'dashboard_stats';
