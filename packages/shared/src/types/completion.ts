import type { Subtask } from './subtask';

export type CompletionAction = 'completed' | 'skipped' | 'snoozed';

export interface CompletionRecord {
  id: string;
  reminderId: string;
  scheduledFor: string;
  completedAt: string;
  action: CompletionAction;
  subtaskSnapshot: Subtask[];
}
