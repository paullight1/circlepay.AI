import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

import { DRIZZLE } from '../db/db.module';
import type { Database } from '../db/drizzle.client';
import { circlePayId as genCirclePayId } from '../common/ids';
import { users, wallets, type UserRow } from '../db/schema';
import { toUserDto, type UserDto } from './user.mapper';

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async findByPhone(phone: string): Promise<UserRow | null> {
    const [row] = await this.db.select().from(users).where(eq(users.phone, phone)).limit(1);
    return row ?? null;
  }

  async getRow(userId: string): Promise<UserRow> {
    const [row] = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!row) throw new NotFoundException('User not found');
    return row;
  }

  async get(userId: string): Promise<UserDto> {
    return toUserDto(await this.getRow(userId));
  }

  /** Create a new user with a provisioned (zero-balance) wallet. */
  async createWithWallet(phone: string, fullName: string): Promise<UserRow> {
    const firstName = fullName.trim().split(/\s+/)[0] || fullName;
    return this.db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          name: fullName.trim(),
          firstName,
          phone,
          circlePayId: genCirclePayId(),
          kycTier: 0,
          trustScore: 720,
        })
        .returning();
      await tx.insert(wallets).values({ userId: user!.id });
      return user!;
    });
  }

  async update(userId: string, patch: { name?: string; firstName?: string }): Promise<UserDto> {
    const next: Partial<UserRow> = {};
    if (patch.name !== undefined) {
      next.name = patch.name;
      next.firstName = patch.firstName ?? patch.name.trim().split(/\s+/)[0] ?? patch.name;
    }
    if (patch.firstName !== undefined) next.firstName = patch.firstName;
    if (Object.keys(next).length === 0) return this.get(userId);
    const [row] = await this.db.update(users).set(next).where(eq(users.id, userId)).returning();
    return toUserDto(row!);
  }

  async setKycTier(userId: string, tier: 0 | 1 | 2): Promise<UserDto> {
    const [row] = await this.db.update(users).set({ kycTier: tier }).where(eq(users.id, userId)).returning();
    return toUserDto(row!);
  }

  async setPin(userId: string, pin: string, biometricsEnabled = false): Promise<UserDto> {
    const pinHash = await bcrypt.hash(pin, 10);
    const [row] = await this.db
      .update(users)
      .set({ pinHash, pinSet: true, biometricsEnabled })
      .where(eq(users.id, userId))
      .returning();
    return toUserDto(row!);
  }

  async verifyPin(userId: string, pin: string): Promise<boolean> {
    const row = await this.getRow(userId);
    if (!row.pinHash) return false;
    return bcrypt.compare(pin, row.pinHash);
  }

  async setOnboarded(userId: string, value: boolean): Promise<UserDto> {
    const [row] = await this.db.update(users).set({ onboarded: value }).where(eq(users.id, userId)).returning();
    return toUserDto(row!);
  }
}
