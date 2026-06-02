import { jsPDF } from 'jspdf';
import { formatDate } from './formatDate';

function formatCurrency(amount: number): string {
  return `J$${amount.toLocaleString()}`;
}

const methodLabels: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  card: 'Card',
  cash: 'Cash',
  other: 'Other',
};

// Brand palette (EasyCollect blue + supporting tones)
const BRAND: [number, number, number] = [33, 102, 240];
const GREEN: [number, number, number] = [22, 163, 74];
const GREEN_BG: [number, number, number] = [236, 253, 245];
const SLATE: [number, number, number] = [30, 41, 59];
const MUTED: [number, number, number] = [100, 116, 139];
const LINE: [number, number, number] = [226, 232, 240];

// Logo assets (served from /public)
const BADGE_SRC = '/easycollect.png'; // white EC on blue tile — header badge
const WATERMARK_SRC = '/easycollectlogoimage.png'; // blue EC on white — faint watermark

export interface ReceiptPdfOptions {
  /** Custom note shown in the footer (e.g. thank-you message or terms). */
  footerNote?: string;
}

interface ReceiptData {
  payment: any;
  profile: any;
  options?: ReceiptPdfOptions;
}

interface LoadedImage {
  dataUrl: string;
  width: number;
  height: number;
}

const imageCache: Record<string, LoadedImage | null> = {};

/** Loads an image from /public, downscales it via canvas, and caches the result. */
function loadImage(src: string, maxDim: number): Promise<LoadedImage | null> {
  if (src in imageCache) return Promise.resolve(imageCache[src]);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1);
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          imageCache[src] = null;
          return resolve(null);
        }
        ctx.drawImage(img, 0, 0, w, h);
        const result = { dataUrl: canvas.toDataURL('image/png'), width: w, height: h };
        imageCache[src] = result;
        resolve(result);
      } catch {
        imageCache[src] = null;
        resolve(null);
      }
    };
    img.onerror = () => {
      imageCache[src] = null;
      resolve(null);
    };
    img.src = src;
  });
}

/**
 * Builds a professional, branded, downloadable PDF of a payment receipt.
 *
 * - Text-based so it renders crisply and downloads reliably on mobile and desktop
 *   (unlike window.print(), which is unreliable on phones).
 * - Carries a faint centered EasyCollect watermark.
 * - Keeps sections whole — a section that won't fit moves to the next page rather
 *   than splitting awkwardly across the page break.
 */
