import { describe, it, expect } from 'vitest';
import { calculateNextOccurrence, formatScheduleDescription } from '../utils/schedule';
import type { ScheduleConfig } from '../types';

// Helper to build a minimal schedule config
function makeSchedule(
  overrides: Partial<ScheduleConfig> & { type: ScheduleConfig['type'] },
): ScheduleConfig {
  return {
    startDate: '2026-03-23T00:00:00.000Z',
    timeOfDay: '09:00',
    timezone: 'UTC',
    ...overrides,
  };
}

describe('calculateNextOccurrence', () => {
  // ── once ──────────────────────────────────────────────────────────
  describe('once', () => {
    it('returns the scheduled time when it is in the future', () => {
      const schedule = makeSchedule({
        type: 'once',
        startDate: '2026-06-15T00:00:00.000Z',
        timeOfDay: '10:30',
      });
      const after = new Date('2026-03-23T00:00:00.000Z');
      const result = calculateNextOccurrence(schedule, after);
      expect(result).not.toBeNull();
      expect(result!.getHours()).toBe(10);
      expect(result!.getMinutes()).toBe(30);
    });

    it('returns null when the scheduled time is in the past', () => {
      const schedule = makeSchedule({
        type: 'once',
        startDate: '2025-01-01T00:00:00.000Z',
        timeOfDay: '08:00',
      });
      const after = new Date('2026-03-23T12:00:00.000Z');
      const result = calculateNextOccurrence(schedule, after);
      expect(result).toBeNull();
    });
  });

  // ── hourly ────────────────────────────────────────────────────────
  describe('hourly', () => {
    it('returns the next hour when interval is 1', () => {
      // Use a fixed local-time start and after to avoid timezone drift
      const start = new Date(2026, 2, 23, 0, 0, 0); // Mar 23 00:00 local
      const schedule = makeSchedule({
        type: 'hourly',
        interval: 1,
        startDate: start.toISOString(),
        timeOfDay: '00:00',
      });
      const after = new Date(2026, 2, 23, 2, 30, 0); // 02:30 local
      const result = calculateNextOccurrence(schedule, after);
      expect(result).not.toBeNull();
      // Next hourly slot after 02:30 is 03:00 local
      expect(result!.getHours()).toBe(3);
      expect(result!.getMinutes()).toBe(0);
    });

    it('respects interval of 3 hours', () => {
      const start = new Date(2026, 2, 23, 0, 0, 0); // Mar 23 00:00 local
      const schedule = makeSchedule({
        type: 'hourly',
        interval: 3,
        startDate: start.toISOString(),
        timeOfDay: '00:00',
      });
      const after = new Date(2026, 2, 23, 2, 0, 0); // 02:00 local
      const result = calculateNextOccurrence(schedule, after);
      expect(result).not.toBeNull();
      // 00:00 + 3h = 03:00 local
      expect(result!.getHours()).toBe(3);
      expect(result!.getMinutes()).toBe(0);
    });

    it('returns correct next occurrence when after is well past start', () => {
      const start = new Date(2026, 2, 20, 0, 0, 0); // Mar 20 00:00 local
      const schedule = makeSchedule({
        type: 'hourly',
        interval: 3,
        startDate: start.toISOString(),
        timeOfDay: '06:00',
      });
      const after = new Date(2026, 2, 23, 10, 0, 0); // 10:00 local
      const result = calculateNextOccurrence(schedule, after);
      expect(result).not.toBeNull();
      // 06:00, 09:00, 12:00 — next after 10:00 is 12:00 local
      expect(result!.getHours()).toBe(12);
    });
  });

  // ── twice_daily ───────────────────────────────────────────────────
  describe('twice_daily', () => {
    it('returns the first time if before first slot', () => {
      const schedule = makeSchedule({
        type: 'twice_daily',
        timeOfDay: '08:00',
        secondTimeOfDay: '20:00',
        startDate: '2026-03-23T00:00:00.000Z',
      });
      const after = new Date('2026-03-23T05:00:00.000Z');
      const result = calculateNextOccurrence(schedule, after);
      expect(result).not.toBeNull();
      expect(result!.getHours()).toBe(8);
    });

    it('returns the second time if after first slot', () => {
      const schedule = makeSchedule({
        type: 'twice_daily',
        timeOfDay: '08:00',
        secondTimeOfDay: '20:00',
        startDate: '2026-03-23T00:00:00.000Z',
      });
      const after = new Date('2026-03-23T12:00:00.000Z');
      const result = calculateNextOccurrence(schedule, after);
      expect(result).not.toBeNull();
      expect(result!.getHours()).toBe(20);
    });

    it('returns next day first slot if after both slots', () => {
      const schedule = makeSchedule({
        type: 'twice_daily',
        timeOfDay: '08:00',
        secondTimeOfDay: '20:00',
        startDate: '2026-03-23T00:00:00.000Z',
      });
      const after = new Date('2026-03-23T22:00:00.000Z');
      const result = calculateNextOccurrence(schedule, after);
      expect(result).not.toBeNull();
      expect(result!.getDate()).toBe(24);
      expect(result!.getHours()).toBe(8);
    });
  });

  // ── daily ─────────────────────────────────────────────────────────
  describe('daily', () => {
    it('returns tomorrow at the given time when interval is 1 and today has passed', () => {
      const schedule = makeSchedule({
        type: 'daily',
        interval: 1,
        startDate: '2026-03-20T00:00:00.000Z',
        timeOfDay: '09:00',
      });
      const after = new Date('2026-03-23T10:00:00.000Z');
      const result = calculateNextOccurrence(schedule, after);
      expect(result).not.toBeNull();
      expect(result!.getDate()).toBe(24);
      expect(result!.getHours()).toBe(9);
    });

    it('respects interval of 2 days', () => {
      const schedule = makeSchedule({
        type: 'daily',
        interval: 2,
        startDate: '2026-03-22T00:00:00.000Z',
        timeOfDay: '09:00',
      });
      // Start=Mar 22, so occurrences are Mar 22, Mar 24, Mar 26 ...
      const after = new Date('2026-03-22T10:00:00.000Z');
      const result = calculateNextOccurrence(schedule, after);
      expect(result).not.toBeNull();
      expect(result!.getDate()).toBe(24);
    });

    it('returns start date time if after is before start', () => {
      const schedule = makeSchedule({
        type: 'daily',
        interval: 1,
        startDate: '2026-04-01T00:00:00.000Z',
        timeOfDay: '09:00',
      });
      const after = new Date('2026-03-23T10:00:00.000Z');
      const result = calculateNextOccurrence(schedule, after);
      expect(result).not.toBeNull();
      expect(result!.getMonth()).toBe(3); // April
      expect(result!.getDate()).toBe(1);
    });
  });

  // ── weekly ────────────────────────────────────────────────────────
  describe('weekly', () => {
    it('returns the next matching day for a single day', () => {
      const schedule = makeSchedule({
        type: 'weekly',
        daysOfWeek: [1], // Monday
        timeOfDay: '09:00',
      });
      // 2026-03-23 is a Monday
      const after = new Date('2026-03-23T10:00:00.000Z'); // past 09:00 on Monday
      const result = calculateNextOccurrence(schedule, after);
      expect(result).not.toBeNull();
      expect(result!.getDay()).toBe(1); // Monday
      expect(result!.getDate()).toBe(30); // next Monday
    });

    it('returns the earliest matching day for multiple days', () => {
      const schedule = makeSchedule({
        type: 'weekly',
        daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
        timeOfDay: '09:00',
      });
      // Tuesday March 24, before 09:00
      const after = new Date('2026-03-24T07:00:00.000Z');
      const result = calculateNextOccurrence(schedule, after);
      expect(result).not.toBeNull();
      expect(result!.getDay()).toBe(3); // Wednesday
    });

    it('returns null when daysOfWeek is empty', () => {
      const schedule = makeSchedule({
        type: 'weekly',
        daysOfWeek: [],
        timeOfDay: '09:00',
      });
      const result = calculateNextOccurrence(schedule, new Date('2026-03-23T00:00:00.000Z'));
      expect(result).toBeNull();
    });
  });

  // ── monthly_date ──────────────────────────────────────────────────
  describe('monthly_date', () => {
    it('returns the specific day of the current month if not yet passed', () => {
      const schedule = makeSchedule({
        type: 'monthly_date',
        dayOfMonth: 25,
        timeOfDay: '09:00',
      });
      const after = new Date('2026-03-23T00:00:00.000Z');
      const result = calculateNextOccurrence(schedule, after);
      expect(result).not.toBeNull();
      expect(result!.getMonth()).toBe(2); // March
      expect(result!.getDate()).toBe(25);
    });

    it('returns next month when the day has already passed', () => {
      const schedule = makeSchedule({
        type: 'monthly_date',
        dayOfMonth: 15,
        timeOfDay: '09:00',
      });
      const after = new Date('2026-03-23T00:00:00.000Z');
      const result = calculateNextOccurrence(schedule, after);
      expect(result).not.toBeNull();
      expect(result!.getMonth()).toBe(3); // April
      expect(result!.getDate()).toBe(15);
    });

    it('handles dayOfMonth=-1 (last day of month)', () => {
      const schedule = makeSchedule({
        type: 'monthly_date',
        dayOfMonth: -1,
        timeOfDay: '09:00',
      });
      const after = new Date('2026-03-23T00:00:00.000Z');
      const result = calculateNextOccurrence(schedule, after);
      expect(result).not.toBeNull();
      expect(result!.getMonth()).toBe(2); // March
      expect(result!.getDate()).toBe(31); // March has 31 days
    });

    it('clamps dayOfMonth to actual days in month (e.g., Feb 31 -> Feb 28)', () => {
      const schedule = makeSchedule({
        type: 'monthly_date',
        dayOfMonth: 31,
        timeOfDay: '09:00',
      });
      const after = new Date('2026-01-31T10:00:00.000Z');
      const result = calculateNextOccurrence(schedule, after);
      expect(result).not.toBeNull();
      // Feb 2026 has 28 days
      expect(result!.getMonth()).toBe(1); // February
      expect(result!.getDate()).toBe(28);
    });
  });

  // ── monthly_weekday ───────────────────────────────────────────────
  describe('monthly_weekday', () => {
    it('calculates the first Monday of a month', () => {
      const schedule = makeSchedule({
        type: 'monthly_weekday',
        weekOfMonth: 1,
        daysOfWeek: [1], // Monday
        timeOfDay: '09:00',
      });
      // After March 23 2026, the first Monday of April is April 6
      const after = new Date('2026-03-23T10:00:00.000Z');
      const result = calculateNextOccurrence(schedule, after);
      expect(result).not.toBeNull();
      expect(result!.getDay()).toBe(1); // Monday
      expect(result!.getDate()).toBeLessThanOrEqual(7); // first week
    });

    it('calculates the last Friday of a month (weekOfMonth=-1)', () => {
      const schedule = makeSchedule({
        type: 'monthly_weekday',
        weekOfMonth: -1,
        daysOfWeek: [5], // Friday
        timeOfDay: '09:00',
      });
      const after = new Date('2026-03-23T00:00:00.000Z');
      const result = calculateNextOccurrence(schedule, after);
      expect(result).not.toBeNull();
      expect(result!.getDay()).toBe(5); // Friday
      // Last Friday of March 2026 is March 27
      expect(result!.getDate()).toBe(27);
    });

    it('moves to next month when target weekday has passed', () => {
      const schedule = makeSchedule({
        type: 'monthly_weekday',
        weekOfMonth: 1,
        daysOfWeek: [1], // Monday
        timeOfDay: '09:00',
      });
      // After first Monday of March has passed (March 2)
      const after = new Date('2026-03-10T10:00:00.000Z');
      const result = calculateNextOccurrence(schedule, after);
      expect(result).not.toBeNull();
      // April 2026: first Monday is April 6
      expect(result!.getMonth()).toBe(3); // April
      expect(result!.getDate()).toBe(6);
    });
  });

  // ── yearly ────────────────────────────────────────────────────────
  describe('yearly', () => {
    it('returns the anniversary date in the same year if not yet passed', () => {
      const schedule = makeSchedule({
        type: 'yearly',
        startDate: '2025-12-25T00:00:00.000Z',
        timeOfDay: '09:00',
      });
      const after = new Date('2026-03-23T00:00:00.000Z');
      const result = calculateNextOccurrence(schedule, after);
      expect(result).not.toBeNull();
      expect(result!.getMonth()).toBe(11); // December
      expect(result!.getDate()).toBe(25);
    });

    it('returns next year if this year has already passed', () => {
      const schedule = makeSchedule({
        type: 'yearly',
        startDate: '2025-01-15T00:00:00.000Z',
        timeOfDay: '09:00',
      });
      const after = new Date('2026-03-23T00:00:00.000Z');
      const result = calculateNextOccurrence(schedule, after);
      expect(result).not.toBeNull();
      expect(result!.getFullYear()).toBe(2027);
      expect(result!.getMonth()).toBe(0); // January
      expect(result!.getDate()).toBe(15);
    });
  });

  // ── endDate handling ──────────────────────────────────────────────
  describe('endDate handling', () => {
    it('returns null when next occurrence would be past endDate', () => {
      const schedule = makeSchedule({
        type: 'daily',
        interval: 1,
        startDate: '2026-03-20T00:00:00.000Z',
        timeOfDay: '09:00',
        endDate: '2026-03-23T23:59:59.000Z',
      });
      const after = new Date('2026-03-23T10:00:00.000Z');
      const result = calculateNextOccurrence(schedule, after);
      expect(result).toBeNull();
    });

    it('returns the occurrence when it is before endDate', () => {
      const schedule = makeSchedule({
        type: 'daily',
        interval: 1,
        startDate: '2026-03-20T00:00:00.000Z',
        timeOfDay: '09:00',
        endDate: '2026-03-25T23:59:59.000Z',
      });
      const after = new Date('2026-03-23T10:00:00.000Z');
      const result = calculateNextOccurrence(schedule, after);
      expect(result).not.toBeNull();
      expect(result!.getDate()).toBe(24);
    });

    it('returns null for weekly schedule past endDate', () => {
      const schedule = makeSchedule({
        type: 'weekly',
        daysOfWeek: [1], // Monday
        timeOfDay: '09:00',
        endDate: '2026-03-24T00:00:00.000Z',
      });
      const after = new Date('2026-03-23T10:00:00.000Z');
      // Next Monday is March 30, which is past endDate
      const result = calculateNextOccurrence(schedule, after);
      expect(result).toBeNull();
    });
  });

  // ── cron (unsupported) ────────────────────────────────────────────
  describe('cron', () => {
    it('returns null for cron schedules', () => {
      const schedule = makeSchedule({
        type: 'cron',
        cronExpression: '0 9 * * *',
      });
      const result = calculateNextOccurrence(schedule, new Date());
      expect(result).toBeNull();
    });
  });
});

