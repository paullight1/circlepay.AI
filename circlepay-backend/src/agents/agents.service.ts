import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';

import { DRIZZLE } from '../db/db.module';
import type { Database } from '../db/drizzle.client';
import { sixDigitCode } from '../common/ids';
import { money, num, round2 } from '../common/money';
import { agents, linkedAccounts, scratchCardRedemptions, withdrawalRequests } from '../db/schema';
import { LedgerService } from '../wallet/ledger.service';
import {
  toAgentDto,
  toLinkedAccountDto,
  toWithdrawalDto,
  type AgentLocationDto,
  type LinkedAccountDto,
  type WithdrawalRequestDto,
} from './agents.mapper';

/** Denomination derived from the serial so the demo is deterministic (matches app). */
function scratchCardValue(serial: string): number {
  const clean = serial.replace(/\s|-/g, '');
  if (!/^\d{14,16}$/.test(clean)) return 0;
  const denoms = [1000, 5000, 10000];
  return denoms[Number(clean[clean.length - 1]) % 3]!;
}

export interface ScratchCardResult {
  ok: boolean;
  amount?: number;
  error?: string;
}

@Injectable()
export class AgentsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly ledger: LedgerService,
  ) {}

  // ── Agent locator ──
  async listAgents(): Promise<AgentLocationDto[]> {
    const rows = await this.db.select().from(agents).orderBy(agents.distanceKm);
    return rows.map(toAgentDto);
  }

  // ── Linked accounts ──
  async listLinkedAccounts(userId: string): Promise<LinkedAccountDto[]> {
    const rows = await this.db
      .select()
      .from(linkedAccounts)
      .where(eq(linkedAccounts.userId, userId))
      .orderBy(linkedAccounts.createdAt);
    return rows.map(toLinkedAccountDto);
  }

  async linkAccount(userId: string, bank: string): Promise<LinkedAccountDto> {
    const last4 = String(1000 + Math.floor(Math.random() * 9000));
    const [row] = await this.db.insert(linkedAccounts).values({ userId, bank, last4, active: true }).returning();
    return toLinkedAccountDto(row!);
  }

  // ── Scratch card ──
  async redeemScratchCard(userId: string, serial: string): Promise<ScratchCardResult> {
    const clean = serial.replace(/\s|-/g, '');
    const value = scratchCardValue(clean);
    if (!value) return { ok: false, error: 'Enter a valid 14–16 digit serial number.' };

    const [existing] = await this.db
      .select({ id: scratchCardRedemptions.id })
      .from(scratchCardRedemptions)
      .where(eq(scratchCardRedemptions.serial, clean))
      .limit(1);
    if (existing) return { ok: false, error: 'This card has already been used.' };

    try {
      await this.db.transaction(async (tx) => {
        await tx.insert(scratchCardRedemptions).values({ userId, serial: clean, amount: money(value) });
        await this.ledger.move(
          tx,
          userId,
          { available: value },
          {
            title: 'Scratch Card Redeemed',
            subtitle: `Card •••• ${clean.slice(-4)}`,
            amount: value,
            direction: 'in',
            category: 'agent',
          },
        );
      });
    } catch {
      // Unique-constraint race → card was used concurrently.
      return { ok: false, error: 'This card has already been used.' };
    }
    return { ok: true, amount: value };
  }

  // ── Kiosk withdrawal ──
  private async currentPending(userId: string): Promise<typeof withdrawalRequests.$inferSelect | null> {
    const [row] = await this.db
      .select()
      .from(withdrawalRequests)
      .where(and(eq(withdrawalRequests.userId, userId), eq(withdrawalRequests.status, 'pending')))
      .orderBy(desc(withdrawalRequests.createdAt))
      .limit(1);
    if (!row) return null;
    if (row.expiresAt.getTime() < Date.now()) {
      await this.db.update(withdrawalRequests).set({ status: 'expired' }).where(eq(withdrawalRequests.id, row.id));
      return null;
    }
    return row;
  }

  async getWithdrawal(userId: string): Promise<WithdrawalRequestDto | null> {
    const row = await this.currentPending(userId);
    return row ? toWithdrawalDto(row) : null;
  }

  async requestWithdrawal(userId: string, amount: number): Promise<WithdrawalRequestDto> {
    const value = round2(amount);
    const fee = Math.max(100, Math.round(value * 0.01));
    return this.db.transaction(async (tx) => {
      const { available } = await this.ledger.balances(tx, userId, true);
      if (value + fee > available) throw new BadRequestException('Insufficient available balance');

      // Supersede any earlier pending request.
      await tx
        .update(withdrawalRequests)
        .set({ status: 'expired' })
        .where(and(eq(withdrawalRequests.userId, userId), eq(withdrawalRequests.status, 'pending')));

      const [row] = await tx
        .insert(withdrawalRequests)
        .values({
          userId,
          code: sixDigitCode(),
          amount: money(value),
          fee: money(fee),
          status: 'pending',
          expiresAt: new Date(Date.now() + 5 * 60_000),
        })
        .returning();
      return toWithdrawalDto(row!);
    });
  }

  async completeWithdrawal(userId: string): Promise<WithdrawalRequestDto> {
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .select()
        .from(withdrawalRequests)
        .where(and(eq(withdrawalRequests.userId, userId), eq(withdrawalRequests.status, 'pending')))
        .orderBy(desc(withdrawalRequests.createdAt))
        .for('update')
        .limit(1);
      if (!row) throw new BadRequestException('No pending withdrawal');
      if (row.expiresAt.getTime() < Date.now()) {
        await tx.update(withdrawalRequests).set({ status: 'expired' }).where(eq(withdrawalRequests.id, row.id));
        throw new BadRequestException('Withdrawal code has expired');
      }

      const amount = num(row.amount);
      const fee = num(row.fee);
      const { available } = await this.ledger.balances(tx, userId, true);
      if (amount + fee > available) throw new BadRequestException('Insufficient available balance');

      await this.ledger.move(
        tx,
        userId,
        { available: -(amount + fee) },
        {
          title: 'Kiosk Cash Withdrawal',
          subtitle: `Code ${row.code}`,
          amount: amount + fee,
          direction: 'out',
          category: 'agent',
        },
      );
      const [updated] = await tx
        .update(withdrawalRequests)
        .set({ status: 'completed' })
        .where(eq(withdrawalRequests.id, row.id))
        .returning();
      return toWithdrawalDto(updated!);
    });
  }

  async cancelWithdrawal(userId: string): Promise<{ ok: true }> {
    await this.db
      .update(withdrawalRequests)
      .set({ status: 'expired' })
      .where(and(eq(withdrawalRequests.userId, userId), eq(withdrawalRequests.status, 'pending')));
    return { ok: true };
  }
}
