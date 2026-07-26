import type { Frequency, LinkedAccount, SavingsPlan, SavingsPlanType } from '@/store/types';

/** Deductions run at 08:00 local, as drawn in the designs. */
export const RUN_HOUR = 8;

/**
 * Most deductions executed in one catch-up sweep. Coming back after a month
 * must not fire thirty instant debits; anything beyond the cap is fast-forwarded
 * and reported rather than silently dropped.
 */
export const MAX_CATCHUP = 5;

/** The given date at 08:00 local, as an ISO string. */
export function atRunHour(date: Date | string): string {
  const d = new Date(date);
  d.setHours(RUN_HOUR, 0, 0, 0);
  return d.toISOString();
}

/** One period later than `iso`, preserving the time of day. */
export function advance(iso: string, frequency: Frequency): string {
  const d = new Date(iso);
  if (frequency === 'daily') d.setDate(d.getDate() + 1);
  else if (frequency === 'weekly') d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

/** First deduction at or after `startDate` that is still in the future. */
export function firstRunAt(startDate: string, frequency: Frequency, now: Date = new Date()): string {
  let next = atRunHour(startDate);
  while (new Date(next).getTime() <= now.getTime()) next = advance(next, frequency);
  return next;
}

/**
 * Skip past every missed occurrence without executing it. Used when a plan is
 * resumed, and when a catch-up sweep hits `MAX_CATCHUP` while still behind.
 */
export function fastForward(
  iso: string,
  frequency: Frequency,
  now: Date = new Date()
): { next: string; skipped: number } {
  let next = iso;
  let skipped = 0;
  while (new Date(next).getTime() <= now.getTime()) {
    next = advance(next, frequency);
    skipped++;
  }
  return { next, skipped };
}

/**
 * The next `count` occurrences, stopping at the end date.
 *
 * Takes a structural subset rather than a whole `SavingsPlan` so the create
 * wizard can preview a schedule for a plan that does not exist yet, without
 * casting a half-built object.
 */
export function upcomingRuns(
  plan: Pick<SavingsPlan, 'nextRunAt' | 'frequency'> & { endDate?: string },
  count: number
): string[] {
  const out: string[] = [];
  let at = plan.nextRunAt;
  for (let i = 0; i < count; i++) {
    if (plan.endDate && new Date(at).getTime() > new Date(plan.endDate).getTime()) break;
    out.push(at);
    at = advance(at, plan.frequency);
  }
  return out;
}

/** "Every Day" / "Every Week" / "Every Month" — the deduction-frequency label. */
export function frequencyLabel(f: Frequency): string {
  if (f === 'daily') return 'Every Day';
  if (f === 'weekly') return 'Every Week';
  return 'Every Month';
}

/** "GTBank · 0582 **** **** 1234" — the From row on the schedule screens. */
export function accountLabel(a: LinkedAccount): string {
  return a.first4 ? `${a.bank} · ${a.first4} **** **** ${a.last4}` : `${a.bank} •••• ${a.last4}`;
}

/** Icon and accent per plan type. Accents reuse existing status semantics. */
export const planTypeMeta: Record<
  SavingsPlanType,
  { label: string; blurb: string; icon: 'wallet' | 'people' | 'cart'; tint: 'success' | 'primary' | 'warning' }
> = {
  daily: {
    label: 'Daily Savings',
    blurb: 'Deduct a fixed amount every day',
    icon: 'wallet',
    tint: 'success',
  },
  weekly: {
    label: 'Weekly Contribution',
    blurb: 'Deduct a fixed amount every week',
    icon: 'people',
    tint: 'primary',
  },
  instalment: {
    label: 'Instalment Payment',
    blurb: 'Pay for items in flexible instalments',
    icon: 'cart',
    tint: 'warning',
  },
};
