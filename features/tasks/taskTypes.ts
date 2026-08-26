import { Priority, TaskStatus, Task } from '../../types/models';

export type TaskCategory = 'Work' | 'Study' | 'Personal' | 'Fitness' | 'Health' | 'Other';

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  priority?: Priority;
  category?: string;
  goalId?: string;
  estimatedMinutes?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  priority?: Priority;
  status?: TaskStatus;
  category?: string;
  goalId?: string;
  estimatedMinutes?: number;
  completedAt?: string;
}

export type TaskFilter = 'all' | 'pending' | 'completed' | 'high_priority';
