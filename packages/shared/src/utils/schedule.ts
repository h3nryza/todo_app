import type { ScheduleConfig } from '../types';

/**
 * Parses a HH:mm time string into hours and minutes.
 * timeOfDay is always in the user's LOCAL time.
 */
function parseTimeOfDay(timeOfDay: string): { hours: number; minutes: number } {
  const [hoursStr, minutesStr] = timeOfDay.split(':');
  return {
    hours: parseInt(hoursStr!, 10),
    minutes: parseInt(minutesStr!, 10),
  };
}

/**
 * Sets LOCAL hours/minutes on a date.
 * We use local time throughout because timeOfDay is entered in local time.
 */
function setTimeOnDate(date: Date, hours: number, minutes: number): Date {
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/**
 * Adds a specified number of days to a date (local time).
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Checks if a candidate date is past the schedule's endDate.
 */
function isPastEndDate(candidate: Date, schedule: ScheduleConfig): boolean {
  if (!schedule.endDate) return false;
  return candidate > new Date(schedule.endDate);
}

/**
 * "once" — fires a single time on the start date at timeOfDay.
 */
function calculateOnce(schedule: ScheduleConfig, after: Date): Date | null {
  const start = new Date(schedule.startDate);
  const { hours, minutes } = parseTimeOfDay(schedule.timeOfDay);
  // Set local time on the start date
  const candidate = setTimeOnDate(start, hours, minutes);
  if (candidate > after) return candidate;
  return null;
}

/**
 * "hourly" — fires every N hours starting from startDate at timeOfDay.
 */
function calculateHourly(schedule: ScheduleConfig, after: Date): Date | null {
  const start = new Date(schedule.startDate);
  const { hours, minutes } = parseTimeOfDay(schedule.timeOfDay);
  const interval = schedule.interval ?? 1;

  let candidate = setTimeOnDate(start, hours, minutes);

  if (candidate <= after) {
    const diffMs = after.getTime() - candidate.getTime();
    const intervalMs = interval * 60 * 60 * 1000;
    const periodsPassed = Math.floor(diffMs / intervalMs);
    candidate = new Date(candidate.getTime() + periodsPassed * intervalMs);

    while (candidate <= after) {
      candidate = new Date(candidate.getTime() + intervalMs);
    }
  }

  if (isPastEndDate(candidate, schedule)) return null;
  return candidate;
}

/**
 * "twice_daily" — fires at timeOfDay and secondTimeOfDay every day.
 */
function calculateTwiceDaily(schedule: ScheduleConfig, after: Date): Date | null {
  const start = new Date(schedule.startDate);
  const time1 = parseTimeOfDay(schedule.timeOfDay);
  const time2 = parseTimeOfDay(schedule.secondTimeOfDay ?? '18:00');

  // Start from the later of startDate or after, at midnight local
  let day = new Date(Math.max(start.getTime(), after.getTime()));
  day.setHours(0, 0, 0, 0);

  for (let i = 0; i < 400; i++) {
    const candidate1 = new Date(day);
    candidate1.setHours(time1.hours, time1.minutes, 0, 0);
    if (candidate1 > after) {
      if (isPastEndDate(candidate1, schedule)) return null;
      return candidate1;
    }

    const candidate2 = new Date(day);
    candidate2.setHours(time2.hours, time2.minutes, 0, 0);
    if (candidate2 > after) {
      if (isPastEndDate(candidate2, schedule)) return null;
      return candidate2;
    }

    day = addDays(day, 1);
  }
  return null;
}

/**
 * "daily" — fires every N days at timeOfDay.
 */
function calculateDaily(schedule: ScheduleConfig, after: Date): Date | null {
  const start = new Date(schedule.startDate);
  const { hours, minutes } = parseTimeOfDay(schedule.timeOfDay);
  const interval = schedule.interval ?? 1;

  let candidate = setTimeOnDate(start, hours, minutes);

  if (candidate <= after) {
    const diffMs = after.getTime() - candidate.getTime();
    const intervalMs = interval * 24 * 60 * 60 * 1000;
    const periodsPassed = Math.floor(diffMs / intervalMs);
    candidate = new Date(candidate.getTime() + periodsPassed * intervalMs);

    while (candidate <= after) {
      candidate = new Date(candidate.getTime() + intervalMs);
    }
  }

  if (isPastEndDate(candidate, schedule)) return null;
  return candidate;
}

/**
 * "weekly" — fires on selected days of the week at timeOfDay.
 * Uses local getDay() so day selection matches the user's calendar.
 */
function calculateWeekly(schedule: ScheduleConfig, after: Date): Date | null {
  const { hours, minutes } = parseTimeOfDay(schedule.timeOfDay);
  const daysOfWeek = schedule.daysOfWeek ?? [];
  if (daysOfWeek.length === 0) return null;

  const sortedDays = [...daysOfWeek].sort((a, b) => a - b);

  let candidate = new Date(after);
  candidate.setHours(hours, minutes, 0, 0);

  // If time already passed today, start from tomorrow
  if (candidate <= after) {
    candidate = addDays(candidate, 1);
  }

  // Search up to 8 days to find the next matching day of week
  for (let i = 0; i < 8; i++) {
    const dayOfWeek = candidate.getDay(); // local day
    if (sortedDays.includes(dayOfWeek)) {
      if (isPastEndDate(candidate, schedule)) return null;
      return candidate;
    }
    candidate = addDays(candidate, 1);
  }

  return null;
}

/**
 * "monthly_date" — fires on a specific day of every month.
 * dayOfMonth === -1 means "last day of month".
 */
function calculateMonthlyDate(schedule: ScheduleConfig, after: Date): Date | null {
  const { hours, minutes } = parseTimeOfDay(schedule.timeOfDay);
  const dayOfMonth = schedule.dayOfMonth ?? 1;

  let year = after.getFullYear();
  let month = after.getMonth();

  for (let i = 0; i < 13; i++) {
    // Days in this month (local)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const actualDay = dayOfMonth === -1 ? daysInMonth : Math.min(dayOfMonth, daysInMonth);

    const candidate = new Date(year, month, actualDay, hours, minutes, 0, 0);

    if (candidate > after) {
      if (isPastEndDate(candidate, schedule)) return null;
      return candidate;
    }

    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }

  return null;
}

/**
 * "monthly_weekday" — fires on the Nth weekday of every month.
 * E.g., "2nd Tuesday", "Last Friday", "First Day".
 */
function calculateMonthlyWeekday(schedule: ScheduleConfig, after: Date): Date | null {
  const { hours, minutes } = parseTimeOfDay(schedule.timeOfDay);
  const weekOfMonth = schedule.weekOfMonth ?? 1;
  const targetDayOfWeek = schedule.daysOfWeek?.[0] ?? 1;

  let year = after.getFullYear();
  let month = after.getMonth();

  for (let i = 0; i < 13; i++) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let targetDate: number;

    if (weekOfMonth === -1) {
      // "Last [weekday] of the month" — search backwards from the last day
      const lastDay = new Date(year, month, daysInMonth);
      const d = lastDay.getDay();
      let offset = d - targetDayOfWeek;
      if (offset < 0) offset += 7;
      targetDate = daysInMonth - offset;
    } else {
      // "Nth [weekday] of the month" — search forwards from the 1st
      const firstOfMonth = new Date(year, month, 1);
      const firstDayOfWeek = firstOfMonth.getDay();
      let dayOffset = targetDayOfWeek - firstDayOfWeek;
      if (dayOffset < 0) dayOffset += 7;
      targetDate = 1 + dayOffset + (weekOfMonth - 1) * 7;
    }

    if (targetDate >= 1 && targetDate <= daysInMonth) {
      const candidate = new Date(year, month, targetDate, hours, minutes, 0, 0);
      if (candidate > after) {
        if (isPastEndDate(candidate, schedule)) return null;
        return candidate;
      }
    }

    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }

  return null;
}

