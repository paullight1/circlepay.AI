import { num } from '../common/money';
import type { TransactionRow } from '../db/schema';

/** Wire shape matching the app's `Transaction` type. */
export interface TransactionDto {
  id: string;
  title: string;
  subtitle?: string;
  amount: number;
  direction: 'in' | 'out';
  date: string;
  status: TransactionRow['status'];
  category: TransactionRow['category'];
}

export function toTransactionDto(row: TransactionRow): TransactionDto {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    amount: num(row.amount),
    direction: row.direction,
    date: row.createdAt.toISOString(),
    status: row.status,
    category: row.category,
  };
}
