import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Printer, Download, Calendar, Loader2 } from 'lucide-react';
import { formatDate } from '@/utils/formatDate';

function formatCurrency(amount: number): string {
  return `J$${amount.toLocaleString()}`;
}

const methodLabels: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  card: 'Card',
  cash: 'Cash',
  other: 'Other',
};

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

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Payment not found.</p>
      </div>
    );
  }

  const tenant = payment.tenant as any;
  const invoice = payment.invoice as any;
  const unit = tenant?.unit as any;
  const property = unit?.property as any;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Receipt</h1>
            <p className="text-gray-600">Receipt #{payment.payment_number}</p>
          </div>
          <div className="flex gap-3 print:hidden">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center border-b">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-xl text-green-600">Payment Received</CardTitle>
            <p className="text-gray-600">Your payment has been successfully processed</p>
          </CardHeader>

          <CardContent className="p-4 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Payment Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-semibold text-xl text-green-600">{formatCurrency(payment.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">{methodLabels[payment.method] ?? payment.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Number:</span>
                    <span className="font-mono text-sm">{payment.payment_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Date:</span>
                    <span className="font-medium">{formatDate(payment.payment_date)}</span>
                  </div>
                  {invoice?.description && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Description:</span>
                      <span className="font-medium">{invoice.description}</span>
                    </div>
                  )}
                  {invoice?.invoice_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invoice:</span>
                      <span className="font-medium">{invoice.invoice_number}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Property Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600 block">Property:</span>
                    <span className="font-medium">{property?.name ?? 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block">Address:</span>
                    <span className="font-medium">{property?.address ?? 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block">Unit:</span>
                    <span className="font-medium">{unit?.name ?? 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Tenant Information</h3>
                  <div className="space-y-2">
                    <p className="font-medium">{tenant?.first_name} {tenant?.last_name}</p>
                    {tenant?.email && <p className="text-gray-600">{tenant.email}</p>}
                    {tenant?.phone && <p className="text-gray-600">{tenant.phone}</p>}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Landlord Information</h3>
                  <div className="space-y-2">
                    <p className="font-medium">
                      {profile?.company_name || `${profile?.first_name} ${profile?.last_name}`}
                    </p>
                    {profile?.email && <p className="text-gray-600">{profile.email}</p>}
                    {profile?.phone && <p className="text-gray-600">{profile.phone}</p>}
                    {profile?.company_address && <p className="text-gray-600">{profile.company_address}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t bg-gray-50 -mx-4 sm:-mx-8 -mb-4 sm:-mb-8 p-4 sm:p-8 rounded-b-lg">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-sm text-gray-600">
                    This receipt serves as proof of payment.
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Keep this receipt for your records.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  Generated on {formatDate(new Date().toISOString())}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
