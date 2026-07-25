import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';

import { DRIZZLE } from '../db/db.module';
import type { Database, Executor } from '../db/drizzle.client';
import { notifications, type NotificationRow } from '../db/schema';

export interface NotificationDto {
  id: string;
  type: NotificationRow['type'];
  title: string;
  body: string;
  date: string;
  read: boolean;
}

function toDto(row: NotificationRow): NotificationDto {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    date: row.createdAt.toISOString(),
    read: row.read,
  };
}

@Injectable()
export class NotificationsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async list(userId: string): Promise<NotificationDto[]> {
    const rows = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
    return rows.map(toDto);
  }

  async markAllRead(userId: string): Promise<{ ok: true }> {
    await this.db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
    return { ok: true };
  }

  /**
   * Append a notification. Accepts an executor so callers can push inside their
   * own transaction (mirrors the app store's pushNotification side-effect).
   */
  async push(
    userId: string,
    n: { type: NotificationRow['type']; title: string; body: string },
    exec: Executor = this.db,
  ): Promise<NotificationDto> {
    const [row] = await exec
      .insert(notifications)
      .values({ userId, type: n.type, title: n.title, body: n.body })
      .returning();
    return toDto(row!);
  }
}
