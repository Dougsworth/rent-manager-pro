import { useState, useEffect, useRef } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { Phone, Mail, Loader2, Upload, FileText, Trash2, Download, Clock, Eye } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getPaymentsForTenant } from "@/services/payments";
import { getInvoicesForTenant } from "@/services/invoices";
import { uploadLeaseDocument, getDocumentsForTenant, deleteLeaseDocument } from "@/services/leaseDocuments";
import { formatDate } from "@/utils/formatDate";
import type { LeaseDocument } from "@/types/app.types";

interface Tenant {
  id: number | string;
  name: string;
  email: string;
  phone: string;
  unit: string;
  rent: number;
  status: "paid" | "pending" | "overdue";
  leaseStart: string;
  leaseEnd: string;
}

interface TenantDetailProps {
  tenant: Tenant;
  tenantId?: string;
  landlordId?: string;
  onSendReminder?: () => Promise<void>;
  sendingReminder?: boolean;
}

const methodLabels: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  card: 'Card',
  cash: 'Cash',
  other: 'Other',
};

const docTypeLabels: Record<string, string> = {
  lease: 'Lease',
  addendum: 'Addendum',
  other: 'Other',
};

export function TenantDetail({ tenant, tenantId, landlordId, onSendReminder, sendingReminder }: TenantDetailProps) {
  const id = tenantId ?? String(tenant.id);
  const { toast } = useToast();

  const [showHistory, setShowHistory] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Late fee invoices
  const [invoicesWithFees, setInvoicesWithFees] = useState<any[]>([]);

  // Documents
  const [documents, setDocuments] = useState<LeaseDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState<'lease' | 'addendum' | 'other'>('lease');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<LeaseDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load documents and invoices with late fees on mount
  useEffect(() => {
    loadDocuments();
    loadInvoicesWithLateFees();
  }, [id]);

  const loadDocuments = async () => {
    setLoadingDocs(true);
    try {
      const docs = await getDocumentsForTenant(id);
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const loadInvoicesWithLateFees = async () => {
    try {
      const invs = await getInvoicesForTenant(id);
      setInvoicesWithFees(invs.filter((i: any) => i.late_fee_amount != null && i.late_fee_amount > 0));
    } catch (err) {
      console.error('Failed to load invoices:', err);
    }
  };

  const handleViewHistory = async () => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    setLoadingPayments(true);
    try {
      const data = await getPaymentsForTenant(id);
      setPayments(data);
      setShowHistory(true);
    } catch (err) {
      console.error('Failed to load payment history:', err);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !landlordId) return;

    setUploading(true);
    try {
      await uploadLeaseDocument(file, id, landlordId, docType);
      toast('Document uploaded successfully!', 'success');
      await loadDocuments();
    } catch (err: any) {
      toast(err.message || 'Failed to upload document.', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (doc: LeaseDocument) => {
    if (!confirm(`Delete "${doc.file_name}"? This cannot be undone.`)) return;
    setDeletingId(doc.id);
    try {
      await deleteLeaseDocument(doc.id, doc.storage_path);
      toast('Document deleted.', 'success');
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
    } catch (err) {
      toast('Failed to delete document.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Contact Information */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-700">{tenant.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-700">{tenant.phone}</span>
          </div>
        </div>
      </div>

      {/* Lease Information */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Lease Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Unit</span>
            <span className="text-sm text-gray-900">{tenant.unit}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Monthly Rent</span>
            <span className="text-sm font-medium text-gray-900">
              J${tenant.rent.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Lease Period</span>
            <span className="text-sm text-gray-900">
              {tenant.leaseStart ? formatDate(tenant.leaseStart) : '—'} - {tenant.leaseEnd ? formatDate(tenant.leaseEnd) : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Payment Status</span>
            <StatusBadge variant={tenant.status}>{tenant.status}</StatusBadge>
          </div>
        </div>
      </div>

      {/* Late Fees */}
      {invoicesWithFees.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-red-500" />
            Late Fees Applied
          </h3>
          <div className="space-y-2">
            {invoicesWithFees.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between p-3 border border-red-200 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {inv.invoice_number || 'Invoice'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Due {formatDate(inv.due_date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-red-600">
                    +J${Number(inv.late_fee_amount).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">late fee</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Documents</h3>

        {/* Upload area */}
        {landlordId && (
          <div className="flex items-center gap-2 mb-3">
            <Select
              value={docType}
              onValueChange={(val) => setDocType(val as 'lease' | 'addendum' | 'other')}
              className="w-32"
              options={[
                { value: 'lease', label: 'Lease' },
                { value: 'addendum', label: 'Addendum' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        )}

        {loadingDocs ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : documents.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No documents uploaded</p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{doc.file_name}</p>
                    <p className="text-xs text-gray-500">
                      {docTypeLabels[doc.document_type] ?? doc.document_type} &middot; {formatFileSize(doc.file_size)} &middot; {formatDate(doc.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-100"
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-100"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(doc)}
                    disabled={deletingId === doc.id}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-500 hover:text-red-600 hover:bg-gray-100 disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingId === doc.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-4">
        <Button
          className="w-full"
          disabled={sendingReminder || !onSendReminder}
          onClick={onSendReminder}
        >
          {sendingReminder ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
          ) : (
            'Send Payment Reminder'
          )}
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleViewHistory}
          disabled={loadingPayments}
        >
          {loadingPayments ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...</>
          ) : showHistory ? (
            'Hide Payment History'
          ) : (
            'View Payment History'
          )}
        </Button>
      </div>

      {/* Payment History */}
      {showHistory && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment History</h3>
          {payments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No payments recorded</p>
          ) : (
            <div className="space-y-2">
              {payments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      J${Number(p.amount).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(p.payment_date)} &middot; {methodLabels[p.method] ?? p.method}
                    </p>
                  </div>
                  <StatusBadge variant={p.status === 'completed' ? 'paid' : p.status === 'failed' ? 'overdue' : 'pending'}>
                    {p.status}
                  </StatusBadge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Document Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => { if (!open) setPreviewDoc(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          {previewDoc && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{previewDoc.file_name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(previewDoc.file_size)} &middot; {formatDate(previewDoc.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={previewDoc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                </div>
              </div>
              <div className="flex-1 bg-gray-50 overflow-auto" style={{ minHeight: '60vh' }}>
                {previewDoc.file_type === 'application/pdf' ? (
                  <iframe
                    src={previewDoc.file_url}
                    className="w-full h-full"
                    style={{ minHeight: '60vh' }}
                    title={previewDoc.file_name}
                  />
                ) : previewDoc.file_type.startsWith('image/') ? (
                  <div className="flex items-center justify-center p-4 h-full">
                    <img
                      src={previewDoc.file_url}
                      alt={previewDoc.file_name}
                      className="max-w-full max-h-[70vh] rounded-lg object-contain shadow-sm"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <FileText className="h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500 mb-4">
                      Preview not available for this file type
                    </p>
                    <a
                      href={previewDoc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Download to view
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
