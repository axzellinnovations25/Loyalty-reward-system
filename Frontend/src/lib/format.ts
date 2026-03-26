/** Format a decimal string or number as LKR currency. */
export function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
  }).format(num);
}

/** Format a points integer with comma separators. */
export function formatPoints(points: number): string {
  return new Intl.NumberFormat('en-LK').format(points);
}

/** Format an ISO date-time string to a readable local date/time. */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

/** Format an ISO date string (date only) to a readable date. */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-LK', { dateStyle: 'medium' }).format(new Date(iso));
}

/** Format a Sri Lankan phone number for display. */
export function formatPhone(phone: string): string {
  // +94 77 123 4567
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('94')) {
    return `+94 ${digits.slice(2, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return phone;
}
