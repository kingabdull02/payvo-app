import type { Invoice } from '../db/dbClient';

// Swedish month abbreviations used in due-date labels.
const MONTHS_SWEDISH = [
  'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
  'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December',
];

/** Returns the number of calendar days from today until the invoice due date.
 *  Negative = already past, 0 = today, positive = in the future. */
export function getDaysDiff(dueDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr + 'T00:00:00');
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** Returns a human-readable Swedish label for when an invoice is due/paid.
 *  @param currentMonth 1-indexed month number (1 = January). */
export function getDueLabel(invoice: Invoice, currentMonth: number): string {
  const [, , dayStr] = invoice.due_date.split('-');
  const day = parseInt(dayStr, 10);
  const monthName = MONTHS_SWEDISH[currentMonth - 1].toLowerCase().substring(0, 3);

  if (invoice.is_paid) return `Betald: ${day} ${monthName}`;

  const diff = getDaysDiff(invoice.due_date);
  if (diff === 0) return 'Förfaller: Idag';
  if (diff === 1) return 'Förfaller: Imorgon';
  if (diff === -1) return 'Förfallen: Igår';
  if (diff < 0) return `Förfallen: ${Math.abs(diff)} dagar sedan`;
  return `Förfaller: ${day} ${monthName}`;
}

export interface InvoiceStatus {
  label: string;
  textClass: string;
  bgClass: string;
}

/** Returns the status badge data (label + CSS classes) for an invoice. */
export function getInvoiceStatus(invoice: Invoice): InvoiceStatus {
  if (invoice.is_paid) {
    return {
      label: 'Betald',
      textClass: 'text-electricTeal font-bold',
      bgClass: 'bg-electricTeal/10 text-electricTeal',
    };
  }

  const diff = getDaysDiff(invoice.due_date);

  if (diff < 0) {
    return {
      label: 'Förfallen',
      textClass: 'text-overdueRed font-bold',
      bgClass: 'bg-overdueRed/10 text-overdueRed',
    };
  }

  if (diff <= 3) {
    return {
      label: 'Förfaller snart',
      textClass: 'text-warningAmber font-bold',
      bgClass: 'bg-warningAmber/10 text-warningAmber',
    };
  }

  return {
    label: 'Obetald',
    textClass: 'text-deepNavy/60 font-bold',
    bgClass: 'bg-deepNavy/5 text-deepNavy/60',
  };
}
