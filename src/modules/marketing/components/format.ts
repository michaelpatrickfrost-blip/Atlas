export function money(minor: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(minor / 100);
  } catch {
    return `${(minor / 100).toFixed(0)} ${currency}`;
  }
}

export function words(value: string) {
  const text = value.replaceAll('_', ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function dayKey(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function parseMonth(value?: string) {
  const now = new Date();
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(5));
    if (year >= 2000 && year <= 2100 && month >= 1 && month <= 12) return { year, month };
  }
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function monthStamp(year: number, month: number, delta = 0) {
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function campaignTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'LIVE' || status === 'COMPLETED') return 'success';
  if (status === 'APPROVAL' || status === 'PAUSED' || status === 'SCHEDULED') return 'warning';
  if (status === 'CANCELLED') return 'danger';
  return 'neutral';
}

export const CHANNEL_CLASS: Record<string, string> = {
  Email: 'bg-[var(--color-accent-blue-soft)] text-[var(--color-accent-indigo)]',
  Social: 'bg-[var(--color-accent-violet-soft)] text-[var(--color-accent-violet)]',
  'Paid search': 'bg-[var(--color-accent-amber-soft)] text-[var(--color-status-warning)]',
  'Paid social': 'bg-[var(--color-accent-rose-soft)] text-[var(--color-accent-rose)]',
  Content: 'bg-[var(--color-accent-teal-soft)] text-[var(--color-accent-teal)]',
  Events: 'bg-[var(--color-accent-indigo-soft)] text-[var(--color-accent-indigo)]',
  SEO: 'bg-[var(--color-status-success-soft)] text-[var(--color-status-success)]',
};

export function channelClass(channel: string) {
  return CHANNEL_CLASS[channel] ?? 'bg-[var(--color-status-neutral-soft)] text-[var(--color-status-neutral)]';
}
