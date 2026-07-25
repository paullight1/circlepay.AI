import { Inject, Injectable } from '@nestjs/common';
import { eq, inArray, or } from 'drizzle-orm';

import { DRIZZLE } from '../db/db.module';
import type { Database } from '../db/drizzle.client';
import { circleMembers, circles, trustSignals } from '../db/schema';
import { UsersService } from '../users/users.service';

export interface TrustSignalDto {
  id: string;
  label: string;
  detail: string;
  positive: boolean;
}

export interface TrustScoreDto {
  score: number;
  band: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  signals: TrustSignalDto[];
}

export interface RiskMemberDto {
  circleId: string;
  circleName: string;
  name: string;
  status: string;
  riskLevel: 'low' | 'moderate' | 'high';
  riskScore: number;
}

function band(score: number): TrustScoreDto['band'] {
  if (score >= 800) return 'Excellent';
  if (score >= 700) return 'Good';
  if (score >= 600) return 'Fair';
  return 'Poor';
}

@Injectable()
export class TrustService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly users: UsersService,
  ) {}

  async getScore(userId: string): Promise<TrustScoreDto> {
    const user = await this.users.getRow(userId);
    const signals = await this.db
      .select()
      .from(trustSignals)
      .where(eq(trustSignals.userId, userId))
      .orderBy(trustSignals.sort);
    return {
      score: user.trustScore,
      band: band(user.trustScore),
      signals: signals.map((s) => ({ id: s.id, label: s.label, detail: s.detail, positive: s.positive })),
    };
  }

  /** At-risk members (moderate/high) across circles the user participates in. */
  async getRisk(userId: string): Promise<RiskMemberDto[]> {
    const memberOf = await this.db
      .select({ circleId: circleMembers.circleId })
      .from(circleMembers)
      .where(eq(circleMembers.userId, userId));
    const ids = memberOf.map((m) => m.circleId);
    const where = ids.length ? or(eq(circles.ownerId, userId), inArray(circles.id, ids)) : eq(circles.ownerId, userId);
    const myCircles = await this.db.select().from(circles).where(where);
    if (!myCircles.length) return [];

    const members = await this.db
      .select()
      .from(circleMembers)
      .where(inArray(circleMembers.circleId, myCircles.map((c) => c.id)));

    return members
      .filter((m) => m.riskLevel === 'moderate' || m.riskLevel === 'high')
      .map((m) => ({
        circleId: m.circleId,
        circleName: myCircles.find((c) => c.id === m.circleId)?.name ?? '',
        name: m.name,
        status: m.status,
        riskLevel: (m.riskLevel ?? 'low') as 'low' | 'moderate' | 'high',
        riskScore: m.riskScore ?? 0,
      }))
      .sort((a, b) => b.riskScore - a.riskScore);
  }
}