/**
 * "yearly" — fires on the same month/day as startDate each year.
 */
function calculateYearly(schedule: ScheduleConfig, after: Date): Date | null {
  const start = new Date(schedule.startDate);
  const { hours, minutes } = parseTimeOfDay(schedule.timeOfDay);

  const year = after.getFullYear();
  const month = start.getMonth();
  const day = start.getDate();

  for (let i = 0; i < 3; i++) {
    const daysInMonth = new Date(year + i, month + 1, 0).getDate();
    const actualDay = Math.min(day, daysInMonth);
    const candidate = new Date(year + i, month, actualDay, hours, minutes, 0, 0);

    if (candidate > after) {
      if (isPastEndDate(candidate, schedule)) return null;
      return candidate;
    }
  }

  return null;
}

/**
 * Calculates the next trigger time for any schedule type.
 *
 * All calculations use LOCAL time because timeOfDay is entered by the
 * user in their local timezone. The resulting Date is then stored as
 * an ISO string (which includes the UTC offset).
 *
 * @param schedule - The schedule configuration
 * @param after - Calculate the next occurrence after this date (defaults to now)
 * @returns The next occurrence as a Date, or null if no future occurrence exists
 */
export function calculateNextOccurrence(
  schedule: ScheduleConfig,
  after: Date = new Date(),
): Date | null {
  switch (schedule.type) {
    case 'once':
      return calculateOnce(schedule, after);
    case 'hourly':
      return calculateHourly(schedule, after);
    case 'twice_daily':
      return calculateTwiceDaily(schedule, after);
    case 'daily':
      return calculateDaily(schedule, after);
    case 'weekly':
      return calculateWeekly(schedule, after);
    case 'monthly_date':
      return calculateMonthlyDate(schedule, after);
    case 'monthly_weekday':
      return calculateMonthlyWeekday(schedule, after);
    case 'yearly':
      return calculateYearly(schedule, after);
    case 'cron':
      return null;
  }
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function ordinal(n: number): string {
  const suffixes: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
  return `${n}${suffixes[n] ?? 'th'}`;
}

function formatTime(timeOfDay: string): string {
  const { hours, minutes } = parseTimeOfDay(timeOfDay);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${period}`;
}

export function formatScheduleDescription(schedule: ScheduleConfig): string {
  const time = formatTime(schedule.timeOfDay);

  switch (schedule.type) {
    case 'once':
      return `Once on ${new Date(schedule.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at ${time}`;

    case 'hourly': {
      const interval = schedule.interval ?? 1;
      return interval === 1
        ? `Every hour starting at ${time}`
        : `Every ${interval} hours starting at ${time}`;
    }

    case 'twice_daily': {
      const secondTime = schedule.secondTimeOfDay
        ? formatTime(schedule.secondTimeOfDay)
        : '6:00 PM';
      return `Twice daily at ${time} and ${secondTime}`;
    }

    case 'daily': {
      const interval = schedule.interval ?? 1;
      return interval === 1 ? `Daily at ${time}` : `Every ${interval} days at ${time}`;
    }

    case 'weekly': {
      const days = (schedule.daysOfWeek ?? [])
        .sort((a, b) => a - b)
        .map((d) => DAY_NAMES[d]!)
        .join(', ');
      return `Every ${days} at ${time}`;
    }

    case 'monthly_date': {
      const day = schedule.dayOfMonth ?? 1;
      return day === -1
        ? `Monthly on the last day at ${time}`
        : `Monthly on the ${ordinal(day)} at ${time}`;
    }

    case 'monthly_weekday': {
      const week = schedule.weekOfMonth ?? 1;
      const dayVal = schedule.daysOfWeek?.[0] ?? 1;
      const weekLabel = week === -1 ? 'Last' : ordinal(week);
      const dayLabel =
        dayVal === -1
          ? 'Day'
          : dayVal === -2
            ? 'Weekday'
            : dayVal === -3
              ? 'Weekend Day'
              : DAY_NAMES[dayVal]!;
      return `Monthly on the ${weekLabel} ${dayLabel} at ${time}`;
    }

    case 'yearly':
      return `Yearly on ${new Date(schedule.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} at ${time}`;

    case 'cron':
      return `Cron: ${schedule.cronExpression ?? 'unknown'}`;
  }
}

/**
 * Checks whether a scheduled trigger time is overdue (in the past).
 */
export function isOverdue(nextTriggerAt: string | Date): boolean {
  const triggerDate = typeof nextTriggerAt === 'string' ? new Date(nextTriggerAt) : nextTriggerAt;
  return triggerDate.getTime() < Date.now();
}