describe('formatScheduleDescription', () => {
  it('formats once schedule', () => {
    const schedule = makeSchedule({
      type: 'once',
      startDate: '2026-06-15T00:00:00.000Z',
      timeOfDay: '10:30',
    });
    const desc = formatScheduleDescription(schedule);
    expect(desc).toContain('Once on');
    expect(desc).toContain('10:30 AM');
  });

  it('formats hourly interval=1', () => {
    const schedule = makeSchedule({ type: 'hourly', interval: 1, timeOfDay: '09:00' });
    expect(formatScheduleDescription(schedule)).toBe('Every hour starting at 9:00 AM');
  });

  it('formats hourly interval>1', () => {
    const schedule = makeSchedule({ type: 'hourly', interval: 3, timeOfDay: '09:00' });
    expect(formatScheduleDescription(schedule)).toBe('Every 3 hours starting at 9:00 AM');
  });

  it('formats twice_daily', () => {
    const schedule = makeSchedule({
      type: 'twice_daily',
      timeOfDay: '08:00',
      secondTimeOfDay: '20:00',
    });
    expect(formatScheduleDescription(schedule)).toBe('Twice daily at 8:00 AM and 8:00 PM');
  });

  it('formats daily interval=1', () => {
    const schedule = makeSchedule({ type: 'daily', interval: 1, timeOfDay: '09:00' });
    expect(formatScheduleDescription(schedule)).toBe('Daily at 9:00 AM');
  });

  it('formats daily interval>1', () => {
    const schedule = makeSchedule({ type: 'daily', interval: 2, timeOfDay: '09:00' });
    expect(formatScheduleDescription(schedule)).toBe('Every 2 days at 9:00 AM');
  });

  it('formats weekly with days', () => {
    const schedule = makeSchedule({
      type: 'weekly',
      daysOfWeek: [1, 3, 5],
      timeOfDay: '09:00',
    });
    expect(formatScheduleDescription(schedule)).toBe('Every Monday, Wednesday, Friday at 9:00 AM');
  });

  it('formats monthly_date with specific day', () => {
    const schedule = makeSchedule({ type: 'monthly_date', dayOfMonth: 15, timeOfDay: '09:00' });
    expect(formatScheduleDescription(schedule)).toBe('Monthly on the 15th at 9:00 AM');
  });

  it('formats monthly_date with last day', () => {
    const schedule = makeSchedule({ type: 'monthly_date', dayOfMonth: -1, timeOfDay: '09:00' });
    expect(formatScheduleDescription(schedule)).toBe('Monthly on the last day at 9:00 AM');
  });

  it('formats monthly_weekday', () => {
    const schedule = makeSchedule({
      type: 'monthly_weekday',
      weekOfMonth: 1,
      daysOfWeek: [1],
      timeOfDay: '09:00',
    });
    expect(formatScheduleDescription(schedule)).toBe('Monthly on the 1st Monday at 9:00 AM');
  });

  it('formats monthly_weekday with last week', () => {
    const schedule = makeSchedule({
      type: 'monthly_weekday',
      weekOfMonth: -1,
      daysOfWeek: [5],
      timeOfDay: '09:00',
    });
    expect(formatScheduleDescription(schedule)).toBe('Monthly on the Last Friday at 9:00 AM');
  });

  it('formats yearly', () => {
    const schedule = makeSchedule({
      type: 'yearly',
      startDate: '2026-12-25T00:00:00.000Z',
      timeOfDay: '09:00',
    });
    const desc = formatScheduleDescription(schedule);
    expect(desc).toContain('Yearly on');
    expect(desc).toContain('December');
    expect(desc).toContain('9:00 AM');
  });

  it('formats cron', () => {
    const schedule = makeSchedule({
      type: 'cron',
      cronExpression: '0 9 * * *',
    });
    expect(formatScheduleDescription(schedule)).toBe('Cron: 0 9 * * *');
  });

  it('formats PM times correctly', () => {
    const schedule = makeSchedule({ type: 'daily', interval: 1, timeOfDay: '14:30' });
    expect(formatScheduleDescription(schedule)).toBe('Daily at 2:30 PM');
  });

  it('formats 12:00 as 12:00 PM', () => {
    const schedule = makeSchedule({ type: 'daily', interval: 1, timeOfDay: '12:00' });
    expect(formatScheduleDescription(schedule)).toBe('Daily at 12:00 PM');
  });

  it('formats 00:00 as 12:00 AM', () => {
    const schedule = makeSchedule({ type: 'daily', interval: 1, timeOfDay: '00:00' });
    expect(formatScheduleDescription(schedule)).toBe('Daily at 12:00 AM');
  });
});
