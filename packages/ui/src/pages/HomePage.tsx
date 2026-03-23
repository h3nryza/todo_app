import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertCircle, CalendarClock, CalendarDays } from 'lucide-react';
import {
  isToday,
  isTomorrow,
  isBefore,
  startOfToday,
  addDays,
  endOfMonth,
  endOfYear,
} from 'date-fns';
import { useReminders } from '@/hooks/useReminders';
import { useCategories } from '@/hooks/useCategories';
import { useAppStore, type ViewMode } from '@/store/app.store';
import Sidebar from '@/components/Sidebar';
import ReminderCard from '@/components/ReminderCard';
import FAB from '@/components/FAB';
import EmptyState from '@/components/EmptyState';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import type { Reminder, Category } from '@ohright/shared';

/**
 * Home page — the main dashboard showing reminders grouped into
 * Overdue, Today, and view-specific upcoming sections.
 */
export default function HomePage() {
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery, selectedCategory, view, setView } = useAppStore();
  const { data: reminders, loading: remindersLoading } = useReminders({
    status: 'active',
    categoryId: selectedCategory ?? undefined,
    search: searchQuery || undefined,
  });
  const { data: categories } = useCategories();

  /** Quick-lookup map: categoryId -> Category */
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const cat of categories) {
      map.set(cat.id, cat);
    }
    return map;
  }, [categories]);

  /**
   * Group reminders into overdue, today, and upcoming based on the
   * selected view mode. Each view defines a different time boundary
   * for "upcoming" reminders.
   */
  const { overdue, today, tomorrow, upcoming } = useMemo(() => {
    const now = new Date();
    const todayStart = startOfToday();
    const weekEnd = addDays(todayStart, 7);
    const monthEnd = endOfMonth(now);
    const yearEnd = endOfYear(now);

    const overdueList: Reminder[] = [];
    const todayList: Reminder[] = [];
    const tomorrowList: Reminder[] = [];
    const upcomingList: Reminder[] = [];

    for (const r of reminders) {
      if (!r.nextTriggerAt) continue;
      const triggerDate = new Date(r.nextTriggerAt);

      // Overdue: trigger time is in the past (but not today)
      if (isBefore(triggerDate, now) && !isToday(triggerDate)) {
        overdueList.push(r);
        continue;
      }

      // Today: trigger date is today (even if overdue within today)
      if (isToday(triggerDate)) {
        todayList.push(r);
        continue;
      }

      // Tomorrow bucket (only used for "tomorrow" and larger views)
      if (isTomorrow(triggerDate)) {
        tomorrowList.push(r);
        continue;
      }

      // Remaining future reminders: filter based on view
      switch (view) {
        case 'today':
          // "Today" view only shows overdue + today; nothing beyond
          break;
        case 'tomorrow':
          // Tomorrow view: tomorrow already captured above
          break;
        case 'this_week':
          if (isBefore(triggerDate, weekEnd) || triggerDate.getTime() === weekEnd.getTime()) {
            upcomingList.push(r);
          }
          break;
        case 'this_month':
          if (isBefore(triggerDate, monthEnd) || triggerDate.getTime() === monthEnd.getTime()) {
            upcomingList.push(r);
          }
          break;
        case 'this_year':
          if (isBefore(triggerDate, yearEnd) || triggerDate.getTime() === yearEnd.getTime()) {
            upcomingList.push(r);
          }
          break;
        case 'all':
          upcomingList.push(r);
          break;
      }
    }

    return {
      overdue: overdueList,
      today: todayList,
      tomorrow: tomorrowList,
      upcoming: upcomingList,
    };
  }, [reminders, view]);

  /** View mode tab definitions */
  const viewTabs: Array<{ value: ViewMode; label: string }> = [
    { value: 'today', label: 'Today' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'this_year', label: 'This Year' },
    { value: 'all', label: 'All' },
  ];

  const hasNoReminders = reminders.length === 0 && !remindersLoading;
  /** Whether any section has content for the current view */
  const hasVisibleReminders =
    overdue.length > 0 || today.length > 0 || tomorrow.length > 0 || upcoming.length > 0;

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8">
          {/* Search bar */}
          <div className="relative mb-6">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-secondary)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reminders..."
              className="input-field pl-10"
            />
          </div>

          {/* View tabs — horizontally scrollable on small screens */}
          <div
            className="flex gap-1 mb-6 p-1 rounded-soft overflow-x-auto"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            {viewTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setView(tab.value)}
                className="flex-shrink-0 py-1.5 px-3 text-sm font-medium rounded-lg transition-all duration-150 whitespace-nowrap"
                style={
                  view === tab.value
                    ? {
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        boxShadow: 'var(--shadow)',
                      }
                    : { color: 'var(--text-secondary)' }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Loading skeleton */}
          {remindersLoading && <LoadingSkeleton count={4} />}

          {/* Empty state — no reminders at all */}
          {hasNoReminders && (
            <EmptyState
              title="No reminders yet"
              description="Create your first reminder to get started!"
              actionLabel="Create Reminder"
              onAction={() => navigate('/reminders/new')}
            />
          )}

          {/* Overdue section — always shown when there are overdue items */}
          {overdue.length > 0 && (
            <section className="mb-6 animate-slide-up">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={16} className="text-red-500" />
                <h2 className="text-sm font-semibold text-red-500">Overdue ({overdue.length})</h2>
              </div>
              <div className="space-y-2">
                {overdue.map((r) => (
                  <ReminderCard key={r.id} reminder={r} category={categoryMap.get(r.categoryId)} />
                ))}
              </div>
            </section>
          )}

          {/* Today section */}
          {today.length > 0 && (
            <section className="mb-6 animate-slide-up">
              <div className="flex items-center gap-2 mb-3">
                <CalendarClock size={16} style={{ color: 'var(--accent)' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Today ({today.length})
                </h2>
              </div>
              <div className="space-y-2">
                {today.map((r) => (
                  <ReminderCard key={r.id} reminder={r} category={categoryMap.get(r.categoryId)} />
                ))}
              </div>
            </section>
          )}

          {/* Tomorrow section — shown for views beyond "today" */}
          {tomorrow.length > 0 && view !== 'today' && (
            <section className="mb-6 animate-slide-up">
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays size={16} style={{ color: 'var(--text-secondary)' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Tomorrow ({tomorrow.length})
                </h2>
              </div>
              <div className="space-y-2">
                {tomorrow.map((r) => (
                  <ReminderCard key={r.id} reminder={r} category={categoryMap.get(r.categoryId)} />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming / Later section */}
          {upcoming.length > 0 && (
            <section className="mb-6 animate-slide-up">
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays size={16} style={{ color: 'var(--text-secondary)' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {view === 'all' ? 'All Reminders' : 'Later'} ({upcoming.length})
                </h2>
              </div>
              <div className="space-y-2">
                {upcoming.map((r) => (
                  <ReminderCard key={r.id} reminder={r} category={categoryMap.get(r.categoryId)} />
                ))}
              </div>
            </section>
          )}

          {/* No results for current view but reminders exist */}
          {!remindersLoading && !hasNoReminders && !hasVisibleReminders && (
            <EmptyState title="All clear!" description="No reminders matching the current view." />
          )}
        </div>
      </main>

      <FAB />
    </div>
  );
}
