export interface Subtask {
  id: string;
  reminderId: string;
  title: string;
  isCompleted: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface CreateSubtaskDto {
  title: string;
}

export interface UpdateSubtaskDto {
  title?: string;
  isCompleted?: boolean;
  sortOrder?: number;
}
