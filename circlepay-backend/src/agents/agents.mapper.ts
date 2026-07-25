import { num } from '../common/money';
import type { AgentRow, LinkedAccountRow, WithdrawalRow } from '../db/schema';

export interface AgentLocationDto {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  open: boolean;
  kind: AgentRow['kind'];
  agentId: string;
}

export interface LinkedAccountDto {
  id: string;
  bank: string;
  last4: string;
  active: boolean;
  purpose?: string;
}

export interface WithdrawalRequestDto {
  code: string;
  amount: number;
  fee: number;
  expiresAt: string;
  status: WithdrawalRow['status'];
}

export function toAgentDto(row: AgentRow): AgentLocationDto {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    distanceKm: num(row.distanceKm),
    open: row.open,
    kind: row.kind,
    agentId: row.agentCode,
  };
}

export function toLinkedAccountDto(row: LinkedAccountRow): LinkedAccountDto {
  return { id: row.id, bank: row.bank, last4: row.last4, active: row.active, purpose: row.purpose ?? undefined };
}

export function toWithdrawalDto(row: WithdrawalRow): WithdrawalRequestDto {
  return {
    code: row.code,
    amount: num(row.amount),
    fee: num(row.fee),
    expiresAt: row.expiresAt.toISOString(),
    status: row.status,
  };
}
