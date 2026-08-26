import { Goal, GoalStatus } from '../../types/models';
import { GoalProgressSummary } from './goalTypes';
import { getLocalDateString } from '../tasks/taskUtils';

/**
 * Calculates goal progress percentage clamped between 0 and 100.
 */
export function calculateGoalProgress(currentValue: number, targetValue: number): number {
  if (targetValue <= 0) return 0;
  const pct = Math.round((currentValue / targetValue) * 100);
  return Math.max(0, Math.min(100, pct));
}

/**
 * Calculates days remaining from today until target date.
 */
export function calculateDaysRemaining(targetDateStr?: string): {
  days: number;
  isOverdue: boolean;
  label: string;
} {
  if (!targetDateStr) {
    return { days: 0, isOverdue: false, label: 'Ongoing' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { days: Math.abs(diffDays), isOverdue: true, label: `${Math.abs(diffDays)}d overdue` };
  }
  if (diffDays === 0) {
    return { days: 0, isOverdue: false, label: 'Due today' };
  }
  return { days: diffDays, isOverdue: false, label: `${diffDays}d left` };
}

/**
 * Resolves goal status dynamically based on current vs target values.
 */
export function calculateGoalStatus(current: number, target: number, currentStatus?: GoalStatus): GoalStatus {
  if (currentStatus === 'paused' || currentStatus === 'archived') {
    return currentStatus;
  }
  if (target > 0 && current >= target) {
    return 'completed';
  }
  return 'active';
}

/**
 * Generates a complete progress summary for any goal.
 */
export function getGoalProgressSummary(goal: Goal): GoalProgressSummary {
  const percentage = calculateGoalProgress(goal.currentValue, goal.targetValue);
  const remaining = Math.max(0, goal.targetValue - goal.currentValue);
  const isCompleted = goal.status === 'completed' || (goal.targetValue > 0 && goal.currentValue >= goal.targetValue);
  const { days, isOverdue, label } = calculateDaysRemaining(goal.targetDate || goal.deadline);

  const formattedDisplay = `${goal.currentValue} / ${goal.targetValue} ${goal.unit}`;

  return {
    percentage,
    remaining,
    isCompleted,
    daysRemaining: days,
    isOverdue,
    label,
    formattedDisplay,
  };
}
