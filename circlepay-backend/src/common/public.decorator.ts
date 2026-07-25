import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marks a route as reachable without a JWT (e.g. auth/OTP endpoints). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
