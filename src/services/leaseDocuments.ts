import { supabase } from '@/lib/supabase';
import type { LeaseDocument } from '@/types/app.types';

const BUCKET = 'lease-documents';
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export async function uploadLeaseDocument(
  file: File,
  tenantId: string,
  landlordId: string,
  documentType: 'lease' | 'addendum' | 'other',
): Promise<LeaseDocument> {
  if (file.size > MAX_SIZE) {
    throw new Error('File size exceeds 10 MB limit.');
  }
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error('Unsupported file type. Accepted: PDF, JPG, PNG, DOC, DOCX.');
  }

  const ext = file.name.split('.').pop();
  const storagePath = `${landlordId}/${tenantId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file);

  if (uploadErr) throw uploadErr;

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  const { data, error } = await supabase
    .from('lease_documents')
    .insert({
      tenant_id: tenantId,
      landlord_id: landlordId,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      file_url: urlData.publicUrl,
      storage_path: storagePath,
      document_type: documentType,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getDocumentsForTenant(tenantId: string): Promise<LeaseDocument[]> {
  const { data, error } = await supabase
    .from('lease_documents')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function deleteLeaseDocument(documentId: string, storagePath: string): Promise<void> {
  const { error: storageErr } = await supabase.storage
    .from(BUCKET)
    .remove([storagePath]);

  if (storageErr) console.error('Storage delete failed:', storageErr);

  const { error } = await supabase
    .from('lease_documents')
    .delete()
    .eq('id', documentId);

  if (error) throw error;
}
