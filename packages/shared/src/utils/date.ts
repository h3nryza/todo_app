/**
 * Returns a human-readable relative time string.
 *
 * @example
 * formatRelativeTime(new Date(Date.now() - 3600000)) // "1 hour ago"
 * formatRelativeTime(new Date(Date.now() + 7200000)) // "in 2 hours"
 */
export function formatRelativeTime(date: Date | string): string {
  const target = typeof date === 'string' ? new Date(date) : date;
  const now = Date.now();
  const diffMs = target.getTime() - now;
  const absDiffMs = Math.abs(diffMs);
  const isFuture = diffMs > 0;

  const MINUTE = 60_000;
  const HOUR = 3_600_000;
  const DAY = 86_400_000;
  const WEEK = 604_800_000;
  const MONTH = 2_592_000_000; // ~30 days
  const YEAR = 31_536_000_000; // ~365 days

  if (absDiffMs < MINUTE) {
    return 'just now';
  }

  let value: number;
  let unit: string;

  if (absDiffMs < HOUR) {
    value = Math.floor(absDiffMs / MINUTE);
    unit = 'minute';
  } else if (absDiffMs < DAY) {
    value = Math.floor(absDiffMs / HOUR);
    unit = 'hour';
  } else if (absDiffMs < WEEK) {
    value = Math.floor(absDiffMs / DAY);
    unit = 'day';
  } else if (absDiffMs < MONTH) {
    value = Math.floor(absDiffMs / WEEK);
    unit = 'week';
  } else if (absDiffMs < YEAR) {
    value = Math.floor(absDiffMs / MONTH);
    unit = 'month';
  } else {
    value = Math.floor(absDiffMs / YEAR);
    unit = 'year';
  }

  const plural = value !== 1 ? 's' : '';

  return isFuture ? `in ${value} ${unit}${plural}` : `${value} ${unit}${plural} ago`;
}

/**
 * Formats a date/time for display. Uses Intl.DateTimeFormat for timezone support.
 *
 * @param date - Date to format
 * @param timezone - IANA timezone (e.g., "America/New_York"). Defaults to UTC.
 * @returns Formatted date string like "Mar 15, 2024, 2:30 PM"
 */
export function formatDateTime(date: Date | string, timezone: string = 'UTC'): string {
  const target = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  }).format(target);
}

/**
 * Converts a local date in the given timezone to UTC.
 *
 * Uses Intl.DateTimeFormat to determine the UTC offset for the given timezone
 * at the specified date, then shifts the date accordingly.
 *
 * @param date - The date representing local time in the given timezone
 * @param timezone - IANA timezone identifier
 * @returns A new Date in UTC
 */
export function toUTC(date: Date, timezone: string): Date {
  // Format the date in the target timezone to get its local representation
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? '0';

  const tzYear = parseInt(get('year'), 10);
  const tzMonth = parseInt(get('month'), 10) - 1;
  const tzDay = parseInt(get('day'), 10);
  const tzHour = parseInt(get('hour'), 10) % 24;
  const tzMinute = parseInt(get('minute'), 10);
  const tzSecond = parseInt(get('second'), 10);

  // The difference between the UTC date and the timezone-local date gives us the offset
  const tzDate = new Date(Date.UTC(tzYear, tzMonth, tzDay, tzHour, tzMinute, tzSecond));
  const offsetMs = tzDate.getTime() - date.getTime();

  // Shift the input date by the offset to get UTC
  return new Date(date.getTime() - offsetMs);
}

/**
 * Converts a UTC date to a local date in the given timezone.
 *
 * @param date - The UTC date
 * @param timezone - IANA timezone identifier
 * @returns A new Date representing the local time in the given timezone
 */
export function fromUTC(date: Date, timezone: string): Date {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? '0';

  const year = parseInt(get('year'), 10);
  const month = parseInt(get('month'), 10) - 1;
  const day = parseInt(get('day'), 10);
  const hour = parseInt(get('hour'), 10) % 24;
  const minute = parseInt(get('minute'), 10);
  const second = parseInt(get('second'), 10);

  return new Date(Date.UTC(year, month, day, hour, minute, second));
}
