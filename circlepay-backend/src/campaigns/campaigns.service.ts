import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { desc, eq, inArray } from 'drizzle-orm';

import { DRIZZLE } from '../db/db.module';
import type { Database } from '../db/drizzle.client';
import { campaignCode as genCampaignCode } from '../common/ids';
import { money, num, round2 } from '../common/money';
import { campaigns, donations, type CampaignRow } from '../db/schema';
import { LedgerService } from '../wallet/ledger.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { toCampaignDto, type CampaignDto } from './campaigns.mapper';
import type { CreateCampaignDto, DonateDto } from './dto';

@Injectable()
export class CampaignsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly ledger: LedgerService,
    private readonly notifications: NotificationsService,
    private readonly users: UsersService,
  ) {}

  /** Public feed of campaigns, newest first, flagged with `isMine` for the viewer. */
  async list(userId: string): Promise<CampaignDto[]> {
    const rows = await this.db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
    if (!rows.length) return [];
    const dons = await this.db
      .select()
      .from(donations)
      .where(inArray(donations.campaignId, rows.map((r) => r.id)));
    return rows.map((c) => toCampaignDto(c, dons.filter((d) => d.campaignId === c.id), userId));
  }

  private async load(campaignId: string): Promise<CampaignRow> {
    const [row] = await this.db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
    if (!row) throw new NotFoundException('Campaign not found');
    return row;
  }

  async getOne(userId: string, campaignId: string): Promise<CampaignDto> {
    const row = await this.load(campaignId);
    const dons = await this.db.select().from(donations).where(eq(donations.campaignId, campaignId));
    return toCampaignDto(row, dons, userId);
  }

  async create(userId: string, input: CreateCampaignDto): Promise<CampaignDto> {
    const user = await this.users.getRow(userId);
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + input.deadlineDays);
    deadline.setHours(23, 59, 0, 0);

    return this.db.transaction(async (tx) => {
      const [campaign] = await tx
        .insert(campaigns)
        .values({
          ownerId: userId,
          code: genCampaignCode(),
          title: input.title,
          organizer: user.name,
          category: input.category,
          target: money(round2(input.target)),
          raised: '0',
          supporters: 0,
          deadline,
          about: input.about,
          status: 'active',
        })
        .returning();

      await this.notifications.push(
        userId,
        {
          type: 'campaign',
          title: 'Campaign Live',
          body: `${input.title} is live. Share your link to start receiving support.`,
        },
        tx,
      );
      return toCampaignDto(campaign!, [], userId);
    });
  }

  async donate(userId: string, campaignId: string, input: DonateDto): Promise<CampaignDto> {
    const user = await this.users.getRow(userId);
    const amount = round2(input.amount);

    return this.db.transaction(async (tx) => {
      const [campaign] = await tx.select().from(campaigns).where(eq(campaigns.id, campaignId)).for('update').limit(1);
      if (!campaign) throw new NotFoundException('Campaign not found');

      if (input.method === 'wallet') {
        const { available } = await this.ledger.balances(tx, userId, true);
        if (amount > available) throw new BadRequestException('Insufficient available balance');
        await this.ledger.move(tx, userId, { available: -amount });
      }

      await tx.insert(donations).values({
        campaignId,
        donorUserId: userId,
        donor: input.donor?.trim() || user.name,
        amount: money(amount),
        method: input.method,
      });

      // Match the app: every donation records a wallet-out transaction on the donor.
      await this.ledger.record(tx, userId, {
        title: 'Donation',
        subtitle: campaign.title,
        amount,
        direction: 'out',
        category: 'campaign',
      });

      await tx
        .update(campaigns)
        .set({ raised: money(num(campaign.raised) + amount), supporters: campaign.supporters + 1 })
        .where(eq(campaigns.id, campaignId));

      const [updated] = await tx.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
      const dons = await tx.select().from(donations).where(eq(donations.campaignId, campaignId));
      return toCampaignDto(updated!, dons, userId);
    });
  }
}
