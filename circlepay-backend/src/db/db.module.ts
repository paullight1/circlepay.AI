import {
  Global,
  Inject,
  Module,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type postgres from 'postgres';

import { createDb, type Database } from './drizzle.client';

/** Injection token for the Drizzle database instance. */
export const DRIZZLE = Symbol('DRIZZLE');
/** Injection token for the raw postgres.js client (used to close the pool). */
export const PG_CLIENT = Symbol('PG_CLIENT');

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PG_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.getOrThrow<string>('DATABASE_URL');
        const { db, sql } = createDb(url);
        // Stash the db on the sql object so the DRIZZLE provider can reuse it
        // without opening a second connection pool.
        (sql as unknown as { __db: Database }).__db = db;
        return sql;
      },
    },
    {
      provide: DRIZZLE,
      inject: [PG_CLIENT],
      useFactory: (sql: postgres.Sql) =>
        (sql as unknown as { __db: Database }).__db,
    },
  ],
  exports: [DRIZZLE, PG_CLIENT],
})
export class DbModule implements OnModuleDestroy {
  constructor(@Inject(PG_CLIENT) private readonly sql: postgres.Sql) {}

  async onModuleDestroy(): Promise<void> {
    await this.sql.end({ timeout: 5 });
  }
}
