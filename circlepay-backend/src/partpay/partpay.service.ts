import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, inArray } from 'drizzle-orm';

import { DRIZZLE } from '../db/db.module';
import type { Database } from '../db/drizzle.client';
import { money, num, round2 } from '../common/money';
import { installments, partPayPlans, type PartPayPlanRow } from '../db/schema';
import { LedgerService } from '../wallet/ledger.service';
import { NotificationsService } from '../notifications/notifications.service';
import { toPlanDto, type PartPayPlanDto } from './partpay.mapper';
import type { CreatePlanDto } from './dto';

@Injectable()
export class PartPayService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly ledger: LedgerService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(userId: string): Promise<PartPayPlanDto[]> {
    const plans = await this.db
      .select()
      .from(partPayPlans)
      .where(eq(partPayPlans.userId, userId))
      .orderBy(desc(partPayPlans.createdAt));
    if (!plans.length) return [];
    const schedule = await this.db
      .select()
      .from(installments)
      .where(inArray(installments.planId, plans.map((p) => p.id)));
    return plans.map((p) => toPlanDto(p, schedule.filter((i) => i.planId === p.id)));
  }

  private async loadForUser(userId: string, planId: string): Promise<PartPayPlanRow> {
    const [row] = await this.db.select().from(partPayPlans).where(eq(partPayPlans.id, planId)).limit(1);
    if (!row || row.userId !== userId) throw new NotFoundException('Plan not found');
    return row;
  }

  async getOne(userId: string, planId: string): Promise<PartPayPlanDto> {
    const row = await this.loadForUser(userId, planId);
    const schedule = await this.db.select().from(installments).where(eq(installments.planId, planId));
    return toPlanDto(row, schedule);
  }

  async create(userId: string, input: CreatePlanDto): Promise<PartPayPlanDto> {
    const total = round2(input.totalAmount);
    const perMonth = Math.ceil(total / input.durationMonths);
    const serviceFeePct = input.model === 'upfront' ? 3 : 0;

    return this.db.transaction(async (tx) => {
      const [plan] = await tx
        .insert(partPayPlans)
        .values({
          userId,
          title: input.title,
          detail: input.detail ?? null,
          category: input.category,
          model: input.model,
          totalAmount: money(total),
          initialPayment: money(perMonth),
          installmentAmount: money(perMonth),
          frequency: 'monthly',
          durationMonths: input.durationMonths,
          paidAmount: '0',
          serviceFeePct,
          status: 'active',
        })
        .returning();

      const scheduleRows = Array.from({ length: input.durationMonths }, (_, i) => ({
        planId: plan!.id,
        dueDate: new Date(Date.now() + 30 * (i + 1) * 86_400_000),
        amount: money(perMonth),
        status: i === 0 ? ('upcoming' as const) : ('pending' as const),
        position: i + 1,
      }));
      const schedule = await tx.insert(installments).values(scheduleRows).returning();

      await this.notifications.push(
        userId,
        {
          type: 'system',
          title: 'Payment Plan Created',
          body: `${input.title} — first payment due soon. We will remind you before each due date.`,
        },
        tx,
      );
      return toPlanDto(plan!, schedule);
    });
  }

  async payInstallment(userId: string, planId: string, installmentId: string): Promise<PartPayPlanDto> {
    return this.db.transaction(async (tx) => {
      const [plan] = await tx
        .select()
        .from(partPayPlans)
        .where(and(eq(partPayPlans.id, planId), eq(partPayPlans.userId, userId)))
        .for('update')
        .limit(1);
      if (!plan) throw new NotFoundException('Plan not found');

      const [inst] = await tx
        .select()
        .from(installments)
        .where(and(eq(installments.id, installmentId), eq(installments.planId, planId)))
        .limit(1);
      if (!inst) throw new NotFoundException('Installment not found');
      if (inst.status === 'paid') throw new BadRequestException('Installment already paid');

      const amount = num(inst.amount);
      const { available } = await this.ledger.balances(tx, userId, true);
      if (amount > available) throw new BadRequestException('Insufficient available balance');

      await this.ledger.move(
        tx,
        userId,
        { available: -amount },
        { title: `Payment - ${plan.title}`, subtitle: 'PartPay installment', amount, direction: 'out', category: 'partpay' },
      );

      await tx.update(installments).set({ status: 'paid' }).where(eq(installments.id, installmentId));

      // Promote the next pending installment to "upcoming".
      const [nextPending] = await tx
        .select()
        .from(installments)
        .where(and(eq(installments.planId, planId), eq(installments.status, 'pending')))
        .orderBy(installments.position)
        .limit(1);
      if (nextPending) {
        await tx.update(installments).set({ status: 'upcoming' }).where(eq(installments.id, nextPending.id));
      }

      const paidAmount = round2(num(plan.paidAmount) + amount);
      const status = paidAmount >= num(plan.totalAmount) ? ('completed' as const) : ('active' as const);
      await tx
        .update(partPayPlans)
        .set({ paidAmount: money(paidAmount), status })
        .where(eq(partPayPlans.id, planId));

      const [updated] = await tx.select().from(partPayPlans).where(eq(partPayPlans.id, planId)).limit(1);
      const schedule = await tx.select().from(installments).where(eq(installments.planId, planId));
      return toPlanDto(updated!, schedule);
    });
  }
}
