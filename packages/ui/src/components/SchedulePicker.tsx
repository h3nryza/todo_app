import { clsx } from 'clsx';
import type { ScheduleType } from '@ohright/shared';

interface SchedulePickerProps {
  type: ScheduleType;
  onTypeChange: (type: ScheduleType) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  timeOfDay: string;
  onTimeOfDayChange: (time: string) => void;
  /** Second time of day for twice_daily schedules */
  secondTimeOfDay?: string;
  onSecondTimeOfDayChange?: (time: string) => void;
  interval?: number;
  onIntervalChange: (interval: number) => void;
  daysOfWeek?: number[];
  onDaysOfWeekChange: (days: number[]) => void;
  dayOfMonth?: number;
  onDayOfMonthChange: (day: number) => void;
  weekOfMonth?: number;
  onWeekOfMonthChange: (week: number) => void;
  endDate?: string;
  onEndDateChange: (date: string) => void;
}

/**
 * All schedule type options available to the user.
 * Includes hourly, twice daily, daily, weekly, and two monthly variants.
 */
const scheduleTypes: Array<{ value: ScheduleType; label: string }> = [
  { value: 'once', label: 'Once' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'twice_daily', label: 'Twice a Day' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly_date', label: 'Day of Month' },
  { value: 'monthly_weekday', label: 'Monthly (Weekday)' },
  { value: 'yearly', label: 'Yearly' },
];

/** Day labels from Sunday (0) through Saturday (6) */
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Week-of-month options for monthly_weekday schedules.
 * Includes "First" through "5th" as well as "Last" for common patterns
 * like "last Monday of the month".
 */
const WEEK_OPTIONS = [
  { value: 1, label: 'First' },
  { value: 2, label: 'Second' },
  { value: 3, label: 'Third' },
  { value: 4, label: 'Fourth' },
  { value: 5, label: 'Fifth' },
  { value: -1, label: 'Last' },
];

/**
 * Day options for monthly_weekday, including generic "Day" (any day),
 * individual weekdays, and "Weekday" / "Weekend Day" helpers.
 */
const MONTHLY_WEEKDAY_DAY_OPTIONS = [
  { value: -1, label: 'Day' }, // Generic "first day" / "last day"
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: -2, label: 'Weekday (Mon-Fri)' },
  { value: -3, label: 'Weekend Day' },
];

/**
 * Special day-of-month presets for the monthly_date schedule.
 * Lets the user pick numbered days (1-31) or "Last Day".
 */
const SPECIAL_DAY_OPTIONS = [{ value: -1, label: 'Last Day of Month' }];

