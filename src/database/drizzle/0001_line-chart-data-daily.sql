CREATE TABLE "line_chart_data_daily" (
	"chart_id" integer NOT NULL,
	"line_name" varchar(255) NOT NULL,
	"day" integer NOT NULL,
	"slots" real[] NOT NULL,
	CONSTRAINT "line_chart_data_daily_chart_id_line_name_day_pk" PRIMARY KEY("chart_id","line_name","day")
);
--> statement-breakpoint
CREATE TABLE "line_chart_migration_state" (
	"singleton" boolean PRIMARY KEY DEFAULT true NOT NULL,
	"migrated_below" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "line_chart_migration_state_singleton_check" CHECK ("line_chart_migration_state"."singleton")
);
--> statement-breakpoint
INSERT INTO "line_chart_migration_state" ("singleton") VALUES (true);
