import { num } from '../common/money';
import type { CampaignRow, DonationRow } from '../db/schema';

export interface DonationDto {
  id: string;
  donor: string;
  amount: number;
  date: string;
  method: DonationRow['method'];
}

export interface CampaignDto {
  id: string;
  code: string;
  title: string;
  organizer: string;
  category: CampaignRow['category'];
  target: number;
  raised: number;
  supporters: number;
  deadline: string;
  about: string;
  donations: DonationDto[];
  isMine?: boolean;
  status: CampaignRow['status'];
}

export function toDonationDto(row: DonationRow): DonationDto {
  return { id: row.id, donor: row.donor, amount: num(row.amount), date: row.createdAt.toISOString(), method: row.method };
}

export function toCampaignDto(row: CampaignRow, donations: DonationRow[], viewerId: string): CampaignDto {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    organizer: row.organizer,
    category: row.category,
    target: num(row.target),
    raised: num(row.raised),
    supporters: row.supporters,
    deadline: row.deadline.toISOString(),
    about: row.about,
    donations: [...donations].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map(toDonationDto),
    isMine: row.ownerId === viewerId ? true : undefined,
    status: row.status,
  };
}
