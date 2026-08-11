import { defineConfig } from 'drizzle-kit';

// Use only `generate` and `migrate`. `push` diffs the schema against the live
// database instead of the snapshot, and that database also holds the Better
// Auth tables (user, session, account, verification, twoFactor), which this
// schema does not describe and push would therefore drop.

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema.ts',
  out: './src/database/drizzle',
  dbCredentials: {
    host: process.env.PGHOST ?? 'localhost',
    port: parseInt(process.env.PGPORT ?? '5432', 10),
    user: process.env.POSTGRES_USER ?? '',
    password: process.env.POSTGRES_PASSWORD ?? '',
    database: process.env.POSTGRES_DB ?? '',
  },
});
