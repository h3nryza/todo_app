import { describe, it, expect } from 'vitest';
import { createReminderSchema, scheduleConfigSchema } from '../schemas/reminder.schema';
import { createCategorySchema } from '../schemas/category.schema';

// Helper: valid base schedule for use in reminder tests
function validSchedule(overrides: Record<string, unknown> = {}) {
  return {
    type: 'daily',
    startDate: '2026-03-23T00:00:00.000Z',
    timeOfDay: '09:00',
    timezone: 'America/New_York',
    interval: 1,
    ...overrides,
  };
}

describe('scheduleConfigSchema', () => {
  it('accepts a valid daily schedule', () => {
    const result = scheduleConfigSchema.safeParse(validSchedule());
    expect(result.success).toBe(true);
  });

  it('accepts a valid once schedule', () => {
    const result = scheduleConfigSchema.safeParse(validSchedule({ type: 'once' }));
    expect(result.success).toBe(true);
  });

  it('accepts a valid hourly schedule', () => {
    const result = scheduleConfigSchema.safeParse(validSchedule({ type: 'hourly', interval: 2 }));
    expect(result.success).toBe(true);
  });

  it('accepts a valid weekly schedule with daysOfWeek', () => {
    const result = scheduleConfigSchema.safeParse(
      validSchedule({ type: 'weekly', daysOfWeek: [1, 3, 5] }),
    );
    expect(result.success).toBe(true);
  });

  it('rejects weekly schedule without daysOfWeek', () => {
    const result = scheduleConfigSchema.safeParse(validSchedule({ type: 'weekly' }));
    expect(result.success).toBe(false);
  });

  it('accepts a valid monthly_date schedule', () => {
    const result = scheduleConfigSchema.safeParse(
      validSchedule({ type: 'monthly_date', dayOfMonth: 15 }),
    );
    expect(result.success).toBe(true);
  });

  it('rejects monthly_date schedule without dayOfMonth', () => {
    const result = scheduleConfigSchema.safeParse(validSchedule({ type: 'monthly_date' }));
    expect(result.success).toBe(false);
  });

  it('accepts dayOfMonth=-1 for last day of month', () => {
    const result = scheduleConfigSchema.safeParse(
      validSchedule({ type: 'monthly_date', dayOfMonth: -1 }),
    );
    expect(result.success).toBe(true);
  });

  it('accepts a valid monthly_weekday schedule', () => {
    const result = scheduleConfigSchema.safeParse(
      validSchedule({ type: 'monthly_weekday', weekOfMonth: 1, daysOfWeek: [1] }),
    );
    expect(result.success).toBe(true);
  });

  it('rejects monthly_weekday without weekOfMonth', () => {
    const result = scheduleConfigSchema.safeParse(
      validSchedule({ type: 'monthly_weekday', daysOfWeek: [1] }),
    );
    expect(result.success).toBe(false);
  });

  it('rejects monthly_weekday with more than one day', () => {
    const result = scheduleConfigSchema.safeParse(
      validSchedule({ type: 'monthly_weekday', weekOfMonth: 1, daysOfWeek: [1, 3] }),
    );
    expect(result.success).toBe(false);
  });

  it('accepts yearly schedule', () => {
    const result = scheduleConfigSchema.safeParse(validSchedule({ type: 'yearly' }));
    expect(result.success).toBe(true);
  });

  it('accepts cron schedule with cronExpression', () => {
    const result = scheduleConfigSchema.safeParse(
      validSchedule({ type: 'cron', cronExpression: '0 9 * * *' }),
    );
    expect(result.success).toBe(true);
  });

  it('rejects cron schedule without cronExpression', () => {
    const result = scheduleConfigSchema.safeParse(validSchedule({ type: 'cron' }));
    expect(result.success).toBe(false);
  });

  it('requires twice_daily to have secondTimeOfDay', () => {
    const result = scheduleConfigSchema.safeParse(validSchedule({ type: 'twice_daily' }));
    expect(result.success).toBe(false);
  });

  it('accepts twice_daily with secondTimeOfDay', () => {
    const result = scheduleConfigSchema.safeParse(
      validSchedule({ type: 'twice_daily', secondTimeOfDay: '18:00' }),
    );
    expect(result.success).toBe(true);
  });

  it('rejects invalid timeOfDay format', () => {
    const result = scheduleConfigSchema.safeParse(validSchedule({ timeOfDay: '9:00' }));
    expect(result.success).toBe(false);
  });

  it('rejects invalid startDate format', () => {
    const result = scheduleConfigSchema.safeParse(validSchedule({ startDate: 'not-a-date' }));
    expect(result.success).toBe(false);
  });

  it('accepts optional endDate', () => {
    const result = scheduleConfigSchema.safeParse(
      validSchedule({ endDate: '2026-12-31T23:59:59.000Z' }),
    );
    expect(result.success).toBe(true);
  });

  it('rejects empty timezone', () => {
    const result = scheduleConfigSchema.safeParse(validSchedule({ timezone: '' }));
    expect(result.success).toBe(false);
  });

  it('rejects invalid schedule type', () => {
    const result = scheduleConfigSchema.safeParse(validSchedule({ type: 'biweekly' }));
    expect(result.success).toBe(false);
  });
});

