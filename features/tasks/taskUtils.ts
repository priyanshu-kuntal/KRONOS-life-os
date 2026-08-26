import { Task, Priority } from '../../types/models';
import { TaskFilter } from './taskTypes';

/**
 * Returns today's date in local ISO format (YYYY-MM-DD)
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const priorityWeight: Record<Priority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Sorts tasks intelligently:
 * 1. Pending before Completed
 * 2. Overdue tasks first
 * 3. High/Urgent priority
 * 4. Due time (earlier first)
 * 5. Creation date (newer first)
 */
export function sortTasks(tasks: Task[], todayStr: string = getLocalDateString()): Task[] {
  return [...tasks].sort((a, b) => {
    // 1. Pending before Completed
    const aDone = a.status === 'completed';
    const bDone = b.status === 'completed';
    if (aDone !== bDone) return aDone ? 1 : -1;

    // 2. Overdue check (only for pending tasks)
    if (!aDone && a.dueDate && b.dueDate) {
      const aOverdue = a.dueDate < todayStr;
      const bOverdue = b.dueDate < todayStr;
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    }

    // 3. Priority Weight (Urgent > High > Medium > Low)
    const pA = priorityWeight[a.priority] || 0;
    const pB = priorityWeight[b.priority] || 0;
    if (pA !== pB) return pB - pA;

    // 4. Due Time (earlier time first)
    if (a.dueTime && b.dueTime) {
      if (a.dueTime !== b.dueTime) return a.dueTime.localeCompare(b.dueTime);
    } else if (a.dueTime && !b.dueTime) {
      return -1;
    } else if (!a.dueTime && b.dueTime) {
      return 1;
    }

    // 5. Creation date
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Filters task list based on TaskFilter
 */
export function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  switch (filter) {
    case 'pending':
      return tasks.filter((t) => t.status !== 'completed');
    case 'completed':
      return tasks.filter((t) => t.status === 'completed');
    case 'high_priority':
      return tasks.filter((t) => t.priority === 'high' || t.priority === 'urgent');
    case 'all':
    default:
      return tasks;
  }
}
