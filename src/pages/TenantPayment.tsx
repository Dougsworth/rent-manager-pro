import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getInvoicesForTenant } from '@/services/invoices';
import { uploadProofImage, submitPaymentProof, getProofsForInvoice } from '@/services/paymentProofs';
import type { Invoice, PaymentProof, Profile } from '@/types/app.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Calendar, Upload, Loader2, CheckCircle, XCircle, Clock, Image as ImageIcon, X } from 'lucide-react';
import { formatDate } from '@/utils/formatDate';

function formatCurrency(amount: number): string {
  return `J$${amount.toLocaleString()}`;
}

interface TenantRecord {
  id: string;
  landlord_id: string;
  first_name: string;
  last_name: string;
}

export default function TenantPayment() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [proofsByInvoice, setProofsByInvoice] = useState<Record<string, PaymentProof[]>>({});
  const [tenantRecord, setTenantRecord] = useState<TenantRecord | null>(null);
  const [landlordProfile, setLandlordProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    if (!user) return;
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
    try {
      const imageUrl = await uploadProofImage(selectedFile);
      await submitPaymentProof(uploadingFor, tenantRecord.id, tenantRecord.landlord_id, imageUrl);
      setUploadingFor(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      await loadData();
    } catch (err) {
      console.error('Failed to submit proof:', err);
    } finally {
      setSubmitting(false);
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!tenantRecord) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">No tenant record linked to your account.</p>
      </div>
    );
  }

  const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid');
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');

  const hasBankDetails = landlordProfile?.bank_name || landlordProfile?.bank_account_name || landlordProfile?.bank_account_number;

  return (
    <div className="min-h-screen bg-gray-50">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Payments</h1>
              <p className="text-gray-600">{tenantRecord.first_name} {tenantRecord.last_name}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Bank Transfer Instructions */}
        {hasBankDetails && (
          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold text-gray-900 mb-3">Bank Transfer Details</h2>
              <p className="text-sm text-gray-600 mb-4">
                Transfer your rent to the account below, then upload a screenshot of your confirmation.
              </p>
              <div className="space-y-2 text-sm">
                {landlordProfile?.bank_name && (
                  <p><span className="text-gray-500">Bank:</span> <strong>{landlordProfile.bank_name}</strong></p>
                )}
                {landlordProfile?.bank_account_name && (
                  <p><span className="text-gray-500">Account Name:</span> <strong>{landlordProfile.bank_account_name}</strong></p>
                )}
                {landlordProfile?.bank_account_number && (
                  <p><span className="text-gray-500">Account Number:</span> <strong>{landlordProfile.bank_account_number}</strong></p>
                )}
                {landlordProfile?.bank_branch && (
                  <p><span className="text-gray-500">Branch:</span> <strong>{landlordProfile.bank_branch}</strong></p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Unpaid Invoices */}
        {unpaidInvoices.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Outstanding Invoices</h2>
            <div className="space-y-4">
              {unpaidInvoices.map((invoice) => {
                const latestProof = getLatestProof(invoice.id);
                const isUploading = uploadingFor === invoice.id;

                return (
                  <Card key={invoice.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{invoice.description || 'Monthly Rent'}</p>
                            <StatusBadge variant={invoice.status}>{invoice.status}</StatusBadge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span>Due: {formatDate(invoice.due_date)}</span>
                            <span>{invoice.invoice_number}</span>
                          </div>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(invoice.amount)}</p>
                      </div>

                      {/* Proof status indicator */}
                      {latestProof && !isUploading && (
                        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm mb-3 ${
                          latestProof.status === 'pending' ? 'bg-yellow-50 text-yellow-800' :
                          latestProof.status === 'approved' ? 'bg-green-50 text-green-800' :
                          'bg-red-50 text-red-800'
                        }`}>
                          {latestProof.status === 'pending' && <Clock className="h-4 w-4" />}
                          {latestProof.status === 'approved' && <CheckCircle className="h-4 w-4" />}
                          {latestProof.status === 'rejected' && <XCircle className="h-4 w-4" />}
                          <span className="font-medium">
                            {latestProof.status === 'pending' && 'Proof submitted — pending review'}
                            {latestProof.status === 'approved' && 'Payment approved'}
                            {latestProof.status === 'rejected' && 'Proof rejected'}
                          </span>
                          {latestProof.status === 'rejected' && latestProof.reviewer_note && (
                            <span className="ml-1">— {latestProof.reviewer_note}</span>
                          )}
                        </div>
                      )}

                      {/* Upload UI */}
                      {isUploading && previewUrl ? (
                        <div className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-700">Preview</p>
                            <button onClick={cancelUpload} className="p-1 hover:bg-gray-100 rounded">
                              <X className="h-4 w-4 text-gray-500" />
                            </button>
                          </div>
                          <img src={previewUrl} alt="Payment proof" className="max-h-64 rounded-lg object-contain mx-auto" />
                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleFileSelect(invoice.id)}
                            >
                              Change Image
                            </Button>
                            <Button
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                              onClick={handleSubmitProof}
                              disabled={submitting}
                            >
                              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Submit Proof
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Show upload button if no pending proof or was rejected */
                        (!latestProof || latestProof.status === 'rejected') && (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => handleFileSelect(invoice.id)}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            I've Paid — Upload Proof
                          </Button>
                        )
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Paid Invoices */}
        {paidInvoices.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Paid Invoices</h2>
            <div className="space-y-3">
              {paidInvoices.map((invoice) => (
                <Card key={invoice.id} className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{invoice.description || 'Monthly Rent'}</p>
                          <StatusBadge variant="paid">paid</StatusBadge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>Due: {formatDate(invoice.due_date)}</span>
                          <span>{invoice.invoice_number}</span>
                        </div>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(invoice.amount)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {invoices.length === 0 && (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No invoices yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
