import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { uploadLeaseDocument, getDocumentsForTenant, deleteLeaseDocument } from "@/services/leaseDocuments";
import { formatDate } from "@/utils/formatDate";
import type { LeaseDocument } from "@/types/app.types";

const docTypeLabels: Record<string, string> = { lease: 'Lease', addendum: 'Addendum', other: 'Other' };

const size = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

/** Leases and other files for one tenant. */
export function TenantDocuments({ tenantId, landlordId }: { tenantId: string; landlordId: string }) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<LeaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState<'lease' | 'addendum' | 'other'>('lease');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<LeaseDocument | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    try { setDocuments(await getDocumentsForTenant(tenantId)); }
    catch (err) { console.error('Failed to load documents:', err); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [tenantId]);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadLeaseDocument(file, tenantId, landlordId, docType);
      toast('Document uploaded.', 'success');
      await load();
    } catch (err: any) {
      toast(err.message || 'That file did not upload. Try a PDF or image under 10 MB.', 'error');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const remove = async (doc: LeaseDocument) => {
    if (!confirm(`Delete "${doc.file_name}"? This cannot be undone.`)) return;
    setDeletingId(doc.id);
    try {
      await deleteLeaseDocument(doc.id, doc.storage_path);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      toast('Document deleted.', 'success');
    } catch {
      toast('That document was not deleted. Try again.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Documents</h2>
        <div className="flex items-center gap-2">
          <Select aria-label="Document type" value={docType} onValueChange={(v) => setDocType(v as typeof docType)} className="w-32"
            options={[{ value: 'lease', label: 'Lease' }, { value: 'addendum', label: 'Addendum' }, { value: 'other', label: 'Other' }]} />
          <input ref={fileInput} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" onChange={upload} />
          <Button variant="outline" onClick={() => fileInput.current?.click()} disabled={uploading}>{uploading ? 'Uploading' : 'Upload'}</Button>
        </div>
      </div>
      {loading ? <p className="border-t border-rule py-3 text-quiet">Loading documents</p>
        : documents.length === 0 ? <p className="border-t border-rule py-3 text-quiet">No lease or documents yet.</p>
        : (
          <ul>
            {documents.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-rule py-2">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium">{doc.file_name}</p>
                  <p className="text-[13.5px] text-quiet">{docTypeLabels[doc.document_type] ?? doc.document_type}, {size(doc.file_size)}, {formatDate(doc.created_at)}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setPreview(doc)}>View</Button>
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center px-3 text-sm font-semibold text-shell hover:bg-secondary">Download</a>
                  <Button variant="ghost" size="sm" className="text-late" onClick={() => remove(doc)} disabled={deletingId === doc.id}>{deletingId === doc.id ? 'Deleting' : 'Delete'}</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      <Dialog open={!!preview} onOpenChange={(o) => { if (!o) setPreview(null); }}>
        <DialogContent className="max-h-[90vh] max-w-[95vw] overflow-hidden p-0 sm:max-w-4xl">
          {preview && (
            <div className="flex h-full flex-col">
              <div className="border-b border-rule px-4 py-3 pr-14">
                <p className="truncate text-sm font-semibold">{preview.file_name}</p>
                <p className="text-[13.5px] text-quiet">{size(preview.file_size)}, {formatDate(preview.created_at)}</p>
              </div>
              <div className="flex-1 overflow-auto bg-ground" style={{ minHeight: '60vh' }}>
                {preview.file_type === 'application/pdf'
                  ? <iframe src={preview.file_url} className="h-full w-full" style={{ minHeight: '60vh' }} title={preview.file_name} />
                  : preview.file_type.startsWith('image/')
                    ? <img src={preview.file_url} alt={preview.file_name} className="mx-auto max-h-[70vh] max-w-full object-contain p-4" />
                    : <p className="p-6 text-quiet">This file type cannot be previewed. <a className="font-semibold text-shell underline" href={preview.file_url} target="_blank" rel="noopener noreferrer">Download it</a> to view.</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
