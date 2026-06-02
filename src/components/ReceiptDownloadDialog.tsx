import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Download, Loader2 } from 'lucide-react';
import { generateReceiptPdf } from '@/utils/generateReceiptPdf';

const STORAGE_KEY = 'receipt_pdf_footer_note';

interface ReceiptDownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: any;
  profile: any;
}

export function ReceiptDownloadDialog({
  open,
  onOpenChange,
  payment,
  profile,
}: ReceiptDownloadDialogProps) {
  const [footerNote, setFooterNote] = useState('');
  const [generating, setGenerating] = useState(false);

  // Pre-fill from the last-used note when the dialog opens.
  useEffect(() => {
    if (open) {
      try {
        setFooterNote(localStorage.getItem(STORAGE_KEY) ?? '');
      } catch {
        setFooterNote('');
      }
      setGenerating(false);
    }
  }, [open]);

  const handleDownload = async () => {
    const note = footerNote.trim();
    try {
      localStorage.setItem(STORAGE_KEY, note);
    } catch {
      // Best-effort persistence; still generate the PDF.
    }
    setGenerating(true);
    try {
      await generateReceiptPdf({
        payment,
        profile,
        options: { footerNote: note || undefined },
      });
      onOpenChange(false);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Download Receipt PDF</DialogTitle>
          <DialogDescription>
            A professional, branded receipt. Add an optional note shown at the bottom —
            it's remembered for next time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="footer-note">Custom footer note (optional)</Label>
          <textarea
            id="footer-note"
            value={footerNote}
            onChange={(e) => setFooterNote(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder="e.g. Thank you for your payment! Late fees apply after the 5th."
            className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all duration-150 placeholder:text-slate-400 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400/40 focus:border-slate-400"
          />
          <p className="text-xs text-slate-400 text-right">{footerNote.length}/300</p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>
            Cancel
          </Button>
          <Button onClick={handleDownload} disabled={generating}>
            {generating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
