import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getInvoicesForTenant } from '@/services/invoices';
import { uploadProofImage, submitPaymentProof, getProofsForInvoice } from '@/services/paymentProofs';
import type { Invoice, PaymentProof, Profile } from '@/types/app.types';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import BrandLogo from '@/components/BrandLogo';
import { formatDate } from '@/utils/formatDate';
import { formatMoney } from '@/lib/money';

interface TenantRecord {
  id: string;
  landlord_id: string;
  first_name: string;
  last_name: string;
}

function CopyValue({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 border-t border-rule py-2.5">
      <div className="min-w-0">
        <dt className="text-[13.5px] text-quiet">{label}</dt>
        <dd className="num truncate text-base font-semibold">{value}</dd>
      </div>
      <button
        type="button"
        onClick={async () => { try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked */ } }}
        className="min-h-11 cursor-pointer px-2 text-sm font-semibold text-shell underline"
        aria-label={`Copy ${label.toLowerCase()}`}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

function Shell({ children, onSignOut }: { children: React.ReactNode; onSignOut?: () => void }) {
  return (
    <div className="min-h-screen bg-ground text-ink">
      <header className="bg-shell text-white">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-5">
          <span className="text-lg"><BrandLogo /></span>
          {onSignOut && (
            <button type="button" onClick={onSignOut} className="min-h-11 cursor-pointer text-sm text-shell-ink underline hover:text-white">Sign out</button>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-lg px-5 pb-16 pt-7">{children}</main>
    </div>
  );
}

/** What a signed in tenant sees: what they owe, where to send it, and a way to show they paid. */
export default function TenantPayment() {
  const { user, signOut } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [proofsByInvoice, setProofsByInvoice] = useState<Record<string, PaymentProof[]>>({});
  const [tenantRecord, setTenantRecord] = useState<TenantRecord | null>(null);
  const [landlordProfile, setLandlordProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkingOutFor, setCheckingOutFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    if (!user) return;
    setLoadError(false);
    try {
      // Get tenant record linked to this profile
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id, landlord_id, first_name, last_name')
        .eq('profile_id', user.id)
        .single();

      if (!tenant) {
        setLoading(false);
        return;
      }
      setTenantRecord(tenant);

      // Fetch landlord profile for bank details
      const { data: landlord } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', tenant.landlord_id)
        .single();
      setLandlordProfile(landlord as Profile | null);

      // Fetch invoices
      const invData = await getInvoicesForTenant(tenant.id) as Invoice[];
      setInvoices(invData);

      // Fetch proofs for each invoice
      const proofMap: Record<string, PaymentProof[]> = {};
      await Promise.all(
        invData.map(async (inv) => {
          const proofs = await getProofsForInvoice(inv.id) as PaymentProof[];
          proofMap[inv.id] = proofs;
        })
      );
      setProofsByInvoice(proofMap);
    } catch (err) {
      console.error('Failed to load tenant data:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleFileSelect = (invoiceId: string) => {
    setUploadingFor(invoiceId);
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const handleSubmitProof = async () => {
    if (!selectedFile || !uploadingFor || !tenantRecord) return;
    setSubmitting(true);
    setError(null);
    try {
      const imageUrl = await uploadProofImage(selectedFile);
      await submitPaymentProof(uploadingFor, tenantRecord.id, tenantRecord.landlord_id, imageUrl);
      setUploadingFor(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      await loadData();
    } catch (err) {
      console.error('Failed to submit proof:', err);
      setError('Your screenshot did not send. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayOnline = async (invoiceId: string) => {
    setCheckingOutFor(invoiceId);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('handypay-checkout', {
        body: { invoice_id: invoiceId },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      const url = data?.checkout_url;
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('HandyPay did not open. Try again, or pay by bank transfer.');
      setCheckingOutFor(null);
    }
  };

  const cancelUpload = () => {
    setUploadingFor(null);
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const getLatestProof = (invoiceId: string): PaymentProof | undefined => {
    const proofs = proofsByInvoice[invoiceId];
    return proofs?.[0];
  };

  if (loading) {
    return (
      <Shell>
        <p aria-busy="true" className="text-quiet">Opening your invoices</p>
      </Shell>
    );
  }

  if (loadError) {
    return (
      <Shell onSignOut={signOut}>
        <h1 className="text-2xl font-semibold">We could not load your invoices</h1>
        <p className="mt-2 text-base text-quiet">Check your connection and try again.</p>
        <Button size="lg" className="mt-5 w-full" onClick={() => { setLoading(true); loadData(); }}>Try again</Button>
      </Shell>
    );
  }

  if (!tenantRecord) {
    return (
      <Shell onSignOut={signOut}>
        <h1 className="text-2xl font-semibold">Your account is not linked to a rental yet</h1>
        <p className="mt-2 text-base text-quiet">Ask your landlord to add you as a tenant using the email you signed up with. Your invoices will show here after that.</p>
      </Shell>
    );
  }

  const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid');
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const owed = unpaidInvoices.reduce((s, inv) => s + Number(inv.amount || 0), 0);
  const lateCount = unpaidInvoices.filter(inv => inv.status === 'overdue').length;

  const hasBankDetails = landlordProfile?.bank_name || landlordProfile?.bank_account_name || landlordProfile?.bank_account_number;

  return (
    <Shell onSignOut={signOut}>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <p className="text-[15px] text-quiet">For {tenantRecord.first_name} {tenantRecord.last_name}</p>
      {unpaidInvoices.length > 0 ? (
        <>
          <h1 className="display num mt-1 text-[48px] font-bold leading-none">{formatMoney(owed)}</h1>
          <p className="mt-2 text-base">
            {lateCount > 0
              ? <><b className="font-semibold text-late">Owed now, {lateCount === 1 ? '1 invoice is' : `${lateCount} invoices are`} late.</b></>
              : <>Owed on {unpaidInvoices.length === 1 ? '1 invoice' : `${unpaidInvoices.length} invoices`}.</>}
          </p>
        </>
      ) : (
        <>
          <h1 className="display mt-1 text-[40px] font-bold leading-none">Nothing owed</h1>
          <p className="mt-2 text-base">{invoices.length > 0 ? <b className="font-semibold text-paid">You are paid up. Thank you.</b> : 'Your landlord has not sent an invoice yet. When they do, it shows here.'}</p>
        </>
      )}

      {error && (
        <p role="alert" className="mt-5 border-t border-late pt-3 text-[15px] font-medium text-late">{error}</p>
      )}

      {unpaidInvoices.length > 0 && hasBankDetails && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Pay by bank transfer</h2>
          <p className="mb-3 mt-1 text-[15px] text-quiet">Send the amount to this account, then add a screenshot of the confirmation to the invoice below.</p>
          <dl>
            {landlordProfile?.bank_name && <CopyValue label="Bank" value={landlordProfile.bank_name} />}
            {landlordProfile?.bank_account_name && <CopyValue label="Account name" value={landlordProfile.bank_account_name} />}
            {landlordProfile?.bank_account_number && <CopyValue label="Account number" value={landlordProfile.bank_account_number} />}
            {landlordProfile?.bank_branch && <CopyValue label="Branch" value={landlordProfile.bank_branch} />}
          </dl>
        </section>
      )}

      {unpaidInvoices.length > 0 && (
        <section className="mt-8">
          <h2 className="pb-2 text-lg font-semibold">{unpaidInvoices.length === 1 ? 'Invoice to pay' : 'Invoices to pay'}</h2>
          <ul>
            {unpaidInvoices.map((invoice) => {
              const latestProof = getLatestProof(invoice.id);
              const isUploading = uploadingFor === invoice.id;
              const canAct = !latestProof || latestProof.status === 'rejected';

              return (
                <li key={invoice.id} className="border-t border-ink pb-6 pt-4">
                  <div className="grid grid-cols-[1fr_auto] gap-x-4">
                    <p className="font-semibold">{invoice.description || 'Monthly rent'}</p>
                    <p className="num text-right text-lg font-bold">{formatMoney(invoice.amount)}</p>
                    <p className="text-[13.5px] text-quiet">Due {formatDate(invoice.due_date)}, invoice {invoice.invoice_number}</p>
                    <div className="text-right">
                      {latestProof?.status === 'pending'
                        ? <StatusBadge variant="pending">Being checked</StatusBadge>
                        : latestProof?.status === 'approved'
                        ? <StatusBadge variant="paid">Approved</StatusBadge>
                        : <StatusBadge variant={invoice.status === 'overdue' ? 'overdue' : 'pending'}>{invoice.status === 'overdue' ? 'Late' : 'Due'}</StatusBadge>}
                    </div>
                  </div>

                  {latestProof && !isUploading && (
                    <p role="status" className="mt-3 text-[15px]">
                      {latestProof.status === 'pending' && 'We got your proof. Your landlord is checking it and you will get a receipt once it is approved.'}
                      {latestProof.status === 'approved' && <span className="text-paid">Your payment was approved.</span>}
                      {latestProof.status === 'rejected' && (
                        <span className="text-late">
                          Your last proof was not accepted.{' '}
                          {latestProof.reviewer_note ? `The note says: ${latestProof.reviewer_note}` : 'Check the amount and account, then send a new screenshot.'}
                        </span>
                      )}
                    </p>
                  )}

                  {isUploading && previewUrl ? (
                    <div className="mt-4">
                      <img src={previewUrl} alt="Your payment screenshot" className="mx-auto max-h-72 border border-rule object-contain" />
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Button size="lg" onClick={handleSubmitProof} disabled={submitting}>{submitting ? 'Sending' : 'Send proof'}</Button>
                        <Button size="lg" variant="outline" onClick={() => handleFileSelect(invoice.id)} disabled={submitting}>Choose another</Button>
                      </div>
                      <button type="button" onClick={cancelUpload} className="mt-2 min-h-11 cursor-pointer text-sm text-quiet underline">Cancel</button>
                    </div>
                  ) : canAct && (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <Button size="lg" onClick={() => handleFileSelect(invoice.id)}>I have paid, add screenshot</Button>
                      <Button size="lg" variant="outline" onClick={() => handlePayOnline(invoice.id)} disabled={checkingOutFor === invoice.id}>
                        {checkingOutFor === invoice.id ? 'Opening HandyPay' : `Pay ${formatMoney(invoice.amount)} by card`}
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {paidInvoices.length > 0 && (
        <section className="mt-8">
          <h2 className="pb-2 text-lg font-semibold">Paid</h2>
          <ul>
            {paidInvoices.map((invoice) => (
              <li key={invoice.id} className="grid grid-cols-[1fr_auto] gap-x-4 border-t border-rule py-3">
                <p className="font-medium">{invoice.description || 'Monthly rent'}</p>
                <p className="num text-right font-semibold">{formatMoney(invoice.amount)}</p>
                <p className="text-[13.5px] text-quiet">Due {formatDate(invoice.due_date)}, invoice {invoice.invoice_number}</p>
                <div className="text-right"><StatusBadge variant="paid">Paid</StatusBadge></div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-12 text-[13.5px] text-quiet">Questions about an amount go to your landlord.</p>
    </Shell>
  );
}
