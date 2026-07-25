import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';

import { DRIZZLE } from '../db/db.module';
import type { Database } from '../db/drizzle.client';
import { transactions } from '../db/schema';
import { round2 } from '../common/money';
import { LedgerService, type WalletBalances } from './ledger.service';
import { toTransactionDto, type TransactionDto } from './wallet.mapper';

@Injectable()
export class WalletService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly ledger: LedgerService,
  ) {}

  async getWallet(userId: string): Promise<WalletBalances> {
    return this.ledger.balances(this.db, userId);
  }

  async getTransactions(userId: string): Promise<TransactionDto[]> {
    const rows = await this.db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
    return rows.map(toTransactionDto);
  }

  /** Top up available balance from an external source. */
  async addMoney(userId: string, amount: number, source: string): Promise<TransactionDto> {
    const value = round2(amount);
    const row = await this.db.transaction((tx) =>
      this.ledger.move(
        tx,
        userId,
        { available: value },
        { title: 'Wallet Top-up', subtitle: source, amount: value, direction: 'in', category: 'wallet' },
      ),
    );
    return toTransactionDto(row!);
  }

  /** Withdraw to an external destination (amount + optional fee). */
  async withdraw(userId: string, amount: number, destination: string, fee = 0): Promise<TransactionDto> {
    const value = round2(amount);
    const feeValue = round2(fee);
    return this.db.transaction(async (tx) => {
      const { available } = await this.ledger.balances(tx, userId, true);
      if (value + feeValue > available) {
        throw new BadRequestException('Insufficient available balance');
      }
      const row = await this.ledger.move(
        tx,
        userId,
        { available: -(value + feeValue) },
        {
          title: 'Withdrawal',
          subtitle: destination,
          amount: value + feeValue,
          direction: 'out',
          category: 'wallet',
        },
      );
      return toTransactionDto(row!);
    });
  }

  /** Transfer to another CirclePay user (by name/ID — settlement is simulated). */
  async transfer(userId: string, amount: number, recipient: string): Promise<TransactionDto> {
    const value = round2(amount);
    return this.db.transaction(async (tx) => {
      const { available } = await this.ledger.balances(tx, userId, true);
      if (value > available) throw new BadRequestException('Insufficient available balance');
      const row = await this.ledger.move(
        tx,
        userId,
        { available: -value },
        { title: 'Transfer', subtitle: `To ${recipient}`, amount: value, direction: 'out', category: 'wallet' },
      );
      return toTransactionDto(row!);
    });
  }
}
