-- This table predates Drizzle in existing installations. IF NOT EXISTS makes
-- the first managed migration an adoption step there and creates it normally
-- for fresh databases.
CREATE TABLE IF NOT EXISTS "historic_line_chart_data" (
	"chartid" integer NOT NULL,
	"tms2000" integer NOT NULL,
	"linename" varchar(255) NOT NULL,
	"value" real,
	CONSTRAINT "historic_line_chart_data_chartid_tms2000_linename_key" UNIQUE("chartid","tms2000","linename")
);
