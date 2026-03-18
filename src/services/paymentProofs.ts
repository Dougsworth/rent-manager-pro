import { supabase } from '@/lib/supabase';
import { createPayment } from '@/services/payments';
import { createNotification } from '@/services/notifications';
import { logActivity } from '@/services/activityLog';
import type { PaymentProofWithDetails } from '@/types/app.types';

export async function uploadProofImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('payment-proofs')
    .upload(path, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from('payment-proofs')
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function submitPaymentProof(
  invoiceId: string,
  tenantId: string,
  landlordId: string,
  imageUrl: string,
) {
  const { data, error } = await supabase
    .from('payment_proofs')
    .insert({ invoice_id: invoiceId, tenant_id: tenantId, landlord_id: landlordId, image_url: imageUrl })
    .select()
    .single();

  if (error) throw error;

  // Fire-and-forget notification to landlord
  const { data: tenant } = await supabase
    .from('tenants')
    .select('first_name, last_name')
    .eq('id', tenantId)
    .single();
  const tenantName = tenant ? `${tenant.first_name} ${tenant.last_name}` : 'A tenant';
  createNotification(
    landlordId,
    'proof_submitted',
    'Payment Proof Submitted',
    `${tenantName} submitted a payment proof for review`,
    (data as any).id,
  );
  logActivity(landlordId, 'proof_submitted', 'proof', `${tenantName} submitted a payment proof`, (data as any).id);

  return data;
}

export async function getProofsForLandlord(landlordId: string): Promise<PaymentProofWithDetails[]> {
  const { data, error } = await supabase
    .from('payment_proofs')
    .select(`
      *,
      tenant:tenants(first_name, last_name),
      invoice:invoices(invoice_number, amount)
    `)
    .eq('landlord_id', landlordId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return ((data ?? []) as any[]).map((p): PaymentProofWithDetails => {
    const tenant = p.tenant as any;
    const invoice = p.invoice as any;
    return {
      ...p,
      tenant_first_name: tenant?.first_name ?? '',
      tenant_last_name: tenant?.last_name ?? '',
      invoice_number: invoice?.invoice_number ?? '',
      invoice_amount: invoice?.amount ?? 0,
    };
  });
}

export async function getProofsForInvoice(invoiceId: string) {
  const { data, error } = await supabase
    .from('payment_proofs')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function approveProof(
  proofId: string,
  landlordId: string,
  invoiceId: string,
  tenantId: string,
  amount: number,
) {
  // Mark proof as approved
  const { error } = await supabase
    .from('payment_proofs')
    .update({ status: 'approved' })
    .eq('id', proofId);

  if (error) throw error;

  // Create the payment record (also marks invoice as paid)
  const payment = await createPayment(landlordId, {
    tenant_id: tenantId,
    invoice_id: invoiceId,
    amount,
    method: 'bank_transfer',
    notes: 'Approved from payment proof',
  });

  createNotification(
    landlordId,
    'proof_approved',
    'Payment Proof Approved',
    `Payment proof approved — J$${amount.toLocaleString()} recorded`,
    proofId,
  );
  logActivity(landlordId, 'proof_approved', 'proof', `Approved payment proof and created payment of J$${amount.toLocaleString()}`, proofId, { amount, invoice_id: invoiceId });

  // Fire-and-forget receipt email
  const paymentId = (payment as any).id;
  supabase.functions.invoke('send-receipt', {
    body: { payment_id: paymentId, tenant_id: tenantId, invoice_id: invoiceId },
  }).catch((err) => console.error('Receipt email failed:', err));

  return payment;
}

export async function rejectProof(proofId: string, landlordId: string, note?: string) {
  const { error } = await supabase
    .from('payment_proofs')
    .update({ status: 'rejected', reviewer_note: note ?? '' })
    .eq('id', proofId);

  if (error) throw error;

  createNotification(
    landlordId,
    'proof_rejected',
    'Payment Proof Rejected',
    `A payment proof was rejected${note ? `: ${note}` : ''}`,
    proofId,
  );
  logActivity(landlordId, 'proof_rejected', 'proof', `Rejected payment proof${note ? `: ${note}` : ''}`, proofId);
}
