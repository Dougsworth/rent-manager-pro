import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getInvoiceByToken, uploadProofImagePublic, submitProofByToken } from '@/services/publicPayment';
import type { PublicInvoiceData } from '@/types/app.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Upload, Loader2, CheckCircle, XCircle, Clock, X, AlertCircle, CreditCard } from 'lucide-react';
import { formatDate } from '@/utils/formatDate';

function formatCurrency(amount: number): string {
  return `J$${amount.toLocaleString()}`;
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

  const cancelUpload = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Payment Link Error</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice) return null;

  const latestProof = invoice.proofs?.[0];
  const hasBankDetails = invoice.bank_name || invoice.bank_account_name || invoice.bank_account_number;
  const canUpload = invoice.status !== 'paid' && (!latestProof || latestProof.status === 'rejected');

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
        <div className="max-w-2xl mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900">Payment Invoice</h1>
          <p className="text-gray-600">for {invoice.tenant_name}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Invoice Details */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">{invoice.invoice_number}</p>
                <p className="font-medium text-gray-900">{invoice.description || 'Monthly Rent'}</p>
              </div>
              <StatusBadge variant={invoice.status}>{invoice.status}</StatusBadge>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p>Due: {formatDate(invoice.due_date)}</p>
                <p>Issued: {formatDate(invoice.issue_date)}</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(invoice.amount)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Pay Online */}
        {invoice.payment_link && invoice.status !== 'paid' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-gray-900" />
                <h2 className="font-semibold text-gray-900">Pay Online</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">Pay securely via HandyPay</p>
              <Button
                className="w-full"
                onClick={() => window.open(invoice.payment_link!, '_blank')}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Online
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Bank Transfer Details */}
        {hasBankDetails && (
          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold text-gray-900 mb-3">{invoice.payment_link && invoice.status !== 'paid' ? 'Or pay via bank transfer' : 'Bank Transfer Details'}</h2>
              <p className="text-sm text-gray-600 mb-4">
                Transfer your rent to the account below, then upload a screenshot of your confirmation.
              </p>
              <div className="space-y-2 text-sm">
                {invoice.bank_name && (
                  <p><span className="text-gray-500">Bank:</span> <strong>{invoice.bank_name}</strong></p>
                )}
                {invoice.bank_account_name && (
                  <p><span className="text-gray-500">Account Name:</span> <strong>{invoice.bank_account_name}</strong></p>
                )}
                {invoice.bank_account_number && (
                  <p><span className="text-gray-500">Account Number:</span> <strong>{invoice.bank_account_number}</strong></p>
                )}
                {invoice.bank_branch && (
                  <p><span className="text-gray-500">Branch:</span> <strong>{invoice.bank_branch}</strong></p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error banner */}
        {error && invoice && (
          <div className="bg-red-50 text-red-800 p-4 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Proof Status */}
        {latestProof && !submitted && (
          <div className={`flex items-center gap-2 p-4 rounded-lg text-sm ${
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

        {/* Success banner after submission */}
        {submitted && (
          <div className="bg-green-50 text-green-800 p-4 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">Proof submitted successfully! Your landlord will review it shortly.</span>
          </div>
        )}

        {/* Upload UI */}
        {canUpload && (
          <Card>
            <CardContent className="p-6">
              {previewUrl ? (
                <div className="space-y-4">
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
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change Image
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleSubmitProof}
                      disabled={submitting}
                    >
                      {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Submit Proof
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  I've Paid — Upload Proof
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {invoice.status === 'paid' && !latestProof && (
          <div className="bg-green-50 text-green-800 p-4 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">This invoice has been paid.</span>
          </div>
        )}
      </div>
    </div>
  );
}
