import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate } from '@/utils/formatDate';
import { generateReceiptPdf } from '@/utils/generateReceiptPdf';
import { formatMoney } from '@/lib/money';
import { toast } from 'sonner';

const methodLabels: Record<string, string> = {
  bank_transfer: 'Bank transfer',
  card: 'Card',
  cash: 'Cash',
  other: 'Other',
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,140px)_minmax(0,1fr)] gap-4 border-t border-rule py-2.5 text-[15px] sm:grid-cols-[180px_minmax(0,1fr)]">
      <dt className="text-quiet">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

export default function Receipt() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data } = await supabase
        .from('payments')
        .select(`
          *,
          tenant:tenants(first_name, last_name, email, phone, unit:units(name, property:properties(name, address))),
          invoice:invoices(invoice_number, description)
        `)
        .eq('id', id)
        .single();
      setPayment(data);
      setLoading(false);
    };
    load();
  }, [id]);

  const [downloading, setDownloading] = useState(false);
  const handlePrint = () => window.print();
  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await generateReceiptPdf({ payment, profile });
    } catch (err) {
      console.error('Receipt PDF download failed', err);
      toast.error('The PDF could not be made. Try again, or use Print instead.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div aria-busy="true" aria-label="Loading receipt" className="mx-auto max-w-2xl">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-6 h-14 w-64" />
        <div className="mt-8 space-y-3">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="mx-auto max-w-2xl py-6">
        <h1 className="text-2xl font-semibold">We could not find that receipt</h1>
        <p className="mt-1 text-quiet">The payment may have been removed. Check your payments list and try again.</p>
      </div>
    );
  }

  const tenant = payment.tenant as any;
  const invoice = payment.invoice as any;
  const unit = tenant?.unit as any;
  const property = unit?.property as any;
  const tenantName = `${tenant?.first_name ?? ''} ${tenant?.last_name ?? ''}`.trim();
  const landlordName = profile?.company_name || `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim();
  const method = methodLabels[payment.method] ?? payment.method;

  return (
    <article className="mx-auto max-w-2xl bg-ground print:max-w-none print:bg-white">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-5">
        <div>
          <h1 className="display text-[34px] font-bold leading-[1.05] sm:text-[40px]">Receipt</h1>
          <p className="num mt-1 text-[15px] text-quiet">{payment.payment_number}</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={handlePrint}>Print</Button>
          <Button onClick={handleDownload} disabled={downloading}>{downloading ? 'Making PDF' : 'Download PDF'}</Button>
        </div>
      </div>

      <section className="py-6">
        <p className="text-[15px] text-quiet">Amount paid</p>
        <p className="display num mt-0.5 text-[42px] font-bold leading-none sm:text-[56px]">{formatMoney(payment.amount)}</p>
        <StatusBadge variant="paid" className="mt-3 text-[15px]">
          Paid {formatDate(payment.payment_date)} by {method.toLowerCase()}
        </StatusBadge>
      </section>

      <section>
        <h2 className="pb-2 text-[15px] font-semibold">Payment</h2>
        <dl className="num border-b border-rule">
          <Row label="Payment number">{payment.payment_number}</Row>
          <Row label="Date paid">{formatDate(payment.payment_date)}</Row>
          <Row label="How">{method}</Row>
          {invoice?.invoice_number && <Row label="Invoice">{invoice.invoice_number}</Row>}
          {invoice?.description && <Row label="For">{invoice.description}</Row>}
          <Row label="Property">{property?.name ?? 'Not recorded'}</Row>
          {property?.address && <Row label="Address">{property.address}</Row>}
          <Row label="Unit">{unit?.name ?? 'Not recorded'}</Row>
        </dl>
      </section>

      <section className="mt-8 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="border-b border-rule pb-2 text-[15px] font-semibold">Paid by</h2>
          <p className="mt-2.5 font-medium">{tenantName || 'Not recorded'}</p>
          {tenant?.email && <p className="text-[15px] text-quiet">{tenant.email}</p>}
          {tenant?.phone && <p className="text-[15px] text-quiet">{tenant.phone}</p>}
        </div>
        <div>
          <h2 className="border-b border-rule pb-2 text-[15px] font-semibold">Paid to</h2>
          <p className="mt-2.5 font-medium">{landlordName || 'Not recorded'}</p>
          {profile?.email && <p className="text-[15px] text-quiet">{profile.email}</p>}
          {profile?.phone && <p className="text-[15px] text-quiet">{profile.phone}</p>}
          {profile?.company_address && <p className="text-[15px] text-quiet">{profile.company_address}</p>}
        </div>
      </section>

      <footer className="mt-10 border-t border-ink pt-4 text-[13.5px] text-quiet">
        <p>This receipt is proof of payment. Keep it for your records.</p>
        <p className="num mt-1">Made on {formatDate(new Date().toISOString())} with EasyCollect.</p>
      </footer>
    </article>
  );
}
