import { z } from 'zod';

/**
 * Zod schema for schedule type enum.
 * Includes all supported recurrence patterns.
 */
const scheduleTypeSchema = z.enum([
  'once',
  'hourly',
  'twice_daily',
  'daily',
  'weekly',
  'monthly_date',
  'monthly_weekday',
  'yearly',
  'cron',
]);

/** HH:mm format validator */
const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:mm format');

/**
 * Schedule configuration schema with type-specific validation.
 *
 * dayOfMonth: 1-31 for specific day, -1 for "last day of month"
 * weekOfMonth: 1-5 for specific week, -1 for "last"
 * daysOfWeek: 0-6 for Sun-Sat, -1 for "any day", -2 for "weekday", -3 for "weekend day"
 */
export const scheduleConfigSchema = z
  .object({
    type: scheduleTypeSchema,
    interval: z.number().int().positive().optional(),
    daysOfWeek: z.array(z.number().int().min(-3).max(6)).min(1).optional(),
    dayOfMonth: z.number().int().min(-1).max(31).optional(),
    weekOfMonth: z.number().int().min(-1).max(5).optional(),
    cronExpression: z.string().optional(),
    startDate: z.string().datetime({ message: 'startDate must be a valid ISO 8601 date' }),
    endDate: z.string().datetime({ message: 'endDate must be a valid ISO 8601 date' }).optional(),
    timeOfDay: timeOfDaySchema,
    secondTimeOfDay: timeOfDaySchema.optional(),
    timezone: z.string().min(1, 'Timezone is required'),
  })
  .superRefine((data, ctx) => {
    // Weekly: at least one day of week required
    if (data.type === 'weekly' && (!data.daysOfWeek || data.daysOfWeek.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'daysOfWeek is required for weekly schedules',
        path: ['daysOfWeek'],
      });
    }

    // Monthly date: dayOfMonth required
    if (data.type === 'monthly_date' && data.dayOfMonth === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'dayOfMonth is required for monthly_date schedules',
        path: ['dayOfMonth'],
      });
    }

    // Monthly weekday: weekOfMonth + exactly one day required
    if (data.type === 'monthly_weekday') {
      if (data.weekOfMonth === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'weekOfMonth is required for monthly_weekday schedules',
          path: ['weekOfMonth'],
        });
      }
      if (!data.daysOfWeek || data.daysOfWeek.length !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Exactly one day of week is required for monthly_weekday schedules',
          path: ['daysOfWeek'],
        });
      }
    }

    // Cron: expression required
    if (data.type === 'cron' && !data.cronExpression) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'cronExpression is required for cron schedules',
        path: ['cronExpression'],
      });
    }

    // Interval validation for hourly/daily
    if (
      (data.type === 'hourly' || data.type === 'daily') &&
      data.interval !== undefined &&
      data.interval < 1
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'interval must be at least 1',
        path: ['interval'],
      });
    }

    // Twice daily: secondTimeOfDay should be provided
    if (data.type === 'twice_daily' && !data.secondTimeOfDay) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'secondTimeOfDay is required for twice_daily schedules',
        path: ['secondTimeOfDay'],
      });
    }
  });

const prioritySchema = z.enum(['high', 'medium', 'low', 'info']).default('medium');

export const createReminderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be at most 200 characters'),
  description: z.string().max(2000, 'Description must be at most 2000 characters').optional(),
  categoryId: z.string().uuid('categoryId must be a valid UUID').optional(),
  schedule: scheduleConfigSchema,
  priority: prioritySchema,
  notes: z.string().optional(),
});

export const updateReminderSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullish(),
  categoryId: z.string().uuid().optional(),
  schedule: scheduleConfigSchema.optional(),
  status: z.enum(['active', 'paused', 'completed', 'archived']).optional(),
  priority: z.enum(['high', 'medium', 'low', 'info']).optional(),
  notes: z.string().nullish(),
});

export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;
