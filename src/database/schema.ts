import {
  integer,
  pgTable,
  primaryKey,
  real,
  varchar,
} from 'drizzle-orm/pg-core';

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
