import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://circlepay:circlepay@localhost:5432/circlepay',
  },
  casing: 'snake_case',
  verbose: true,
  strict: true,
});
