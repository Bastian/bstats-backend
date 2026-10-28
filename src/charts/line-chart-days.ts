/**
 * Historic line chart data is stored as one row per (chart, line, day) holding
 * the day's 48 half-hour buckets in an array.
 */

export const SLOTS_PER_DAY = 48;

/**
 * A day's buckets. `null` = nothing recorded (renders as 0), `NaN` = manual
 * 'ignored' marker for broken buckets (dropped from the API output), number =
 * value.
 */
export type Slots = (number | null)[];

export interface LineChartDay {
  day: number;
  slots: Slots;
}

/** Day since the tms2000 epoch (midnight UTC, so days align with buckets). */
export function tms2000ToDay(tms2000: number): number {
  return Math.floor(tms2000 / SLOTS_PER_DAY);
}

/** The slot a tms2000 occupies within its day. Always 0..47. */
export function tms2000ToSlot(tms2000: number): number {
  return tms2000 - tms2000ToDay(tms2000) * SLOTS_PER_DAY;
}

/** The tms2000 of slot 47, the last bucket of the given day. */
export function dayToLastTms2000(day: number): number {
  return day * SLOTS_PER_DAY + SLOTS_PER_DAY - 1;
}

/** The tms2000 of a (day, slot) pair. */
export function dayAndSlotToTms2000(day: number, slot: number): number {
  return day * SLOTS_PER_DAY + slot;
}

/** A day with no values in it. */
export function emptySlots(): Slots {
  return new Array<number | null>(SLOTS_PER_DAY).fill(null);
}

/** Groups (tms2000, value) pairs into days, ascending; missing buckets stay null. */
export function groupIntoDays(
  entries: Iterable<[number, number | null]>,
): LineChartDay[] {
  const days = new Map<number, Slots>();

  for (const [tms2000, value] of entries) {
    const day = tms2000ToDay(tms2000);
    let slots = days.get(day);
    if (slots === undefined) {
      slots = emptySlots();
      days.set(day, slots);
    }
    slots[tms2000ToSlot(tms2000)] = value;
  }

  return Array.from(days, ([day, slots]) => ({ day, slots })).sort(
    (a, b) => a.day - b.day,
  );
}
