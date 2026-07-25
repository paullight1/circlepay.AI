import { num } from '../common/money';
import type { CircleMemberRow, CircleRow } from '../db/schema';

export interface CircleMemberDto {
  id: string;
  name: string;
  status: CircleMemberRow['status'];
  amount: number;
  isYou?: boolean;
  position: number;
  riskLevel?: 'low' | 'moderate' | 'high';
  riskScore?: number;
}

export interface CircleDto {
  id: string;
  name: string;
  frequency: CircleRow['frequency'];
  amountPerMember: number;
  members: CircleMemberDto[];
  currentCycle: number;
  nextPayoutDate: string;
  backupPoolPct: number;
  backupPoolBalance: number;
  status: CircleRow['status'];
  createdAt: string;
}

export function toMemberDto(row: CircleMemberRow): CircleMemberDto {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    amount: num(row.amount),
    isYou: row.isYou || undefined,
    position: row.position,
    riskLevel: row.riskLevel ?? undefined,
    riskScore: row.riskScore ?? undefined,
  };
}

export function toCircleDto(row: CircleRow, members: CircleMemberRow[]): CircleDto {
  return {
    id: row.id,
    name: row.name,
    frequency: row.frequency,
    amountPerMember: num(row.amountPerMember),
    members: [...members].sort((a, b) => a.position - b.position).map(toMemberDto),
    currentCycle: row.currentCycle,
    nextPayoutDate: row.nextPayoutDate.toISOString(),
    backupPoolPct: row.backupPoolPct,
    backupPoolBalance: num(row.backupPoolBalance),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}
