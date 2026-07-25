/** Formatting helpers shared by every feature. */

export const NAIRA = '₦';

/** ₦125,680.50 — pass decimals=0 to drop kobo (most list rows). */
export function formatNaira(amount: number, decimals: 0 | 2 = 0): string {
  const fixed = amount.toFixed(decimals);
  const [int, frac] = fixed.split('.');
  const grouped = int!.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${NAIRA}${grouped}${frac ? `.${frac}` : ''}`;
}

/** "May 24, 2026" */
export function formatDate(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** "May 24, 2026 · 6:05 PM" */
export function formatDateTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${formatDate(d)} · ${time}`;
}

/** "2m ago", "1h ago", "3 days ago" */
export function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? '1 day ago' : `${d} days ago`;
}

/** Whole days from now until iso date (>= 0). */
export function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

export interface Countdown {
  days: number;
  hours: number;
  mins: number;
  secs: number;
  done: boolean;
}

export function countdownTo(iso: string): Countdown {
  let ms = new Date(iso).getTime() - Date.now();
  const done = ms <= 0;
  if (done) ms = 0;
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return { days, hours, mins, secs, done };
}

/** ISO date `days` from now (keeps mock data fresh relative to today). */
export function daysFromNow(days: number, hour = 18, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function minutesAgo(mins: number): string {
  return new Date(Date.now() - mins * 60000).toISOString();
}

let seq = 0;
export function uid(prefix: string): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}
