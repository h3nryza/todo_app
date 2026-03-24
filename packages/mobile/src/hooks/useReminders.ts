import { useState, useEffect, useCallback } from 'react';
import type { Reminder, CreateReminderDto, UpdateReminderDto } from '@ohright/shared';
import {
  getReminders as fetchReminders,
  getReminder as fetchReminder,
  createReminder as createReminderService,
  updateReminder as updateReminderService,
  deleteReminder as deleteReminderService,
  completeReminder as completeReminderService,
  snoozeReminder as snoozeReminderService,
  skipReminder as skipReminderService,
  toggleSubtask as toggleSubtaskService,
  type ReminderFilters,
} from '../services/reminders.service';
import { on, off, EVENTS } from '../lib/events';

interface UseRemindersResult {
  data: Reminder[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useReminders(filters?: ReminderFilters): UseRemindersResult {
  const [data, setData] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const reminders = await fetchReminders(filters);
      setData(reminders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reminders');
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.categoryId, filters?.search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    on(EVENTS.REMINDERS_CHANGED, load);
    return () => off(EVENTS.REMINDERS_CHANGED, load);
  }, [load]);

  return { data, loading, error, refetch: load };
}

interface UseReminderResult {
  data: Reminder | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useReminder(id: string | undefined): UseReminderResult {
  const [data, setData] = useState<Reminder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const reminder = await fetchReminder(id);
      setData(reminder);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reminder');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    on(EVENTS.REMINDERS_CHANGED, load);
    return () => off(EVENTS.REMINDERS_CHANGED, load);
  }, [load]);

  return { data, loading, error, refetch: load };
}

interface UseMutationResult<TArgs extends unknown[], TResult> {
  mutate: (...args: TArgs) => Promise<TResult>;
  loading: boolean;
  error: string | null;
}

export function useCreateReminder(): UseMutationResult<[CreateReminderDto], Reminder> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (data: CreateReminderDto): Promise<Reminder> => {
    setLoading(true);
    setError(null);
    try {
      return await createReminderService(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create reminder';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error };
}

export function useUpdateReminder(): UseMutationResult<
  [string, UpdateReminderDto],
  Reminder | null
> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (id: string, data: UpdateReminderDto): Promise<Reminder | null> => {
      setLoading(true);
      setError(null);
      try {
        return await updateReminderService(id, data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update reminder';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { mutate, loading, error };
}

export function useDeleteReminder(): UseMutationResult<[string], void> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await deleteReminderService(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete reminder';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error };
}

export function useCompleteReminder(): UseMutationResult<[string], Reminder | null> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (id: string): Promise<Reminder | null> => {
    setLoading(true);
    setError(null);
    try {
      return await completeReminderService(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to complete reminder';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error };
}

export function useSnoozeReminder(): UseMutationResult<[string, number], Reminder | null> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (id: string, minutes: number): Promise<Reminder | null> => {
    setLoading(true);
    setError(null);
    try {
      return await snoozeReminderService(id, minutes);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to snooze reminder';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error };
}

export function useSkipReminder(): UseMutationResult<[string], Reminder | null> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (id: string): Promise<Reminder | null> => {
    setLoading(true);
    setError(null);
    try {
      return await skipReminderService(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to skip reminder';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error };
}

export function useToggleSubtask(): UseMutationResult<[string, boolean], void> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (subtaskId: string, isCompleted: boolean): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await toggleSubtaskService(subtaskId, isCompleted);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to toggle subtask';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error };
}
