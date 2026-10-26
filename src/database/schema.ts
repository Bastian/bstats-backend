import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  integer,
  pgTable,
  primaryKey,
  real,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';

export const historicLineChartData = pgTable(
  'historic_line_chart_data',
  {
    chartId: integer('chartid').notNull(),
    tms2000: integer('tms2000').notNull(),
    lineName: varchar('linename', { length: 255 }).notNull(),
    value: real('value'),
  },
  (table) => [
    unique('historic_line_chart_data_chartid_tms2000_linename_key').on(
      table.chartId,
      table.tms2000,
      table.lineName,
    ),
  ],
);

export const lineChartDataDaily = pgTable(
  'line_chart_data_daily',
  {
    chartId: integer('chart_id').notNull(),
    lineName: varchar('line_name', { length: 255 }).notNull(),
    day: integer('day').notNull(),
    slots: real('slots').array().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.chartId, table.lineName, table.day] }),
  ],
);

export const lineChartMigrationState = pgTable(
  'line_chart_migration_state',
  {
    singleton: boolean('singleton').primaryKey().default(true),
    migratedBelow: integer('migrated_below').notNull().default(0),
  },
  (table) => [
    check(
      'line_chart_migration_state_singleton_check',
      sql`${table.singleton}`,
    ),
  ],
);
