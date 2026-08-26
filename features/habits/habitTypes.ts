import { HabitFrequency } from '../../types/models';

export type HabitCategory = 'Health' | 'Productivity' | 'Mindset' | 'Fitness' | 'Learning' | 'Other';

export interface CreateHabitInput {
  title: string;
  description?: string;
  category: HabitCategory;
  targetDaysPerWeek: number;
  frequency: HabitFrequency;
  goalId?: string;
  color?: string;
  icon?: string;
}

export interface UpdateHabitInput {
  title?: string;
  description?: string;
  category?: HabitCategory;
  targetDaysPerWeek?: number;
  frequency?: HabitFrequency;
  goalId?: string;
  color?: string;
  icon?: string;
  isArchived?: boolean;
}

export interface HabitHistoryDay {
  date: string; // YYYY-MM-DD
  dayLabel: string; // M, T, W...
  dayNumber: number; // 26
  completed: boolean;
  isToday: boolean;
}
