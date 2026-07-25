import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { and, desc, eq, gt, isNull } from 'drizzle-orm';

import { DRIZZLE } from '../db/db.module';
import type { Database } from '../db/drizzle.client';
import { sixDigitCode } from '../common/ids';
import { otpCodes } from '../db/schema';
import { UsersService } from '../users/users.service';
import { toUserDto, type UserDto } from '../users/user.mapper';

const OTP_TTL_MS = 10 * 60 * 1000;

export interface RequestOtpResult {
  sent: true;
  // Only present in dev mode so the app can auto-fill during demos.
  devCode?: string;
}

export interface VerifyOtpResult {
  token: string;
  user: UserDto;
  isNew: boolean;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private get devMode(): boolean {
    return this.config.get('OTP_DEV_MODE', 'true') !== 'false';
  }

  async requestOtp(phone: string): Promise<RequestOtpResult> {
    const code = sixDigitCode();
    await this.db.insert(otpCodes).values({
      phone,
      code,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });
    // In production this is where an SMS provider send would happen.
    this.logger.log(`OTP for ${phone}: ${code}`);
    return this.devMode ? { sent: true, devCode: code } : { sent: true };
  }

  async verifyOtp(phone: string, code: string, name?: string): Promise<VerifyOtpResult> {
    const [otp] = await this.db
      .select()
      .from(otpCodes)
      .where(and(eq(otpCodes.phone, phone), isNull(otpCodes.consumedAt), gt(otpCodes.expiresAt, new Date())))
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);

    if (!otp || otp.code !== code) {
      throw new BadRequestException('Invalid or expired code');
    }
    await this.db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, otp.id));

    let user = await this.users.findByPhone(phone);
    const isNew = !user;
    if (!user) {
      user = await this.users.createWithWallet(phone, name?.trim() || 'CirclePay User');
    }

    const token = await this.jwt.signAsync({ sub: user.id, phone: user.phone });
    return { token, user: toUserDto(user), isNew };
  }
}
