/**
 * Backfills historic_line_chart_data into line_chart_data_daily.
 *
 * Walks chart ids upwards, pushing the `migrated_below` watermark ahead of
 * itself. Each batch is one transaction: copy, read both formats back and
 * compare, only then advance the watermark. A mismatch rolls the batch back and
 * aborts the run.
 *
 * A batch holds the watermark FOR UPDATE, the archiver reads it FOR SHARE in
 * its write transaction, so neither slips between the other's format decision
 * and write. Relies on no older backend version running alongside. Re-copying
 * a range is safe: existing slots win, for a migrated chart they can hold days
 * the archiver wrote after the migration.
 *
 * Nothing is deleted from the old table; space is reclaimed by a single DROP
 * TABLE at the end. Lowering the watermark is no way back: days archived since
 * the migration exist only in the new table.
 *
 * Usage (from the built output):
 *   node dist/scripts/backfill-line-chart-daily.js [options]
 *
 * Options:
 *   --batch-size <n>   chart ids per transaction (default 200)
 *   --pause-ms <n>     pause between batches (default 1000)
 *   --max-batches <n>  stop after n batches (default: until done)
 *   --stop-above <n>   do not migrate charts with an id above n
 *   --no-verify        skip the comparison (only for an already verified range)
 *   --dry-run          run a single batch and roll it back
 *   --verify-only      write nothing; re-check that every old-format bucket of
 *                      the migrated range made it into the new format
 *   --repair           like --verify-only, but re-copies chunks with missing
 *                      buckets; the watermark does not move
 *   --finish           move the watermark past every chart id once nothing is
 *                      left to copy; run --verify-only before the DROP TABLE
 *
 * Connects like the application: PGHOST, PGPORT, POSTGRES_USER,
 * POSTGRES_PASSWORD, POSTGRES_DB.
 */

import { Pool, PoolClient } from 'pg';
import { SLOTS_PER_DAY } from '../charts/line-chart-days';

/** How many mismatching buckets are printed before giving up. */
const MISMATCH_REPORT_LIMIT = 20;

/** Max int4; `--finish` moves the watermark here. */
const FINISHED_WATERMARK = 2147483647;

type Mode = 'backfill' | 'verify-only' | 'repair' | 'finish';

interface Options {
  mode: Mode;
  batchSize: number;
  pauseMs: number;
  maxBatches: number | null;
  stopAbove: number | null;
  verify: boolean;
  dryRun: boolean;
}

interface BatchResult {
  from: number;
  to: number;
  dayRows: number;
  charts: number;
  merged: boolean;
}

interface Mismatch {
  chartid: number;
  linename: string;
  tms2000: number;
  old_value: number | null;
  new_value: number | null;
}

class VerificationError extends Error {
  constructor(
    public readonly mismatches: Mismatch[],
    total: number,
    problem: string,
  ) {
    super(`Verification failed: ${countLabel(total)} bucket(s) ${problem}`);
  }
}

/** Counts from a query limited to one row more than is reported. */
function countLabel(count: number): string {
  return count > MISMATCH_REPORT_LIMIT
    ? `more than ${MISMATCH_REPORT_LIMIT}`
    : `${count}`;
}

function parseOptions(argv: string[]): Options {
  const options: Options = {
    mode: 'backfill',
    batchSize: 200,
    pauseMs: 1000,
    maxBatches: null,
    stopAbove: null,
    verify: true,
    dryRun: false,
  };

  const setMode = (mode: Mode) => {
    if (options.mode !== 'backfill') {
      throw new Error(
        'Only one of --verify-only, --repair and --finish can be given',
      );
    }
    options.mode = mode;
  };

  for (let i = 0; i < argv.length; i++) {
    const argument = argv[i];
    const number = () => {
      const value = parseInt(argv[++i], 10);
      if (isNaN(value)) {
        throw new Error(`${argument} needs a number`);
      }
      return value;
    };

    switch (argument) {
      case '--batch-size':
        options.batchSize = number();
        break;
      case '--pause-ms':
        options.pauseMs = number();
        break;
      case '--max-batches':
        options.maxBatches = number();
        break;
      case '--stop-above':
        options.stopAbove = number();
        break;
      case '--no-verify':
        options.verify = false;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--verify-only':
        setMode('verify-only');
        break;
      case '--repair':
        setMode('repair');
        break;
      case '--finish':
        setMode('finish');
        break;
      default:
        throw new Error(`Unknown argument '${argument}'`);
    }
  }

  if (options.batchSize < 1) {
    throw new Error('--batch-size must be at least 1');
  }

  if (options.mode !== 'backfill' && (options.dryRun || !options.verify)) {
    throw new Error(
      `--${options.mode} cannot be combined with --dry-run or --no-verify`,
    );
  }

  // Without a committed watermark every batch would redo the same range
  if (options.dryRun) {
    options.maxBatches = 1;
  }

  return options;
}

