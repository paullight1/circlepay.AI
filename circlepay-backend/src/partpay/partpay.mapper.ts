import { num } from '../common/money';
import type { InstallmentRow, PartPayPlanRow } from '../db/schema';

export interface InstallmentDto {
  id: string;
  date: string;
  amount: number;
  status: InstallmentRow['status'];
}

export interface PartPayPlanDto {
  id: string;
  title: string;
  detail?: string;
  category: PartPayPlanRow['category'];
  model: PartPayPlanRow['model'];
  totalAmount: number;
  initialPayment: number;
  installmentAmount: number;
  frequency: PartPayPlanRow['frequency'];
  durationMonths: number;
  paidAmount: number;
  serviceFeePct: number;
  schedule: InstallmentDto[];
  status: PartPayPlanRow['status'];
  createdAt: string;
}

export function toInstallmentDto(row: InstallmentRow): InstallmentDto {
  return { id: row.id, date: row.dueDate.toISOString(), amount: num(row.amount), status: row.status };
}

export function toPlanDto(row: PartPayPlanRow, schedule: InstallmentRow[]): PartPayPlanDto {
  return {
    id: row.id,
    title: row.title,
    detail: row.detail ?? undefined,
    category: row.category,
    model: row.model,
    totalAmount: num(row.totalAmount),
    initialPayment: num(row.initialPayment),
    installmentAmount: num(row.installmentAmount),
    frequency: row.frequency,
    durationMonths: row.durationMonths,
    paidAmount: num(row.paidAmount),
    serviceFeePct: row.serviceFeePct,
    schedule: [...schedule].sort((a, b) => a.position - b.position).map(toInstallmentDto),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}
