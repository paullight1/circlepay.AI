import postgres from 'postgres';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import * as schema from './schema';

export type Database = PostgresJsDatabase<typeof schema>;

/** A Drizzle transaction handle (same query surface as Database). */
export type Tx = Parameters<Parameters<Database['transaction']>[0]>[0];

/** Either the root db or an open transaction — for helpers that run in both. */
export type Executor = Database | Tx;

/**
 * Create a Drizzle client bound to our schema. Used both by the Nest DI provider
 * and by the standalone migrate/seed scripts (which manage their own lifecycle).
 */
export function createDb(url: string, max = 10): { db: Database; sql: postgres.Sql } {
  const sql = postgres(url, { max });
  const db = drizzle(sql, { schema, casing: 'snake_case' });
  return { db, sql };
}
