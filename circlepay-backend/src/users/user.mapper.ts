import type { UserRow } from '../db/schema';

/** Wire shape matching the app's `User` type (+ `onboarded`). */
export interface UserDto {
  id: string;
  name: string;
  firstName: string;
  phone: string;
  circlePayId: string;
  kycTier: 0 | 1 | 2;
  pinSet: boolean;
  biometricsEnabled: boolean;
  trustScore: number;
  onboarded: boolean;
}

export function toUserDto(row: UserRow): UserDto {
  return {
    id: row.id,
    name: row.name,
    firstName: row.firstName,
    phone: row.phone,
    circlePayId: row.circlePayId,
    kycTier: row.kycTier as 0 | 1 | 2,
    pinSet: row.pinSet,
    biometricsEnabled: row.biometricsEnabled,
    trustScore: row.trustScore,
    onboarded: row.onboarded,
  };
}
