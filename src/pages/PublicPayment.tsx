import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getInvoiceByToken, uploadProofImagePublic, submitProofByToken } from '@/services/publicPayment';
import type { PublicInvoiceData } from '@/types/app.types';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/formatDate';
import { formatMoney as formatCurrency } from '@/lib/money';

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

export default function PublicPayment() {
  const { token } = useParams<{ token: string }>();
  const [invoice, setInvoice] = useState<PublicInvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadInvoice = async () => {
    if (!token) {
      setError('Invalid payment link.');
      setLoading(false);
      return;
    }
    try {
      const data = await getInvoiceByToken(token);
      if (!data) {
        setError('Invoice not found. This link may be invalid or expired.');
      } else {
        setInvoice(data);
      }
    } catch {
      setError('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
  }, [token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleSubmitProof = async () => {
    if (!selectedFile || !token) return;
    setSubmitting(true);
    try {
      const imageUrl = await uploadProofImagePublic(selectedFile);
      await submitProofByToken(token, imageUrl);
      setSubmitted(true);
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      // Reload to show updated proof status
      await loadInvoice();
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to submit proof.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayOnline = async () => {
    if (!invoice) return;
    setCheckingOut(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/handypay-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'apikey': anonKey,
        },
        body: JSON.stringify({ invoice_id: invoice.invoice_id }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to create checkout');
      const url = data.checkout_url;
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to start checkout. Please try again.');
      setCheckingOut(false);
    }
  };

  const cancelUpload = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ground" aria-busy="true">
        <p className="text-quiet">Opening your invoice</p>
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="min-h-screen bg-ground px-5 py-10">
        <div className="mx-auto max-w-md">
          <p className="display text-lg font-bold">EasyCollect</p>
          <h1 className="mt-8 text-2xl font-semibold">This payment link does not work</h1>
          <p className="mt-2 text-base text-quiet">{error} Ask the person who sent it for a new link.</p>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  const latestProof = invoice.proofs?.[0];
  const hasBankDetails = invoice.bank_name || invoice.bank_account_name || invoice.bank_account_number;
  const canUpload = invoice.status !== 'paid' && (!latestProof || latestProof.status === 'rejected');
  const paid = invoice.status === 'paid' || latestProof?.status === 'approved';
  const pendingReview = latestProof?.status === 'pending' || submitted;

  return (
    <div className="min-h-screen bg-ground text-ink">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <header className="bg-shell px-5 py-3 text-white">
        <div className="mx-auto max-w-lg display text-lg font-bold">EasyCollect</div>
      </header>

      <main className="mx-auto max-w-lg px-5 pb-16 pt-7">
        <p className="text-[15px] text-quiet">For {invoice.tenant_name}</p>
        <h1 className="display num mt-1 text-[48px] font-bold leading-none">{formatCurrency(invoice.amount)}</h1>
        <p className="mt-2 text-base">
          {invoice.description || 'Rent'}, {paid ? <b className="font-semibold text-paid">paid. Thank you.</b> : <>due {formatDate(invoice.due_date)}</>}
        </p>
        <p className="mt-1 text-[13.5px] text-quiet">Invoice {invoice.invoice_number}, issued {formatDate(invoice.issue_date)}</p>

        {error && (
          <p role="alert" className="mt-5 border-t border-late pt-3 text-[15px] font-medium text-late">{error}</p>
        )}

        {pendingReview && !paid && (
          <div role="status" className="mt-6 border-t border-ink pt-4">
            <h2 className="text-lg font-semibold">We got your proof</h2>
            <p className="mt-1 text-[15px]">Your landlord will check it and you will get a receipt once it is approved. You can close this page.</p>
          </div>
        )}

        {latestProof?.status === 'rejected' && !submitted && (
          <div role="status" className="mt-6 border-t border-late pt-4">
            <h2 className="text-lg font-semibold text-late">Your last proof was not accepted</h2>
            <p className="mt-1 text-[15px]">{latestProof.reviewer_note ? `The note says: ${latestProof.reviewer_note}` : 'Check the amount and account, then send a new screenshot.'}</p>
          </div>
        )}

        {!paid && !pendingReview && (
          <>
            {hasBankDetails && (
              <section className="mt-8">
                <h2 className="text-lg font-semibold">Pay by bank transfer</h2>
                <p className="mb-3 mt-1 text-[15px] text-quiet">Send {formatCurrency(invoice.amount)} to this account, then send a screenshot of the confirmation below.</p>
                <dl>
                  {invoice.bank_name && <CopyValue label="Bank" value={invoice.bank_name} />}
                  {invoice.bank_account_name && <CopyValue label="Account name" value={invoice.bank_account_name} />}
                  {invoice.bank_account_number && <CopyValue label="Account number" value={invoice.bank_account_number} />}
                  {invoice.bank_branch && <CopyValue label="Branch" value={invoice.bank_branch} />}
                  <CopyValue label="Amount" value={String(invoice.amount)} />
                </dl>
              </section>
            )}

            {canUpload && (
              <section className="mt-8 border-t border-ink pt-5">
                <h2 className="text-lg font-semibold">Send your proof</h2>
                {previewUrl ? (
                  <div className="mt-3">
                    <img src={previewUrl} alt="Your payment screenshot" className="mx-auto max-h-72 border border-rule object-contain" />
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button size="lg" onClick={handleSubmitProof} disabled={submitting}>{submitting ? 'Sending' : 'Send proof'}</Button>
                      <Button size="lg" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={submitting}>Choose another</Button>
                    </div>
                    <button onClick={cancelUpload} className="mt-2 min-h-11 cursor-pointer text-sm text-quiet underline">Cancel</button>
                  </div>
                ) : (
                  <>
                    <p className="mb-4 mt-1 text-[15px] text-quiet">A screenshot of your bank confirmation is enough. You do not need an account.</p>
                    <Button size="lg" className="w-full" onClick={() => fileInputRef.current?.click()}>I have paid, add screenshot</Button>
                  </>
                )}
              </section>
            )}

            <section className="mt-8 border-t border-rule pt-5">
              <h2 className="text-lg font-semibold">Or pay by card</h2>
              <p className="mb-3 mt-1 text-[15px] text-quiet">Through HandyPay. When it goes through you come back to this page.</p>
              <Button size="lg" variant="outline" className="w-full" onClick={handlePayOnline} disabled={checkingOut}>
                {checkingOut ? 'Opening HandyPay' : `Pay ${formatCurrency(invoice.amount)} online`}
              </Button>
            </section>
          </>
        )}

        <p className="mt-12 text-[13.5px] text-quiet">Sent with EasyCollect. Questions about this amount go to your landlord.</p>
      </main>
    </div>
  );
}
