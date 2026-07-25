import { Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';

import { DRIZZLE } from '../db/db.module';
import type { Database, Executor } from '../db/drizzle.client';
import { transactions, wallets, type TransactionRow } from '../db/schema';
import { money, num } from '../common/money';

export interface WalletBalances {
  available: number;
  savings: number;
  onHold: number;
}

export interface WalletDelta {
  available?: number;
  savings?: number;
  onHold?: number;
}

export interface TxInput {
  title: string;
  subtitle?: string | null;
  amount: number;
  direction: 'in' | 'out';
  status?: TransactionRow['status'];
  category: TransactionRow['category'];
}

/**
 * The single choke point for money movement. Mirrors the app store's invariant:
 * every balance change is atomic and (when it represents a user-visible movement)
 * writes a Transaction row. Feature services open a `db.transaction` and call
 * `move()` so their domain writes and the ledger update commit together.
 */
@Injectable()
export class LedgerService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  /** Read a user's wallet balances. Locks the row when inside a transaction. */
  async balances(exec: Executor, userId: string, lock = false): Promise<WalletBalances> {
    const q = exec
      .select({ available: wallets.available, savings: wallets.savings, onHold: wallets.onHold })
      .from(wallets)
      .where(eq(wallets.userId, userId));
    const [row] = lock ? await q.for('update') : await q;
    return {
      available: num(row?.available),
      savings: num(row?.savings),
      onHold: num(row?.onHold),
    };
  }

  /**
   * Apply signed deltas to a wallet and optionally append a transaction row.
   * Runs entirely on the passed executor (root db or an open transaction).
   */
  async move(
    exec: Executor,
    userId: string,
    delta: WalletDelta,
    txn?: TxInput,
  ): Promise<TransactionRow | null> {
    await exec
      .update(wallets)
      .set({
        available: sql`${wallets.available} + ${money(delta.available ?? 0)}`,
        savings: sql`${wallets.savings} + ${money(delta.savings ?? 0)}`,
        onHold: sql`${wallets.onHold} + ${money(delta.onHold ?? 0)}`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId));

    if (!txn) return null;
    const [row] = await exec
      .insert(transactions)
      .values({
        userId,
        title: txn.title,
        subtitle: txn.subtitle ?? null,
        amount: money(txn.amount),
        direction: txn.direction,
        status: txn.status ?? 'success',
        category: txn.category,
      })
      .returning();
    return row ?? null;
  }

  /** Record a standalone transaction (no balance change), e.g. a fee credit. */
  async record(exec: Executor, userId: string, txn: TxInput): Promise<TransactionRow | null> {
    return this.move(exec, userId, {}, txn);
  }

  /** Convenience for services that don't need to compose their own transaction. */
  runInTransaction<T>(fn: (tx: Parameters<Parameters<Database['transaction']>[0]>[0]) => Promise<T>): Promise<T> {
    return this.db.transaction(fn);
  }
}
