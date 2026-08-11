import { integer, pgTable, real, unique, varchar } from 'drizzle-orm/pg-core';

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
