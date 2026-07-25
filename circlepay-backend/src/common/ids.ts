import { randomBytes, randomInt, randomUUID } from 'node:crypto';

/** A CirclePay account ID: "CPAI-7834-5689". */
export function circlePayId(): string {
  const a = randomInt(1000, 10000);
  const b = randomInt(1000, 10000);
  return `CPAI-${a}-${b}`;
}

/** A campaign share code: "CP-784512". */
export function campaignCode(): string {
  return `CP-${randomInt(100000, 1000000)}`;
}

/** A 6-digit OTP / kiosk withdrawal code, as a zero-padded string. */
export function sixDigitCode(): string {
  return String(randomInt(0, 1000000)).padStart(6, '0');
}

export function uuid(): string {
  return randomUUID();
}

/** Non-guessable token (unused reserved helper for share links). */
export function token(bytes = 16): string {
  return randomBytes(bytes).toString('hex');
}
