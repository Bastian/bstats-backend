import {
  SLOTS_PER_DAY,
  dayAndSlotToTms2000,
  dayToLastTms2000,
  emptySlots,
  groupIntoDays,
  tms2000ToDay,
  tms2000ToSlot,
} from './line-chart-days';

describe('line chart day/slot arithmetic', () => {
  describe('tms2000ToDay / tms2000ToSlot', () => {
    it('maps the very first bucket to day 0, slot 0', () => {
      expect(tms2000ToDay(0)).toBe(0);
      expect(tms2000ToSlot(0)).toBe(0);
    });

    it('maps the last bucket of day 0 to slot 47', () => {
      expect(tms2000ToDay(47)).toBe(0);
      expect(tms2000ToSlot(47)).toBe(47);
    });

    it('starts a new day at tms2000 % 48 == 0', () => {
      expect(tms2000ToDay(48)).toBe(1);
      expect(tms2000ToSlot(48)).toBe(0);
    });

    it('ends a day at tms2000 % 48 == 47', () => {
      expect(tms2000ToDay(95)).toBe(1);
      expect(tms2000ToSlot(95)).toBe(47);
      expect(tms2000ToDay(96)).toBe(2);
      expect(tms2000ToSlot(96)).toBe(0);
    });

    it('rounds down for negative tms2000 instead of truncating', () => {
      // SQL's mod(-440642, 48) returns -2 and `(-440642 / 48) | 0` returns
      // -9180, both of which would produce an out-of-range slot index.
      expect(tms2000ToDay(-440642)).toBe(-9181);
      expect(tms2000ToSlot(-440642)).toBe(46);

      expect(tms2000ToDay(-1)).toBe(-1);
      expect(tms2000ToSlot(-1)).toBe(47);

      expect(tms2000ToDay(-48)).toBe(-1);
      expect(tms2000ToSlot(-48)).toBe(0);

      expect(tms2000ToDay(-49)).toBe(-2);
      expect(tms2000ToSlot(-49)).toBe(47);
    });

    it('never produces a slot outside 0..47', () => {
      for (let tms2000 = -200; tms2000 <= 200; tms2000++) {
        const slot = tms2000ToSlot(tms2000);
        expect(slot).toBeGreaterThanOrEqual(0);
        expect(slot).toBeLessThan(SLOTS_PER_DAY);
      }
    });

    it('round-trips through dayAndSlotToTms2000', () => {
      for (const tms2000 of [0, 1, 47, 48, 95, 96, 1_000_000, -1, -48, -49]) {
        expect(
          dayAndSlotToTms2000(tms2000ToDay(tms2000), tms2000ToSlot(tms2000)),
        ).toBe(tms2000);
      }
    });

    it('agrees with a real bucket timestamp', () => {
      // 2026-08-09 23:30 UTC is the last bucket of a UTC day, so it has to be
      // slot 47
      const epoch = Date.UTC(2000, 1, 1);
      const tms2000 = (Date.UTC(2026, 7, 9, 23, 30) - epoch) / (1000 * 60 * 30);
      expect(tms2000ToSlot(tms2000)).toBe(47);
      expect(tms2000ToSlot(tms2000 + 1)).toBe(0);
    });
  });

  describe('first and last bucket of a day', () => {
    it('spans exactly one day', () => {
      expect(dayAndSlotToTms2000(0, 0)).toBe(0);
      expect(dayToLastTms2000(0)).toBe(47);
      expect(dayAndSlotToTms2000(1, 0)).toBe(48);
      expect(dayToLastTms2000(1)).toBe(95);
      expect(dayToLastTms2000(7) - dayAndSlotToTms2000(7, 0)).toBe(
        SLOTS_PER_DAY - 1,
      );
    });

    it('is the inverse of tms2000ToDay at both edges', () => {
      for (const day of [0, 1, 42, 9500, -1, -9181]) {
        expect(tms2000ToDay(dayAndSlotToTms2000(day, 0))).toBe(day);
        expect(tms2000ToDay(dayToLastTms2000(day))).toBe(day);
        expect(tms2000ToSlot(dayAndSlotToTms2000(day, 0))).toBe(0);
        expect(tms2000ToSlot(dayToLastTms2000(day))).toBe(47);
      }
    });
  });

  describe('emptySlots', () => {
    it('is 48 nulls', () => {
      const slots = emptySlots();
      expect(slots).toHaveLength(SLOTS_PER_DAY);
      expect(slots.every((slot) => slot === null)).toBe(true);
    });

    it('returns a fresh array each call', () => {
      const a = emptySlots();
      a[0] = 1;
      expect(emptySlots()[0]).toBeNull();
    });
  });

  describe('groupIntoDays', () => {
    it('returns nothing for no entries', () => {
      expect(groupIntoDays([])).toEqual([]);
    });

    it('puts a single value in the right slot and nulls the rest', () => {
      const [{ day, slots }] = groupIntoDays([[100, 7]]);

      expect(day).toBe(2);
      expect(slots).toHaveLength(SLOTS_PER_DAY);
      expect(slots[4]).toBe(7);
      expect(slots.filter((slot) => slot !== null)).toEqual([7]);
    });

    it('fills a complete day in slot order', () => {
      const entries = Array.from(
        { length: SLOTS_PER_DAY },
        (_, slot): [number, number] => [
          dayAndSlotToTms2000(3, slot),
          slot * 10,
        ],
      );

      const days = groupIntoDays(entries);

      expect(days).toHaveLength(1);
      expect(days[0].day).toBe(3);
      expect(days[0].slots).toEqual(entries.map(([, value]) => value));
    });

    it('is independent of the input order', () => {
      const ascending = groupIntoDays([
        [48, 1],
        [49, 2],
        [50, 3],
      ]);
      const shuffled = groupIntoDays([
        [50, 3],
        [48, 1],
        [49, 2],
      ]);

      expect(shuffled).toEqual(ascending);
    });

    it('splits a record that runs across a day boundary', () => {
      // Slots 46 and 47 of day 5, then slots 0 and 1 of day 6.
      const days = groupIntoDays([
        [5 * SLOTS_PER_DAY + 46, 1],
        [5 * SLOTS_PER_DAY + 47, 2],
        [6 * SLOTS_PER_DAY + 0, 3],
        [6 * SLOTS_PER_DAY + 1, 4],
      ]);

      expect(days.map(({ day }) => day)).toEqual([5, 6]);
      expect(days[0].slots[46]).toBe(1);
      expect(days[0].slots[47]).toBe(2);
      expect(days[0].slots[0]).toBeNull();
      expect(days[1].slots[0]).toBe(3);
      expect(days[1].slots[1]).toBe(4);
      expect(days[1].slots[47]).toBeNull();
    });

    it('leaves gaps in the middle of a day as null', () => {
      const [{ slots }] = groupIntoDays([
        [dayAndSlotToTms2000(9, 0), 1],
        [dayAndSlotToTms2000(9, 1), 2],
        // slots 2..45 are missing
        [dayAndSlotToTms2000(9, 46), 3],
        [dayAndSlotToTms2000(9, 47), 4],
      ]);

      expect(slots[1]).toBe(2);
      expect(slots[2]).toBeNull();
      expect(slots[45]).toBeNull();
      expect(slots[46]).toBe(3);
      expect(slots.filter((slot) => slot !== null)).toEqual([1, 2, 3, 4]);
    });

    it('keeps the NaN ignored marker distinguishable from a missing bucket', () => {
      // 'ignored' arrives as NaN and must stay distinguishable from null
      const [{ slots }] = groupIntoDays([
        [dayAndSlotToTms2000(1, 0), 5],
        [dayAndSlotToTms2000(1, 1), NaN],
      ]);

      expect(slots[0]).toBe(5);
      expect(Number.isNaN(slots[1])).toBe(true);
      expect(slots[2]).toBeNull();
    });

    it('sorts days ascending even when the input is not', () => {
      const days = groupIntoDays([
        [dayAndSlotToTms2000(12, 0), 1],
        [dayAndSlotToTms2000(10, 0), 2],
        [dayAndSlotToTms2000(11, 0), 3],
      ]);

      expect(days.map(({ day }) => day)).toEqual([10, 11, 12]);
    });

    it('groups negative tms2000 without corrupting slots', () => {
      const days = groupIntoDays([
        [-440642, 1],
        [-1, 2],
      ]);

      expect(days.map(({ day }) => day)).toEqual([-9181, -1]);
      expect(days[0].slots[46]).toBe(1);
      expect(days[1].slots[47]).toBe(2);
    });

    it('lets a later entry win for a duplicated bucket', () => {
      const [{ slots }] = groupIntoDays([
        [5, 1],
        [5, 2],
      ]);

      expect(slots[5]).toBe(2);
    });
  });
});
