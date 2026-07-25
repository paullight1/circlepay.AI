/**
 * Money helpers. Drizzle `numeric` columns round-trip as strings to preserve
 * exact decimal precision; the app's wire format uses plain JS numbers, so we
 * convert at the service boundary. Rounding to 2dp guards against float drift.
 */
export function num(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/** Serialize a JS number to the string form a numeric column expects. */
export function money(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2);
}

/** Round to kobo precision for safe comparisons/arithmetic on naira amounts. */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