export async function generateReceiptPdf({ payment, profile, options = {} }: ReceiptData): Promise<void> {
  const tenant = payment.tenant as any;
  const invoice = payment.invoice as any;
  const unit = tenant?.unit as any;
  const property = unit?.property as any;

  const [badge, watermark] = await Promise.all([
    loadImage(BADGE_SRC, 128),
    loadImage(WATERMARK_SRC, 512),
  ]);

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  const right = margin + contentWidth;
  const bottomLimit = pageHeight - 64;
  let y = margin;

  const setColor = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
  const setFill = (c: [number, number, number]) => doc.setFillColor(c[0], c[1], c[2]);
  const setStroke = (c: [number, number, number]) => doc.setDrawColor(c[0], c[1], c[2]);

  const drawWatermark = () => {
    if (!watermark) return;
    const w = 340;
    const h = (watermark.height / watermark.width) * w;
    const x = (pageWidth - w) / 2;
    const wy = (pageHeight - h) / 2;
    const anyDoc = doc as any;
    try {
      doc.saveGraphicsState();
      doc.setGState(new anyDoc.GState({ opacity: 0.05 }));
      doc.addImage(watermark.dataUrl, 'PNG', x, wy, w, h);
      doc.restoreGraphicsState();
    } catch {
      // GState unsupported — skip the watermark rather than fail.
    }
  };

  const newPage = () => {
    doc.addPage();
    y = margin;
    drawWatermark();
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > bottomLimit) newPage();
  };

  drawWatermark();

  // ---------------- Header ----------------
  const badgeSize = 40;
  if (badge) {
    doc.addImage(badge.dataUrl, 'PNG', margin, y, badgeSize, badgeSize);
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  setColor(BRAND);
  doc.text('EasyCollect', margin + badgeSize + 10, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setColor(MUTED);
  doc.text('Rent & Payment Management', margin + badgeSize + 10, y + 31);

  // Right side: document title + meta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  setColor(SLATE);
  doc.text('PAYMENT RECEIPT', right, y + 14, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  setColor(MUTED);
  doc.text(`Receipt #${payment.payment_number}`, right, y + 30, { align: 'right' });
  doc.text(formatDate(payment.payment_date), right, y + 43, { align: 'right' });

  y += badgeSize + 16;
  setStroke(LINE);
  doc.setLineWidth(1);
  doc.line(margin, y, right, y);
  y += 22;

  // ---------------- Amount hero ----------------
  const heroH = 62;
  ensureSpace(heroH + 10);
  setFill(GREEN_BG);
  doc.roundedRect(margin, y, contentWidth, heroH, 8, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  setColor(MUTED);
  doc.text('AMOUNT PAID', margin + 18, y + 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  setColor(GREEN);
  doc.text(formatCurrency(payment.amount), margin + 18, y + 47);

  // "PAID" pill on the right
  const pillW = 54;
  const pillH = 22;
  const pillX = right - 18 - pillW;
  const pillY = y + (heroH - pillH) / 2;
  setFill(GREEN);
  doc.roundedRect(pillX, pillY, pillW, pillH, 11, 11, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('PAID', pillX + pillW / 2, pillY + 14.5, { align: 'center' });

  y += heroH + 26;

  // ---------------- Two columns: Billed To / Paid To ----------------
  const colGap = 24;
  const colW = (contentWidth - colGap) / 2;
  const leftX = margin;
  const rightX = margin + colW + colGap;

  const heading = (text: string, x: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    setColor(BRAND);
    doc.text(text.toUpperCase(), x, y);
  };

  const tenantLines: { text: string; bold?: boolean }[] = [
    { text: `${tenant?.first_name ?? ''} ${tenant?.last_name ?? ''}`.trim() || 'N/A', bold: true },
    ...(tenant?.email ? [{ text: tenant.email }] : []),
    ...(tenant?.phone ? [{ text: tenant.phone }] : []),
    ...(unit?.name ? [{ text: `Unit: ${unit.name}` }] : []),
  ];

  const landlordName =
    profile?.company_name || `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim();
  const landlordLines: { text: string; bold?: boolean }[] = [
    { text: landlordName || 'N/A', bold: true },
    ...(profile?.email ? [{ text: profile.email }] : []),
    ...(profile?.phone ? [{ text: profile.phone }] : []),
    ...(profile?.company_address ? [{ text: profile.company_address }] : []),
  ];

  const blockHeight = Math.max(tenantLines.length, landlordLines.length) * 14 + 16;
  ensureSpace(blockHeight + 10);

  heading('Billed To', leftX);
  heading('Paid To', rightX);
  const blockTop = y + 14;

  const drawBlock = (lines: { text: string; bold?: boolean }[], x: number) => {
    let ly = blockTop;
    for (const line of lines) {
      doc.setFont('helvetica', line.bold ? 'bold' : 'normal');
      doc.setFontSize(line.bold ? 11 : 9.5);
      setColor(line.bold ? SLATE : MUTED);
      const wrapped = doc.splitTextToSize(line.text, colW);
      doc.text(wrapped, x, ly);
      ly += wrapped.length * 13 + (line.bold ? 3 : 1);
    }
  };
  drawBlock(tenantLines, leftX);
  drawBlock(landlordLines, rightX);
  y = blockTop + Math.max(tenantLines.length, landlordLines.length) * 14 + 18;

  // ---------------- Payment details table ----------------
  const detailRows: [string, string][] = [
    ['Payment Number', String(payment.payment_number)],
    ['Payment Method', methodLabels[payment.method] ?? payment.method],
    ['Payment Date', formatDate(payment.payment_date)],
  ];
  if (invoice?.invoice_number) detailRows.push(['Invoice', invoice.invoice_number]);
  if (invoice?.description) detailRows.push(['Description', invoice.description]);
  if (property?.name) detailRows.push(['Property', property.name]);
  if (property?.address) detailRows.push(['Property Address', property.address]);

  const rowH = 26;
  ensureSpace(22 + rowH); // heading + at least one row before breaking

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  setColor(BRAND);
  doc.text('PAYMENT DETAILS', margin, y);
  y += 12;
  setStroke(LINE);
  doc.setLineWidth(1);
  doc.line(margin, y, right, y);

  for (const [label, value] of detailRows) {
    ensureSpace(rowH);
    const rowMid = y + rowH / 2 + 3.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    setColor(MUTED);
    doc.text(label, margin + 4, rowMid);
    doc.setFont('helvetica', 'bold');
    setColor(SLATE);
    const wrapped = doc.splitTextToSize(String(value || 'N/A'), contentWidth * 0.55);
    doc.text(wrapped, right - 4, rowMid, { align: 'right' });
    y += rowH;
    setStroke(LINE);
    doc.setLineWidth(0.5);
    doc.line(margin, y, right, y);
  }
  y += 24;

  // ---------------- Footer note ----------------
  if (options.footerNote?.trim()) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10.5);
    setColor(SLATE);
    const noteLines = doc.splitTextToSize(options.footerNote.trim(), contentWidth);
    ensureSpace(noteLines.length * 14 + 16);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 14 + 10;
  }

  // ---------------- Standard footer ----------------
  ensureSpace(40);
  setStroke(LINE);
  doc.setLineWidth(1);
  doc.line(margin, y, right, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  setColor(MUTED);
  doc.text('This receipt serves as proof of payment. Please keep it for your records.', margin, y);
  y += 13;
  doc.text(`Generated on ${formatDate(new Date().toISOString())} via EasyCollect`, margin, y);

  // ---------------- Page numbers (only if more than one page) ----------------
  const pageCount = doc.getNumberOfPages();
  if (pageCount > 1) {
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      setColor(MUTED);
      doc.text(`Page ${i} of ${pageCount}`, right, pageHeight - 28, { align: 'right' });
    }
  }

  doc.save(`receipt-${payment.payment_number}.pdf`);
}
