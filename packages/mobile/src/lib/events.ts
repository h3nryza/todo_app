type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();

export function on(event: string, fn: Listener): void {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event)!.add(fn);
}

export function off(event: string, fn: Listener): void {
  listeners.get(event)?.delete(fn);
}

export function emit(event: string): void {
  listeners.get(event)?.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      console.error(`Event listener error for "${event}":`, err);
    }
  });
}

export const EVENTS = {
  REMINDERS_CHANGED: 'reminders:changed',
  CATEGORIES_CHANGED: 'categories:changed',
  SETTINGS_CHANGED: 'settings:changed',
} as const;