export default function SchedulePicker({
  type,
  onTypeChange,
  startDate,
  onStartDateChange,
  timeOfDay,
  onTimeOfDayChange,
  secondTimeOfDay = '18:00',
  onSecondTimeOfDayChange,
  interval,
  onIntervalChange,
  daysOfWeek = [],
  onDaysOfWeekChange,
  dayOfMonth,
  onDayOfMonthChange,
  weekOfMonth,
  onWeekOfMonthChange,
  endDate,
  onEndDateChange,
}: SchedulePickerProps) {
  /** Toggle a day on/off for weekly schedules (checkbox-style) */
  const toggleDay = (day: number) => {
    if (daysOfWeek.includes(day)) {
      onDaysOfWeekChange(daysOfWeek.filter((d) => d !== day));
    } else {
      onDaysOfWeekChange([...daysOfWeek, day].sort((a, b) => a - b));
    }
  };

  return (
    <div className="space-y-4">
      {/* Schedule type chips — wraps to multiple rows on smaller screens */}
      <div className="flex flex-wrap gap-2">
        {scheduleTypes.map((st) => (
          <button
            key={st.value}
            type="button"
            onClick={() => onTypeChange(st.value)}
            className={clsx(
              'px-3 py-1.5 text-sm rounded-full font-medium transition-all duration-150',
              type === st.value ? 'text-white' : 'hover:opacity-80',
            )}
            style={
              type === st.value
                ? { backgroundColor: 'var(--accent)' }
                : { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }
            }
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Date and time inputs — always shown */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            className="block text-xs font-medium mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            {type === 'once' ? 'Date' : 'Start Date'}
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label
            className="block text-xs font-medium mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            {type === 'twice_daily' ? 'First Time' : 'Time'}
          </label>
          <input
            type="time"
            value={timeOfDay}
            onChange={(e) => onTimeOfDayChange(e.target.value)}
            className="input-field"
          />
        </div>
      </div>

      {/* Second time input for twice-daily schedules */}
      {type === 'twice_daily' && (
        <div>
          <label
            className="block text-xs font-medium mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            Second Time
          </label>
          <input
            type="time"
            value={secondTimeOfDay}
            onChange={(e) => onSecondTimeOfDayChange?.(e.target.value)}
            className="input-field w-40"
          />
        </div>
      )}

      {/* Interval for hourly */}
      {type === 'hourly' && (
        <div>
          <label
            className="block text-xs font-medium mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            Repeat every
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={24}
              value={interval ?? 1}
              onChange={(e) => onIntervalChange(Math.max(1, parseInt(e.target.value) || 1))}
              className="input-field w-20"
            />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              hour(s)
            </span>
          </div>
        </div>
      )}

      {/* Interval for daily */}
      {type === 'daily' && (
        <div>
          <label
            className="block text-xs font-medium mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            Repeat every
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={365}
              value={interval ?? 1}
              onChange={(e) => onIntervalChange(Math.max(1, parseInt(e.target.value) || 1))}
              className="input-field w-20"
            />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              day(s)
            </span>
          </div>
        </div>
      )}

      {/* Days of week for weekly — checkboxes rendered as circular toggle buttons */}
      {type === 'weekly' && (
        <div>
          <label
            className="block text-xs font-medium mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Repeat on (select days)
          </label>
          <div className="flex gap-1.5">
            {DAY_LABELS.map((label, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => toggleDay(idx)}
                className={clsx(
                  'w-9 h-9 rounded-full text-xs font-medium transition-all duration-150',
                  daysOfWeek.includes(idx) ? 'text-white' : '',
                )}
                style={
                  daysOfWeek.includes(idx)
                    ? { backgroundColor: 'var(--accent)' }
                    : { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }
                }
                title={`Toggle ${label}`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Tap each day to toggle it on/off
          </p>
        </div>
      )}

      {/* Day of month for monthly_date schedule */}
      {type === 'monthly_date' && (
        <div>
          <label
            className="block text-xs font-medium mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            Day of month
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={31}
              value={dayOfMonth && dayOfMonth > 0 ? dayOfMonth : 1}
              onChange={(e) =>
                onDayOfMonthChange(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))
              }
              className="input-field w-20"
            />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              or
            </span>
            {SPECIAL_DAY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onDayOfMonthChange(opt.value)}
                className={clsx(
                  'px-3 py-1.5 text-xs rounded-full font-medium transition-all duration-150',
                  dayOfMonth === opt.value ? 'text-white' : '',
                )}
                style={
                  dayOfMonth === opt.value
                    ? { backgroundColor: 'var(--accent)' }
                    : { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/*
       * Monthly weekday — e.g. "First Monday", "Last Friday", "First Day", "Last Day"
       * Combines a week-of-month selector with a day-of-week selector.
       */}
      {type === 'monthly_weekday' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Which week
            </label>
            <select
              value={weekOfMonth ?? 1}
              onChange={(e) => onWeekOfMonthChange(parseInt(e.target.value))}
              className="input-field"
            >
              {WEEK_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Which day
            </label>
            <select
              value={daysOfWeek[0] ?? 1}
              onChange={(e) => onDaysOfWeekChange([parseInt(e.target.value)])}
              className="input-field"
            >
              {MONTHLY_WEEKDAY_DAY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <p className="col-span-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            Examples: "First Monday", "Last Day", "Last Friday"
          </p>
        </div>
      )}

      {/* Optional end date — shown for all recurring types */}
      {type !== 'once' && (
        <div>
          <label
            className="block text-xs font-medium mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            End date (optional)
          </label>
          <input
            type="date"
            value={endDate ?? ''}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="input-field"
          />
        </div>
      )}
    </div>
  );
}