/**
 * Reads the watermark. `forUpdate` holds it until the transaction ends, which
 * serialises script runs and keeps the archiver out.
 */
async function readWatermark(
  client: PoolClient,
  forUpdate: boolean,
): Promise<number> {
  const state = await client.query<{ migrated_below: number }>(
    `SELECT migrated_below FROM line_chart_migration_state${
      forUpdate ? ' FOR UPDATE' : ''
    }`,
  );
  if (state.rows.length === 0) {
    throw new Error(
      'line_chart_migration_state is empty — has migration ' +
        '0001_line-chart-data-daily been applied?',
    );
  }
  return state.rows[0].migrated_below;
}

/** The highest chart id with rows in the old format, null if there are none. */
async function highestOldChartId(client: PoolClient): Promise<number | null> {
  const highest = await client.query<{ max: number | null }>(
    'SELECT max(chartId) AS max FROM historic_line_chart_data',
  );
  return highest.rows[0].max;
}

/**
 * Copies chart ids `[from, to)` into the day-array format. Must run in a
 * transaction holding the watermark. `merged` = the range already had
 * new-format rows (a repeated copy).
 */
async function copyRange(
  client: PoolClient,
  from: number,
  to: number,
): Promise<{ dayRows: number; charts: number; merged: boolean }> {
  const existing = await client.query<{ exists: boolean }>(
    `
SELECT EXISTS (
  SELECT 1 FROM line_chart_data_daily WHERE chart_id >= $1 AND chart_id < $2
) AS exists;
    `,
    [from, to],
  );

  // One read of the old table per copy, shared by insert and verification.
  // tms2000 < 0 is broken data and dropped (also keeps the integer division in
  // line with tms2000ToDay). value NULL is the manual 'ignored' marker and
  // becomes NaN, so the left join below can tell it from a missing row.
  await client.query(
    `
CREATE TEMP TABLE backfill_src ON COMMIT DROP AS
SELECT chartId AS chartid,
       lineName AS linename,
       tms2000 / ${SLOTS_PER_DAY} AS day,
       tms2000 % ${SLOTS_PER_DAY} AS slot,
       coalesce(value, 'NaN'::real) AS value
FROM historic_line_chart_data
WHERE chartId >= $1 AND chartId < $2 AND tms2000 >= 0;
    `,
    [from, to],
  );
  await client.query('ANALYZE backfill_src');

  // generate_series creates the 48 slots, the left join fills them — all
  // against the temp table. On conflict existing slots win: for a migrated
  // chart they hold what the archiver wrote after the migration.
  const inserted = await client.query(
    `
INSERT INTO line_chart_data_daily (chart_id, line_name, day, slots)
SELECT d.chartid, d.linename, d.day, array_agg(s.value ORDER BY g.slot)
FROM (SELECT DISTINCT chartid, linename, day FROM backfill_src) d
CROSS JOIN generate_series(0, ${SLOTS_PER_DAY - 1}) AS g(slot)
LEFT JOIN backfill_src s
       ON s.chartid = d.chartid AND s.linename = d.linename
      AND s.day = d.day AND s.slot = g.slot
GROUP BY d.chartid, d.linename, d.day
ON CONFLICT (chart_id, line_name, day) DO UPDATE SET slots = (
  SELECT array_agg(COALESCE(o, n) ORDER BY i)
  FROM unnest(line_chart_data_daily.slots, EXCLUDED.slots)
       WITH ORDINALITY AS t(o, n, i)
);
    `,
  );

  const charts = await client.query<{ count: string }>(
    'SELECT count(DISTINCT chartid) AS count FROM backfill_src',
  );

  return {
    dayRows: inserted.rowCount ?? 0,
    charts: parseInt(charts.rows[0].count, 10),
    merged: existing.rows[0].exists,
  };
}

