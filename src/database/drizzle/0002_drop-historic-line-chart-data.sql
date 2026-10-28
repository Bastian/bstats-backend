-- IF EXISTS: prod dropped it by hand after the backfill
DROP TABLE IF EXISTS "historic_line_chart_data" CASCADE;--> statement-breakpoint
DROP TABLE "line_chart_migration_state" CASCADE;