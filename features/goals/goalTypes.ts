import { GoalStatus } from '../../types/models';

export type GoalCategory =
  | 'Fitness'
  | 'Career'
  | 'Study'
  | 'Finance'
  | 'Health'
  | 'Personal'
  | 'Other';

export const GOAL_CATEGORIES: GoalCategory[] = [
  'Fitness',
  'Career',
  'Study',
  'Finance',
  'Health',
  'Personal',
  'Other',
];

export const GOAL_CATEGORY_COLORS: Record<GoalCategory, string> = {
  Fitness: '#38BDF8',
  Career: '#4F8CFF',
  Study: '#FBBF24',
  Finance: '#34D399',
  Health: '#8B7CFF',
  Personal: '#A1A8B5',
  Other: '#687080',
};

export interface CreateGoalInput {
  title: string;
  description?: string;
  category: GoalCategory;
  targetValue: number;
  currentValue?: number;
  unit?: string;
  startDate?: string;
  targetDate?: string;
  status?: GoalStatus;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  category?: GoalCategory;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  startDate?: string;
  targetDate?: string;
  status?: GoalStatus;
}

export interface GoalProgressSummary {
  percentage: number;
  remaining: number;
  isCompleted: boolean;
  daysRemaining: number;
  isOverdue: boolean;
  label: string;
  formattedDisplay: string;
}