/**
 * Copies one range of chart ids and advances the watermark, all in one
 * transaction (including the verification), so a failure leaves no trace.
 */
async function runBatch(
  client: PoolClient,
  options: Options,
): Promise<BatchResult | 'done' | 'capped'> {
  await client.query('BEGIN');
  try {
    const from = await readWatermark(client, true);

    // Re-read every batch: new charts can appear while the backfill runs
    const highestChartId = await highestOldChartId(client);

    if (highestChartId === null || from > highestChartId) {
      await client.query('ROLLBACK');
      return 'done';
    }

    // Never past the highest old-format chart id; going further is --finish's job
    const to = Math.min(
      from + options.batchSize,
      highestChartId + 1,
      options.stopAbove === null ? Infinity : options.stopAbove + 1,
    );

    if (to <= from) {
      await client.query('ROLLBACK');
      return 'capped';
    }

    const copied = await copyRange(client, from, to);

    // A repeated copy keeps the existing slots, so the new format can
    // legitimately differ from the old one
    if (options.verify) {
      reportDifferences(await verifyBatch(client, from, to, !copied.merged));
    }

    await client.query(
      'UPDATE line_chart_migration_state SET migrated_below = $1 WHERE singleton',
      [to],
    );

    await client.query(options.dryRun ? 'ROLLBACK' : 'COMMIT');

    return { from, to, ...copied };
  } catch (error) {
    // Swallow rollback failures so the original error surfaces; Postgres rolls
    // back on disconnect anyway
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  }
}

/**
 * Reads the range back from both formats and compares bucket by bucket —
 * starting from the original tms2000, not backfill_src, so a broken day/slot
 * derivation cannot cancel itself out. tms2000 < 0 is excluded; old NULLs are
 * compared as NaN (Postgres treats NaN = NaN as true).
 *
 * `strict` (first copy) requires an exact match in both directions. Otherwise
 * the new format may legitimately hold more — days and values the archiver
 * wrote after the migration — so only old buckets missing from it fail;
 * differing values are merely returned for reporting.
 */
async function verifyBatch(
  client: PoolClient,
  from: number,
  to: number,
  strict: boolean,
): Promise<Mismatch[]> {
  const response = await client.query<Mismatch>(
    `
WITH old AS (
  SELECT chartId AS chartid, lineName AS linename, tms2000,
         coalesce(value, 'NaN'::real) AS value
  FROM historic_line_chart_data
  WHERE chartId >= $1 AND chartId < $2 AND tms2000 >= 0
),
new AS (
  SELECT d.chart_id AS chartid,
         d.line_name AS linename,
         -- ord is bigint; cast back to the tms2000 column type
         (d.day * ${SLOTS_PER_DAY} + (s.ord - 1))::integer AS tms2000,
         s.value
  FROM line_chart_data_daily d
  CROSS JOIN LATERAL unnest(d.slots) WITH ORDINALITY AS s(value, ord)
  WHERE d.chart_id >= $1 AND d.chart_id < $2 AND s.value IS NOT NULL
)
SELECT coalesce(o.chartid, n.chartid) AS chartid,
       coalesce(o.linename, n.linename) AS linename,
       coalesce(o.tms2000, n.tms2000) AS tms2000,
       o.value AS old_value,
       n.value AS new_value
FROM old o
${strict ? 'FULL OUTER' : 'LEFT'} JOIN new n
  ON  o.chartid = n.chartid
  AND o.linename = n.linename
  AND o.tms2000 = n.tms2000
WHERE o.value IS DISTINCT FROM n.value
-- Missing buckets first, so the limit cannot hide them behind differing ones
ORDER BY (o.value IS NULL OR n.value IS NULL) DESC, 1, 2, 3
LIMIT ${MISMATCH_REPORT_LIMIT + 1};
    `,
    [from, to],
  );

  const rows = response.rows;
  const fatal = strict ? rows : rows.filter((row) => row.new_value === null);

  if (fatal.length > 0) {
    throw new VerificationError(
      fatal.slice(0, MISMATCH_REPORT_LIMIT),
      // Only all-fatal results can have been cut off by the limit
      fatal.length === rows.length ? rows.length : fatal.length,
      strict
        ? 'differ between the old and the new format'
        : 'of the old format are missing from the new format',
    );
  }

  return rows;
}

