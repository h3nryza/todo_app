import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatRelativeTime } from '../utils/date';
import { isOverdue } from '../utils/schedule';

describe('formatRelativeTime', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns "just now" for times within the last minute', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-03-23T12:00:00.000Z').getTime());
    const date = new Date('2026-03-23T11:59:30.000Z');
    expect(formatRelativeTime(date)).toBe('just now');
  });

  it('returns "just now" for times within the next minute', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-03-23T12:00:00.000Z').getTime());
    const date = new Date('2026-03-23T12:00:30.000Z');
    expect(formatRelativeTime(date)).toBe('just now');
  });

  it('returns "X minutes ago" for past times', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-03-23T12:00:00.000Z').getTime());
    const date = new Date('2026-03-23T11:45:00.000Z');
    expect(formatRelativeTime(date)).toBe('15 minutes ago');
  });

  it('returns "in X minutes" for future times', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-03-23T12:00:00.000Z').getTime());
    const date = new Date('2026-03-23T12:10:00.000Z');
    expect(formatRelativeTime(date)).toBe('in 10 minutes');
  });

  it('returns "1 hour ago" for 1 hour in the past', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-03-23T12:00:00.000Z').getTime());
    const date = new Date('2026-03-23T11:00:00.000Z');
    expect(formatRelativeTime(date)).toBe('1 hour ago');
  });

  it('returns "in 2 hours" for 2 hours in the future', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-03-23T12:00:00.000Z').getTime());
    const date = new Date('2026-03-23T14:00:00.000Z');
    expect(formatRelativeTime(date)).toBe('in 2 hours');
  });

  it('returns days for multi-day differences', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-03-23T12:00:00.000Z').getTime());
    const date = new Date('2026-03-20T12:00:00.000Z');
    expect(formatRelativeTime(date)).toBe('3 days ago');
  });

  it('returns weeks for multi-week differences', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-03-23T12:00:00.000Z').getTime());
    const date = new Date('2026-03-02T12:00:00.000Z');
    expect(formatRelativeTime(date)).toBe('3 weeks ago');
  });

  it('returns months for multi-month differences', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-03-23T12:00:00.000Z').getTime());
    const date = new Date('2025-12-23T12:00:00.000Z');
    expect(formatRelativeTime(date)).toBe('3 months ago');
  });

  it('returns years for differences over a year', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-03-23T12:00:00.000Z').getTime());
    const date = new Date('2024-03-23T12:00:00.000Z');
    expect(formatRelativeTime(date)).toBe('2 years ago');
  });

  it('handles singular forms (1 day, 1 week, etc.)', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-03-23T12:00:00.000Z').getTime());
    const date = new Date('2026-03-22T12:00:00.000Z');
    expect(formatRelativeTime(date)).toBe('1 day ago');
  });

  it('accepts a string date input', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-03-23T12:00:00.000Z').getTime());
    expect(formatRelativeTime('2026-03-23T11:00:00.000Z')).toBe('1 hour ago');
  });
});

describe('isOverdue', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true when the trigger time is in the past', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-03-23T12:00:00.000Z').getTime());
    expect(isOverdue('2026-03-23T10:00:00.000Z')).toBe(true);
  });

  it('returns false when the trigger time is in the future', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-03-23T12:00:00.000Z').getTime());
    expect(isOverdue('2026-03-23T14:00:00.000Z')).toBe(false);
  });

  it('accepts a Date object', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-03-23T12:00:00.000Z').getTime());
    expect(isOverdue(new Date('2026-03-23T10:00:00.000Z'))).toBe(true);
  });

  it('returns false when the trigger time is exactly now', () => {
    const now = new Date('2026-03-23T12:00:00.000Z');
    vi.spyOn(Date, 'now').mockReturnValue(now.getTime());
    // At exactly the same millisecond, getTime() < Date.now() is false
    expect(isOverdue(now)).toBe(false);
  });
});