describe('createReminderSchema', () => {
  function validReminder(overrides: Record<string, unknown> = {}) {
    return {
      name: 'Take medication',
      schedule: validSchedule(),
      priority: 'medium',
      ...overrides,
    };
  }

  it('accepts a valid reminder', () => {
    const result = createReminderSchema.safeParse(validReminder());
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = createReminderSchema.safeParse(validReminder({ name: '' }));
    expect(result.success).toBe(false);
  });

  it('rejects name longer than 200 characters', () => {
    const result = createReminderSchema.safeParse(validReminder({ name: 'a'.repeat(201) }));
    expect(result.success).toBe(false);
  });

  it('accepts optional description', () => {
    const result = createReminderSchema.safeParse(validReminder({ description: 'Take with food' }));
    expect(result.success).toBe(true);
  });

  it('rejects description longer than 2000 characters', () => {
    const result = createReminderSchema.safeParse(validReminder({ description: 'a'.repeat(2001) }));
    expect(result.success).toBe(false);
  });

  it('accepts optional categoryId as valid UUID', () => {
    const result = createReminderSchema.safeParse(
      validReminder({ categoryId: '550e8400-e29b-41d4-a716-446655440000' }),
    );
    expect(result.success).toBe(true);
  });

  it('rejects categoryId that is not a valid UUID', () => {
    const result = createReminderSchema.safeParse(validReminder({ categoryId: 'not-a-uuid' }));
    expect(result.success).toBe(false);
  });

  it('accepts when categoryId is omitted', () => {
    const input = validReminder();
    // categoryId not present at all
    const result = createReminderSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('accepts priority=high', () => {
    const result = createReminderSchema.safeParse(validReminder({ priority: 'high' }));
    expect(result.success).toBe(true);
  });

  it('accepts priority=medium', () => {
    const result = createReminderSchema.safeParse(validReminder({ priority: 'medium' }));
    expect(result.success).toBe(true);
  });

  it('accepts priority=low', () => {
    const result = createReminderSchema.safeParse(validReminder({ priority: 'low' }));
    expect(result.success).toBe(true);
  });

  it('accepts priority=info', () => {
    const result = createReminderSchema.safeParse(validReminder({ priority: 'info' }));
    expect(result.success).toBe(true);
  });

  it('rejects invalid priority value', () => {
    const result = createReminderSchema.safeParse(validReminder({ priority: 'urgent' }));
    expect(result.success).toBe(false);
  });

  it('defaults priority to medium when omitted', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { priority: _omitted, ...input } = validReminder();
    const result = createReminderSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe('medium');
    }
  });

  it('accepts optional notes', () => {
    const result = createReminderSchema.safeParse(validReminder({ notes: 'Remember to log it' }));
    expect(result.success).toBe(true);
  });
});

describe('createCategorySchema', () => {
  function validCategory(overrides: Record<string, unknown> = {}) {
    return {
      name: 'Health',
      color: '#FF5733',
      icon: 'heart',
      ...overrides,
    };
  }

  it('accepts a valid category', () => {
    const result = createCategorySchema.safeParse(validCategory());
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = createCategorySchema.safeParse(validCategory({ name: '' }));
    expect(result.success).toBe(false);
  });

  it('rejects name longer than 50 characters', () => {
    const result = createCategorySchema.safeParse(validCategory({ name: 'a'.repeat(51) }));
    expect(result.success).toBe(false);
  });

  it('rejects invalid hex color', () => {
    const result = createCategorySchema.safeParse(validCategory({ color: 'red' }));
    expect(result.success).toBe(false);
  });

  it('rejects hex color without hash', () => {
    const result = createCategorySchema.safeParse(validCategory({ color: 'FF5733' }));
    expect(result.success).toBe(false);
  });

  it('accepts lowercase hex color', () => {
    const result = createCategorySchema.safeParse(validCategory({ color: '#ff5733' }));
    expect(result.success).toBe(true);
  });

  it('rejects empty icon', () => {
    const result = createCategorySchema.safeParse(validCategory({ icon: '' }));
    expect(result.success).toBe(false);
  });
});