/** Prints what `verifyBatch` let through. */
function reportDifferences(differences: Mismatch[]): void {
  if (differences.length === 0) {
    return;
  }
  console.warn(
    `${countLabel(differences.length)} bucket(s) hold different values in ` +
      `the two formats. The new format's value is kept: for a migrated chart ` +
      `it is the newer one.`,
  );
  console.table(differences.slice(0, MISMATCH_REPORT_LIMIT));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Re-copies a chunk and checks nothing is missing; the watermark does not move. */
async function repairChunk(
  client: PoolClient,
  from: number,
  to: number,
): Promise<void> {
  await client.query('BEGIN');
  try {
    const migratedBelow = await readWatermark(client, true);
    if (to > migratedBelow) {
      throw new Error(
        `The watermark moved below chart id ${to} during the repair`,
      );
    }

    await copyRange(client, from, to);
    await verifyBatch(client, from, to, false);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  }
}

/**
 * Re-checks the whole migrated range — the final gate before the DROP TABLE.
 * Surfaces buckets stranded in the old format (older backend version, manual
 * watermark change). Writes nothing unless `repair`.
 */
async function runVerifySweep(
  client: PoolClient,
  options: Options,
  isStopRequested: () => boolean,
): Promise<boolean> {
  const repair = options.mode === 'repair';
  const migratedBelow = await readWatermark(client, false);

  // New-format rows above the watermark: lowered by hand or lost in a restore
  const above = await client.query<{ exists: boolean }>(
    `
SELECT EXISTS (
  SELECT 1 FROM line_chart_data_daily WHERE chart_id >= $1
) AS exists;
    `,
    [migratedBelow],
  );
  const watermarkLowered = above.rows[0].exists;
  if (watermarkLowered) {
    console.error(
      `line_chart_data_daily has rows for chart ids at or above ` +
        `migrated_below (${migratedBelow}). The watermark was lowered by hand ` +
        `or lost in a restore, and those charts are read from the old table.`,
    );
  }

  // Cap at the highest old-format chart id (the watermark is huge after --finish)
  const highestChartId = await highestOldChartId(client);
  const end =
    highestChartId === null ? 0 : Math.min(migratedBelow, highestChartId + 1);

  if (end <= 0) {
    console.log(
      migratedBelow <= 0
        ? 'Nothing has been migrated yet, nothing to verify.'
        : 'The old table is empty, nothing to verify.',
    );
    return !watermarkLowered;
  }

  let failedRanges = 0;
  let repairedRanges = 0;
  for (let from = 0; from < end; from += options.batchSize) {
    if (isStopRequested()) {
      console.log('Stopped early — the range is only partially verified.');
      return false;
    }

    const to = Math.min(from + options.batchSize, end);

    try {
      reportDifferences(await verifyBatch(client, from, to, false));
      console.log(`chart ids [${from}, ${to}): ok`);
    } catch (error) {
      if (!(error instanceof VerificationError)) {
        throw error;
      }
      console.error(`chart ids [${from}, ${to}): ${error.message}`);
      console.table(error.mismatches);

      if (repair) {
        await repairChunk(client, from, to);
        repairedRanges++;
        console.log(`chart ids [${from}, ${to}): repaired`);
      } else {
        failedRanges++;
      }
    }

    if (options.pauseMs > 0 && !isStopRequested()) {
      await sleep(options.pauseMs);
    }
  }

  if (repairedRanges > 0) {
    console.log(`Repaired ${repairedRanges} range(s).`);
  }

  if (failedRanges > 0) {
    console.error(
      `${failedRanges} range(s) failed verification. Do NOT drop the old ` +
        `table; the listed buckets only exist there. --repair copies them ` +
        `over.`,
    );
    return false;
  }

  if (watermarkLowered) {
    return false;
  }

  console.log(
    `All old-format buckets of chart ids [0, ${end}) are present in the new ` +
      `format.`,
  );
  return true;
}

/**
 * Moves the watermark past every chart id, including unassigned ones. Refuses
 * while old-format rows remain at or above it; the lock keeps the archiver
 * from adding any meanwhile.
 */
async function finish(client: PoolClient): Promise<void> {
  await client.query('BEGIN');
  try {
    const migratedBelow = await readWatermark(client, true);
    if (migratedBelow === FINISHED_WATERMARK) {
      await client.query('ROLLBACK');
      console.log('The migration is already finished.');
      return;
    }

    const left = await client.query<{ exists: boolean }>(
      `
SELECT EXISTS (
  SELECT 1 FROM historic_line_chart_data WHERE chartId >= $1
) AS exists;
      `,
      [migratedBelow],
    );
    if (left.rows[0].exists) {
      throw new Error(
        `Charts from id ${migratedBelow} up still have rows in the old ` +
          `format. Run the backfill first.`,
      );
    }

    await client.query(
      'UPDATE line_chart_migration_state SET migrated_below = $1 WHERE singleton',
      [FINISHED_WATERMARK],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  }

  console.log(
    `migrated_below is now ${FINISHED_WATERMARK}: every chart, including the ` +
      `ones created from now on, uses the new format. Run --verify-only ` +
      `before the DROP TABLE.`,
  );
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));

  switch (options.mode) {
    case 'verify-only':
    case 'repair':
      console.log(
        `${options.mode === 'repair' ? 'Repairing' : 'Verifying'} the ` +
          `migrated range in chunks of ${options.batchSize} chart id(s)`,
      );
      break;
    case 'backfill':
      console.log(
        `Backfilling in batches of ${options.batchSize} chart id(s) with a ` +
          `${options.pauseMs} ms pause` +
          `${options.verify ? '' : ', WITHOUT verification'}` +
          `${options.dryRun ? ', DRY RUN (nothing is committed)' : ''}`,
      );
      break;
  }

  let stopRequested = false;
  const requestStop = (signal: NodeJS.Signals) => {
    if (stopRequested) {
      // Postgres rolls the uncommitted transaction back when the connection dies
      console.log('Stopping right away, the current batch is not committed.');
      process.exit(signal === 'SIGINT' ? 130 : 143);
    }
    stopRequested = true;
    console.log(
      'Stop requested, finishing the current batch… (again to abort it)',
    );
  };
  process.on('SIGINT', requestStop);
  process.on('SIGTERM', requestStop);

  const pool = new Pool({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    max: 1,
  });

  // One connection: temp table and row lock are per-session, and a single
  // writer is exactly the throttle we want
  const client = await pool.connect();

  const startedAt = Date.now();
  let batches = 0;
  let dayRows = 0;
  let charts = 0;
  let watermark = 0;

  try {
    if (options.mode === 'verify-only' || options.mode === 'repair') {
      if (!(await runVerifySweep(client, options, () => stopRequested))) {
        process.exitCode = 1;
      }
      return;
    }

    if (options.mode === 'finish') {
      await finish(client);
      return;
    }

    while (
      !stopRequested &&
      (options.maxBatches === null || batches < options.maxBatches)
    ) {
      const result = await runBatch(client, options);

      if (result === 'done') {
        console.log('Nothing left to migrate.');
        break;
      }
      if (result === 'capped') {
        console.log(`--stop-above ${options.stopAbove} reached.`);
        break;
      }

      batches++;
      dayRows += result.dayRows;
      charts += result.charts;

      const seconds = Math.round((Date.now() - startedAt) / 1000);
      console.log(
        `chart ids [${result.from}, ${result.to}): ${result.charts} chart(s), ` +
          `${result.dayRows} day row(s)` +
          `${result.merged ? ' merged into existing rows' : ''} — ` +
          `${options.dryRun ? 'rolled back' : `watermark now ${result.to}`}, ` +
          `${seconds}s elapsed`,
      );

      if (!stopRequested && options.pauseMs > 0) {
        await sleep(options.pauseMs);
      }
    }

    watermark = await readWatermark(client, false);
  } finally {
    client.release();
    await pool.end();
  }

  console.log(
    `Done: ${batches} batch(es), ${charts} chart(s), ${dayRows} day row(s) in ` +
      `${Math.round((Date.now() - startedAt) / 1000)}s.`,
  );
  if (options.dryRun) {
    console.log(
      'Dry run — everything was rolled back, migrated_below is unchanged.',
    );
    return;
  }

  if (watermark === FINISHED_WATERMARK) {
    console.log('The migration is finished.');
    return;
  }

  console.log(
    `migrated_below is now ${watermark}. The migration is only finished ` +
      'after a run with --finish. Until then, charts at or above it, ' +
      'including every chart created from now on, keep using the old format.',
  );
}

main().catch((error) => {
  if (error instanceof VerificationError) {
    console.error(error.message);
    console.error('The transaction was rolled back.');
    console.table(error.mismatches);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});
