import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, inArray, or } from 'drizzle-orm';

import { DRIZZLE } from '../db/db.module';
import type { Database } from '../db/drizzle.client';
import { money, num, round2 } from '../common/money';
import { circleMembers, circles, type CircleRow } from '../db/schema';
import { LedgerService } from '../wallet/ledger.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { toCircleDto, type CircleDto } from './circles.mapper';
import type { CreateCircleDto } from './dto';

function daysForFrequency(freq: 'daily' | 'weekly' | 'monthly'): number {
  return freq === 'daily' ? 1 : freq === 'weekly' ? 7 : 30;
}

@Injectable()
export class CirclesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly ledger: LedgerService,
    private readonly notifications: NotificationsService,
    private readonly users: UsersService,
  ) {}

  /** Circles the user owns or is a member of, newest first. */
  async list(userId: string): Promise<CircleDto[]> {
    const memberOf = await this.db
      .select({ circleId: circleMembers.circleId })
      .from(circleMembers)
      .where(eq(circleMembers.userId, userId));
    const ids = memberOf.map((m) => m.circleId);

    const where = ids.length ? or(eq(circles.ownerId, userId), inArray(circles.id, ids)) : eq(circles.ownerId, userId);
    const rows = await this.db.select().from(circles).where(where).orderBy(desc(circles.createdAt));
    if (!rows.length) return [];

    const members = await this.db
      .select()
      .from(circleMembers)
      .where(inArray(circleMembers.circleId, rows.map((r) => r.id)));

    return rows.map((c) => toCircleDto(c, members.filter((m) => m.circleId === c.id)));
  }

  private async loadForUser(userId: string, circleId: string): Promise<CircleRow> {
    const [row] = await this.db.select().from(circles).where(eq(circles.id, circleId)).limit(1);
    if (!row) throw new NotFoundException('Circle not found');
    if (row.ownerId !== userId) {
      const [membership] = await this.db
        .select({ id: circleMembers.id })
        .from(circleMembers)
        .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)))
        .limit(1);
      if (!membership) throw new NotFoundException('Circle not found');
    }
    return row;
  }

  async getOne(userId: string, circleId: string): Promise<CircleDto> {
    const row = await this.loadForUser(userId, circleId);
    const members = await this.db.select().from(circleMembers).where(eq(circleMembers.circleId, circleId));
    return toCircleDto(row, members);
  }

  async create(userId: string, input: CreateCircleDto): Promise<CircleDto> {
    const user = await this.users.getRow(userId);
    const amount = round2(input.amountPerMember);
    const nextPayout = input.startDate
      ? new Date(input.startDate)
      : new Date(Date.now() + daysForFrequency(input.frequency) * 86_400_000);

    const dto = await this.db.transaction(async (tx) => {
      const [circle] = await tx
        .insert(circles)
        .values({
          ownerId: userId,
          name: input.name,
          frequency: input.frequency,
          amountPerMember: money(amount),
          currentCycle: 1,
          nextPayoutDate: nextPayout,
          backupPoolPct: 10,
          backupPoolBalance: '0',
          status: 'pending',
        })
        .returning();

      const memberRows = [
        {
          circleId: circle!.id,
          userId,
          name: user.name,
          status: 'pending' as const,
          amount: money(amount),
          isYou: true,
          position: 1,
          riskLevel: 'low' as const,
          riskScore: 10,
        },
        ...Array.from({ length: Math.max(0, input.memberCount - 1) }, (_, i) => ({
          circleId: circle!.id,
          userId: null,
          name: `Member ${i + 2}`,
          status: 'pending' as const,
          amount: money(amount),
          isYou: false,
          position: i + 2,
          riskLevel: 'low' as const,
          riskScore: 10,
        })),
      ];
      const members = await tx.insert(circleMembers).values(memberRows).returning();

      await this.notifications.push(
        userId,
        {
          type: 'system',
          title: 'Circle Created',
          body: `${input.name} is ready. Share the invite link to add members.`,
        },
        tx,
      );
      return toCircleDto(circle!, members);
    });
    return dto;
  }

  /** Contribute this cycle: deduct from available, pool into on-hold + backup. */
  async contribute(userId: string, circleId: string): Promise<CircleDto> {
    return this.db.transaction(async (tx) => {
      const [circle] = await tx.select().from(circles).where(eq(circles.id, circleId)).for('update').limit(1);
      if (!circle) throw new NotFoundException('Circle not found');

      const amount = num(circle.amountPerMember);
      const { available } = await this.ledger.balances(tx, userId, true);
      if (amount > available) throw new BadRequestException('Insufficient available balance');

      const backup = Math.round(amount * (circle.backupPoolPct / 100));

      await this.ledger.move(
        tx,
        userId,
        { available: -amount, onHold: amount },
        { title: 'Manual Contribution', subtitle: circle.name, amount, direction: 'out', category: 'circle' },
      );

      await tx
        .update(circles)
        .set({ backupPoolBalance: money(num(circle.backupPoolBalance) + backup) })
        .where(eq(circles.id, circleId));

      // Mark only the caller's own membership row as paid for this cycle.
      await tx
        .update(circleMembers)
        .set({ status: 'paid' })
        .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)));

      const [updated] = await tx.select().from(circles).where(eq(circles.id, circleId)).limit(1);
      const members = await tx.select().from(circleMembers).where(eq(circleMembers.circleId, circleId));
      return toCircleDto(updated!, members);
    });
  }
}
